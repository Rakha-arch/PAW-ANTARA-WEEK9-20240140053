const { Habit, CheckIn } = require("../models");
const sendResponse = require("../utils/response");

function formatDate(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function today() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// hitung current streak dari list tanggal checkin (string YYYY-MM-DD, urutan bebas)
// aturan: streak masih "hidup" kalo checkin terakhir hari ini ATAU kemarin
// (biar user yang belum sempet checkin hari ini gak langsung dianggap putus)
function calculateStreak(dateStrings) {
  if (dateStrings.length === 0) return 0;

  const sorted = [...new Set(dateStrings)].sort().reverse(); // unik & terbaru dulu

  const t = today();
  const yesterday = new Date(t);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  let cursor;
  if (sorted[0] === formatDate(t)) {
    cursor = t;
  } else if (sorted[0] === formatDate(yesterday)) {
    cursor = yesterday;
  } else {
    return 0; // checkin terakhir lebih dari 1 hari lalu -> streak putus
  }

  let streak = 0;
  for (const dateStr of sorted) {
    if (dateStr === formatDate(cursor)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// GET /habits -> list semua habit milik user, termasuk current streak
async function getHabits(req, res) {
  try {
    const habits = await Habit.findAll({
      where: { user_id: req.session.userId },
      order: [["createdAt", "DESC"]],
      include: [{ model: CheckIn, as: "checkins", attributes: ["date"] }],
    });

    const result = habits.map((habit) => {
      const dates = habit.checkins.map((c) => c.date);
      return {
        id: habit.id,
        name: habit.name,
        target_frequency: habit.target_frequency,
        current_streak: calculateStreak(dates),
        total_checkins: dates.length,
        checked_in_today: dates.includes(formatDate(today())),
      };
    });

    return sendResponse(res, { message: "Berhasil ambil habit", data: result });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

// POST /habits -> tambah habit baru
async function addHabit(req, res) {
  try {
    const { name, target_frequency } = req.body;

    if (!name) {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "name wajib diisi",
      });
    }

    const habit = await Habit.create({
      name,
      target_frequency: target_frequency || 7,
      user_id: req.session.userId,
    });

    return sendResponse(res, {
      code: 201,
      message: "Habit berhasil ditambahkan",
      data: habit,
    });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

// PUT /habits/:id -> update nama / target habit
async function updateHabit(req, res) {
  try {
    const { id } = req.params;
    const { name, target_frequency } = req.body;

    const habit = await Habit.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!habit) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Habit tidak ditemukan",
      });
    }

    if (name !== undefined) habit.name = name;
    if (target_frequency !== undefined) habit.target_frequency = target_frequency;
    await habit.save();

    return sendResponse(res, { message: "Habit berhasil diupdate", data: habit });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

// DELETE /habits/:id -> hapus habit (checkin ikut kehapus krn onDelete CASCADE)
async function deleteHabit(req, res) {
  try {
    const { id } = req.params;

    const habit = await Habit.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!habit) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Habit tidak ditemukan",
      });
    }

    await habit.destroy();

    return sendResponse(res, { message: "Habit berhasil dihapus" });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

// POST /habits/:id/checkins -> checkin (default hari ini, atau tanggal tertentu kalo dikirim)
async function addCheckIn(req, res) {
  try {
    const { id } = req.params;
    const { date } = req.body; // optional, format YYYY-MM-DD

    const habit = await Habit.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!habit) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Habit tidak ditemukan",
      });
    }

    const checkinDate = date || formatDate(today());

    const [checkin, created] = await CheckIn.findOrCreate({
      where: { habit_id: habit.id, date: checkinDate },
    });

    if (!created) {
      return sendResponse(res, {
        code: 409,
        success: false,
        message: "Sudah checkin di tanggal ini",
      });
    }

    return sendResponse(res, {
      code: 201,
      message: "Checkin berhasil dicatat",
      data: checkin,
    });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

// GET /habits/:id/checkins -> riwayat checkin sebuah habit
async function getCheckIns(req, res) {
  try {
    const { id } = req.params;

    const habit = await Habit.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!habit) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Habit tidak ditemukan",
      });
    }

    const checkins = await CheckIn.findAll({
      where: { habit_id: habit.id },
      order: [["date", "DESC"]],
    });

    return sendResponse(res, { message: "Berhasil ambil riwayat checkin", data: checkins });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

// DELETE /habits/:id/checkins/:checkinId -> undo checkin (misal kepencet gak sengaja)
async function deleteCheckIn(req, res) {
  try {
    const { id, checkinId } = req.params;

    const habit = await Habit.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!habit) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Habit tidak ditemukan",
      });
    }

    const checkin = await CheckIn.findOne({
      where: { id: checkinId, habit_id: habit.id },
    });
    if (!checkin) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Checkin tidak ditemukan",
      });
    }

    await checkin.destroy();

    return sendResponse(res, { message: "Checkin berhasil dihapus" });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

module.exports = {
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  addCheckIn,
  getCheckIns,
  deleteCheckIn,
};
