const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');



// register with role basedcz
async function register(req, res) {
  const {username, email, first_name, last_name, password, password_confirm} = req.body

  if(!username || !email || !password || !password_confirm || !first_name || !last_name) {
    return res.status(422).json({'message': 'Invalid fields'})
  }

  // Validate FPT email domain
  if (!email.toLowerCase().endsWith('@fpt.edu.vn')) {
    return res.status(422).json({
      'message': 'Registration is only allowed with an @fpt.edu.vn email address'
    })
  }

  if(password !== password_confirm) return res.status(422).json({'message': 'Passwords do not match'})

  const userExists = await User.exists({email}).exec()
  //check if user exists
  if(userExists) return res.sendStatus(409).json({message: 'User already exists'})
  //hash password
  try {
    hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({email, username, password: hashedPassword, first_name, last_name})

    // Send confirmation email
    const emailHtml = `
      <h1>Welcome to Our Greenwich Viet Nam University!</h1>
      <p>Dear ${first_name} ${last_name},</p>
      <p>Thank you for registering with us. Here are your registration details:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Name:</strong> ${first_name} ${last_name}</li>
      </ul>
      <p>You can now log in to your account using your email and password.</p>
      <p>If you did not create this account, please contact our support team immediately.</p>
      <br>
      <p>Best regards,</p>
      <p>Greenwich Viet Nam Team</p>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Our Platform - Registration Successful',
      html: emailHtml
    })


    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    return res.status(400).json({ message: "Could not register", error: error.message });
  }
}


async function login(req, res){
  const {email, password } = req.body

  if(!email || !password) return res.status(422).json({'message': 'Invalid fields'})
  
  const user = await User.findOne({email}).exec()

  

  if(!user) return res.status(401).json({message: "Email is in incorrect"})

  const match = await bcrypt.compare(password, user.password)

  if(!match) return res.status(401).json({message: "Email or password is incorrect"})

  if(user.isBan) return res.status(401).json({message: "User is banned"})

  const accessToken = jwt.sign(
    {
      id: user.id
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '1800s'
    }
  )

  const refreshToken = jwt.sign(
    {
      id: user.id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '1d'
    }
  )

  user.refresh_token = refreshToken
  await user.save()

  res.cookie('refresh_token', refreshToken, {httpOnly: true, sameSite: 'None', secure: true, maxAge: 24*60*60*1000})

  //return the user and role document
  res.json({access_token: accessToken})
}

async function logout(req, res){
  const cookies = req.cookies

  if(!cookies.refresh_token) return res.sendStatus(204)

  const refreshToken = cookies.refresh_token
  const user = await User.findOne({refresh_token: refreshToken}).exec()

  if(!user){
    res.clearCookie('refresh_token', {httpOnly: true, sameSite: 'None', secure: true})
    return res.sendStatus(204)
  }

  user.refresh_token = null
  await user.save()

  res.clearCookie('refresh_token', {httpOnly: true, sameSite: 'None', secure: true})
  res.sendStatus(204)
}

async function refresh(req, res){
  const cookies = req.cookies
  if(!cookies.refresh_token) return res.sendStatus(401)

  const refreshToken = cookies.refresh_token

  const user = await User.findOne({refresh_token: refreshToken}).exec()

  if(!user) return res.sendStatus(403)

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
      if(err || user.id !== decoded.id) return res.sendStatus(403)

      const accessToken = jwt.sign(
        { id: decoded.id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1800s' }
      )

      res.json({access_token: accessToken})
    }
  )
}


async function user(req, res) {
  const user = req.user;
  return res.status(200).json({ user });
}

async function viewUserById(req, res) {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  return res.status(200).json({ user });
}


// Email transport configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

async function forgotPassword(req, res) {

  const { email } = req.body;
  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
  user.otp = otp; // Store OTP in user record
  user.otpExpiration = Date.now() + 300000; // 5 minutes expiration
  await user.save();

  // Send OTP to email
  await transporter.sendMail({
    to: email,
    subject: 'Password Reset OTP',
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`
  });

  res.json({ message: 'OTP sent to your email.' });
}

// verify OTP
async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.otp || !user.otpExpiration) {
    return res.status(400).json({ message: 'Invalid OTP or OTP expired.' });
  }

  if (user.otp !== otp || Date.now() > user.otpExpiration) {
    return res.status(400).json({ message: 'Invalid OTP or OTP expired.' });
  }

  // OTP is valid, allow user to set a new password
  res.status(200).json({ message: 'OTP verified. You can now set a new password.' });
}

// reset password
async function resetPassword(req, res) {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword; // Set new password
  user.otp = null; // Clear OTP and expiration
  user.otpExpiration = null; 
  await user.save();

  res.status(200).json({ message: 'Password has been reset successfully.' });
}

async function updateProfile(req, res) {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const { first_name, last_name, username, email, facebook } = req.body;
  

  // Handle avatar update
  // Handle multiple image uploads, save paths in an array
  const imageUrls = req.files
  ? req.files.map((file) => `/uploads/${file.filename}`)
  : [];

  try {
    // Only update fields that were sent in the request
    if (req.body.first_name !== undefined) user.first_name = req.body.first_name;
    if (req.body.last_name !== undefined) user.last_name = req.body.last_name;
    if (req.body.username !== undefined) user.username = req.body.username;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.facebook !== undefined) user.profile.facebook = req.body.facebook;
    
    // Only update avatar if new images were uploaded
    if (req.files && req.files.length > 0) {
      user.profile.avatar = `/uploads/${req.files[0].filename}`;
    }

    await user.save();

    return res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    return res.status(400).json({ message: 'Could not update profile.', error: error.message });
  }
}

async function updatePassword(req, res) {
  const userId = req.params.id;
  const { current_password, new_password, new_password_confirmation } = req.body;
   
  
    if (req.user._id != userId) {
      return res.status(403).json({ message: 'You are not authorized to update this user.' });
    }
    // Validate input
    if (!current_password || !new_password || !new_password_confirmation) {
      return res.status(400).json({ 
        message: 'Current password, new password and confirmation are required.' 
      });
    }

    // Check if new password matches confirmation
    if (new_password !== new_password_confirmation) {
      return res.status(400).json({ 
        message: 'New password and confirmation do not match.' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);

    // Debug: Log comparison result
    console.log('Password comparison result:', isValidPassword);
    console.log('Comparison details:', {
      providedPassword: current_password,
      storedHash: user.password,
      comparisonResult: isValidPassword
    });

    if (!isValidPassword) {
      return res.status(400).json({ 
        message: 'Current password is incorrect.',
        debug: {
          userId,
          comparisonResult: isValidPassword
        }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ 
      message: 'Password updated successfullyyyy.' 
    });
}


module.exports = {register, login, logout, refresh, user, viewUserById, forgotPassword, verifyOtp, resetPassword, updateProfile, updatePassword}