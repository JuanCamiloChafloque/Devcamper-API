const express = require("express");
const router = express.Router({ mergeParams: true });
const controller = require("../controllers/reviews");

// Other resources
const Review = require("../models/Review");
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

router.get(
  "/",
  advancedResults(Review, {
    path: "bootcamp",
    select: "name description",
  }),
  controller.getReviews
);
router.get("/:id", controller.getReview);
router.post("/", protect, authorize("user", "admin"), controller.addReview);
router.put(
  "/:id",
  protect,
  authorize("user", "admin"),
  controller.updateReview
);
router.delete(
  "/:id",
  protect,
  authorize("user", "admin"),
  controller.deleteReview
);

module.exports = router;
