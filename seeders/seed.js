require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, User, Todo, Habit, CheckIn } = require("../models");

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

const SALT_ROUNDS = 10;

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    // pastiin tabel udah ada
    await sequelize.sync();

    // password plain buat semua dummy user: "password123"
    const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

    // upsert biar aman kalo seed dijalanin berkali-kali (gak bikin duplikat)
    const [user1] = await User.findOrCreate({
      where: { username: "rizki" },
      defaults: { password: hashedPassword },
    });

    const [user2] = await User.findOrCreate({
      where: { username: "budi" },
      defaults: { password: hashedPassword },
    });

    console.log("User dummy siap:", user1.username, "&", user2.username);

    // bikin todo dummy, tapi cek dulu biar gak numpuk kalo diulang-ulang
    const existingTodos = await Todo.count({ where: { user_id: user1.id } });

    if (existingTodos === 0) {
      await Todo.bulkCreate([
        { title: "Belajar Sequelize", is_done: true, user_id: user1.id },
        { title: "Bikin API Todo", is_done: true, user_id: user1.id },
        { title: "Nambahin fitur seeder", is_done: false, user_id: user1.id },
        { title: "Review PR temen", is_done: false, user_id: user2.id },
        { title: "Fix bug login", is_done: false, user_id: user2.id },
      ]);
      console.log("Todo dummy berhasil ditambahin");
    } else {
      console.log("Todo dummy udah ada, skip supaya gak dobel");
    }

    // bikin habit dummy + checkin history biar streak-nya kelihatan jalan
    const existingHabits = await Habit.count({ where: { user_id: user1.id } });

    if (existingHabits === 0) {
      const habit = await Habit.create({
        name: "Baca buku 20 menit",
        target_frequency: 7,
        user_id: user1.id,
      });

      // checkin 4 hari beruntun sampe kemarin (streak tetep "hidup" krn belum checkin hari ini)
      const checkinRows = [];
      for (let i = 1; i <= 4; i++) {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        d.setUTCDate(d.getUTCDate() - i);
        checkinRows.push({ habit_id: habit.id, date: formatDate(d) });
      }
      await CheckIn.bulkCreate(checkinRows);

      console.log("Habit dummy + checkin history berhasil ditambahin");
    } else {
      console.log("Habit dummy udah ada, skip supaya gak dobel");
    }

    console.log("\nSeeding selesai ✅");
    console.log("Login pake salah satu ini:");
    console.log("  username: rizki  | password: password123");
    console.log("  username: budi   | password: password123");

    process.exit(0);
  } catch (err) {
    console.error("Gagal seeding:", err.message);
    process.exit(1);
  }
}

seed();
