import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import connectDB from './config/db.js';

// Load environment variables
config(); 

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(json());
app.use(urlencoded({ extended: true }));

import admin from 'firebase-admin';
import needsRoutes from './routes/needs.routes.js';

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Routes
// Note: Some existing routes use require(), keeping them as is.
app.use('/api', needsRoutes);
// Existing routes where require is used.
try { app.use('/api/incidents', require('./routes/incidents')); } catch(e){}
try { app.use('/api/resources', require('./routes/resources')); } catch(e){}
try { app.use('/api/alerts', require('./routes/alerts')); } catch(e){}
try { app.use('/api/tasks', require('./routes/tasks')); } catch(e){}
try { app.use('/api/users', require('./routes/users')); } catch(e){}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Database connection
connectDB();

export default app;