"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PackageTag = sequelize.define(
    "PackageTag",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      package_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      label: { type: DataTypes.STRING(80), allowNull: false },
      // Null renders the outlined pill; a colour renders the filled pill.
      accent_color: { type: DataTypes.STRING(20), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "package_tags", indexes: [{ fields: ["package_id"] }] },
  );

  return PackageTag;
};
