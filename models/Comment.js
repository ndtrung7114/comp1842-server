const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'posts', required: true },  // Reference to the post
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },  // User who made the comment
    content: { type: String, required: true },  // Comment content
    likes: [{ type: Schema.Types.ObjectId, ref: 'users' }],  // Users who liked this comment

  },
  {
    timestamps: true,
  }
);

// Method to format timestamps in Vietnam (GMT+7)
CommentSchema.methods.formatTimestamps = function () {
  return {
    ...this.toObject(),
    createdAt: moment(this.createdAt).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'), // Format to GMT+7
    updatedAt: moment(this.updatedAt).tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'), // Format to GMT+7
  };
};

module.exports = mongoose.model('comments', CommentSchema);
