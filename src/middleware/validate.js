const { validationResult, body } = require('express-validator');

// Middleware that reads validation results and returns 400 on errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg, // Return the first error message
      errors: errors.array(),
    });
  }
  next();
};

// ── Reusable validator chains ─────────────────────────────────────

const phoneValidator = body('phone')
  .trim()
  .notEmpty().withMessage('Phone number is required')
  .matches(/^(07|01|2547|2541)\d{8}$/).withMessage('Please enter a valid Kenyan phone number (e.g. 0712345678)');

const emailValidator = body('email')
  .trim()
  .notEmpty().withMessage('Email address is required')
  .isEmail().withMessage('Please enter a valid email address')
  .toLowerCase();

const passwordValidator = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters');

const nameValidator = body('name')
  .trim()
  .isLength({ min: 2 }).withMessage('Name must be at least 2 characters');

const amountValidator = body('amount')
  .isNumeric().withMessage('Amount must be a number')
  .custom(val => parseFloat(val) >= 10).withMessage('Minimum amount is KES 10');

const registerValidators = [
  nameValidator,
  phoneValidator,
  emailValidator,
  passwordValidator,
];

const loginValidators = [
  emailValidator,
  body('password').notEmpty().withMessage('Password is required'),
];

const depositValidators = [
  amountValidator,
  phoneValidator,
];

const contactValidators = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email address'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
];

module.exports = {
  validate,
  registerValidators,
  loginValidators,
  depositValidators,
  contactValidators,
};
