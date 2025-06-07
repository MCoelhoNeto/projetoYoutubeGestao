import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#3B82F6' },
  channelsCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
