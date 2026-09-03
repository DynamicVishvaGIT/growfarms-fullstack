"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Amenity = sequelize.define(
    "Amenity",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      // Key into the hand-tuned inline SVG map in Amenitiessection.jsx. Keeping
      // a key (rather than an uploaded PNG) preserves the icon hover animation.
      icon_key: { type: DataTypes.STRING(60), allowNull: true },
      icon_image: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.STRING(300), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "amenities" },
  );

  return Amenity;
};
