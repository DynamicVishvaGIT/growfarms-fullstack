"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Blog = sequelize.define(
    "Blog",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
      title: {
        type: DataTypes.STRING(240),
        allowNull: false,
        validate: { notEmpty: { msg: "Blog title is required" } },
      },
      excerpt: { type: DataTypes.STRING(500), allowNull: true },
      content: { type: DataTypes.TEXT("long"), allowNull: true },
      featured_image: { type: DataTypes.STRING(255), allowNull: true },
      banner_image: { type: DataTypes.STRING(255), allowNull: true },
      category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      author_name: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "Admin" },
      published_at: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "published"),
        allowNull: false,
        defaultValue: "published",
      },
      views: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      meta_title: { type: DataTypes.STRING(180), allowNull: true },
      meta_description: { type: DataTypes.STRING(320), allowNull: true },
    },
    {
      tableName: "blogs",
      indexes: [
        { fields: ["status"] },
        { fields: ["category_id"] },
        { fields: ["published_at"] },
      ],
    },
  );

  return Blog;
};
