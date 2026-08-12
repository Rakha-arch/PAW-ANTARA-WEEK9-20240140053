const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user.model");

const Habit = sequelize.define(
  "Habit",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_frequency: {
      // target checkin per minggu, cuma informatif (gak dipakai buat validasi ketat)
      type: DataTypes.INTEGER,
      defaultValue: 7,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "habits",
    timestamps: true,
  },
);

// relasi: satu user punya banyak habit
User.hasMany(Habit, { foreignKey: "user_id", onDelete: "CASCADE", as: "habits" });
Habit.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = Habit;
