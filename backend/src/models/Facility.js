"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Facility = sequelize.define(
    "Facility",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      // Nullable so a facility row can be global (shown on every project page)
      // or scoped to one project.
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      icon_image: { type: DataTypes.STRING(255), allowNull: true },
      distance: { type: DataTypes.STRING(60), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "facilities", indexes: [{ fields: ["project_id"] }] },
  );

  return Facility;
};

