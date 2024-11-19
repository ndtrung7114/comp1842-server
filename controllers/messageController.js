const Message = require("../models/Message");

// Send a new message
exports.sendMessage = async (req, res, io) => {
  const { sender, recipient, content = '' } = req.body;

  

  const imageUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

  try {
    const message = new Message({
      sender,
      recipient,
      content,
      imageUrls,
    });

    await message.save();

    // Emit the message to the recipient in real-time
    io.to(recipient).emit("receiveMessage", message);
    res.status(201).json(message); // Send back the created message
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error });
  }
};

// Get all messages between two users
exports.getMessages = async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 },
      ],
    }).sort({ sent_at: 1 }); // Sort messages by date in ascending order

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve messages", error });
  }
};

exports.getUserConversations = async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { sent_at: 1 } // Sort by sent_at to ensure proper grouping
      },
      {
        $group: {
          _id: {
            user: {
              $cond: {
                if: { $eq: ["$sender", userId] },
                then: "$recipient",
                else: "$sender",
              },
            },
          },
          messages: {
            $push: {
              sender: "$sender",
              recipient: "$recipient",
              is_read: "$is_read",
              sent_at: "$sent_at"
            }
          },
          lastMessage: { $last: "$content" },
          lastSenderId: { $last: "$sender" },
          sentAt: { $last: "$sent_at" },
        },
      },
      {
        $addFields: {
          unreadCount: {
            $size: {
              $filter: {
                input: "$messages",
                as: "msg",
                cond: {
                  $and: [
                    { $eq: ["$$msg.recipient", userId] },
                    { $eq: ["$$msg.is_read", false] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 0,
          userId: "$userInfo._id",
          username: "$userInfo.username",
          fullName: {
            $concat: ["$userInfo.first_name", " ", "$userInfo.last_name"],
          },
          avatar: "$userInfo.profile.avatar",
          lastMessage: 1,
          lastSenderId: 1,
          sentAt: 1,
          unreadCount: 1,
          is_read: {
            $cond: {
              if: { $eq: ["$unreadCount", 0] },
              then: true,
              else: false
            }
          }
        },
      },
      { $sort: { sentAt: -1 } },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve conversations", error });
  }
};

// Mark a message as read
exports.markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Update the is_read status to true
    message.is_read = true;
    await message.save();

    res.status(200).json({ message: "Message marked as read successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to mark message as read", error });
  }
};
