"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define(
    "Category",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: { msg: "Category name is required" } },
      },
      slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
      // A category belongs to exactly one content area so the admin dropdowns
      // for projects, packages and blogs never bleed into each other.
      type: {
        type: DataTypes.ENUM("project", "package", "blog"),
        allowNull: false,
        defaultValue: "project",
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      image: { type: DataTypes.STRING(255), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "categories", indexes: [{ fields: ["type"] }, { fields: ["is_active"] }] },
  );

  return Category;
};
