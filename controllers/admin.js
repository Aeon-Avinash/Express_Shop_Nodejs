const Product = require("../models/product");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const { deleteFile } = require("../util/file");

exports.getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ user: req.session.user._id });
    res.render("admin/admin-product-list", {
      products,
      errorMessage: req.flash("errorMessage"),
      confirmMessage: req.flash("confirmMessage"),
      docTitle: "Admin Products",
      path: "/admin/products"
    });
  } catch (err) {
    console.log(err);
    // res.redirect("/admin/add-product");
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    product: null,
    docTitle: "Add Product",
    path: "/admin/add-product",
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = async (req, res, next) => {
  const user = req.session.user._id;
  const { title, price, description } = req.body;
  const image = req.file;
  if (!image) {
    return res.render("admin/edit-product", {
      errorMessage: "Attached file is not an image!",
      product: null,
      docTitle: "Add Product",
      path: "/admin/add-product",
      prevInput: {
        title,
        price,
        description
      },
      validationErrors: []
    });
  }
  const imageUrl = image ? `/${image.path}` : "";
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("admin/edit-product", {
      errorMessage: errors.array()[0].msg,
      product: null,
      docTitle: "Add Product",
      path: "/admin/add-product",
      prevInput: {
        title,
        price,
        description
      },
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    user
  });

  try {
    await product.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
    // res.redirect("/admin/add-product");
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  const editMode = Boolean(req.query.edit);
  const { productId } = req.params;
  if (!editMode) {
    return res.redirect("/admin/products");
  }

  try {
    const product = await Product.findOne({
      _id: productId,
      user: req.session.user._id
    });
    if (!product) {
      req.flash("errorMessage", "unauthorized operation!");
      return res.redirect("/admin/products");
    }
    res.render("admin/edit-product", {
      product,
      docTitle: "Edit Product",
      path: `/admin/add-product`,
      errorMessage: null,
      validationErrors: []
    });
  } catch (err) {
    console.log(err);
    // res.redirect("/admin/products");
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEditProduct = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const product = await Product.findOne({
      _id: productId,
      user: req.session.user._id
    });
    if (!product) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }

    const image = req.file;
    const imageUrl = image ? `/${image.path}` : "";
    const update = image ? { ...req.body, imageUrl } : { ...req.body };
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("admin/edit-product", {
        errorMessage: errors.array()[0].msg,
        product,
        docTitle: "Edit Product",
        path: `/admin/add-product`,
        prevInput: {
          ...update,
          productId
        },
        validationErrors: errors.array()
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, update);
    if (image) {
      await deleteFile(product.imageUrl.slice(1), next);
    }
    return res.redirect(`/products/${productId}`);
  } catch (err) {
    console.log(err);
    // res.redirect("/admin/products");
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const { productId } = req.params;
  try {
    const product = await Product.findOne({
      _id: productId,
      user: req.session.user._id
    });
    if (!product) {
      req.flash("errorMessage", "unauthorized operation!");
      return res.redirect("/admin/products");
    }
    const deleted = await Product.findByIdAndDelete(productId);
    await deleteFile(product.imageUrl.slice(1), next);
    const deletedFromCart = await User.updateMany(
      {},
      { $pull: { "cart.items": { product: productId } } }
    );

    return res.status(200).json({ message: "success" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Deleting product failed!" });
  }
};
