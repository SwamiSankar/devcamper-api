const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

//@desc    Get all courses
//@route   GET /api/v1/courses
//@route   GET /api/v1/bootcamps/:bootcampId/courses
//@access  Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
  const courses = await query;

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

//@desc    Get all courses
//@route   GET /api/v1/courses/:id
//@access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course found under id ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc    Create a course
//@route   POST /api/v1/bootcamps/:bootcampId/courses
//@access  Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.bootcampId}`),
      404
    );
  }

  //Make sure it is the course owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not authorized to add course to this bootcamp ${bootcamp.name}`,
        401
      )
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc    Update a course
//@route   PUT /api/v1/courses/:id
//@access  Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id ${req.params.id}`),
      404
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  //Make sure it is the course owner
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not authorized to update the course ${course.name}`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc    Delete a course
//@route   DELETE /api/v1/courses/:id
//@access  Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id ${req.params.id}`),
      404
    );
  }

  //Make sure it is the course owner
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user.name} is not authorized to delete the course ${course.name}`,
        401
      )
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
