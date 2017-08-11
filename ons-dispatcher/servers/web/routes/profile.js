const router = require('../router');

module.exports = function (app) {
   // Profile
   app.get('/profile', router.authenticationMiddleware(), (req, res) => {
      res.render('profile', {
         title: "Profile"
      })
   });
}