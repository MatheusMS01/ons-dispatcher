
const passport = require('passport');

module.exports = function (app) {

   app.get('/login', (req, res) => {
      res.render('login', {
         title: "Login"
      })
   });

   app.post('/login', passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/login'
   }));

   app.get('/logout', (req, res) => {
      req.logout();
      req.session.destroy();
      res.redirect('/');
   });
}