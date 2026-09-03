"use strict";

const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Collect express-validator results into a single 422 with a field->message
 * map, which is the shape both the admin panel and the public forms consume.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const err of result.array()) {
    const key = err.path || err.param || "_";
    if (!details[key]) details[key] = err.msg;
  }

  next(new ApiError(422, "Please correct the highlighted fields", details));
}

module.exports = validate;
