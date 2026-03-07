import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import tempAuthRouter from './routes/tempAuth';
import complaintRouter from './routes/complaints';
import notificationRouter from './routes/notifications';
import uploadRouter from './routes/uploads';
import metricsRouter from './routes/metrics';
import utilityRouter from './routes/utility';
import copilotRouter from './routes/copilot';
import predictionsRouter from './routes/predictions';
import { initializeSocketService } from './services/socketService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const server = createServer(app);

// Initialize Socket.IO
const socketService = initializeSocketService(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api', tempAuthRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api', utilityRouter);
app.use('/api', copilotRouter);
app.use('/api', predictionsRouter);

// Public transparency portal (no authentication required)
import transparencyRouter from './routes/transparency';
app.use('/api/transparency', transparencyRouter);

// Error handling middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO initialized for real-time updates`);
  });
}

export default app;
