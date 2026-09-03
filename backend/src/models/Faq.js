"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Faq = sequelize.define(
    "Faq",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      question: { type: DataTypes.STRING(400), allowNull: false },
      answer: { type: DataTypes.TEXT, allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "faqs", indexes: [{ fields: ["project_id"] }] },
  );

  return Faq;
};
