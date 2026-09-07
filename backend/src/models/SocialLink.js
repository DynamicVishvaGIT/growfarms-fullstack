"use strict";

const { DataTypes } = require("sequelize");

/**
 * The platform keys the site has an icon for. `other` falls back to a generic
 * link glyph, so adding a row for a platform this list has never heard of
 * still renders something sensible instead of a hole in the footer.
 */
const PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "twitter",
  "linkedin",
  "whatsapp",
  "other",
];

// http(s) links, plus the mailto:/tel: and bare-number forms a WhatsApp row is
// naturally typed as. Anything else — `javascript:` above all — is refused
// here, because this value goes straight into an href on the public site.
const SAFE_URL_RE = /^(https?:\/\/|mailto:|tel:)\S+$/i;
const BARE_PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

module.exports = (sequelize) => {
  const SocialLink = sequelize.define(
    "SocialLink",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      // Shown in the admin table and used as the icon's accessible name.
      name: { type: DataTypes.STRING(80), allowNull: false },
      // Chooses the icon; the frontend maps this key onto a react-icons glyph.
      platform: {
        type: DataTypes.ENUM(...PLATFORMS),
        allowNull: false,
        defaultValue: "other",
      },
      url: {
        type: DataTypes.STRING(400),
        allowNull: false,
        validate: {
          isSafeUrl(value) {
            const v = String(value ?? "").trim();
            if (!SAFE_URL_RE.test(v) && !BARE_PHONE_RE.test(v)) {
              throw new Error(
                "Enter a full https:// link — or, for WhatsApp, a phone number",
              );
            }
          },
        },
      },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "social_links" },
  );

  SocialLink.PLATFORMS = PLATFORMS;

  return SocialLink;
};
