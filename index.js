require('dotenv').config()
const socketIo = require('socket.io')
const http = require('http')

const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const path = require('path')
const corsOptions = require('./config/cors')
const connectDB = require('./config/database')
const credentials = require('./middleware/credentials')
const errorHandlerMiddleware = require('./middleware/error_handler')
const authenticationMiddleware = require('./middleware/authentication')

// Create Express server
const express = require('express')
const app = express()

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO with matching CORS config
const io = socketIo(server, {
  pingTimeout: 60000,
  cors: {
    origin: corsOptions.origin, 
    credentials: corsOptions.credentials, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
})

//post for local
// const PORT = 3500
//post for cloud
const PORT = process.env.PORT || 3001
// Basic Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    console.log('User joined room:', userId);
    socket.join(userId); // User joins a room based on their ID


  });



  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

connectDB()

// Allow Credentials
app.use(credentials)

// CORS
app.use(cors(corsOptions))

// application.x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))


// application/json response
app.use(express.json())

// middleware for cookies
app.use(cookieParser())

app.use(authenticationMiddleware)

// static files
app.use('/static', express.static(path.join(__dirname, 'public')))

// Default error handler
app.use(errorHandlerMiddleware)


// Routes
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/post', require('./routes/api/post')(io))
app.use('/api/comment', require('./routes/api/comment')(io))
app.use('/api/notification', require('./routes/api/notification'))
app.use('/api/message', require('./routes/api/message')(io))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/search', require('./routes/api/search'))
app.use('/api/admin', require('./routes/api/admin'))

app.all('*', (req, res) => {
  res.status(404)

  if (req.accepts('json')) {
    res.json({ 'error': '404 Not Found' })
  } else {
    res.type('text').send('404 Not Found')
  }
});



mongoose.connection.once('open', () => {
  console.log('DB connected')
  // app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) })
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
  })
})

module.exports = { io};