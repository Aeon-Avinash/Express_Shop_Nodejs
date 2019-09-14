const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBSessionStore = require("connect-mongodb-session")(session);

const CONNECTION_URI = `mongodb+srv://${process.env.ATLAS_MONGODB_USERNAME}:${process.env.ATLAS_MONGODB_PASSWORD}@cluster0-ic80e.mongodb.net/${process.env.EXPRESS_SHOP_DB_NAME}?retryWrites=true&w=majority`;

exports.mongooseConnect = dbConnectCB => {
  return mongoose.connect(CONNECTION_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
};

exports.sessionStoreConnect = () => {
  return new MongoDBSessionStore({
    uri: CONNECTION_URI,
    collection: "sessions"
  });
};
