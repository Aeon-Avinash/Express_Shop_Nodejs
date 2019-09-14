const path = require("path");
const fs = require("fs");
const https = require("https");

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const { mongooseConnect, sessionStoreConnect } = require("./util/database");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorControllers = require("./controllers/errors");
const User = require("./models/user");

const app = express();
const PORT = process.env.PORT || 8000;
const sessionStore = sessionStoreConnect();
const csrfProtection = csrf();

const privateKey = fs.readFileSync("server.key");
const certificate = fs.readFileSync("server.cert");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date(Date.now()).toISOString()}-${file.originalname}`);
  }
});
const fileFilter = (req, file, cb) => {
  cb(
    null,
    ["image/png", "image/jpg", "image/jpeg", "image/gif"].includes(
      file.mimetype
    )
  );
  // cb(null, file.originalname.match(/\.(jpeg|jpg|png|gif)$/))
};

app.set("view engine", "ejs");
app.set("views", "views");

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static(path.resolve("public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: "application/json" }));
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false }
  })
);
app.use((req, res, next) => {
  if (req.url === "/checkout-success" || req.url === "/webhook") {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});
app.use(flash());

app.use(errorControllers.requestLogger);

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated
    ? req.session.isAuthenticated
    : false;
  res.locals.csrfToken = req["csrfToken"] ? req.csrfToken() : "";
  next();
});

app.use(async (req, res, next) => {
  try {
    if (req.session.isAuthenticated && req.session.user) {
      const user = new User().init(req.session.user);
      req.session.user = user;
    }
    if (req.url === "/cart") {
      console.log("req.session.isAuthenticated", req.session.isAuthenticated);
    }
    next();
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
});

app.use("/admin", adminRoutes);
app.use("/", shopRoutes);
app.use("/", authRoutes);

// app.use("/500", errorControllers.get500Error);

app.use(errorControllers.getNotFound);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(error.httpStatusCode || 500).render("500Error", {
    isAuthenticated: req.session ? req.session.isAuthenticated : undefined,
    docTitle: "500 | Internal Server Error",
    path: "/500"
  });
});

mongooseConnect(dbConnect => {})
  .then(result => {
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    app.listen(PORT, () => {
      console.log(`Server is listening at Port ${PORT}...`);
    });
  })
  .catch(err => console.log(err));
