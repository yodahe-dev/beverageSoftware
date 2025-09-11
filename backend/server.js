require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');
const path = require('path');

// Routes
const Signup = require('./routes/auth/SignUp_Route');
const Login = require('./routes/auth/Login_Route');
const Follow = require('./routes/Follow/follow');
const profile = require('./routes/auth/profile');
const chatRoutes = require('./routes/chat/sendMessage');
const markSeen = require('./routes/chat/markSeen');
const getConversation = require('./routes/chat/getConversation');
const postRoutes = require('./routes/post/postRoutes');
const save = require('./routes/post/save');
const like = require('./routes/post/like');
const comment = require('./routes/post/comments');
const PostView = require('./routes/post/PostView');

const setupSocket = require('./utils/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// ===== CORS SETUP =====
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(url => url.trim());
if (!allowedOrigins.length) console.warn('No CLIENT_URL defined for CORS');

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

// ===== LOGGER (optional) =====
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ===== TEST ROUTE =====
app.get('/', (req, res) => res.status(200).send('Welcome to our backend server!'));

// ===== API ROUTES =====
app.use('/api', Signup);
app.use('/api', Login);
app.use('/api', Follow);
app.use('/api', profile);
app.use('/api', chatRoutes);
app.use('/api', markSeen);
app.use('/api', getConversation);
app.use('/api', postRoutes);
app.use('/api', like);
app.use('/api', save);
app.use('/api', comment);
app.use('/api', PostView);

// ===== SOCKET.IO SETUP =====
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 20 * 1024 * 1024, 
});

app.set('io', io);
setupSocket(io)

// ===== START SERVER =====
sequelize.sync()
  .then(() => {
    console.log('Database connected and synced.');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB sync failed:', err);
    process.exit(1);
  });
