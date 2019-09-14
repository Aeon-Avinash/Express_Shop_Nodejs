const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");
const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

const welcomeEmail = (email, name = "there") => ({
  to: email,
  from: "supportDesk@express-shop.com",
  subject: `Welcome onboard to Express-Shop`,
  html: `<p>Hi ${name}, We are excited to have you at Express Shop. 
  We hope you enjoy your shopping at our shop. Please reach out to us with any help or advice on improving your shopping experience.</p> 
  </p>Thanks</p>
  <p>Team Express-Shop</p>`
});

const resetConfirmEmail = (token, email, name = "there") => ({
  to: email,
  from: "supportDesk@express-shop.com",
  subject: `ExpressShop Account: Password Reset Request`,
  html: `<p>Hi ${name}, You are receiving this email because we recieived a password reset request. If it wasn't you kindly ignore this mail. To continue with password reset, please click the provided link to proceed with password updation.</p>
  <p>The take expires in one hour. Click the password change request link: <a href="http://localhost:8000/reset/${token}">Reset Password</a></p>
  <p>We hope you enjoy your shopping at our shop. Please reach out to us with any help or advice on improving your shopping experience.</p> 
  </p>Thanks</p>
  <p>Team Express-Shop</p>`
});

exports.getLogin = (req, res, next) => {
  res.render("auth/auth", {
    existing: "existing",
    errorMessage: req.flash("errorMessage"),
    confirmMessage: req.flash("confirmMessage"),
    docTitle: "Log in :: Express Shop",
    path: "/login",
    validationErrors: []
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/auth", {
      errorMessage: errors.array()[0].msg,
      confirmMessage: null,
      existing: "existing",
      docTitle: "Log in :: Express Shop",
      path: "/login",
      prevInput: {
        email,
        password
      },
      validationErrors: errors.array()
    });
  }
  try {
    const user = await User.findOne({ email });
    req.session.isAuthenticated = true;
    req.session.user = user;
    await req.session.save();
    return res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

exports.getSignup = (req, res, next) => {
  res.render("auth/auth", {
    existing: null,
    errorMessage: req.flash("errorMessage"),
    confirmMessage: req.flash("confirmMessage"),
    docTitle: "Sign up :: Express Shop",
    path: "/signup",
    validationErrors: []
  });
};

exports.postSignup = async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/auth", {
      errorMessage: errors.array()[0].msg,
      confirmMessage: null,
      existing: null,
      docTitle: "Sign up :: Express Shop",
      path: "/signup",
      prevInput: {
        email,
        password,
        confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  try {
    const hashedPasssword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPasssword });
    await user.save();
    req.session.isAuthenticated = true;
    req.session.user = user;
    await req.session.save();
    req.flash("confirmMessage", "Successfully registered. Enjoy Express-Shop!");
    res.redirect("/");
    transporter.sendMail(welcomeEmail(email));
  } catch (err) {
    console.log(err);
    res.redirect("/signup");
  }
};

exports.postLogout = async (req, res, next) => {
  try {
    await req.session.destroy();
    // return res.render("auth/auth", {
    //   existing: "existing",
    //   errorMessage: null,
    //   confirmMessage: "Successfully logged out!",
    //   docTitle: "Log in :: Express Shop",
    //   path: "/login"
    // });
    return res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

exports.getConfirmReset = async (req, res, next) => {
  res.render("auth/confirm-reset", {
    errorMessage: req.flash("errorMessage"),
    docTitle: "Forgot Password :: Express Shop",
    path: "/reset",
    validationErrors: []
  });
};

exports.postConfirmReset = async (req, res, next) => {
  const { email } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/confirm-reset", {
      errorMessage: errors.array()[0].msg,
      docTitle: "Forgot Password :: Express Shop",
      path: "/reset",
      prevInput: {
        email
      },
      validationErrors: errors.array()
    });
  }
  try {
    const user = await User.findOne({ email });
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString("hex");
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    await transporter.sendMail(resetConfirmEmail(token, email));

    return res.render("auth/auth", {
      existing: "existing",
      errorMessage: null,
      confirmMessage:
        "Account update Email has been sent. Please check your inbox!",
      docTitle: "Log in :: Express Shop",
      path: "/login",
      validationErrors: []
    });
  } catch (err) {
    console.log(err);
    res.redirect("/reset");
  }
};

exports.getEditAccount = async (req, res, next) => {
  const { token: resetToken } = req.params;
  try {
    if (!resetToken) {
      return res.render("auth/auth", {
        existing: "existing",
        errorMessage: "Invalid token or token has expired. Please try again!",
        confirmMessage: null,
        docTitle: "Log in :: Express Shop",
        path: "/login"
      });
    }
    const user = await User.findOne({
      resetToken,
      resetTokenExpiration: { $gt: Date.now() }
    });
    if (!user) {
      return res.render("auth/auth", {
        existing: "existing",
        errorMessage: "Invalid token or token has expired. Please try again!",
        confirmMessage: null,
        docTitle: "Log in :: Express Shop",
        path: "/login"
      });
    }

    res.render("auth/edit-auth", {
      errorMessage: null,
      confirmMessage: null,
      resetToken,
      email: user.email,
      userId: user._id,
      docTitle: "Update Account :: Express Shop",
      path: "/edit-account",
      validationErrors: []
    });
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

exports.postEditAccount = async (req, res, next) => {
  const { token } = req.params;
  const {
    newPassword,
    confirmNewPassword,
    email,
    userId,
    resetToken
  } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/edit-auth", {
      errorMessage: errors.array()[0].msg,
      confirmMessage: null,
      docTitle: "Forgot Password :: Express Shop",
      path: "/edit-auth",
      prevInput: {
        email,
        newPassword,
        confirmNewPassword,
        resetToken,
        token,
        userId
      },
      validationErrors: errors.array()
    });
  }
  try {
    const user = await User.findOne({ _id: userId, email });
    const hashedNewPasssword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPasssword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();
    req.flash("confirmMessage", "Account details successfully updated.");
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/edit-account");
  }
};
