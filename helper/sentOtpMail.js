const nodemailer = require("nodemailer");
// Defining the account for sending email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = function (otp,email) {
    transporter.sendMail(
        {
          from: process.env.EMAIL_USERNAME, // sender address
          to: email, // list of receivers
          subject: `OTP for Fomino`, // Subject line
          text: `OTP for Fomino is : ${otp}`, // plain text body
         
        },
        function (error, info) {
          if(error)
          {
            console.log(error)
          }
          else
          {
            console.log(info)
          }
        });
  };
  
 
  