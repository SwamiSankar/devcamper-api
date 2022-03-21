const asyncHandler = require('../middleware/async');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

//@desc    Resgister an user
//@route   POST /api/v1/auth/register
//@access  Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

//@desc    Login user
//@route   POST /api/v1/auth/login
//@access  Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email or password', 400));
  }

  //Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid Credentials', 401));
  }

  //Validating the password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid Credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

//@desc    Get Current logged in user
//@route   GET /api/v1/auth/me
//@access  Private

exports.getMe = asyncHandler(async (req, res, next) => {
  console.log(req);
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  console.log(req);
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Forgot Password
//@route   GET /api/v1/auth/forgotpassword
//@access  Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  //Get reset token

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  //Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `Please reset your password by providing a PUT request to this URL ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    (user.resetPasswordToken = undefined),
      (user.resetPasswordExpiry = undefined);

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Could not send email', 500));
  }

  console.log(resetToken);

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Reset password
//@route   PUT /api/v1/auth/resetpassword/:resettoken
//@access  Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
  //Get Hashed Token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  //Set new password

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //Create Token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};
