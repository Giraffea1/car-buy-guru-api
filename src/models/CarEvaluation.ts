import mongoose, { Document, Schema, Types } from 'mongoose';
import { ICarEvaluation } from '../types';

const CarEvaluationSchema = new Schema<ICarEvaluation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest evaluations
  },
  
  // Basic car information
  carDetails: {
    year: {
      type: Number,
      required: [true, 'Please provide car year'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    make: {
      type: String,
      required: [true, 'Please provide car make'],
      trim: true,
      maxlength: [50, 'Make cannot be more than 50 characters']
    },
    model: {
      type: String,
      required: [true, 'Please provide car model'],
      trim: true,
      maxlength: [50, 'Model cannot be more than 50 characters']
    },
    mileage: {
      type: Number,
      required: [true, 'Please provide mileage'],
      min: [0, 'Mileage cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Please provide asking price'],
      min: [0, 'Price cannot be negative']
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(v: string) {
          return !v || v.length === 17;
        },
        message: 'VIN must be exactly 17 characters'
      }
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    }
  },

  // Photo uploads
  photos: [{
    id: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Carfax information
  carfax: {
    requested: {
      type: Boolean,
      default: false
    },
    purchased: {
      type: Boolean,
      default: false
    },
    wantCarfax: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0
    },
    vin: {
      type: String,
      default: ''
    },
    reportId: String,
    data: {
      accidents: Number,
      owners: Number,
      serviceRecords: Number,
      titleIssues: [String],
      recalls: Number
    }
  },

  // Market analysis
  marketAnalysis: {
    estimatedValue: Number,
    priceVsMarket: Number,
    dealScore: Number,
    comparable: [{
      source: String,
      price: Number,
      mileage: Number,
      location: String
    }]
  },

  // Inspection results
  inspection: {
    general: {
      completed: {
        type: Boolean,
        default: false
      },
      notes: String,
      issues: [String]
    },
    mechanical: {
      completed: {
        type: Boolean,
        default: false
      },
      results: [{
        category: String,
        item: String,
        status: {
          type: String,
          enum: ['pass', 'fail', 'warning']
        },
        notes: String
      }]
    },
    paperwork: {
      completed: {
        type: Boolean,
        default: false
      },
      vinMatch: {
        type: String,
        enum: ['pass', 'fail']
      },
      titleStatus: String,
      ownershipVerified: {
        type: String,
        enum: ['pass', 'fail']
      },
      liens: [String]
    }
  },

  // Final recommendations
  recommendations: {
    suggestedOffer: Number,
    maxOffer: Number,
    walkAwayPrice: Number,
    repairCosts: [{
      issue: String,
      estimatedCost: Number,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    negotiationPoints: [String]
  },

  // Evaluation status
  status: {
    type: String,
    enum: ['draft', 'analyzing', 'in_progress', 'awaiting_carfax', 'completed', 'archived'],
    default: 'draft'
  },

  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create indexes for better query performance
CarEvaluationSchema.index({ userId: 1, createdAt: -1 });
CarEvaluationSchema.index({ status: 1 });
CarEvaluationSchema.index({ 'carDetails.make': 1, 'carDetails.model': 1 });
CarEvaluationSchema.index({ 'carDetails.year': 1 });
CarEvaluationSchema.index({ 'carfax.vin': 1 });

// Virtual for car display name
CarEvaluationSchema.virtual('carDisplayName').get(function(this: ICarEvaluation) {
  return `${this.carDetails.year} ${this.carDetails.make} ${this.carDetails.model}`;
});

// Method to get evaluation summary
CarEvaluationSchema.methods.getSummary = function(this: ICarEvaluation) {
  return {
    id: this._id,
    carDisplayName: this.carDisplayName,
    status: this.status,
    progress: this.progress,
    dealScore: this.marketAnalysis?.dealScore || null,
    estimatedValue: this.marketAnalysis?.estimatedValue || null,
    askingPrice: this.carDetails.price,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to calculate overall progress
CarEvaluationSchema.methods.calculateProgress = function(this: ICarEvaluation) {
  let progress = 0;
  
  // Basic car details (20%)
  if (this.carDetails.year && this.carDetails.make && this.carDetails.model && 
      this.carDetails.mileage && this.carDetails.price) {
    progress += 20;
  }
  
  // Photos (10%)
  if (this.photos && this.photos.length > 0) {
    progress += 10;
  }
  
  // Market analysis (25%)
  if (this.marketAnalysis && this.marketAnalysis.dealScore) {
    progress += 25;
  }
  
  // Inspection (30%)
  if (this.inspection.general.completed) progress += 10;
  if (this.inspection.mechanical.completed) progress += 10;
  if (this.inspection.paperwork.completed) progress += 10;
  
  // Recommendations (15%)
  if (this.recommendations && this.recommendations.suggestedOffer) {
    progress += 15;
  }
  
  this.progress = progress;
  return progress;
};

// Ensure virtual fields are serialized
CarEvaluationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const CarEvaluation = mongoose.model<ICarEvaluation>('CarEvaluation', CarEvaluationSchema);

export default CarEvaluation;