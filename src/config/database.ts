import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/carbuyguru';
    
    await mongoose.connect(mongoURI);

    console.log('📦 MongoDB Connected Successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err: Error) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MongoDB connection failed:', errorMessage);
    
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // In development, continue without DB for testing
      console.log('⚠️  Continuing without database in development mode');
    }
  }
};

export default connectDB;
