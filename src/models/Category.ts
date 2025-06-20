// src/models/Category.ts
import mongoose, { Schema } from 'mongoose';

const categorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#3B82F6' },
  tags: { type: String, default: '' },
  icon: { type: String, default: '' },
  listInVideos: { type: Boolean, default: true },
  channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
  channelsCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// 🛠 importante para ambientes como Next.js
export default mongoose.models.Category || mongoose.model('Category', categorySchema);
