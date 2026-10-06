const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} = require('../validators/taskValidator');

router.use(authMiddleware);

router.get('/', validate(taskQuerySchema, 'query'), taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
