"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Enquiry = sequelize.define(
    "Enquiry",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

      // Both public forms land here so the admin has one inbox; `source` and
      // `project_id` record which surface the lead came from.
      source: {
        type: DataTypes.ENUM("enquiry_modal", "contact_page", "package", "other"),
        allowNull: false,
        defaultValue: "contact_page",
      },

      // The modal collects a single "name"; the contact page collects two
      // fields. We persist all three and keep `name` as the display value.
      name: { type: DataTypes.STRING(120), allowNull: false },
      first_name: { type: DataTypes.STRING(60), allowNull: true },
      last_name: { type: DataTypes.STRING(60), allowNull: true },

      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        validate: { isEmail: { msg: "Please enter a valid email address" } },
      },
      phone: { type: DataTypes.STRING(30), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: true },

      project_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      package_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      // Free-text copy of whatever the form was opened against, so the lead
      // stays readable even if the project is later renamed or deleted.
      subject: { type: DataTypes.STRING(200), allowNull: true },

      status: {
        type: DataTypes.ENUM("new", "read", "contacted", "closed"),
        allowNull: false,
        defaultValue: "new",
      },
      admin_notes: { type: DataTypes.TEXT, allowNull: true },
      handled_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      ip_address: { type: DataTypes.STRING(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(400), allowNull: true },
    },
    {
      tableName: "enquiries",
      indexes: [
        { fields: ["status"] },
        { fields: ["source"] },
        { fields: ["project_id"] },
        { fields: ["created_at"] },
      ],
    },
  );

  return Enquiry;
};
