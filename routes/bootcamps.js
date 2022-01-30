const express = require("express");
const router = express.Router();
const controller = require("../controllers/bootcamps");

// Other resources
const Bootcamp = require("../models/Bootcamp");
const courseRouter = require("./courses");
const reviewRouter = require("./reviews");
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

//Re route into other resource routes
router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewRouter);

//Bootcamps routes
router.get("/", advancedResults(Bootcamp, "courses"), controller.getBootcamps);
router.get("/:id", controller.getBootcamp);
router.get("/radius/:zipcode/:distance", controller.getBootcampsInRadius);
router.post(
  "/",
  protect,
  authorize("publisher", "admin"),
  controller.createBootcamp
);
router.put(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  controller.updateBootcamp
);
router.put(
  "/:id/photo",
  protect,
  authorize("publisher", "admin"),
  controller.bootcampPhotoUpload
);
router.delete(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  controller.deleteBootcamp
);

module.exports = router;
