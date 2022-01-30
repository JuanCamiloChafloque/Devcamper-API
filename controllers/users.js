const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

//@desc:   Get All Users
//@route:  GET api/v1/users
//@access: Private/admin
exports.getUsers = (req, res, next) => {
  res.status(200).json(res.advancedResults);
};

//@desc:   Get Single User
//@route:  GET api/v1/users/:id
//@access: Private/admin
exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        return next(
          new ErrorResponse("User not found with id of " + req.params.id, 404)
        );
      }
      res.status(200).json({
        success: true,
        data: user,
      });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Create Single User
//@route:  POST api/v1/users
//@access: Private/admin
exports.createUser = (req, res, next) => {
  User.create(req.body)
    .then((user) => {
      res.status(201).json({
        success: true,
        data: user,
      });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Update Single User
//@route:  PUT api/v1/users/:id
//@access: Private/admin
exports.updateUser = (req, res, next) => {
  User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .then((user) => {
      if (!user) {
        return next(
          new ErrorResponse("User not found with id of " + req.params.id, 404)
        );
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Delete Single User
//@route:  DELETE api/v1/users/:id
//@access: Private/admin
exports.deleteUser = (req, res, next) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (!user) {
        return next(
          new ErrorResponse("User not found with id of " + req.params.id, 404)
        );
      }

      res.status(200).json({
        success: true,
        data: "User Deleted Successfully",
      });
    })
    .catch((err) => {
      next(err);
    });
};
