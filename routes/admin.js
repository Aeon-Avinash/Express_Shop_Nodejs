const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/isAuth");
const {
  addProductValidator,
  editProductValidator
} = require("../validators/admin");

router.post(
  "/add-product",
  isAuth,
  addProductValidator,
  adminController.postAddProduct
);

router.get("/add-product", isAuth, adminController.getAddProduct);

router.get("/products", isAuth, adminController.getAdminProducts);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product/:productId",
  isAuth,
  editProductValidator,
  adminController.postEditProduct
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
