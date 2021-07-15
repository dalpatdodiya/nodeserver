const { validatorResult, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const hasPass = bcrypt.hashSync(password, 12)
    
      const user = new User({
        email: email,
        password: hasPass,
        name: name,
      });
    user.save()
    .then((result) => {
      res.status(201).json({ message: "User Created!!", userId: result.id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ where: {email: email}})
    .then(user => {
      if (!user) {
        const error = new Error("A user with this email could not found");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compareSync(password,user.password);

    })
    .then(isEqual => {
        console.log(isEqual);
      if (!isEqual) {
        const error = new Error("Password don't match");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser.id.toString()
        },
        'secretsecretsecret',
        { expiresIn: "1h" }
      );
      res.status(200).json({ token: token, userId: loadedUser.id.toString() , status: loadedUser.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.status = (req, res, next) => {
  //console.log(req.userId);
  User.findOne({where: { id: req.userId }})
      .then(result => {
        if(!result){
        const error = new Error("A user status could not found");
        error.statusCode = 401;
        throw error;
        }
        res.status(200).json({ message: " Status Found ", status: result.status})
      })
      .catch( err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      })
}

exports.updateStatus = (req, res, next) => {
  User.findByPk(req.userId)
      .then(result => {
        if(!result){
          error = new Error("Not found with status");
          error.statusCode = 401;
          throw error;
        }
        result.status = req.body.status;
        return result.save();
      })
      .then(data => {
         
        res.status(200).json({ message: "Status Updated" , status: data.status});
      })
      .catch(err => {
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
      });
}
