const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserSchema = Schema(
  {
    username: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      validate: [
        (val) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val),
      ]
    },

    first_name: {
      type: String,
      required: true
    },

    last_name: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true,
      min: 6
    },

    refresh_token: String,

    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
      required: true
    },

    profile: {
      facebook: {
        type: String,
        default: ''
      },
      avatar: {
        type: String,
        default: ''
      }
    },

    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users'
      }
    ],

    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users'
      }
    ],

    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'posts'
      }
    ],
    
    liked_posts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'posts'
      }
    ],

    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'comments'
      }
    ],

    notifications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'notifications'
      }
    ],
    
    status: {
      type: String,
      default: 'inactive',
      enum: ['active', 'inactive'],
      required: true
    },
    // New fields for OTP functionality
    otp: {
      type: String, // Store the OTP
      default: null // Default to null when not set
    },
    otpExpiration: {
      type: Date, // Store expiration time for the OTP
      default: null // Default to null when not set
    },
    isBan: {
      type: Boolean,
      default: false
    },
  },
  {
    virtuals: {
      full_name: {
        get() {
          return this.first_name + ' ' + this.last_name
        }
      },

      id: {
        get() {
          return this._id
        }
      }
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  },

)

module.exports = mongoose.model('users', UserSchema)