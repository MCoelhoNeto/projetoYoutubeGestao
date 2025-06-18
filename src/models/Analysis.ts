import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videoId: {
    type: String,
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  videoTitle: {
    type: String,
    required: true,
  },
  channelName: {
    type: String,
    required: true,
  },
  transcription: {
    type: String,
    required: true,
  },
  aiSummary: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["processing", "completed", "error"],
    default: "processing",
  },
  errorMessage: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Atualizar updatedAt antes de salvar
analysisSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Analysis ||
  mongoose.model("Analysis", analysisSchema); 