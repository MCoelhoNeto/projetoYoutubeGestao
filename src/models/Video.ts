import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: String,
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  publishedAt: Date,
  tags: [String],
  summary: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Video || mongoose.model('Video', videoSchema);
