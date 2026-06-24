const router = require('express').Router();
const passport = require('passport');

// Start GitHub OAuth
router.get('/github', passport.authenticate('github', {
  scope: ['user:email', 'repo', 'read:org'],
}));

// GitHub OAuth callback
router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    console.log('================================');
    console.log('AUTHENTICATED USER:', req.user);
    console.log('SESSION ID:', req.sessionID);
    console.log('IS AUTH:', req.isAuthenticated());
    console.log('================================');

    req.session.save((err) => {
      if (err) {
        console.error('SESSION SAVE ERROR:', err);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=session`
        );
      }

      console.log('SESSION SAVED SUCCESSFULLY');

      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    });
  }
);

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { _id, username, displayName, email, avatar, plan, reviewsThisMonth } = req.user;
  res.json({ user: { _id, username, displayName, email, avatar, plan, reviewsThisMonth } });
});

// Logout
router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

module.exports = router;
