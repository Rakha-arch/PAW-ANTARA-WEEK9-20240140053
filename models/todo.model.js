const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user.model");

const Todo = sequelize.define(
  "Todo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_done: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "todos",
    timestamps: true,
  },
);

// relasi: satu user punya banyak todo
User.hasMany(Todo, { foreignKey: "user_id", onDelete: "CASCADE" });
Todo.belongsTo(User, { foreignKey: "user_id" });

module.exports = Todo;
