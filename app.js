require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { sequelize } = require("./models");

const authRoutes = require("./routes/auth.routes");
const todoRoutes = require("./routes/todo.routes");
const habitRoutes = require("./routes/habit.routes");

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-default",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 hari
      httpOnly: true,
    },
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/habits", habitRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Todo API jalan 🚀" });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    // sync model ke db (bikin tabel kalo belum ada)
    await sequelize.sync();
    console.log("Sync model selesai");

    app.listen(PORT, () => {
      console.log(`Server jalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Gagal konek ke database:", err.message);
  }
}

start();
