import mongoose, { Document, Schema, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: false
      }
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Encrypt password using bcrypt
UserSchema.pre('save', async function(this: IUser, next: (err?: CallbackError) => void) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function(this: IUser): string {
  const payload = { 
    userId: this._id.toString(),
    email: this.email,
    role: this.role
  };
  
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  } as SignOptions;
  
  return jwt.sign(payload, secret, options);
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(this: IUser, enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get public profile (without sensitive data)
UserSchema.methods.getPublicProfile = function(this: IUser) {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    subscription: this.subscription,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Virtual for user stats (can be extended)
UserSchema.virtual('stats').get(function(this: IUser) {
  return {
    evaluationsCount: 0, // This would be calculated via aggregation
    joinedDays: Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  };
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
