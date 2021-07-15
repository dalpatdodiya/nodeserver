const { validationResult } = require("express-validator");
const fs = require('fs');
const path = require('path');
const User = require("../models/user");
const Post = require('../models/post');
const io = require('../socket');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page;
  const perPage = 3;
  let totalItems;
  Post.count()
    .then(count => {
      totalItems = count;
      return Post.findAll({
        limit: perPage,
        offset: perPage * (currentPage - 1),
        order: [
          ['createdAt', 'DESC']
        ]
      });
    })
    .then(posts => {
     // console.log(posts)
      res.status(200).json({ 
          message: "Fetched posts successfully", 
          posts: posts, 
          totalItems: totalItems})
    })
    .catch(err => {
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
      }); 
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422;
    throw error;
  }
  if(!req.file){
    const error = new Error('No image Provided')
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const imageUrl = req.file.path.replace('\\','/');
  
  User.findOne({ where: { id: req.userId}})
      .then(userData => {
        const post = new Post({
          title: title,
          content: content,
          imageUrl: imageUrl,
          creator: {
            name: userData.name
          },
          userId: userData.id,
        });
        return post.save();
      })
      .then(post => {
        //console.log(post);
        io.getIO().emit('posts', { action: 'create', post: post});
        res.status(201).json({ message: " Post Created Successfully", post: post, creator: { id: post.userId, name: post.creator.name}})
      })
      .catch(err => {
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  })
  // Create post in db
};

exports.getPost =  (req, res, next) => {
  const postId = req.params.postId;
  Post.findByPk(postId)
    .then(post => {
     // console.log(post)
      if(!post){
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      //console.log(post);
      res.status(200).json({ message: 'post fetched', post: post});
    })
    .catch(err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err);
    })
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const contest = req.body.content;
  let imageUrl = req.body.image;
  if(req.file){
    imageUrl = req.file.path.replace('\\','/');
  }
  if(!imageUrl){
    const error = new Error('NO file Picked.');
    error.statusCode = 422;
    throw error;
  }
  Post.findByPk(postId)
    .then(post => {
      if(!post){
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if(post.userId.toString() !== req.userId){
          error = new Error('You Are Not Authorized User to Update');
          error.statusCode = 403;
          throw error;
      }
      if(imageUrl !== post.imageUrl){
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = contest;
      return post.save();
    })
    .then(result => {
      io.getIO().emit('posts', { action: 'update', post: result})
      res.status(200).json({ message: 'Post Updated!', post: result});
    })
    .catch(err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err);
    })
};
exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  console.log(postId);
  Post.findByPk(postId)
    .then(post => {
        if(!post){
          const error = new Error("Could not find Post.");
          error.statusCode = 404;
          throw error;
        }
        if(post.userId.toString() !== req.userId){
          error = new Error('You Are Not Authorized User to delete');
          error.statusCode = 403;
          throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByPk(postId);
    })
    .then(post => {
      post.destroy();
      io.getIO().emit('posts', { action: 'delete', post: postId})
      res.status(201).json({message: "Deleted Post", post: post})
    })
    .catch(err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err);
    })
}

const clearImage = filePath => {
  filePath = path.join(__dirname,'..', filePath);
  console.log("file Path : ",filePath)
  fs.unlink(filePath, err => console.log(err));
}
