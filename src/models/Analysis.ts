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
    required: false,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: false,
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
    required: false,
    default: "",
  },
  aiSummary: {
    type: String,
    required: false,
    default: "",
  },
  status: {
    type: String,
    enum: ["processing", "completed", "error"],
    default: "processing",
  },
  errorMessage: {
    type: String,
    required: false,
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

// Forçar recriação do modelo para evitar cache
if (mongoose.models.Analysis) {
  delete mongoose.models.Analysis;
}

export default mongoose.model("Analysis", analysisSchema); 