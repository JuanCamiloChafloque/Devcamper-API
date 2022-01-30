const express = require("express");
const router = express.Router({ mergeParams: true });
const controller = require("../controllers/courses");

// Other resources
const Course = require("../models/Course");
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

router.get(
  "/",
  advancedResults(Course, {
    path: "bootcamp",
    select: "name description",
  }),
  controller.getCourses
);
router.get("/:id", controller.getCourse);
router.post(
  "/",
  protect,
  authorize("publisher", "admin"),
  controller.addCourse
);
router.put(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  controller.updateCourse
);
router.delete(
  "/:id",
  protect,
  authorize("publisher", "admin"),
  controller.deleteCourse
);

module.exports = router;
