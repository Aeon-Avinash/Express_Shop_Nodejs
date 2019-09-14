const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_TEST_APIKEY);
const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");

const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
const ITEMS_PER_PAGE = 2;

exports.getIndex = async (req, res, next) => {
  const page = req.query && req.query.page;
  let currentPage;
  if (page === undefined || page === "1") {
    currentPage = 1;
  } else {
    currentPage = Number(page);
  }
  try {
    const productsCount = await Product.find({}).countDocuments();
    const prevPage = currentPage === 1 ? 1 : currentPage - 1;
    const nextPage =
      currentPage * ITEMS_PER_PAGE === productsCount
        ? currentPage
        : currentPage + 1;

    const products = await Product.find({})
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render("shop/index", {
      products,
      confirmMessage: req.flash("confirmMessage"),
      docTitle: "Express Shop",
      path: "/",
      prevPage,
      currentPage,
      nextPage
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  const page = req.query && req.query.page;
  let currentPage;
  if (page === undefined || page === "1") {
    currentPage = 1;
  } else {
    currentPage = Number(page);
  }
  try {
    const productsCount = await Product.find({}).countDocuments();
    const prevPage = currentPage === 1 ? 1 : currentPage - 1;
    const nextPage =
      currentPage * ITEMS_PER_PAGE === productsCount
        ? currentPage
        : currentPage + 1;

    const products = await Product.find({})
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.render("shop/shop-product-list", {
      products,
      docTitle: "Products: Express Shop",
      path: "/products",
      prevPage,
      currentPage,
      nextPage
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProductDetails = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.render("notFound", {
        docTitle: "404 | not found",
        path: "/404"
      });
    }
    res.render("shop/product-detail", {
      product,
      docTitle: "Product Details",
      path: `/products`
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCurrentCart = async (req, res, next) => {
  try {
    const populatedUser = await User.findById(req.session.user._id).populate(
      "cart.items.product"
    );
    let totalItems = 0;
    let totalPrice = 0;
    populatedUser.cart.items.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.product.price * item.quantity;
    });

    res.render("shop/cart", {
      errorMessage: req.flash("errorMessage"),
      cartId: Date.now,
      items: populatedUser.cart.items,
      totalItems,
      totalPrice,
      docTitle: "Your Express Cart",
      path: "/cart"
    });
  } catch (err) {
    console.log(err);
    res.redirect("/products");
  }
};

exports.postAddToCart = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const existingIndex = req.session.user.cart.items.findIndex(item => {
      return item.product.equals(productId);
    });
    if (existingIndex !== -1) {
      req.session.user.cart.items[existingIndex].quantity += 1;
    } else {
      req.session.user.cart.items.push({ product: productId, quantity: 1 });
    }

    const user = await req.session.user.save();

    return res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.redirect("/products");
  }
};

exports.postDeleteFromCart = async (req, res, next) => {
  const { productId } = req.params;

  try {
    req.session.user.cart.items = req.session.user.cart.items.filter(
      item => !item.product.equals(productId)
    );
    const user = await req.session.user.save();
    return res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.redirect("/cart");
  }
};

exports.postIncreaseCart = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const existingIndex = req.session.user.cart.items.findIndex(item =>
      item.product.equals(productId)
    );
    req.session.user.cart.items[existingIndex].quantity += 1;
    const user = await req.session.user.save();
    return res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.redirect("/cart");
  }
};

exports.postDecreaseCart = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const existingIndex = req.session.user.cart.items.findIndex(item =>
      item.product.equals(productId)
    );
    if (
      req.session.user.cart.items[existingIndex] &&
      req.session.user.cart.items[existingIndex].quantity > 1
    ) {
      req.session.user.cart.items[existingIndex].quantity -= 1;
    } else {
      req.session.user.cart.items = req.session.user.cart.items.filter(
        item => !item.product.equals(productId)
      );
    }

    const user = await req.session.user.save();
    return res.redirect("/cart");
  } catch (err) {
    console.log(err);
    res.redirect("/cart");
  }
};

