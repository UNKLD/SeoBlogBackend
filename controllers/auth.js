const User = require("../models/user");
const Blog = require("../models/blog");
const shortId = require("shortid");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const _ = require("lodash");
const { errorHandler } = require("../helpers/dbErrorHandler");
var nodemailer = require("nodemailer");

exports.preSignup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Account with this Email already exists please signin!",
      });
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "20m" }
    );
    console.log(token);
    res.json({
      message: `Email has been sent to ${email}. Follow the instructions to activate your account. Link expires in 20min.`,
      token: token,
    });

    // var transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_TO,
    //     pass: process.env.PASS,
    //   },
    // });

    // var mailOptions = {
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: "Account Activation link",
    //   html: `
    //         <p>Please use the following link to activate your account: </p><hr />
    //         <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
    //         <hr />
    //         <p>This Email was sent to you from:</p>
    //         <p>https://Anime-Blogs.tk</p>
    //       `,
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     //console.log('Email sent: ' + info.response)
    //     res.json({
    //       message: `Email has been sent to ${email}. Follow the instructions to activate your account. Link expires in 20min.`,
    //     });
    //   }
    // });
  });
};

exports.signup = (req, res) => {
  const token = req.body.token;
  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (err, decoded) {
      if (err) {
        return res.status(401).json({
          error: "Expired link try again",
        });
      }

      const { name, email, password } = jwt.decode(token);
      let username = shortId.generate();
      let profile = `${process.env.CLIENT_URL}/profile/${username}`;
      const user = new User({ name, email, password, profile, username });
      user.save((err, user) => {
        if (err) {
          return res.status(401).json({
            error: errorHandler(err),
          });
        }
        return res.json({
          message: "Signup Success please signin",
        });
      });
    });
  } else {
    return res.json({
      message: "Something went wrong try again",
    });
  }
};

exports.signin = (req, res) => {
  const { email, password } = req.body;
  //check if user exists
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that Email does not exist! Please Signup First!",
      });
    }
    //authonticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Wrong password!",
      });
    }
    //generate web token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, { expiresIn: "1d" });
    const { _id, username, name, email, role } = user;
    return res.json({
      token,
      user: { _id, username, name, email, role },
    });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "Signout success",
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findById({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        err: "User Not Found",
      });
    }
    req.profile = user;
    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  const adminUserId = req.user._id;
  User.findById({ _id: adminUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        err: "User Not Found",
      });
    }
    if (user.role !== 1) {
      return res.status(400).json({
        err: "Admin Resource: Access Denied",
      });
    }
    req.profile = user;
    next();
  });
};

exports.canUpdateDeleteBlog = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).Json({
        error: errorHandler(err),
      });
    }
    let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();
    if (!authorizedUser) {
      return res.status(400).Json({
        error: "Not Authorized",
      });
    }
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "User with that email does not exist ",
      });
    }

    const token = jwt.sign({ _id: user.id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "20m",
    });

    //Send varification email
    // var transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_TO,
    //     pass: process.env.PASS,
    //   },
    // });

    // var mailOptions = {
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: "Password reset link",
    //   html: `
    //     <p>Please use the following link to reset your password:</p><hr />
    //     <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
    //     <hr />
    //     <p>This Email was sent to you from:</p>
    //     <p>https://Anime-Blog.com</p>
    //   `,
    // };

    //populating db with user resetLink
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.json({ error: errorHandler(err) });
      } else {
        // transporter.sendMail(mailOptions, (error, info) => {
        //   if (error) {
        //     console.log(error);
        //   } else {
        //console.log('Email sent: ' + info.response)
        res.json({
          message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 20min.`,
          token: token,
        });
        // }
        // });
      }
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: "Expired link try again",
          });
        }
        User.findOne({ resetPasswordLink }, (err, user) => {
          if (err || !user) {
            return res.status(401).json({
              error: "Something went wrong. Try later",
            });
          }
          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };

          user = _.extend(user, updatedFields);

          user.save((err, result) => {
            if (err) {
              return res.status(401).json({
                error: errorHandler(err),
              });
            }
            res.json({
              message: `Great! Now you can login with your new password`,
            });
          });
        });
      }
    );
  }
};
