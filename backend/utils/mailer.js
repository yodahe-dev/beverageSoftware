const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');
const handlebars = require('handlebars');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

async function loadDKIMKey() {
  try {
    const keyPath = path.resolve(__dirname, 'dkim-private.pem');
    return await fs.readFile(keyPath, 'utf8');
  } catch {
    return '';
  }
}

async function createTransporter() {
  const dkimPrivateKey = process.env.DKIM_PRIVATE_KEY || (await loadDKIMKey());

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      minVersion: 'TLSv1.3',
      ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
      rejectUnauthorized: true
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5,
    dkim: dkimPrivateKey
      ? {
          domainName: 'plusme.com',
          keySelector: 'default',
          privateKey: dkimPrivateKey,
        }
      : false,
  });
}

const transporterPromise = createTransporter();

const templateDir = path.join(__dirname, 'email-templates');
const templateFiles = ['verification.html', 'welcome.html'];
const templates = {};

async function loadTemplates() {
  await Promise.all(
    templateFiles.map(async (file) => {
      const content = await fs.readFile(path.join(templateDir, file), 'utf8');
      templates[file.replace('.html', '')] = handlebars.compile(content, { noEscape: true });
    })
  );
}
loadTemplates();

fs.watch(templateDir, { persistent: false }, (eventType, filename) => {
  if (templateFiles.includes(filename) && eventType === 'change') {
    fs.readFile(path.join(templateDir, filename), 'utf8')
      .then(content => {
        templates[filename.replace('.html', '')] = handlebars.compile(content, { noEscape: true });
      })
      .catch(() => {});
  }
});

function maskEmail(email) {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const first = user[0];
  const last = user.length > 1 ? user[user.length - 1] : '';
  const masked = user.length <= 2 ? first + '*' : first + '*'.repeat(user.length - 2) + last;
  return `${masked}@${domain}`;
}

const verificationSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', minLength: 6, maxLength: 10 },
    expiresIn: { type: 'integer', minimum: 1, maximum: 60 },
    year: { type: 'integer', minimum: 2000 },
    supportEmail: { type: 'string', format: 'email' },
    appName: { type: 'string', minLength: 1 },
    backendurl: { type: 'string', format: 'uri' },
    signupToken: { type: 'string', minLength: 10 },
    messageId: { type: 'string', pattern: '^[a-f0-9\\-]{36}$' },
    trackOpens: { type: 'boolean' },
    trackClicks: { type: 'boolean' },
    maskedEmail: { type: 'string', format: 'email' }
  },
  required: ['code', 'expiresIn', 'year', 'supportEmail', 'appName', 'backendurl', 'signupToken', 'messageId', 'trackOpens', 'trackClicks', 'maskedEmail'],
  additionalProperties: false
};

const validateVerification = ajv.compile(verificationSchema);

const emailQueue = [];
let sendingInProgress = false;

async function processQueue() {
  if (sendingInProgress || emailQueue.length === 0) return;
  sendingInProgress = true;
  const transporter = await transporterPromise;

  while (emailQueue.length) {
    const { mailOptions, messageId, email, code, expiresIn } = emailQueue.shift();
    try {
      await sendWithRetry(transporter, mailOptions, 3);
      await logEmailDelivery({ messageId, recipient: email, type: 'verification', status: 'sent', code, expiresAt: new Date(Date.now() + expiresIn * 60000).toISOString() });
    } catch (error) {
      await logEmailDelivery({ messageId, recipient: email, type: 'verification', status: 'failed', error: error.message });
    }
  }
  sendingInProgress = false;
}

async function sendWithRetry(transporter, mailOptions, retries) {
  let attempt = 0;
  while (true) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      attempt++;
      if (attempt > retries) throw error;
      const delay = Math.floor(Math.random() * 1000) + (2 ** attempt * 500);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function sendVerificationEmail(email, code, signupToken, options = {}) {
  const trackOpens = options.trackOpens !== false;
  const trackClicks = options.trackClicks !== false;
  const expiresIn = Number(options.expiresIn) || 10;
  const messageId = uuidv4();

  const templateData = {
    code,
    expiresIn,
    year: new Date().getFullYear(),
    supportEmail: process.env.SUPPORT_EMAIL || 'support@plusme.com',
    appName: process.env.APP_NAME || 'PlusMe',
    backendurl: process.env.backendurl || '',
    signupToken,
    messageId,
    trackOpens,
    trackClicks,
    maskedEmail: maskEmail(email)
  };

  if (!validateVerification(templateData)) {
    console.error(validateVerification.errors);
    throw new Error('Invalid template data');
  }

  const template = templates.verification;
  if (!template) throw new Error('Verification template missing');

  const html = template(templateData);

  const mailOptions = {
    from: `"${templateData.appName}" <no-reply@plusme.com>`,
    to: email,
    replyTo: `no-reply@plusme.com`,
    subject: '🔒 Verify Your Email Address',
    html,
    headers: {
      'X-Message-ID': messageId,
      'X-Application': templateData.appName,
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All',
      'Return-Path': '<>'
    },
    list: {
      unsubscribe: {
        url: `${process.env.UNSUBSCRIBE_URL || ''}?token=${messageId}`,
        comment: `Unsubscribe from all ${templateData.appName} emails`
      }
    },
    priority: 'high'
  };

  emailQueue.push({ mailOptions, messageId, email, code, expiresIn });
  processQueue().catch(() => {});

  return { success: true, messageId };
}

async function logEmailDelivery(details) {
  const logEntry = { timestamp: new Date().toISOString(), ...details };
  const logLine = JSON.stringify(logEntry) + '\n';
  try {
    await fs.appendFile(path.join(__dirname, 'email-delivery.log'), logLine);
  } catch {}
}

async function verifyConnection() {
  try {
    const transporter = await transporterPromise;
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (err) {
    console.error('Email server connection failed:', err.message);
    return false;
  }
}

async function getEmailStats() {
  return {
    sentLast24h: 0,
    deliveredRate: 0,
    openRate: 0,
    bounceRate: 0
  };
}

async function renderWelcomePage(userName) {
  const template = templates.welcome;
  if (!template) throw new Error('Welcome template missing');

  return template({
    userName,
    year: new Date().getFullYear(),
    supportEmail: process.env.SUPPORT_EMAIL || 'support@plusme.com',
    appUrl: process.env.APP_URL || 'https://plusme.com',
    list: { unsubscribe: { url: '#' } }
  });
}

process.on('SIGINT', async () => {
  while (emailQueue.length) await processQueue();
  process.exit();
});

verifyConnection();

module.exports = {
  sendVerificationEmail,
  getEmailStats,
  verifyConnection,
  renderWelcomePage
};
