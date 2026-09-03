"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BuyingStep = sequelize.define(
    "BuyingStep",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      // 'details' → the animated S-curve on HowToBuyFarmLand.
      // 'blog'    → the simpler numbered list inside BlogDetails.
      scope: {
        type: DataTypes.ENUM("details", "blog"),
        allowNull: false,
        defaultValue: "details",
      },
      // NULL → the shared journey shown on every project; set → that project's
      // own steps, which replace the shared ones wholesale. Same nullable
      // project_id convention as facilities, FAQs and why-choose cards.
      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      step_number: { type: DataTypes.STRING(6), allowNull: false },
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },

      // Percentage/px layout values from the desktop stage (viewBox 0 0 1000 900).
      pos_top: { type: DataTypes.STRING(12), allowNull: true },
      pos_left: { type: DataTypes.STRING(12), allowNull: true },
      width: { type: DataTypes.INTEGER, allowNull: true },
      rotate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      default_open: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: "buying_steps",
      indexes: [{ fields: ["scope"] }, { fields: ["project_id"] }],
    },
  );

  return BuyingStep;
};
