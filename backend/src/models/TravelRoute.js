"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TravelRoute = sequelize.define(
    "TravelRoute",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      mode: {
        type: DataTypes.ENUM("road", "train", "air", "other"),
        allowNull: false,
        defaultValue: "road",
      },
      label: { type: DataTypes.STRING(80), allowNull: false },
      icon_image: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "travel_routes", indexes: [{ fields: ["project_id"] }] },
  );

  return TravelRoute;
};
