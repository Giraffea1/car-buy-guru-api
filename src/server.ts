import app from './app';
import connectDB from './config/database';

const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚗 CarBuyGuru API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
