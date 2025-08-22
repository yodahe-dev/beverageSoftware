require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');

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
const PostView = require('./routes/post/PostView')

const setupSocket = require('./utils/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

app.set('trust proxy', true);

// ===== CORS SETUP (supports multiple origins) =====
const allowedOrigins = process.env.CLIENT_URL.split(',').map(url => url.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
}));

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== TEST ROUTE =====
app.get('/', async (req, res) => {
  res.status(200).send('Welcome to our backend server!');
});

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
app.use("/api", PostView);


// ===== SOCKET.IO SETUP =====
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.set('io', io);
setupSocket(io);

// ===== START SERVER AFTER DB SYNC =====
sequelize.sync()
  .then(() => {
    console.log('Database connected and synced.');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB sync failed:', err);
    process.exit(1);
  });
