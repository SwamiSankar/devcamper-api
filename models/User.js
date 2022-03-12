const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a user name'],
  },
  email: {
    type: String,
    required: [true, 'Please add a email'],
    unique: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter email in the correct format',
    ],
  },

  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Please enter the password'],
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

//Match entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
