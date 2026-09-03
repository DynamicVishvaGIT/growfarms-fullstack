"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Testimonial = sequelize.define(
    "Testimonial",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      // NULL → played on the home page and on every project; set → that
      // project's own reel, which replaces the shared one on its page.
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      // The 3D carousel plays YouTube embeds keyed by video id.
      youtube_id: { type: DataTypes.STRING(40), allowNull: true },
      author_name: { type: DataTypes.STRING(120), allowNull: true },
      author_role: { type: DataTypes.STRING(120), allowNull: true },
      quote: { type: DataTypes.TEXT, allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 1, max: 5 } },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "testimonials", indexes: [{ fields: ["project_id"] }] },
  );

  return Testimonial;
};
