const express = require("express");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { Result } = require("express-validator");
const helmet = require('helmet');
const sequelize = require("./config/db.config");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const User = require("./models/user");
const Post = require("./models/post");

const port = process.env.PORT || 3030;

const app = express();

User.hasMany(Post, { as: "posts" });
Post.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(file);
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(helmet());
app.use(express.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

sequelize
  .sync
  //{ force: true }
  ()
  .then(() => {
    console.log("Connection has been Established successfully");
    const server = app.listen(port);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client Connected");
    });
  })
  .catch((err) => console.log(err));
