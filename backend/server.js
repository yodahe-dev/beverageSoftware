require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const path = require('path');

// ===== ROUTES =====
const Signup = require('./routes/signupRouter');
const Login = require('./routes/loginRouter');
const Profile = require('./routes/profileRouter');
const supliersRouter = require('./routes/suppliersRouter');
const customerRouter = require('./routes/customerRouter')
const brandRoute = require('./routes/brandRoute')
const productRoute = require('./routes/productRouter')
const salesRouter = require('./routes/salesRouter')
const expenseRoute = require('./routes/expenseRoute')

const app = express();
const PORT = process.env.PORT || 8000;

// ===== CORS SETUP =====
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(url => url.trim());
if (!allowedOrigins.length) console.warn('⚠️  No CLIENT_URL defined for CORS');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ===== STATIC FILES =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== LOGGER =====
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ===== ROUTES =====
app.use('/api', Signup);
app.use('/api', Login);
app.use('/api', Profile);
app.use('/api', supliersRouter);
app.use('/api', customerRouter)
app.use('/api', brandRoute)
app.use('/api', productRoute)
app.use('/api', expenseRoute)
app.use('/api', salesRouter)

// ===== DATABASE SYNC =====
sequelize.sync({ force: true })
  .then(() => {
    console.log('✅ Database connected and synced.');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ DB sync failed:', err);
    process.exit(1);
  });
