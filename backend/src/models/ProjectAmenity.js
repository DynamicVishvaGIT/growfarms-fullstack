"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectAmenity = sequelize.define(
    "ProjectAmenity",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      amenity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "project_amenities",
      indexes: [{ unique: true, fields: ["project_id", "amenity_id"] }],
    },
  );

  return ProjectAmenity;
};
