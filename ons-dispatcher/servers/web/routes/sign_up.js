////////////////////////////////////////////////
//
// Copyright (c) 2017 Matheus Medeiros Sarmento
//
////////////////////////////////////////////////

const User = require('../../../database/models/user');

module.exports = function (app) {

   app.get('/sign_up', (req, res) => {
      res.render('sign_up', {
         'title': "Sign Up",
         'active': "sign_up"
      });
   });

   app.post('/sign_up', (req, res) => {

      // Validation
      {
         req.checkBody('name', 'Name must be between 4-50 characters long.').len(4, 50);
         req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
         req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
         //req.checkBody("password", "Password must include one lowercase character, one uppercase character, a number, and a special character.").matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, "i");
         req.checkBody('passwordMatch', 'Passwords do not match, please try again.').equals(req.body.password);
      }

      // @TODO: update to newer version
      const errors = req.validationErrors();

      if (errors) {
         res.render('sign_up', {
            'title': "Sign Up",
            'errors': errors
         });

         return;
      }

      const name = req.body.name;
      const email = req.body.email;
      const password = req.body.password;
      const passwordMatch = req.body.passwordMatch;

      // Encrypt password
      User.encryptPassword(password, (err, hash) => {
         if (err) {
            res.render('sign_up', {
               'title': "Sign Up",
               errors: [{
                  'msg': "An error occurred. Please try again"
               }]
            });
         }

         const user = new User({
            'name': name,
            'email': email,
            'password': hash,
         })

         user.save((err, user) => {
            if (err) {
               if (err.code === 11000) {
                  // Unique conflict
                  res.render('sign_up', {
                     'title': "Sign Up",
                     errors: [{
                        'msg': "User already exists"
                     }]
                  });
               }
               else {
                  res.render('sign_up', {
                     'title': "Sign Up",
                     errors: [{
                        'msg': "An error occurred. Please try again"
                     }]
                  });
               }

               return;
            }

            req.login(user, (err) => {
               if (err) {
                  console.log(err);
                  return;
               }

               res.redirect('/profile');
            });
         });
      });
   });
}