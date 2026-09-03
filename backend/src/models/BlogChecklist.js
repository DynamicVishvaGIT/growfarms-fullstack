"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BlogChecklist = sequelize.define(
    "BlogChecklist",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      blog_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      item_text: { type: DataTypes.STRING(400), allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "blog_checklist", indexes: [{ fields: ["blog_id"] }] },
  );

  return BlogChecklist;
};
