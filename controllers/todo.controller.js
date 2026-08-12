const { Todo } = require("../models");
const sendResponse = require("../utils/response");

// GET /todos -> ambil semua todo milik user yg login
async function getTodos(req, res) {
  try {
    const todos = await Todo.findAll({
      where: { user_id: req.session.userId },
      order: [["createdAt", "DESC"]],
    });

    return sendResponse(res, { message: "Berhasil ambil todo", data: todos });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// POST /todos -> tambah todo baru
async function addTodo(req, res) {
  try {
    const { title } = req.body;

    if (!title) {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "title wajib diisi",
      });
    }

    const todo = await Todo.create({
      title,
      user_id: req.session.userId,
    });

    return sendResponse(res, {
      code: 201,
      message: "Todo berhasil ditambahkan",
      data: todo,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// PUT /todos/:id -> update todo (title / is_done)
async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title, is_done } = req.body;

    const todo = await Todo.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!todo) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Todo tidak ditemukan",
      });
    }

    if (title !== undefined) todo.title = title;
    if (is_done !== undefined) todo.is_done = is_done;
    await todo.save();

    return sendResponse(res, { message: "Todo berhasil diupdate", data: todo });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// DELETE /todos/:id
async function deleteTodo(req, res) {
  try {
    const { id } = req.params;

    const todo = await Todo.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!todo) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Todo tidak ditemukan",
      });
    }

    await todo.destroy();

    return sendResponse(res, { message: "Todo berhasil dihapus" });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

module.exports = { getTodos, addTodo, updateTodo, deleteTodo };
