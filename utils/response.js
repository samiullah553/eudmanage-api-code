// Small helper to standardize API responses
function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function error(res, message, status = 400, details = null) {
  const payload = { success: false, error: message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

module.exports = { success, error };
