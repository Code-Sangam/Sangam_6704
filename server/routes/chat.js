const express = require('express');
const router = express.Router();

// Chat main page
router.get('/', (req, res) => {
  res.render('pages/chat', {
    title: 'Chat - Sangam Alumni Network',
    user: req.session.user
  });
});

// Chat with specific user
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  res.render('pages/chat', {
    title: 'Chat - Sangam Alumni Network',
    user: req.session.user,
    activeUserId: userId
  });
});

module.exports = router;