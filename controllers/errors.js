exports.getNotFound = (req, res, next) => {
  res.status(404).render("notFound", {
    isAuthenticated: req.session.isAuthenticated,
    docTitle: "404 | not found",
    path: "/404"
  });
};

exports.get500Error = (req, res, next) => {
  res.status(500).render("500Error", {
    isAuthenticated: req.session.isAuthenticated,
    docTitle: "500 | Internal Server Error",
    path: "/500"
  });
};

exports.requestLogger = (req, res, next) => {
  console.log(`Request Url: ${req.url}, ${req.method}`);
  next();
};
