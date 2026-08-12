const bcrypt = require("bcrypt");
const { User } = require("../models");
const sendResponse = require("../utils/response");

const SALT_ROUNDS = 10;

async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "username dan password wajib diisi",
      });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return sendResponse(res, {
        code: 409,
        success: false,
        message: "username sudah dipakai",
      });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, password: hashed });

    return sendResponse(res, {
      code: 201,
      message: "Registrasi berhasil",
      data: { id: user.id, username: user.username },
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "username dan password wajib diisi",
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return sendResponse(res, {
        code: 401,
        success: false,
        message: "username atau password salah",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendResponse(res, {
        code: 401,
        success: false,
        message: "username atau password salah",
      });
    }

    // simpan session
    req.session.userId = user.id;

    return sendResponse(res, {
      message: "Login berhasil",
      data: { id: user.id, username: user.username },
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return sendResponse(res, {
        code: 500,
        success: false,
        message: "Gagal logout",
      });
    }
    res.clearCookie("connect.sid");
    return sendResponse(res, { message: "Logout berhasil" });
  });
}

module.exports = { register, login, logout };
