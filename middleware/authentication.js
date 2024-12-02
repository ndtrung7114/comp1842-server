const jwt = require('jsonwebtoken')
const User = require('../models/User')

//function to authenticate user
function authentication(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  //check if the header is present and starts with Bearer
  if(authHeader?.startsWith('Bearer')) {

    const token = authHeader.split(' ')[1]
    //verify the token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if(err){
        req.user = {}
        return next()
      }
      //find the user by id and exclude password and refresh
      const user = await User.findById(decoded.id).select({ password: 0, refresh_token: 0 }).exec()
      //if user is found set req.user to the user object
      if(user){
        req.user = user.toObject({ getters: true })
      }else{
        req.user = {}
      }

      return next()

    })

  }else{
    req.user = {}
    return next()
  }
}

module.exports = authentication