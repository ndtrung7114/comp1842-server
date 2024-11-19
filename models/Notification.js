const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
    {
      receiver: { type: Schema.Types.ObjectId, ref: 'users', required: true },  // User receiving the notification
      sender: { type: Schema.Types.ObjectId, ref: 'users', required: true },  // User sending the notification
      type: { 
        type: String, 
        enum: ['like', 'comment', 'friend_request', 'message'],  // Type of notification
        required: true 
      },
      reference: { type: Schema.Types.ObjectId },  // Reference to related data (e.g., post, comment, message)
      message: { type: String, required: true },  // Notification message
      is_read: { type: Boolean, default: false },  // Whether the user has read the notification
      created_at: { type: Date, default: Date.now }
    }
  );
  
  module.exports = mongoose.model('notifications', NotificationSchema);
  