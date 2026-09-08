"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BlogStep = sequelize.define(
    "BlogStep",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      blog_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      // Free text rather than a number: the design prints "01", "02" …
      step_number: { type: DataTypes.STRING(6), allowNull: false },
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "blog_steps", indexes: [{ fields: ["blog_id"] }] },
  );

  return BlogStep;
};
