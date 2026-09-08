"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BlogImage = sequelize.define(
    "BlogImage",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      blog_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      image_path: { type: DataTypes.STRING(255), allowNull: false },
      alt_text: { type: DataTypes.STRING(200), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "blog_images", indexes: [{ fields: ["blog_id"] }] },
  );

  return BlogImage;
};
