const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚗 CarBuyGuru API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
