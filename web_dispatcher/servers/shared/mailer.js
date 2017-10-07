////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const nodemailer = require( 'nodemailer' );
const config = require( './configuration' ).getConfiguration();
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

var transporter = nodemailer.createTransport( {
   service: config.transporter.service,
   auth: {
      user: config.transporter.auth.user,
      pass: config.transporter.auth.pass
   }
 });

 module.exports.sendMail = function (to, subject, text) {

   var mailOptions = {
      from: config.transporter.auth.user,
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