const projectService = require('../services/projectService');
const { sendSuccess } = require('../utils/apiResponse');

const getProjects = async (req, res, next) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await projectService.getProjects(req.user.id, {
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return sendSuccess(res, 200, 'Projects retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Project retrieved successfully', project);
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    return sendSuccess(res, 201, 'Project created successfully', project);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 200, 'Project updated successfully', project);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Project deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
