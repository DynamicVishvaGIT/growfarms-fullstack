"use strict";

/** An error the API is willing to describe to the client verbatim. */
class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad request", details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = "Not authenticated") { return new ApiError(401, msg); }
  static forbidden(msg = "You do not have permission to do that") { return new ApiError(403, msg); }
  static notFound(msg = "Resource not found") { return new ApiError(404, msg); }
  static conflict(msg = "That resource already exists") { return new ApiError(409, msg); }
  static tooLarge(msg = "File is too large") { return new ApiError(413, msg); }
}

module.exports = ApiError;
