const { check } = require('express-validator')

exports.userSignupValidator = [
    check('name')
       .not()
       .isEmpty()
       .withMessage('Name is required'),
    check('email')
        .isEmail()
        .withMessage('Please Enter a Valid Email'),
    check('password')
        .isLength({ min : 6 })
        .withMessage('Password Must be at least 6 characters long')
];

exports.userSigninValidator = [
    check('email')
        .isEmail()
        .withMessage('Please Enter a Valid Email'),
    check('password')
        .isLength({ min : 6 })
        .withMessage('Password Must be at least 6 characters long')
];

exports.forgotPasswordValidator = [
  check('email')
      .isEmail()
      .withMessage('Please Enter a Valid Email')
];

exports.resetPasswordValidator = [
  check('password')
      .isLength({ min : 6 })
      .withMessage('Password Must be at least 6 characters long')
]
