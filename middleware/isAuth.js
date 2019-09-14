module.exports = (req, res, next) => {
  if (!req.session.isAuthenticated || !req.session.user) {
    return res.redirect("/login");
  }
  next();
};
