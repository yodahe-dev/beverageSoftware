const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');
const handlebars = require('handlebars');
const { v4: uuidv4 } = require('uuid');

const RESET_TEMPLATE = 'reset.html';
const templatePath = path.join(__dirname, 'email-templates', RESET_TEMPLATE);
let compiledResetTemplate = null;

async function loadTemplate() {
  try {
    const content = await fs.readFile(templatePath, 'utf8');
    compiledResetTemplate = handlebars.compile(content, { noEscape: true });
  } catch (err) {
    console.error('Failed to load reset template:', err);
  }
}
loadTemplate();

fs.watch(path.dirname(templatePath), { persistent: false }, (eventType, filename) => {
  if (filename === RESET_TEMPLATE && eventType === 'change') {
    loadTemplate();
  }
});

const transporterPromise = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: true
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 10,
  rateLimit: 5
});

async function sendResetEmail(email, code, token, options = {}) {
  const expiresIn = Number(options.expiresIn) || 10;
  const appName = process.env.APP_NAME || 'PlusMe';
  const backendurl = process.env.backendurl || '';

  if (!compiledResetTemplate) throw new Error('Reset template not loaded');

  const messageId = uuidv4();
  const html = compiledResetTemplate({
    code,
    expiresIn,
    year: new Date().getFullYear(),
    backendurl,
    appName,
    token,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@plusme.com'
  });

  const mailOptions = {
    from: `"${appName}" <no-reply@plusme.com>`,
    to: email,
    subject: '🔑 Reset Your Password',
    html,
    headers: {
      'X-Message-ID': messageId,
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'All'
    },
    priority: 'high'
  };

  const transporter = await transporterPromise;
  await transporter.sendMail(mailOptions);
  return { success: true, messageId };
}

module.exports = { sendResetEmail };
