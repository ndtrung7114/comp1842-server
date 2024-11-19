const Post = require("../models/Post");
const User = require("../models/User");


async function search(req, res) {
    try {
      const { q, filter } = req.query;
  
      if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
      }
  
      const searchQuery = new RegExp(q, 'i');
      let results = [];
  
      if (!filter || filter === 'all') {
        // Search both posts and users
        const [posts, users] = await Promise.all([
          Post.find({
            $or: [
              { title: searchQuery },
              { body: searchQuery }
            ]
          })
          .populate('author', 'username first_name last_name profile followers following posts liked_posts ')
          .limit(5),
          
          User.find({
            $or: [
              { username: searchQuery },
              { first_name: searchQuery },
              { last_name: searchQuery },
              { email: searchQuery }
            ]
          })
          .select('username first_name last_name profile followers following posts liked_posts ')
          .limit(5)
        ]);
  
        results = [...posts, ...users];
      } else if (filter === 'posts') {
        // Search only posts
        results = await Post.find({
          $or: [
            { title: searchQuery },
            { body: searchQuery }
          ]
        })
        .populate('author', 'username first_name last_name profile followers following posts liked_posts ')
        .limit(10);
      } else if (filter === 'users') {
        // Search only users
        results = await User.find({
          $or: [
            { username: searchQuery },
            { first_name: searchQuery },
            { last_name: searchQuery },
            { email: searchQuery }
          ]
        })
        .select('username first_name last_name profile followers following posts liked_posts ')
        .limit(10);
      }
  
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  module.exports = { search };