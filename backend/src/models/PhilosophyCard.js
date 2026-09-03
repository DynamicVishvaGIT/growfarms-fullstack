"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PhilosophyCard = sequelize.define(
    "PhilosophyCard",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(120), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      // Keys the inline SVG (mission | vision | values) in CorePhilosophy.jsx.
      icon_key: { type: DataTypes.STRING(60), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "philosophy_cards" },
  );

  return PhilosophyCard;
};
