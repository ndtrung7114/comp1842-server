const express = require('express');
const { createPost, viewAllPosts, getPostById, updatePost, deletePost, likePost, unlikePost } = require('../../controllers/postController');
const  authenticate  = require('../../middleware/auth');
const router = express.Router();
const upload = require('../../middleware/upload');


module.exports = (io) => {
    router.post('/create', authenticate, upload, createPost);// Allow up to 10 images
    router.get('/', viewAllPosts);
    router.get('/:id', getPostById);
    router.put('/:id', authenticate, upload, updatePost);
    router.delete('/:id', authenticate, deletePost);
    router.post('/:postId/like', authenticate, (req, res) => likePost(req, res, io));
    router.post('/:postId/unlike', authenticate, unlikePost);
  
    return router;
  };
