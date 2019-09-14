const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const isAuth = require("../middleware/isAuth");

const {
  loginValidator,
  signupValidator,
  resetRequestValidator,
  resetPasswordValidator
} = require("../validators/auth");

router.get("/login", authController.getLogin);
router.post("/login", loginValidator, authController.postLogin);

router.get("/signup", authController.getSignup);
router.post("/signup", signupValidator, authController.postSignup);

router.post("/logout", isAuth, authController.postLogout);

router.get("/reset", authController.getConfirmReset);
router.post("/reset", resetRequestValidator, authController.postConfirmReset);

router.get("/reset/:token", authController.getEditAccount);
router.post(
  "/reset/:token",
  resetPasswordValidator,
  authController.postEditAccount
);

module.exports = router;
