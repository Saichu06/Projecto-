const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/apiResponse');

const registerDevice = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    const device = await notificationService.registerDeviceToken(req.user.id, { token, platform });
    return sendSuccess(res, 200, 'Device push token registered successfully', device);
  } catch (error) {
    next(error);
  }
};

const triggerDueTomorrowCheck = async (req, res, next) => {
  try {
    const result = await notificationService.sendDueTomorrowNotifications();
    return sendSuccess(res, 200, 'Due tomorrow check executed successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDevice,
  triggerDueTomorrowCheck,
};
