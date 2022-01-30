const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth");

//Other Resources
const { protect } = require("../middleware/auth");

router.get("/me", protect, controller.getMe);
router.get("/logout", controller.logout);
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/forgotpassword", controller.forgotPassword);
router.put("/resetPassword/:resetToken", controller.resetPassword);
router.put("/updatedetails", protect, controller.updateDetails);
router.put("/updatepassword", protect, controller.updatePassword);

module.exports = router;
