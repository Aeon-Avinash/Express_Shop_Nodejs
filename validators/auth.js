const bcrypt = require("bcryptjs");
const { check, body } = require("express-validator");
const User = require("../models/user");

exports.loginValidator = [
  check("email")
    .isEmail()
    .withMessage("Invalid Email")
    .normalizeEmail({ gmail_remove_dots: false })
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        throw new Error("Email or Password do not match. Try again!");
      }
      return true;
    }),
  body("password")
    .trim()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.body.email });
      const isMatch = await bcrypt.compare(value, user.password);
      if (!user || !isMatch) {
        throw new Error("Email or Password do not match. Try again!");
      }
      return true;
    })
];

exports.signupValidator = [
  check("email")
    .isEmail()
    .withMessage("Invalid Email")
    .normalizeEmail({ gmail_remove_dots: false })
    .custom(async (value, { req }) => {
      if (await User.findOne({ email: req.body.email })) {
        throw new Error("email already in use!");
      }
      return true;
    }),
  check("password")
    .trim()
    .isLength({ min: 7 })
    .withMessage("Password should be at least of 7 characters length")
    .custom((value, { req }) => {
      if (value.toLowerCase().includes("password")) {
        throw new Error("Password cannot have 'password' string in it");
      }
      return true;
    }),
  body("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    })
];

exports.resetRequestValidator = [
  check("email")
    .isEmail()
    .withMessage("Invalid Email")
    .normalizeEmail({ gmail_remove_dots: false })
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        throw new Error(
          "Account related to Email not found. Check Email again!"
        );
      }
      return true;
    })
];

exports.resetPasswordValidator = [
  check("email").custom(async (value, { req }) => {
    const { token } = req.params;
    const { email, userId, resetToken } = req.body;
    console.log(userId);
    const user = await User.findOne({ _id: userId, email: email });
    if (!token || !(token === resetToken) || !user) {
      throw new Error("Invalid request. Please try again!");
    }
    return true;
  }),
  check("newPassword")
    .trim()
    .isLength({ min: 7 })
    .withMessage("Password should be at least of 7 characters length")
    .custom((value, { req }) => {
      if (
        value
          .trim()
          .toLowerCase()
          .includes("password")
      ) {
        throw new Error("Password cannot have 'password' string in it");
      }
      return true;
    }),
  body("confirmNewPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    })
];
