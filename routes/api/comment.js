const express = require('express');
const { createComment, getAllComments, updateComment, deleteComment } = require('../../controllers/commentController');
const authenticate = require('../../middleware/auth');
const router = express.Router();

module.exports = (io) => {
    router.post('/create', authenticate, (req, res) => createComment(req, res, io));
    router.get('/:postId', getAllComments);
    router.put('/:commentId', authenticate, updateComment);
    router.delete('/:commentId', authenticate, deleteComment);
    return router;
};
