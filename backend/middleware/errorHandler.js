function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log full detail server-side only — never forward stack traces, Mongo
  // connection strings, or JWT secrets to the client.
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: "Validation failed.", details: err.errors });
  }
  if (err.name === "CastError") {
    // Malformed MongoDB ObjectId (e.g. a garbage :id in the URL) — this must
    // never crash the server or leak the raw Mongoose cast error message.
    return res.status(400).json({ success: false, message: "Invalid ID format." });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "That value already exists.", key: err.keyValue });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  const status = err.status || 500;
  const isServerError = status >= 500;
  res.status(status).json({
    success: false,
    // Never leak internal error detail (DB errors, stack traces) for 5xx —
    // only pass through err.message for expected 4xx errors we threw ourselves.
    message: isServerError ? "Something went wrong on our end. Please try again." : (err.message || "Request failed."),
  });
}

module.exports = { notFound, errorHandler };
