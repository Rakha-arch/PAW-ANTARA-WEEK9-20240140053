const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Habit = require("./habit.model");

const CheckIn = sequelize.define(
  "CheckIn",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      // cuma tanggal (YYYY-MM-DD), tanpa jam, biar gampang ngecek "udah checkin hari ini apa belum"
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    habit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "checkins",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["habit_id", "date"], // satu habit cuma bisa checkin sekali per tanggal
      },
    ],
  },
);

// relasi: satu habit punya banyak checkin
Habit.hasMany(CheckIn, { foreignKey: "habit_id", onDelete: "CASCADE", as: "checkins" });
CheckIn.belongsTo(Habit, { foreignKey: "habit_id", as: "habit" });

module.exports = CheckIn;
