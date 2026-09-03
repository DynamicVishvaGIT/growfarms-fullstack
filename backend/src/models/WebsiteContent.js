"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const WebsiteContent = sequelize.define(
    "WebsiteContent",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      page: {
        type: DataTypes.ENUM("home", "about", "details", "blogs", "contact", "global"),
        allowNull: false,
        defaultValue: "home",
      },
      // Stable identifier the frontend looks the block up by, e.g.
      // 'hero_stage_1', 'trust_section', 'footer_address'.
      section_key: { type: DataTypes.STRING(80), allowNull: false },
      label: { type: DataTypes.STRING(160), allowNull: true },

      title: { type: DataTypes.STRING(400), allowNull: true },
      subtitle: { type: DataTypes.STRING(400), allowNull: true },
      body: { type: DataTypes.TEXT, allowNull: true },
      image: { type: DataTypes.STRING(255), allowNull: true },
      link_url: { type: DataTypes.STRING(400), allowNull: true },
      link_label: { type: DataTypes.STRING(120), allowNull: true },

      // Anything that does not fit the columns above (stat pairs, list items).
      extra_data: { type: DataTypes.JSON, allowNull: true },

      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: "website_content",
      indexes: [
        { unique: true, fields: ["page", "section_key"] },
        { fields: ["page"] },
      ],
    },
  );

  return WebsiteContent;
};
