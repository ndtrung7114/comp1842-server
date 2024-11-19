const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const path = require("path");
const fs = require("fs");
//function to create a post
const createPost = async (req, res) => {
  const { title, body } = req.body;
  //check if title and body are not empty
  if (!title || !body) {
    return res.status(422).json({ message: "Title and body must be fill" });
  }
  try {
    //get the userID from authentiend user
    const userId = req.user._id;
    // Check and filter existing images
    const imageUrls = req.files
      ? await Promise.all(req.files.map(async (file) => {
          const existingFilePath = path.join(
            __dirname, 
            "..", 
            "uploads", 
            file.filename
          );
          
          // If file doesn't exist, it will be saved by multer
          // If file exists, use existing path
          try {
            await fs.promises.access(existingFilePath, fs.constants.F_OK);
            return `/uploads/${file.filename}`;
          } catch (err) {
            // File doesn't exist, multer will save it
            return `/uploads/${file.filename}`;
          }
        }))
      : [];

    const newPost = await Post.create({
      title,
      body,
      author: userId,
      imageUrls,
    });

    // Update the user's posts array with the new post ID
    await User.findByIdAndUpdate(
      userId,
      { $push: { posts: newPost._id } }, // Add post ID to user's posts array
      { new: true }
    );
    return res
      .status(201)
      .json({ message: "Post created successfully", post: newPost, imageUrls });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not create post", error: error.message });
  }
};

//view all posts
const viewAllPosts = async (req, res) => {
  try {
    //use find function to fetch all posts and populate the author field to display the author responsible for the post
    const posts = await Post.find().sort({ createdAt: -1 })
      .populate("author")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          model: "users",
        },
      });
    const formattedPosts = posts.map((post) => {
      const formattedPost = post.formatTimestamps();

      // Manually format the comments
      const formattedComments = post.comments.map((comment) => {
        return new Comment(comment).formatTimestamps(); // Convert comment to Comment instance
      });

      return {
        ...formattedPost,
        comments: formattedComments, // Include formatted comments
      };
    });

    return res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not fetch posts", error: error.message });
  }
};

//get post by id
const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id).sort({ createdAt: -1 })
      .populate("author")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          model: "users",
        },
      });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Format the post
    const formattedPost = post.formatTimestamps();

    // Manually format the comments
    const formattedComments = post.comments.map((comment) => {
      return new Comment(comment).formatTimestamps(); // Convert comment to Comment instance
    });

    return res.status(200).json({
      post: {
        ...formattedPost,
        comments: formattedComments, // Include formatted comments
      },
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not fetch post", error: error.message });
  }
};

//Update a post

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;

  const existingImageUrls = JSON.parse(req.body.imageUrls || "[]");

  // Get new image files from multer
  const newImageUrls = req.files
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  // Combine existing and new image URLs
  const combinedImageUrls = [...existingImageUrls, ...newImageUrls];

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    //check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You are not authorized to update this post" });
    }

    // Remove deleted images from storage
    const removedImages = post.imageUrls.filter(
      (url) => !existingImageUrls.includes(url)
    );
    for (const imageUrl of removedImages) {
      try {
        // Remove the file from your storage
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          imageUrl.replace("/uploads/", "")
        );

        // Check if the file exists before attempting to delete it
        await fs.promises.access(filePath, fs.constants.F_OK);

        // File exists, now remove it
        await fs.promises.unlink(filePath);
        console.log(`Deleted image: ${filePath}`);
      } catch (err) {
        console.error("Error deleting image:", err);
        // Continue even if deletion fails
      }
    }

    // Update the post
    post.title = title;
    post.body = body;
    post.imageUrls = combinedImageUrls;

    await post.save();

    return res.status(200).json({
      message: "Post updated successfully",
      post: post.formatTimestamps(),
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not update post", error: error.message });
  }
};

//delete a post
const deletePost = async (req, res) => {
  const { id } = req.params;



  try {
    // Find the post and delete it
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Delete images from upload folder
    for (const imageUrl of post.imageUrls) {
      try {
        // Remove the file from storage
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          imageUrl.replace("/uploads/", "")
        );
    
        // Check if the file exists before attempting to delete it
        await fs.promises.access(filePath, fs.constants.F_OK);
    
        // File exists, now remove it
        await fs.promises.unlink(filePath);
        console.log(`Deleted image: ${filePath}`);
      } catch (err) {
        // Only log errors that are NOT "file not found"
        if (err.code !== 'ENOENT') {
          console.error("Error deleting image:", err);
        }
        // Silently continue if file is already deleted
      }
    }

    // Get the post author
    const postAuthor = await User.findById(post.author);

    // Remove the post ID from the author's posts array
    postAuthor.posts = postAuthor.posts.filter((postId) => postId.toString() !== id);

    // Remove the post ID from the author's liked_posts array
    postAuthor.liked_posts = postAuthor.liked_posts.filter((postId) => postId.toString() !== id);

    // Remove the associated comments from the author's comments array
    postAuthor.comments = postAuthor.comments.filter((commentId) => {
      return !post.comments.includes(commentId);
    });

    // Save the updated user document
    await postAuthor.save();

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: id });

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not delete post", error: error.message });
  }
};

const likePost = async (req, res, io) => {
  const { postId } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (user.liked_posts.includes(postId)) {
      return res
        .status(400)
        .json({ message: "You have already liked this post" });
    }

    // add post id to the user's liked_posts array
    user.liked_posts.push(postId);
    await user.save();

    // add user id to the post's likedBy array
    post.likedBy.push(userId);
    post.likes += 1;
    await post.save();

    //Create a notification
    const notification = await Notification.create({
      receiver: post.author,
      sender: userId,
      type: "like",
      reference: postId,
      message: `${req.user.username} liked your post "${post.title}"`,
    });

    const userWasLiked = await User.findById(post.author);

    if (userWasLiked) {
      userWasLiked.notifications.push(notification._id);
      await userWasLiked.save();
    }

    // Update the user's notifications
    

    // Add code to save the like, then emit the event
    io.to(post.author.toString()).emit("postLiked", {
      _id: notification._id.toString(), // Ensure it's a string
      receiver: post.author.toString(), // Ensure it's a string
      sender: userId.toString(), // Ensure it's a string
      type: notification.type,
      reference: postId.toString(), // Ensure it's a string
      message: notification.message,
      is_read: false, // New notifications are unread
      created_at: notification.created_at,
    });

    res.status(200).json({
      message: "Post liked successfully",
      post: post.formatTimestamps(),
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not like post", error: error.message });
  }
};

const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    // Check if the post and user exist
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //remove post id from the user's liked_posts array
    user.liked_posts = user.liked_posts.filter(
      (id) => id.toString() !== postId
    );
    await user.save();

    //remove user id from the post's likedBy array
    post.likedBy.pull(userId);
    post.likes -= 1;
    await post.save();

    res.status(200).json({
      message: "Post unliked successfully",
      post: post.formatTimestamps(),
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not unlike post", error: error.message });
  }
};

module.exports = {
  createPost,
  viewAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
