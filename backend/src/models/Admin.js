"use strict";

const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");

const ROUNDS = 12;

module.exports = (sequelize) => {
  const Admin = sequelize.define(
    "Admin",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: "Name is required" }, len: [2, 100] },
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: { isEmail: { msg: "Please enter a valid email address" } },
        set(value) {
          this.setDataValue("email", String(value || "").trim().toLowerCase());
        },
      },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.ENUM("super_admin", "admin", "editor"),
        allowNull: false,
        defaultValue: "admin",
      },
      avatar: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "admins",
      defaultScope: { attributes: { exclude: ["password_hash"] } },
      scopes: { withPassword: { attributes: { include: ["password_hash"] } } },
    },
  );

  /** Hash and store a plaintext password. Never assign password_hash directly. */
  Admin.prototype.setPassword = async function setPassword(plain) {
    this.password_hash = await bcrypt.hash(plain, ROUNDS);
  };

  Admin.prototype.verifyPassword = function verifyPassword(plain) {
    if (!this.password_hash) return Promise.resolve(false);
    return bcrypt.compare(plain, this.password_hash);
  };

  Admin.hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

  return Admin;
};
