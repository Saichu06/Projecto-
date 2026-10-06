const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/register-device', notificationController.registerDevice);
router.post('/trigger-due-check', notificationController.triggerDueTomorrowCheck);

module.exports = router;
