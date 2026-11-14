const AppError = require('../utils/AppError');

/** validate(schema, 'body' | 'query') -> stores the cleaned value on the request. */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return next(new AppError(400, errors[0].message, 'VALIDATION_ERROR', errors));
  }
  if (source === 'query') req.validatedQuery = value;
  else req[source] = value;
  next();
};
