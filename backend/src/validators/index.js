"use strict";

const { body, param, query } = require("express-validator");

/*
 * These rules mirror src/lib/validation.js in the React app one for one, so a
 * value the client accepted is never rejected by the server for a different
 * reason (and, more importantly, a client that skips validation entirely still
 * hits the same wall).
 */

const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]*$/;
const PHONE_ALLOWED_RE = /^[\d\s+()-]+$/;

const nameRule = (field, label = "name") =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`Please enter your ${label}`)
    .bail()
    .isLength({ min: 2 })
    .withMessage(`Your ${label} must be at least 2 characters`)
    .isLength({ max: 60 })
    .withMessage(`Your ${label} must be under 60 characters`)
    .matches(NAME_RE)
    .withMessage(`Your ${label} can only contain letters, spaces and - . '`);

const emailRule = body("email")
  .trim()
  .notEmpty()
  .withMessage("Please enter your email address")
  .bail()
  .isLength({ max: 254 })
  .withMessage("That email address is too long")
  .isEmail()
  .withMessage("Please enter a valid email address")
  .normalizeEmail({ gmail_remove_dots: false });

const phoneRule = body("phone")
  .trim()
  .notEmpty()
  .withMessage("Please enter your phone number")
  .bail()
  .matches(PHONE_ALLOWED_RE)
  .withMessage("Phone number can only contain digits, spaces and + - ( )")
  .bail()
  .custom((value) => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.length < 10) {
      throw new Error("Please enter a valid phone number (at least 10 digits)");
    }
    if (digits.length > 15) {
      throw new Error("Please enter a valid phone number (at most 15 digits)");
    }
    return true;
  });

const messageRule = (required = false, min = 10, max = 1000) =>
  body("message")
    .optional({ values: "falsy" })
    .trim()
    .custom((value) => {
      if (!value) {
        if (required) throw new Error("Please enter a message");
        return true;
      }
      if (value.length < min) throw new Error(`Your message must be at least ${min} characters`);
      if (value.length > max) throw new Error(`Your message must be under ${max} characters`);
      return true;
    });

/* ── Auth ────────────────────────────────────────────────────────────────── */

const loginRules = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail()
    .withMessage("Please enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

const passwordRules = [
  body("current_password").notEmpty().withMessage("Your current password is required"),
  body("new_password")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("New password must contain a letter")
    .matches(/\d/)
    .withMessage("New password must contain a number"),
];

const profileRules = [
  body("name").optional().trim().isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email").optional().trim().isEmail().withMessage("Please enter a valid email address"),
  body("phone").optional({ values: "falsy" }).trim().isLength({ max: 30 })
    .withMessage("Phone number is too long"),
];

/* ── Public enquiry ──────────────────────────────────────────────────────── */

/**
 * The enquiry modal posts `name`; the contact page posts `first_name` and
 * `last_name`. One rule set accepts either shape.
 */
const enquiryRules = [
  body("name")
    .if(body("first_name").not().exists({ values: "falsy" }))
    .trim()
    .notEmpty()
    .withMessage("Please enter your name")
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage("Your name must be between 2 and 60 characters")
    .matches(NAME_RE)
    .withMessage("Your name can only contain letters, spaces and - . '"),

  body("first_name")
    .if(body("first_name").exists({ values: "falsy" }))
    .trim()
    .notEmpty()
    .withMessage("Please enter your first name")
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage("Your first name must be between 2 and 60 characters")
    .matches(NAME_RE)
    .withMessage("Your first name can only contain letters, spaces and - . '"),

  body("last_name")
    .if(body("last_name").exists({ values: "falsy" }))
    .trim()
    .notEmpty()
    .withMessage("Please enter your last name")
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage("Your last name must be between 2 and 60 characters")
    .matches(NAME_RE)
    .withMessage("Your last name can only contain letters, spaces and - . '"),

  emailRule,
  phoneRule,
  messageRule(false, 10, 1000),

  body("source").optional().isIn(["enquiry_modal", "contact_page", "package", "other"])
    .withMessage("Unknown enquiry source"),
];

/* ── Admin resources ─────────────────────────────────────────────────────── */

const idParam = [param("id").isInt({ min: 1 }).withMessage("Invalid id")];

const projectRules = [
  body("title").optional().trim().isLength({ min: 2, max: 160 })
    .withMessage("Title must be between 2 and 160 characters"),
  body("status").optional().isIn(["active", "inactive", "sold_out"])
    .withMessage("Invalid status"),
  body("map_pin_top").optional({ values: "falsy" }).isFloat({ min: 0, max: 100 })
    .withMessage("Map pin top must be a percentage between 0 and 100"),
  body("map_pin_left").optional({ values: "falsy" }).isFloat({ min: 0, max: 100 })
    .withMessage("Map pin left must be a percentage between 0 and 100"),
  body("short_description").optional({ values: "falsy" }).isLength({ max: 500 })
    .withMessage("Short description must be under 500 characters"),
];

const packageRules = [
  body("title").optional().trim().isLength({ min: 2, max: 160 })
    .withMessage("Title must be between 2 and 160 characters"),
  body("price").optional({ values: "falsy" }).isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("status").optional().isIn(["active", "inactive", "sold_out"])
    .withMessage("Invalid status"),
  body("button_variant").optional().isIn(["solid", "outline"])
    .withMessage("Button variant must be solid or outline"),
  body("button_color").optional({ values: "falsy" }).matches(/^#?[0-9a-fA-F]{3,8}$/)
    .withMessage("Button colour must be a hex value"),
];

const blogRules = [
  body("title").optional().trim().isLength({ min: 2, max: 240 })
    .withMessage("Title must be between 2 and 240 characters"),
  body("status").optional().isIn(["draft", "published"]).withMessage("Invalid status"),
  body("excerpt").optional({ values: "falsy" }).isLength({ max: 500 })
    .withMessage("Excerpt must be under 500 characters"),
];

const categoryRules = [
  body("name").optional().trim().isLength({ min: 2, max: 120 })
    .withMessage("Name must be between 2 and 120 characters"),
  body("type").optional().isIn(["project", "package", "blog"])
    .withMessage("Type must be project, package or blog"),
];

const enquiryUpdateRules = [
  body("status").optional().isIn(["new", "read", "contacted", "closed"])
    .withMessage("Status must be new, read, contacted or closed"),
  body("admin_notes").optional({ values: "falsy" }).isLength({ max: 5000 })
    .withMessage("Notes must be under 5000 characters"),
];

const paginationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100"),
];

module.exports = {
  loginRules,
  passwordRules,
  profileRules,
  enquiryRules,
  enquiryUpdateRules,
  projectRules,
  packageRules,
  blogRules,
  categoryRules,
  idParam,
  paginationRules,
  nameRule,
  emailRule,
  phoneRule,
  messageRule,
};
