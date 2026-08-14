const { validationResult } = require('express-validator');
const { error: respError } = require('../utils/response');

const validate = (rules = []) => {
  const middleware = async (req, res, next) => {
    try {
      for (const rule of rules) {
        if (!rule) continue;
        if (typeof rule.run === 'function') {
          await rule.run(req);
          continue;
        }
        if (typeof rule !== 'function') continue;
        await new Promise((resolve, reject) => {
          rule(req, res, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      }

      const errors = validationResult(req);
      if (errors.isEmpty()) return next();
      // Standardize validation response shape using response helper
      return respError(res, 'Validation failed', 400, errors.array());
    } catch (err) {
      next(err);
    }
  };

  return middleware;
};

module.exports = validate;