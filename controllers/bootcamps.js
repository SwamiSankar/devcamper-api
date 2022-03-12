const Bootcamp = require('../models/Bootcamp');
const path = require('path');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const ErrorResponse = require('../utils/errorResponse');

//@desc    Get all bootcamps
//@route   GET /api/v1/bootcamps
//@access  Public
exports.getBootCamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@desc    Get a bootcamp
//@route   GET /api/v1/bootcamps/:id
//@access  Public
exports.getBootCamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: bootcamp,
  });
});

//@desc    Create a new Bootcamp
//@route   POST /api/v1/bootcamps
//@access  Private
exports.createBootCamp = asyncHandler(async (req, res, next) => {
  const bootcamps = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamps,
  });
});

//@desc    Update a Bootcamp
//@route   PUT /api/v1/bootcamps/:id
//@access  Private
exports.updateBootCamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: bootcamp,
  });
});

//@desc    Delete a new Bootcamp
//@route   DELETE /api/v1/bootcamps/:id
//@access  Private
exports.deleteBootCamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404)
    );
  }

  bootcamp.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

//@desc    Get bootcamps by radius
//@route   GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access  Private
exports.getBootCampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //Get lat,long via geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lon = loc[0].longitude;

  //Calculate radius using radians
  //Divide distance by radius of Earth
  //Earth Radius = 3963 mi / 6378 km
  const radius = distance / 6378;

  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[lon, lat], radius] },
    },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

//@desc    Upload photo for a Bootcamp
//@route   DELETE /api/v1/bootcamps/:id/photo
//@access  Private
exports.uploadBootcampPhoto = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.files;

  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Incorrect file type', 400));
  }

  //Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse('File size more than recommended size', 400));
  }

  //Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  //Upload file

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Error with file upload', 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
  });

  res.status(200).json({
    success: true,
    data: file.name,
  });
});
