const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const User = require("../models/User");

const createComment = async (req, res, io) => {
  const { postId, content } = req.body;
  if (!postId || !content) {
    return res.status(422).json({ message: "PostId and content must be fill" });
  }
  try {
    const post = await Post.findById(postId);
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!userId) return res.status(400).json({ message: "User ID is missing" });
    const newComment = await Comment.create({
      post: postId,
      user: userId,
      content,
    });
    post.comments.push(newComment._id); // Associate comment with post
    user.comments.push(newComment._id); // Associate comment with user

    await post.save();
    await user.save();

    //Create a notification
    const notification = await Notification.create({
      receiver: post.author,
      sender: userId,
      type: "comment",
      reference: postId,
      message: `${req.user.username} commented your post "${post.title}"`,
    });

    io.to(post.author.toString()).emit("newComment", {
      _id: notification._id.toString(), // Ensure it's a string
      receiver: post.author.toString(), // Ensure it's a string
      sender: userId.toString(), // Ensure it's a string
      type: notification.type,
      reference: postId.toString(), // Ensure it's a string
      message: notification.message,
      is_read: false, // New notifications are unread
      created_at: notification.created_at,
    });
    return res
      .status(201)
      .json({ message: "Comment created successfully", comment: newComment });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not create comment", error: error.message });
  }
};

const getAllComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate("user")
      .sort({ createdAt: -1 });

    return res.status(200).json({ comments });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not fetch comments", error: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;
    const comment = await Comment.findOne({ _id: commentId, user: userId });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.content = content;
    await comment.save();

    return res
      .status(200)
      .json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ message: "Could not update comment", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
        const comment = await Comment.findByIdAndDelete(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Remove the comment ID from the post's comments array
        await Post.updateOne(
            { _id: comment.post },
            { $pull: { comments: commentId } }
        );

        // Remove the comment ID from the user's comments array
        await User.updateOne(
            { _id: comment.user },
            { $pull: { comments: commentId } }
        );

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not delete comment", error: error.message });
  }
};

module.exports = {
  createComment,
  getAllComments,
  updateComment,
  deleteComment,
};
