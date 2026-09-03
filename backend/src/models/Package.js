"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Package = sequelize.define(
    "Package",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      title: {
        type: DataTypes.STRING(160),
        allowNull: false,
        validate: { notEmpty: { msg: "Package title is required" } },
      },
      description: { type: DataTypes.TEXT, allowNull: true },

      // `price` is the sortable/filterable number; `price_label` is the exact
      // string the card renders ("₹5.99 Lakh"), so Indian formatting survives.
      price: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      price_label: { type: DataTypes.STRING(60), allowNull: true },

      area_sqft: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      built_up_sqft: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      configuration: { type: DataTypes.STRING(60), allowNull: true },

      // Presentation values lifted out of LandPackages.jsx so the admin can
      // add a card without a developer, and the GSAP fan animation still works.
      button_variant: {
        type: DataTypes.ENUM("solid", "outline"),
        allowNull: false,
        defaultValue: "outline",
      },
      button_color: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "#D4AF37" },
      button_label: { type: DataTypes.STRING(60), allowNull: false, defaultValue: "Book Now" },
      card_rotate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },

      status: {
        type: DataTypes.ENUM("active", "inactive", "sold_out"),
        allowNull: false,
        defaultValue: "active",
      },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: "packages",
      indexes: [{ fields: ["project_id"] }, { fields: ["status"] }],
    },
  );

  return Package;
};
