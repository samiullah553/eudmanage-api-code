// // backend/server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();
// const connectDB = require('./config/db');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.json({ limit: '20mb' }));
// app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// // MongoDB Connection
// connectDB();

// // Routes
// app.use('/api/students', require('./routes/students'));
// app.use('/api/teachers', require('./routes/teachers'));
// app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/classes', require('./routes/classes'));
// app.use('/api/subjects', require('./routes/subjects'));
// app.use('/api/timetables', require('./routes/timetables'));
// app.use('/api/fees', require('./routes/fees'));
// app.use('/api/tasks', require('./routes/tasks'));
// app.use('/api/questions', require('./routes/question'));
// app.use('/api/grades', require('./routes/grade'));

// // Start server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const { roleRouteAccess } = require('./middleware/roleAccess');

const app = express();
app.set('trust proxy', true);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors())
// app.use(cors({
//   origin(origin, callback) {
//     if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     callback(new Error('Not allowed by CORS'));
//   },
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// Ensure preflight OPTIONS requests are handled explicitly
// app.options('*', cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/schools', require('./routes/schools'));

connectDB()
  .then(() => {
    app.use('/api', authenticate);
    app.use('/api', roleRouteAccess);
    app.use('/api/students', require('./routes/students'));
    app.use('/api/parents', require('./routes/parents'));
    app.use('/api/teachers', require('./routes/teachers'));
    app.use('/api/attendance', require('./routes/attendance'));
    app.use('/api/classes', require('./routes/classes'));
    app.use('/api/subjects', require('./routes/subjects'));
    app.use('/api/timetables', require('./routes/timetables'));
    app.use('/api/fees', require('./routes/fees'));
    app.use('/api/tasks', require('./routes/tasks'));
    app.use('/api/questions', require('./routes/question'));
    app.use('/api/grades', require('./routes/grade'));
    app.use('/api/study-materials', require('./routes/studyMaterials'));
    app.use('/api/hostel', require('./routes/hostel'));
    app.use('/api/quran', require('./routes/quran'));

    app.use((req, res) => res.status(404).json({ error: 'Not found' }));
    app.use(errorHandler);

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Startup failed:', err);
    process.exit(1);
  });