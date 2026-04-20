const authService = require('./auth.service');

async function registerDoctor(req, res, next) {
  try {
    const result = await authService.registerDoctor(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function registerPatient(req, res, next) {
  try {
    const result = await authService.registerPatient(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerDoctor, registerPatient, login, refresh, me };
