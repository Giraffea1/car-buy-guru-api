const mongoose = require('mongoose');

const CarEvaluationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false // Allow guest evaluations
  },
  sessionId: {
    type: String,
    required: true // For guest users
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
        validator: function(v) {
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

  // Photos
  photos: [{
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Carfax information
  carfax: {
    requested: { type: Boolean, default: false },
    purchased: { type: Boolean, default: false },
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
    priceVsMarket: Number, // percentage above/below market
    dealScore: Number, // 0-100
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
      completed: { type: Boolean, default: false },
      notes: String,
      issues: [String]
    },
    mechanical: {
      completed: { type: Boolean, default: false },
      results: [{
        category: String,
        item: String,
        status: { type: String, enum: ['pass', 'fail', 'warning'] },
        notes: String
      }]
    },
    paperwork: {
      completed: { type: Boolean, default: false },
      vinMatch: { type: String, enum: ['pass', 'fail'] },
      titleStatus: String,
      ownershipVerified: { type: String, enum: ['pass', 'fail'] },
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
      priority: { type: String, enum: ['low', 'medium', 'high'] }
    }],
    negotiationPoints: [String]
  },

  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'analyzing', 'in_progress', 'awaiting_carfax', 'completed', 'archived'],
    default: 'draft'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Analytics
  analytics: {
    timeSpent: Number, // minutes
    pagesVisited: [String],
    completedAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
CarEvaluationSchema.index({ user: 1, createdAt: -1 });
CarEvaluationSchema.index({ sessionId: 1 });
CarEvaluationSchema.index({ 'carDetails.vin': 1 });
CarEvaluationSchema.index({ status: 1 });

// Virtual for car display name
CarEvaluationSchema.virtual('carDisplayName').get(function() {
  return `${this.carDetails.year} ${this.carDetails.make} ${this.carDetails.model}`;
});

// Method to calculate progress
CarEvaluationSchema.methods.calculateProgress = function() {
  let progress = 0;
  
  // Basic details (20%)
  if (this.carDetails.year && this.carDetails.make && this.carDetails.model) {
    progress += 20;
  }
  
  // Carfax decision (20%)
  if (this.carfax.requested !== undefined) {
    progress += 20;
  }
  
  // Market analysis (20%)
  if (this.marketAnalysis.dealScore) {
    progress += 20;
  }
  
  // Inspection (30%)
  if (this.inspection.general.completed) progress += 10;
  if (this.inspection.mechanical.completed) progress += 10;
  if (this.inspection.paperwork.completed) progress += 10;
  
  // Recommendations (10%)
  if (this.recommendations.suggestedOffer) {
    progress += 10;
  }
  
  this.progress = progress;
  return progress;
};

// Method to get summary
CarEvaluationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    carDisplayName: this.carDisplayName,
    price: this.carDetails.price,
    mileage: this.carDetails.mileage,
    status: this.status,
    progress: this.progress,
    dealScore: this.marketAnalysis?.dealScore,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('CarEvaluation', CarEvaluationSchema);
