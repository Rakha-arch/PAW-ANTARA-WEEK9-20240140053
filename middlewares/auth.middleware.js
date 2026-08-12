const sendResponse = require("../utils/response");

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return sendResponse(res, {
      code: 401,
      success: false,
      message: "Belum login, silakan login dulu",
    });
  }
  next();
}

module.exports = requireAuth;
