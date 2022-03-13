const express = require('express');

const {
  getBootCamp,
  getBootCamps,
  updateBootCamp,
  createBootCamp,
  deleteBootCamp,
  getBootCampsInRadius,
  uploadBootcampPhoto,
} = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

//Include other resource routers
const courseRouter = require('./courses');

const router = express.Router();

//Re-route to other resource router
router.use('/:bootcampId/courses', courseRouter);

router.route('/radius/:zipcode/:distance').get(getBootCampsInRadius);

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootCamps)
  .post(protect, authorize('publisher', 'admin'), createBootCamp);

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), uploadBootcampPhoto);

router
  .route('/:id')
  .get(getBootCamp)
  .put(protect, authorize('publisher', 'admin'), updateBootCamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootCamp);

module.exports = router;
