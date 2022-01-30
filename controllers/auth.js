const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

//@desc:   Register User
//@route:  POST api/v1/auth/register
//@access: Public
exports.register = (req, res, next) => {
  const { name, email, password, role } = req.body;
  User.create({
    name,
    email,
    password,
    role,
  })
    .then((user) => {
      sendTokenResponse(user, 200, res);
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Login User
//@route:  POST api/v1/auth/login
//@access: Public
exports.login = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    next(new ErrorResponse("Please provide an email and password", 400));
  }

  User.findOne({ email: email })
    .select("+password")
    .then((user) => {
      if (!user) {
        next(new ErrorResponse("Invalid credentials", 401));
      } else {
        //Check for password match
        user
          .matchPassword(password)
          .then((isMatch) => {
            if (!isMatch) {
              next(new ErrorResponse("Invalid credentials", 401));
            } else {
              sendTokenResponse(user, 200, res);
            }
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

//@desc:   Get Current Logged In User
//@route:  GET api/v1/auth/me
//@access: Private
exports.getMe = (req, res, next) => {
  User.findById(req.user.id)
    .then((user) => {
      if (!user) {
        next(
          new ErrorResponse("User not found with id of " + req.user.id, 400)
        );
      } else {
        res.status(200).json({
          success: true,
          data: user,
        });
      }
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Logout User / Clear cookies
//@route:  GET api/v1/auth/logout
//@access: Private
exports.logout = (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: "Logged out",
  });
};

//@desc:   Forgot Password
//@route:  POST api/v1/auth/forgotpassword
//@access: Public
exports.forgotPassword = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return next(
          new ErrorResponse(
            "User not found with email of " + req.body.email,
            404
          )
        );
      }
      const resetToken = user.getResetPasswordToken();
      user.save({ validateBeforeSave: false }).then((user) => {
        //Create Reset URL
        const resetUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/v1/auth/resetpassword/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        sendEmail({
          email: user.email,
          subject: "Password Reset Token",
          message: message,
        })
          .then(() => {
            res.status(200).json({
              success: true,
              data: "Email Sent",
            });
          })
          .catch((err) => {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            user.save({ validateBeforeSave: false }).then((user) => {
              console.log(err);
              next(new ErrorResponse("Email could not be sent", 500));
            });
          });
      });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Reset Password
//@route:  PUT api/v1/auth/resetpassword/:resetToken
//@access: Public
exports.resetPassword = (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return next(new ErrorResponse("Invalid Token", 400));
      }

      //Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      user
        .save()
        .then(() => {
          sendTokenResponse(user, 200, res);
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Update User Details
//@route:  PUT api/v1/auth/updatedetails
//@access: Private
exports.updateDetails = (req, res, next) => {
  const fieldsToUdpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  User.findByIdAndUpdate(req.user.id, fieldsToUdpdate, {
    new: true,
    runValidators: true,
  })
    .then((user) => {
      if (!user) {
        next(
          new ErrorResponse("User not found with id of " + req.user.id, 400)
        );
      } else {
        res.status(200).json({
          success: true,
          data: user,
        });
      }
    })
    .catch((err) => {
      next(err);
    });
};

//@desc:   Update Password
//@route:  PUT api/v1/auth/updatepassword
//@access: Private
exports.updatePassword = (req, res, next) => {
  User.findById(req.user.id)
    .select("+password")
    .then((user) => {
      if (!user) {
        next(
          new ErrorResponse("User not found with id of " + req.user.id, 400)
        );
      } else {
        user
          .matchPassword(req.body.currentPassword)
          .then((isMatch) => {
            if (!isMatch) {
              return next(new ErrorResponse("Password is incorrect", 401));
            }

            user.password = req.body.newPassword;
            user
              .save()
              .then(() => {
                sendTokenResponse(user, 200, res);
              })
              .catch((err) => {
                next(err);
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

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    data: user,
    token: token,
  });
};
