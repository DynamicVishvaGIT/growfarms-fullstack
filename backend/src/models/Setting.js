"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Setting = sequelize.define(
    "Setting",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING(80), allowNull: false, unique: true, field: "setting_key" },
      value: { type: DataTypes.TEXT, allowNull: true, field: "setting_value" },
      label: { type: DataTypes.STRING(160), allowNull: true },
      group: {
        type: DataTypes.ENUM("general", "contact", "social", "seo", "media"),
        allowNull: false,
        defaultValue: "general",
        field: "setting_group",
      },
      type: {
        type: DataTypes.ENUM("text", "textarea", "image", "url", "email", "number", "boolean"),
        allowNull: false,
        defaultValue: "text",
        field: "setting_type",
      },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "settings", indexes: [{ fields: ["setting_group"] }] },
  );

  return Setting;
};
