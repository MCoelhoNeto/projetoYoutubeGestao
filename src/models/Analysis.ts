import mongoose, { Schema, model, models } from "mongoose";

const noteSchema = new Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['resumo', 'observacao', 'correlato'],
    default: 'resumo',
  },
}, { _id: false });

const analysisSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videoId: {
    type: String,
    required: true,
  },
  channelId: {
    type: Schema.Types.ObjectId,
    ref: "Channel",
    required: false,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
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
  notes: {
    type: [noteSchema],
    required: false,
    default: [],
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
}, {
  timestamps: true
});

// Atualizar updatedAt antes de salvar
analysisSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default models.Analysis || model('Analysis', analysisSchema); 