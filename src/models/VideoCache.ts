// src/models/VideoCache.ts
import mongoose from 'mongoose';

const VideoCacheSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  channelId: String,
  date: String, // formato YYYY-MM-DD
  videos: [
    {
      videoId: String,
      title: String,
      publishedAt: String,
      thumbnail: String
    }
  ]
}, { timestamps: true });

export default mongoose.models.VideoCache || mongoose.model('VideoCache', VideoCacheSchema);
