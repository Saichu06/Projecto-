const taskService = require('../services/taskService');
const { sendSuccess } = require('../utils/apiResponse');

const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority, projectId, page, limit, sortBy, sortOrder } = req.query;
    const result = await taskService.getTasks(req.user.id, {
      search,
      status,
      priority,
      projectId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return sendSuccess(res, 200, 'Tasks retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Task retrieved successfully', task);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    return sendSuccess(res, 201, 'Task created successfully', task);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 200, 'Task updated successfully', task);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Task deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
