const { body, validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

const registerDoctorRules = [
  body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.'),
  body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
];

const registerPatientRules = [
  body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.'),
  body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
  body('phone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido.'),
];

const loginRules = [
  body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória.'),
];

const refreshRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório.'),
];

module.exports = { validate, registerDoctorRules, registerPatientRules, loginRules, refreshRules };
