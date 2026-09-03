"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const WhyPaliSlide = sequelize.define(
    "WhyPaliSlide",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      image: { type: DataTypes.STRING(255), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "why_pali_slides" },
  );

  return WhyPaliSlide;
};
