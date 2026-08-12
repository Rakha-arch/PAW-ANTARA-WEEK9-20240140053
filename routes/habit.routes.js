const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/auth.middleware");
const {
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  addCheckIn,
  getCheckIns,
  deleteCheckIn,
} = require("../controllers/habit.controller");

// semua route habit wajib login dulu
router.use(requireAuth);

router.get("/", getHabits);
router.post("/", addHabit);
router.put("/:id", updateHabit);
router.delete("/:id", deleteHabit);

router.post("/:id/checkins", addCheckIn);
router.get("/:id/checkins", getCheckIns);
router.delete("/:id/checkins/:checkinId", deleteCheckIn);

module.exports = router;
