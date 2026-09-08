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

      // Wording laid over the full-bleed banner. Blank falls back to the
      // "Blog article hero" block in Admin → Content → Blogs, and past that to
      // the post's own title.
      hero_title: { type: DataTypes.STRING(240), allowNull: true },
      hero_subtitle: { type: DataTypes.STRING(400), allowNull: true },

      // The block above the ticked list on the article page: its own heading
      // and paragraph. Blank on a post means that section shows just the list,
      // under the wording the page ships with.
      sub_heading: { type: DataTypes.STRING(240), allowNull: true },
      second_description: { type: DataTypes.TEXT, allowNull: true },

      // The white pull-quote card that straddles the foot of the article.
      // Without quote_text the card is not rendered at all.
      quote_text: { type: DataTypes.TEXT, allowNull: true },
      quote_author: { type: DataTypes.STRING(160), allowNull: true },
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
