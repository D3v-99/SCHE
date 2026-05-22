import mongoose from 'mongoose'

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Retail Channels', 'Corporate Channels']
  },
  type: {
    type: String,
    required: true,
    enum: ['retail', 'corporate']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Team', teamSchema)
