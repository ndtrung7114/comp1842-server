const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the message schema
const MessageSchema = new Schema(
    {
      sender: { type: Schema.Types.ObjectId, ref: 'users', required: true },  // User who sends the message
      recipient: { type: Schema.Types.ObjectId, ref: 'users', required: true },  // User who receives the message
      content: { type: String},  // Message text
      sent_at: { type: Date, default: Date.now },  // Time the message was sent
      imageUrls: [String],  // Array of image URLs sent with the message
      is_read: { type: Boolean, default: false }  // Whether the recipient has read the message
    }
  );
  // Export the model
  module.exports = mongoose.model('messages', MessageSchema);
  