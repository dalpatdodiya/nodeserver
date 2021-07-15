const Sequelize = require("sequelize");
const sequelize = require("../config/db.config");

const Post = sequelize.define(
  "post",
  {
    title: {
      type: Sequelize.STRING,
      required: true,
    },
    imageUrl: {
      type: Sequelize.STRING,
      required: true,
    },
    content: {
      type: Sequelize.STRING,
      required: true,
    },
    creator: {
      type: Sequelize.JSON,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Post;
