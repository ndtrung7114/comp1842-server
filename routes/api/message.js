const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/messageController');
const  authenticate  = require('../../middleware/auth');
const upload = require('../../middleware/upload');


module.exports = (io) => {
    // Route for sending a message
router.post('/send', authenticate, upload, (req, res) => messageController.sendMessage(req, res, io));

// Route for retrieving messages between two users
router.get('/:userId1/:userId2', authenticate, messageController.getMessages);

router.get('/conversations', authenticate, messageController.getUserConversations);
router.post('/:messageId/markAsRead', authenticate, messageController.markMessageAsRead);

return router;
}

