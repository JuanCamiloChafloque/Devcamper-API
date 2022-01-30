const Bootcamp = require("../models/Bootcamp");
const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");

//@desc:   Get all bootcamps
//@route:  GET api/v1/bootcamps
//@access: Public
exports.getBootcamps = async (req, res, next) => {
  res.status(200).json(res.advancedResults);
};

//@desc:   Get a bootcamp
//@route:  GET api/v1/bootcamps/:id
//@access: Public
exports.getBootcamp = (req, res, next) => {
  Bootcamp.findOne({ _id: req.params.id })
    .then((data) => {
      if (!data) {
        next(
          new ErrorResponse(
            "Bootcamp not found with id of " + req.params.id,
            404
          )
        );
      } else {
        res.status(200).json({
          success: true,
          data: data,
        });
      }
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Create a bootcamp
//@route:  POST api/v1/bootcamps
//@access: Private
exports.createBootcamp = (req, res, next) => {
  //Assign user to the bootcamp body
  req.body.user = req.user.id;

  //Check for published bootcamp
  Bootcamp.findOne({ user: req.user.id }).then((bootcamp) => {
    if (bootcamp && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          "The user with id " +
            req.user.id +
            " already has a published bootcamp",
          400
        )
      );
    }

    Bootcamp.create(req.body)
      .then((data) => {
        res.status(201).json({
          success: true,
          data: data,
        });
      })
      .catch((err) => {
        next(err);
      });
  });
};

//@desc:   Edit a bootcamp
//@route:  PUT api/v1/bootcamps/:id
//@access: Private
exports.updateBootcamp = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then((data) => {
      if (!data) {
        next(
          new ErrorResponse(
            "Bootcamp not found with id of " + req.params.id,
            404
          )
        );
      } else {
        //Make sure the logged in user is the same as the owner
        if (data.user.toString() !== req.user.id && req.user.role !== "admin") {
          return next(
            new ErrorResponse(
              "User with id " +
                req.user.id +
                " is not authorized to update this bootcamp",
              401
            )
          );
        }

        Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        })
          .then((data) => {
            res.status(200).json({
              success: true,
              data: data,
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

//@desc:   Delete a bootcamp
//@route:  DELETE api/v1/bootcamps/:id
//@access: Private
exports.deleteBootcamp = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then((bootcamp) => {
      if (
        bootcamp.user.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return next(
          new ErrorResponse(
            "User with id " +
              req.user.id +
              " is not authorized to delete this bootcamp",
            401
          )
        );
      }

      bootcamp.remove().then((data) => {
        if (!data) {
          next(
            new ErrorResponse(
              "Bootcamp not found with id of " + req.params.id,
              404
            )
          );
        } else {
          res.status(200).json({
            success: true,
            data: "Bootcamp Deleted Successfully",
          });
        }
      });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Get Bootcamps within a radius
//@route:  GET api/v1/bootcamps/radius/:zipcode/:distance
//@access: Public
exports.getBootcampsInRadius = (req, res, next) => {
  const { zipcode, distance } = req.params;

  //Get Lat, Long
  geocoder.geocode(zipcode).then((loc) => {
    const lat = loc[0].latitude;
    const lon = loc[0].longitude;

    //Calculate Radius using radians
    const radius = distance / 3963;
    Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [[lon, lat], radius] } },
    })
      .then((data) => {
        if (!data) {
          next(
            new ErrorResponse(
              "Bootcamp not found with id of " + req.params.id,
              404
            )
          );
        } else {
          res.status(200).json({
            success: true,
            count: data.length,
            data: data,
          });
        }
      })
      .catch((err) => {
        next(err);
      });
  });
};

//@desc:   Upload photo for bootcamp
//@route:  PUT api/v1/bootcamps/:id/photo
//@access: Private
exports.bootcampPhotoUpload = (req, res, next) => {
  Bootcamp.findOne({ _id: req.params.id })
    .then((bootcamp) => {
      if (!bootcamp) {
        next(
          new ErrorResponse(
            "Bootcamp not found with id of " + req.params.id,
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
                " is not authorized to update this bootcamp photo",
              401
            )
          );
        }

        if (!req.files) {
          next(new ErrorResponse("Please upload a file", 400));
        } else {
          const file = req.files.file;
          //Make sure the image is a photo
          if (!file.mimetype.startsWith("image")) {
            next(new ErrorResponse("Please upload an image file", 400));
          }
          //Check File size
          if (file.size > process.env.MAX_FILE_UPLOAD) {
            next(
              new ErrorResponse(
                "Please upload an image less than " +
                  process.env.MAX_FILE_UPLOAD,
                400
              )
            );
          }
          //Create custom file name
          file.name = "photo_" + bootcamp._id + path.parse(file.name).ext;
          file.mv(
            process.env.FILE_UPLOAD_PATH + "/" + file.name,
            async (err) => {
              if (err) {
                next(new ErrorResponse("Problem with file upload", 500));
              }
              Bootcamp.findByIdAndUpdate(req.params.id, {
                photo: file.name,
              })
                .then((data) => {
                  res.status(200).json({
                    success: true,
                    data: file.name,
                  });
                })
                .catch((err) => {
                  next(err);
                });
            }
          );
        }
      }
    })
    .catch((err) => {
      next(err);
    });
};
