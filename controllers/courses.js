const Bootcamp = require("../models/Bootcamp");
const Course = require("../models/Course");
const ErrorResponse = require("../utils/errorResponse");

//@desc:   Get all courses
//@route:  GET api/v1/courses
//@route:  GET api/v1/bootcamps/:bootcampId/courses
//@access: Public
exports.getCourses = (req, res, next) => {
  if (req.params.bootcampId) {
    Course.find({ bootcamp: req.params.bootcampId })
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

//@desc:   Get a single courses
//@route:  GET api/v1/courses/:id
//@access: Public
exports.getCourse = (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .populate({
      path: "bootcamp",
      select: "name description",
    })
    .then((course) => {
      if (!course) {
        next(
          new ErrorResponse("Course not found with id of " + req.params.id, 404)
        );
      } else {
        res.status(200).json({
          success: true,
          data: course,
        });
      }
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Add a course
//@route:  POST api/v1/bootcamps/:bootcampId/courses
//@access: Private
exports.addCourse = (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  Bootcamp.findOne({ _id: req.params.bootcampId }).then((bootcamp) => {
    if (!bootcamp) {
      next(
        new ErrorResponse(
          "Bootcamp not found with id of " + req.params.bootcampId,
          404
        )
      );
    } else {
      if (
        bootcamp.user.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return next(
          new ErrorResponse(
            "User with id " +
              req.user.id +
              " is not authorized to create a course in this bootcamp",
            401
          )
        );
      }

      Course.create(req.body).then((course) => {
        res.status(201).json({
          success: true,
          data: course,
        });
      });
    }
  });
};

//@desc:   Update a course
//@route:  PUT api/v1/courses/:id
//@access: Private
exports.updateCourse = (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .then((course) => {
      if (!course) {
        next(
          new ErrorResponse("Course not found with id of " + req.params.id, 404)
        );
      } else {
        if (
          course.user.toString() !== req.user.id &&
          req.user.role !== "admin"
        ) {
          return next(
            new ErrorResponse(
              "User with id " +
                req.user.id +
                " is not authorized to update this course",
              401
            )
          );
        }

        Course.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        })
          .then((course) => {
            res.status(200).json({
              success: true,
              data: course,
            });
          })
          .catch((err) => {
            next(err);
          });
      }
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Delete a course
//@route:  DELETE api/v1/courses/:id
//@access: Private
exports.deleteCourse = (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .then((course) => {
      if (!course) {
        next(
          new ErrorResponse("Course not found with id of " + req.params.id, 404)
        );
      } else {
        if (
          course.user.toString() !== req.user.id &&
          req.user.role !== "admin"
        ) {
          return next(
            new ErrorResponse(
              "User with id " +
                req.user.id +
                " is not authorized to delete this course",
              401
            )
          );
        }

        course
          .remove()
          .then(() => {
            res.status(200).json({
              success: true,
              data: "Course Deleted Successfully",
            });
          })
          .catch((err) => {
            next(err);
          });
      }
    })
    .catch((err) => {
      next(err);
    });
};
