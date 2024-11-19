const express = require('express');
const { getNotificationsForUser, markAllAsRead, deleteNotification } = require('../../controllers/notificationsController');
const  authenticate  = require('../../middleware/auth');
const router = express.Router();


router.get('/', authenticate, getNotificationsForUser);
router.put('/mark-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;