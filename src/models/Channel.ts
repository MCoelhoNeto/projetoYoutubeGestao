// src/models/Channel.ts
import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  youtubeChannelId: String,
  title: String,
  description: String,
  customUrl: String,
  thumbnails: {
    default: String,
    medium: String,
    high: String,
  },
  statistics: {
    subscriberCount: String,
    videoCount: String,
    viewCount: String,
  },
  publishedAt: String,
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Channel ||
  mongoose.model("Channel", channelSchema);
