const Bootcamp = require("../models/Bootcamp");
const Review = require("../models/Review");
const ErrorResponse = require("../utils/errorResponse");

//@desc:   Get all reviews
//@route:  GET api/v1/reviews
//@route:  GET api/v1/bootcamps/:bootcampId/reviews
//@access: Public
exports.getReviews = (req, res, next) => {
  if (req.params.bootcampId) {
    Review.find({ bootcamp: req.params.bootcampId })
      .then((data) => {
        if (!data) {
          next(
            new ErrorResponse(
              "Bootcamp not found with id of " + req.params.bootcampId,
              404
            )
          );
        }
        res.status(200).json({
          success: true,
          count: data.length,
          data: data,
        });
      })
      .catch((err) => {
        next(err);
      });
  } else {
    res.status(200).json(res.advancedResults);
  }
};

//@desc:   Get Single Review
//@route:  GET api/v1/reviews/:id
//@access: Public
exports.getReview = (req, res, next) => {
  Review.findOne({ _id: req.params.id })
    .populate({
      path: "bootcamp",
      select: "name description",
    })
    .then((review) => {
      if (!review) {
        return next(
          new ErrorResponse("Review not found with id of " + req.params.id, 404)
        );
      }

      res.status(200).json({
        success: true,
        data: review,
      });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Add a Review
//@route:  POST api/v1/bootcamps/:bootcampId/reviews
//@access: Private
exports.addReview = (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  Bootcamp.findById(req.params.bootcampId)
    .then((bootcamp) => {
      if (!bootcamp) {
        return next(
          new ErrorResponse(
            "Bootcamp not found with id of " + req.params.bootcampId,
            404
          )
        );
      }

      Review.create(req.body)
        .then((review) => {
          res.status(201).json({
            success: true,
            data: review,
          });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Update a Review
//@route:  PUT api/v1/reviews/:id
//@access: Private
exports.updateReview = (req, res, next) => {
  Review.findById(req.params.id)
    .then((review) => {
      if (!review) {
        return next(
          new ErrorResponse("Review not found with id of " + req.params.id, 404)
        );
      }

      //Make sure review belongs to user or user is admin
      if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
          new ErrorResponse("User not authorized to update this review", 401)
        );
      }

      Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .then((review) => {
          res.status(200).json({
            success: true,
            data: review,
          });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Delete a Review
//@route:  DELETE api/v1/reviews/:id
//@access: Private
exports.deleteReview = (req, res, next) => {
  Review.findById(req.params.id)
    .then((review) => {
      if (!review) {
        return next(
          new ErrorResponse("Review not found with id of " + req.params.id, 404)
        );
      }

      //Make sure review belongs to user or user is admin
      if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
          new ErrorResponse("User not authorized to delete this review", 401)
        );
      }

      review
        .remove()
        .then(() => {
          res.status(200).json({
            success: true,
            data: "Review Deleted Successfully",
          });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
};
