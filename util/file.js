const fs = require("fs");

exports.deleteFile = (filePath, next) => {
  fs.unlink(filePath, err => {
    if (err) {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  });
};
