const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user.id);
    return sendSuccess(res, 200, 'Dashboard statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
