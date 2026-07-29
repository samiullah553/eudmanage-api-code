const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const schoolController = require('../controllers/schoolController');

const router = express.Router();

router.get('/', schoolController.listSchools);
router.get('/:id', validate([param('id').isMongoId()]), schoolController.getSchool);

// Allow initial school creation without auth, but protect later school creation behind admin.
router.post('/',
  validate([
    body('name').trim().notEmpty().withMessage('School name is required'),
    body('code').trim().notEmpty().withMessage('School code is required')
  ]),
  async (req, res, next) => {
    if (!req.headers.authorization) {
      return schoolController.createSchool(req, res);
    }
    authenticate(req, res, async () => {
      authorize('admin')(req, res, () => schoolController.createSchool(req, res));
    });
  }
);

module.exports = router;
