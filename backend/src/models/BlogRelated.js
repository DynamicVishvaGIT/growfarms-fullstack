"use strict";

const { DataTypes } = require("sequelize");

/**
 * Which posts a given article lists under "Other Blog".
 *
 * A join table pointing at `blogs` twice: `blog_id` is the article being read,
 * `related_blog_id` one of the posts it links out to. A post with no rows here
 * keeps the automatic list (the newest published siblings), which is what
 * every article showed before the picker existed.
 */
module.exports = (sequelize) => {
  const BlogRelated = sequelize.define(
    "BlogRelated",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      blog_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      related_blog_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "blog_related",
      indexes: [
        { unique: true, fields: ["blog_id", "related_blog_id"] },
        { fields: ["blog_id"] },
      ],
    },
  );

  return BlogRelated;
};
