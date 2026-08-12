const sequelize = require("../config/database");
const User = require("./user.model");
const Todo = require("./todo.model");
const Habit = require("./habit.model");
const CheckIn = require("./checkin.model");

module.exports = {
  sequelize,
  User,
  Todo,
  Habit,
  CheckIn,
};
