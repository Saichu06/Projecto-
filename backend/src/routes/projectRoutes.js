const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} = require('../validators/projectValidator');

router.use(authMiddleware);

router.get('/', validate(projectQuerySchema, 'query'), projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', validate(createProjectSchema), projectController.createProject);
router.put('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
