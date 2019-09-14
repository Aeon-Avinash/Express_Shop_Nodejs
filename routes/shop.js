const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/isAuth");

router.get("/", shopController.getIndex);
router.get("/products", shopController.getProducts);
router.get("/products/:productId", shopController.getProductDetails);

router.get("/cart", isAuth, shopController.getCurrentCart);
router.post("/cart/:productId", isAuth, shopController.postAddToCart);
router.post(
  "/cart-remove/:productId",
  isAuth,
  shopController.postDeleteFromCart
);
router.post(
  "/cart-increase/:productId",
  isAuth,
  shopController.postIncreaseCart
);
router.post(
  "/cart-decrease/:productId",
  isAuth,
  shopController.postDecreaseCart
);

router.get("/orders", isAuth, shopController.getOrders);
router.get("/orders/:orderId", isAuth, shopController.getOrderInvoice);
router.post("/orders/:orderId", isAuth, shopController.postDeleteOrder);

router.get("/checkout", isAuth, shopController.getCheckout);
router.get(
  "/checkout-success/success",
  isAuth,
  shopController.getCheckoutSuccess
);

router.post("/webhook", shopController.checkoutSuccessWebhook);

module.exports = router;

// Possible ways to navigate to the views file:
// console.log(
//   path.join(path.dirname(process.mainModule.filename), 'views', 'shop.html')
// );
// console.log(path.join(__dirname, '..', 'views', 'shop.html'));
// console.log(path.resolve('views', 'shop.html'));
