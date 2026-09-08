"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      title: {
        type: DataTypes.STRING(160),
        allowNull: false,
        validate: { notEmpty: { msg: "Project title is required" } },
      },
      // Mirrors the `desc` / `fullDesc` split the aerial-map pins already use:
      // the short line shows in the map tooltip, the long one on the panel.
      short_description: { type: DataTypes.STRING(500), allowNull: true },
      full_description: { type: DataTypes.TEXT, allowNull: true },

      location: { type: DataTypes.STRING(200), allowNull: true },
      total_area: { type: DataTypes.STRING(80), allowNull: true },
      category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      hero_image: { type: DataTypes.STRING(255), allowNull: true },
      map_image: { type: DataTypes.STRING(255), allowNull: true },

      // ── Details-page prose sections ────────────────────────────────────
      // "About <project>" and "Why invest in Pali" are each one heading, one
      // body and one photograph, and every project tells its own story there.
      // The components keep their designed copy as the fallback, so a column
      // left blank renders exactly what the page renders today.
      //
      // The About section shows a small label above its heading, then a row of
      // four tilted photo cards; each card is its own column so a project can
      // fill in as many as it has photographs for and the row closes up around
      // whatever is missing.
      about_eyebrow: { type: DataTypes.STRING(80), allowNull: true },
      about_title: { type: DataTypes.STRING(200), allowNull: true },
      about_body: { type: DataTypes.TEXT, allowNull: true },
      about_image: { type: DataTypes.STRING(255), allowNull: true },
      about_image_2: { type: DataTypes.STRING(255), allowNull: true },
      about_image_3: { type: DataTypes.STRING(255), allowNull: true },
      about_image_4: { type: DataTypes.STRING(255), allowNull: true },

      // The heading above the three Why Choose cards. The cards themselves are
      // their own rows in `why_choose_cards`; this is the label, headline and
      // paragraph that introduce them, and each project names itself there.
      why_choose_eyebrow: { type: DataTypes.STRING(80), allowNull: true },
      why_choose_title: { type: DataTypes.STRING(200), allowNull: true },
      why_choose_body: { type: DataTypes.TEXT, allowNull: true },

      invest_title: { type: DataTypes.STRING(200), allowNull: true },
      invest_body: { type: DataTypes.TEXT, allowNull: true },
      invest_image: { type: DataTypes.STRING(255), allowNull: true },

      // Percentage coordinates of the pin on the aerial map source image.
      // These drive AerialMapSection's pin placement maths verbatim.
      map_pin_top: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      map_pin_left: { type: DataTypes.DECIMAL(5, 2), allowNull: true },

      status: {
        type: DataTypes.ENUM("active", "inactive", "sold_out"),
        allowNull: false,
        defaultValue: "active",
      },
      is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      show_on_map: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

      meta_title: { type: DataTypes.STRING(180), allowNull: true },
      meta_description: { type: DataTypes.STRING(320), allowNull: true },
    },
    {
      tableName: "projects",
      indexes: [
        { fields: ["status"] },
        { fields: ["is_featured"] },
        { fields: ["category_id"] },
      ],
    },
  );

  return Project;
};
