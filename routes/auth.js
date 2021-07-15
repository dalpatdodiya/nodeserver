const express = require("express");
const { body } = require("express-validator");
const User = require('../models/user')
const authController = require("../controllers/auth");

const isAuth = require('../middleware/is-auth')

const router = express.Router();
// PUT /auth/signup 
router.put('/signup', [
    body('email')
    .isEmail()
    .withMessage("Please enter a valid email")
    .custom((value, {req}) => {
        return User.findOne({ where: {email: value}}).then( data => {
            if(data){
                return Promise.reject('Email address already exists');
            }
        })
    })
    .normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body("name").trim().not().isEmpty()
    ],
    authController.signup
    );

//POST /auth/login
router.post("/login",authController.login);
//GET /auth/status
router.get("/status", isAuth, authController.status);
//PATCH /auth/status
router.patch('/status', isAuth, [
    body('status').trim().not().isEmpty()] , authController.updateStatus);

module.exports = router;