exports.getCheckout = async (req, res, next) => {
  try {
    const user = req.session.user._id;

    const populatedUser = await User.findById(user).populate(
      "cart.items.product"
    );

    let totalItems = 0;
    let totalPrice = 0;
    populatedUser.cart.items.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.product.price * item.quantity;
    });

    const lineItems = populatedUser.cart.items.map(({ product, quantity }) => {
      let imageUrl = product.imageUrl;
      imageUrl =
        imageUrl !== ""
          ? imageUrl
          : `https://source.unsplash.com/800x600/?${product.title}`;
      return {
        name: product.title,
        description: product.description,
        images: [imageUrl],
        amount: parseInt(product.price * 100),
        currency: "usd",
        quantity: quantity
      };
    });

    const createStripeSession = async () => {
      const session = await stripe.checkout.sessions.create({
        client_reference_id: String(user),
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url: `http://localhost:8000/checkout-success/success?userId=${user}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: "http://localhost:8000/cart"
      });
      return session;
    };

    const checkoutSession = await createStripeSession();
    console.log(checkoutSession.id);
    const checkoutSessionId = checkoutSession ? checkoutSession.id : undefined;

    if (!checkoutSession || !checkoutSessionId) {
      req.flash("errorMessage", "Network/Technical error. Please try again!");
      return res.redirect("/cart");
    }

    req.session.user.currentTransaction.sessionId = checkoutSessionId;
    await req.session.user.save();

    return res.render("shop/checkout", {
      email: req.session.user.email,
      totalItems,
      totalPrice,
      checkoutSessionId: checkoutSessionId,
      docTitle: "Express Shop Checkout",
      path: "/orders"
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.checkoutSuccessWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("checkout.session: Webhook", event.type);
    try {
      const user = await User.findOne({ _id: session.client_reference_id });
      user.currentTransaction.confirmSignature = true;
      user.currentTransaction.failureMessage = "no errors";
      console.log(user._id);
      req.session.isAuthenticated = true;
      req.session.user = user;
      await req.session.save();
      console.log("checkout.session.completed", session.id);
      //! Do not redirect after req.session.save() or else it saves an entirely new copy
      // return res.redirect("/cart");
    } catch (err) {
      console.log(err);
    }
  }
  res.json({ received: true });
};

exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    const { session_id } = req.query;

    const transactionSuccessFlag =
      req.session.user.currentTransaction.confirmSignature;

    const transactionSessionIdMatch =
      req.session.user.currentTransaction.sessionId === session_id;

    if (!transactionSuccessFlag || !transactionSessionIdMatch) {
      req.flash(
        "errorMessage",
        "Network/Technical error. We are working on it. We will update you with the transaction status ASAP!"
      );
      //? add: proper failureMessage delivery to the user
      return res.redirect("/cart");
    }

    console.log("get-Checkout-Success!");

    const populatedUser = await User.findOne({
      _id: req.session.user._id
    }).populate("cart.items.product");

    let totalItems = 0;
    let totalPrice = 0;
    populatedUser.cart.items.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.product.price * item.quantity;
    });

    const order = new Order({
      createdAt: new Date(Date.now()).toLocaleString(),
      user: req.session.user._id,
      totalItems,
      totalPrice,
      cart: populatedUser.cart
    });

    await order.save();
    req.session.user.cart = { items: [] };
    await req.session.user.save();

    return res.redirect("/orders");
  } catch (err) {
    console.log(err);
    res.redirect("/cart");
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "name, email");

    res.render("shop/orders", {
      name: req.session.user.name,
      orders: orders,
      docTitle: "Your Express Order History",
      path: "/orders"
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postDeleteOrder = async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.session.user._id;

  try {
    const deleted = await Order.findByIdAndDelete(orderId);
    res.redirect("/orders");
  } catch (err) {
    console.log(err);
    res.redirect("/orders");
  }
};

exports.getOrderInvoice = async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.session.user._id;

  try {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      throw new Error("Unauthorized Request!");
    }
    const invoiceName = `Express-shop-invoice-${orderId}.pdf`;
    const invoicePath = path.join("data", "invoices", invoiceName);

    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename='${invoiceName}'`);
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc
      .fontSize(26)
      .text("Express Shop Invoice", 100, 100, { underline: true })
      .fontSize(20)
      .text(`OrderId: ${orderId}`, 100, 150)
      .text(`UserId: ${order.user}`);

    pdfDoc
      .text("Order Items:", 100, 250, {
        underline: true
      })
      .text("--------------------------------");

    order.cart.items.forEach(({ product, quantity }) => {
      pdfDoc
        .text(product.title, { bold: true })
        .text(product.description)
        .text(`Quantity - ${quantity}`)
        .text(`Price/Item - ${product.price}$`)
        .text("--------------------------------");
    });

    pdfDoc
      .fontSize(24)
      .text(`Total Items: ${order.totalItems}`)
      .text(`Total Price: ${order.totalPrice}$`)
      .text("--------------------------------");

    pdfDoc
      .fontSize(20)
      .text("Thank you for shopping with Express Shop. See you soon.");

    pdfDoc.end();

    // const file = fs.createReadStream(invoicePath);
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", `inline; filename='${invoiceName}'`);
    // file.pipe(res);
    //! Important not to return with res.send(), as that will abruptly stop the stream!
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 401;
    return next(error);
  }
};
