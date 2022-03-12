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

//Include other resource routers
const courseRouter = require('./courses');

const router = express.Router();

//Re-route to other resource router
router.use('/:bootcampId/courses', courseRouter);

router.route('/radius/:zipcode/:distance').get(getBootCampsInRadius);

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootCamps)
  .post(createBootCamp);

router.route('/:id/photo').put(uploadBootcampPhoto);

router
  .route('/:id')
  .get(getBootCamp)
  .put(updateBootCamp)
  .delete(deleteBootCamp);

module.exports = router;
