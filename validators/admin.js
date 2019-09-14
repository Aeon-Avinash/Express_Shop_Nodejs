const { body, check, sanitizeBody } = require("express-validator");
const Product = require("../models/product");

exports.addProductValidator = [
  check("price")
    .trim()
    .not()
    .isEmpty()
    .escape()
    .isFloat(),
  // check("image").custom((value, { ref }) => {
  //   if (value === "") {
  //     return true;
  //   }
  //   if (value.match(/\.(jpeg|jpg|gif|png)$/) == null) {
  //     throw new Error("Invalid image file!");
  //   }
  //   return true;
  // }),
  check("title")
    .trim()
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 3, max: 30 }),
  sanitizeBody("description")
    .trim()
    .unescape()
];

exports.editProductValidator = [
  body().custom(async (_, { req }) => {
    const { productId } = req.params;
    const product = await Product.findOne({
      _id: productId,
      user: req.session.user._id
    });
    if (!product) {
      throw new Error("Unauthorized operation!");
    }
    return true;
  }),
  check("price")
    .trim()
    .not()
    .isEmpty()
    .escape()
    .isFloat(),
  // check("image").custom((value, { ref }) => {
  //   if (value === "") {
  //     return true;
  //   }
  //   if (value.match(/\.(jpeg|jpg|gif|png)$/) == null) {
  //     throw new Error("Invalid image url!");
  //   }
  //   return true;
  // }),
  check("title")
    .trim()
    .not()
    .isEmpty()
    .isString()
    .isLength({ min: 3, max: 30 }),
  sanitizeBody("description")
    .trim()
    .unescape()
];
