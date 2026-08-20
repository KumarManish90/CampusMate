/**
 * Wraps every successful res.json(...) payload in a predictable envelope:
 *   { success: true, ...originalPayload }
 * Error responses already set `success: false` explicitly in
 * middleware/errorHandler.js and in the few routes that hand-roll an error
 * response, so this only touches the success path — applied once here
 * instead of editing every individual route handler's res.json() call.
 */
function responseEnvelope(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === "object" && !Array.isArray(body) && typeof body.success === "undefined") {
      return originalJson({ success: res.statusCode < 400, ...body });
    }
    return originalJson(body);
  };
  next();
}

module.exports = responseEnvelope;
