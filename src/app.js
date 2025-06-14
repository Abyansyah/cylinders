require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('./config/passport');
const allRoutes = require('./routes/index');
const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(passport.initialize());

app.use('/api/v1', allRoutes);

app.get('/', (req, res) => {
  res.send('PPP');
});

app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

const startServer = async (port) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully. 🐘');

    app.listen(port, () => {
      console.log(`Server is running on port ${port} 🚀`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
};

module.exports = { app, startServer };
