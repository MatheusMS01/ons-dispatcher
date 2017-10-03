////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const nodemailer = require('nodemailer');
const log4js = require( 'log4js' );

log4js.configure( {
   appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: 'log/mailer.log' }
   },
   categories: {
      default: { appenders: ['out', 'app'], level: 'debug' }
   }
});

const logger = log4js.getLogger();

var transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
     user: 'dontreply.dispatcher@gmail.com',
     pass: 'Kh2NhMmUBX'
   },
   tls:{
      secureProtocol: "TLSv1_method"
   }
 });

 module.exports.sendMail = function (to, subject, text) {

   var mailOptions = {
      from: 'dontreply.dispatcher@gmail.com',
      to: to,
      subject: subject,
      text: text
    };

    var promise = transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        logger.error(error);
      }
    }); 
 }