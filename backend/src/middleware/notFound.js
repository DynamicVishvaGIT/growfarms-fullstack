"use strict";

const ApiError = require("../utils/ApiError");

module.exports = (req, res, next) => {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
};
