const mongoose = require('mongoose');
const moment = require('moment-timezone');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',  // Referencing the 'users' collection
    required: true,
  },
  imageUrls: [String],
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',  // Reference to the 'users' collection
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'comments',  // Reference to the 'comments' collection (if exists)
  }],
}, {
  timestamps: true,  // Automatically manage `createdAt` and `updatedAt`
});
// Method to format timestamps in Vietnam (GMT+7)
PostSchema.methods.formatTimestamps = function () {
  return {
    ...this.toObject(),
    createdAt: moment(this.createdAt).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'), // Format to GMT+7
    updatedAt: moment(this.updatedAt).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'), // Format to GMT+7
  };
};
module.exports = mongoose.model('posts', PostSchema);
