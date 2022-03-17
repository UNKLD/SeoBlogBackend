// const sgMail = require('@sendgrid/mail')
var nodemailer = require('nodemailer')
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)


exports.contactForm = (req, res) => {
    //console.log(req.body)
    const {name, email, message} = req.body
    var transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.EMAIL_TO,
        pass: process.env.PASS
      }
    })

    var mailOptions = {
      from: email,
      to: process.env.EMAIL_TO,
      subject: `Contact from - ${process.env.APP_NAME}`,
      html: `
        <h4>Email received from contact form:</h4>
        <p>Sender name: ${name}</p>
        <p>Sender email: ${email}</p>
        <p>Sender message: ${message}</p>
        <hr />
        <p>https://Anime-blog.com</p>
      `
    };

    transporter.sendMail(mailOptions,(error, info) => {
      if (error) {
        console.log(error)
      } else {
        //console.log('Email sent: ' + info.response)
        res.json({
          success: true
        })
      }
    })
};

exports.contactBlogAuthorForm = (req, res) => {
  const { authorEmail, name, email, message } = req.body
    //console.log(req.body)

    let maillist = [authorEmail, process.env.EMAIL_TO];

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_TO,
        pass: process.env.PASS
      }
    });

  const mailOptions = {
    to: maillist,
    from: email,
    subject: `Someone Messaged you from - ${process.env.APP_NAME}`,
    html: `
      <h4>Message received from:</h4>
      <p>name: ${name}</p>
      <p>email: ${email}</p>
      <p>message: ${message}</p>
      <hr />
      <p>https://Anime-blog.com</p>
    `
    };
    transporter.sendMail(mailOptions,(error, info) => {
      if (error) {
        console.log(error)
      } else {
        //console.log('Email sent: ' + info.response)
        res.json({
          success: true
        })
      }
    })
};
