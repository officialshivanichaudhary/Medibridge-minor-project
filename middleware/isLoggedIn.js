module.exports = function (req, res, next) {
  if (req.session && req.session.patientName) {
    next(); // allow access
  } else {
    res.redirect("/login"); // redirect to login if not logged in
  }
};
