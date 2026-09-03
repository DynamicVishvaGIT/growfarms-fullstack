"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PackageImage = sequelize.define(
    "PackageImage",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      package_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      image_path: { type: DataTypes.STRING(255), allowNull: false },
      alt_text: { type: DataTypes.STRING(200), allowNull: true },
      is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "package_images", indexes: [{ fields: ["package_id"] }] },
  );

  return PackageImage;
};
