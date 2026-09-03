"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const WhyChooseCard = sequelize.define(
    "WhyChooseCard",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      // The three cards animate in from different directions keyed off this
      // slot, so it stays an enum rather than a free-form ordering.
      position: {
        type: DataTypes.ENUM("left", "center", "right"),
        allowNull: false,
        defaultValue: "center",
      },
      title: { type: DataTypes.STRING(160), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      image: { type: DataTypes.STRING(255), allowNull: true },
      alt_text: { type: DataTypes.STRING(200), allowNull: true },
      object_position: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "center" },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "why_choose_cards", indexes: [{ fields: ["project_id"] }] },
  );

  return WhyChooseCard;
};
