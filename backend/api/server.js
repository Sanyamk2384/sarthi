// require('dotenv').config();
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import connectDB from './config/db.js';
config(); 

import app from './app.js';

// Database connection is already handled in app.js, so we don't need connectDB here again if it's there
// Except wait, app.js already initializes express, middlewares, and everything!


// Basic route for testing
app.get('/', (req, res) => {
  res.send('Disaster Response API is running');
});

// Error handling middleware
// app.use(require('./utils/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});