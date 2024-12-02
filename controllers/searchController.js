const Post = require("../models/Post");
const User = require("../models/User");


// Asynchronous function to handle search requests
async function search(req, res) {
  try {
      // Extract query parameters 'q' (search query) and 'filter' from the request
      const { q, filter } = req.query;

      // If 'q' (search query) is missing, return a 400 Bad Request response
      if (!q) {
          return res.status(400).json({ message: 'Search query is required' });
      }

      // Create a case-insensitive regular expression from the search query
      const searchQuery = new RegExp(q, 'i');
      // Initialize an empty array to hold search results
      let results = [];

      // If no filter is provided or filter is 'all', search both posts and users
      if (!filter || filter === 'all') {
          // Use Promise.all to search both posts and users concurrently
          const [posts, users] = await Promise.all([
              // Search posts where the title or body matches the search query
              Post.find({
                  $or: [
                      { title: searchQuery },
                      { body: searchQuery }
                  ]
              })
              // Populate the 'author' field with selected fields from the related user document
              .populate('author', 'username first_name last_name profile followers following posts liked_posts')
              // Limit the number of post results to 5
              .limit(5),
              
              // Search users where username, first name, last name, or email matches the search query
              User.find({
                  $or: [
                      { username: searchQuery },
                      { first_name: searchQuery },
                      { last_name: searchQuery },
                      { email: searchQuery }
                  ]
              })
              // Select specific fields to return for user results
              .select('username first_name last_name profile followers following posts liked_posts')
              // Limit the number of user results to 5
              .limit(5)
          ]);

          // Combine posts and users into a single results array
          results = [...posts, ...users];
      } else if (filter === 'posts') {
          // If the filter is 'posts', search only in posts
          results = await Post.find({
              $or: [
                  { title: searchQuery },
                  { body: searchQuery }
              ]
          })
          // Populate the 'author' field with selected fields from the related user document
          .populate('author', 'username first_name last_name profile followers following posts liked_posts')
          // Limit the number of post results to 10
          .limit(10);
      } else if (filter === 'users') {
          // If the filter is 'users', search only in users
          results = await User.find({
              $or: [
                  { username: searchQuery },
                  { first_name: searchQuery },
                  { last_name: searchQuery },
                  { email: searchQuery }
              ]
          })
          // Select specific fields to return for user results
          .select('username first_name last_name profile followers following posts liked_posts')
          // Limit the number of user results to 10
          .limit(10);
      }

      // Send the search results back to the client in JSON format
      res.json(results);
  } catch (error) {
      // Log any errors to the console
      console.error('Search error:', error);
      // Return a 500 Internal Server Error response with an error message
      res.status(500).json({ message: 'Internal server error' });
  }
};

  module.exports = { search };