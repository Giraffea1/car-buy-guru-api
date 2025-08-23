import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import carRoutes from './routes/cars';
import evaluationRoutes from './routes/evaluations';
import carfaxRoutes from './routes/carfax';
import paymentRoutes from './routes/payments';

// Import middleware
import errorHandler from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';

// Load environment variables
config();

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/carfax', carfaxRoutes);
app.use('/api/payments', paymentRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'CarBuyGuru API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      cars: '/api/cars',
      evaluations: '/api/evaluations',
      carfax: '/api/carfax',
      payments: '/api/payments'
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
