const Notification = require('../models/Notification');



// Get notifications for a specific user
const getNotificationsForUser = async (req, res) => {
    try {
        
        
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in request' });
        }

        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', 'username profilePicture')
            .sort({ created_at: -1 });

        

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error('Error in getNotificationsForUser:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve user notifications',
            details: error.message 
        });
    }
};


// API to mark all notifications for the user as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // req.user._id holds the authenticated user's ID

    if (!userId) {
      console.error('User ID is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update all notifications for this user where `is_read` is `false`
    const updatedNotifications = await Notification.updateMany(
      { receiver: userId, is_read: false },
      { is_read: true }
    );

    if (!updatedNotifications) {
      return res.status(404).json({ error: 'Notifications not found' });
    }
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// delete a notification
const deleteNotification = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedNotification = await Notification.findByIdAndDelete(id);
  
      if (!deletedNotification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
  
      res.status(200).json(deletedNotification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  };

module.exports = {
    getNotificationsForUser,
    markAllAsRead,
    deleteNotification,
    };
