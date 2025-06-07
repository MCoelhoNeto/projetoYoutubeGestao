import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    image: String,

    googleId: { type: String },
    googleProfile: {
      name: String,
      picture: String,
      given_name: String,
      email_verified: Boolean,
      locale: String
    },

    plan: {
      type: {
        type: String, // 'free', 'pro', 'enterprise', etc.
        required: true
      },
      startDate: Date,
      endDate: Date,
      features: {
        maxChannels: Number,
        maxCategories: Number,
        maxAnalysesPerMonth: Number,
        priorityProcessing: Boolean,
        exportData: Boolean,
        advancedFilters: Boolean
      }
    },

    usage: {
      channelsCount: { type: Number, default: 0 },
      categoriesCount: { type: Number, default: 0 },
      analysesThisMonth: { type: Number, default: 0 },
      lastAnalysis: Date,
      loginCount: { type: Number, default: 1 }
    },

    settings: {
      language: { type: String, default: 'pt-BR' },
      timezone: { type: String, default: 'America/Sao_Paulo' },
      notifications: {
        email: { type: Boolean, default: true },
        analysisComplete: { type: Boolean, default: true },
        monthlyReport: { type: Boolean, default: false }
      }
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },

    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

export default models.User || model('User', UserSchema);
