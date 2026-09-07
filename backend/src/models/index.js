"use strict";

const { sequelize, Sequelize } = require("../config/database");

/* ── Model registration ──────────────────────────────────────────────────── */

const Admin = require("./Admin")(sequelize);
const Category = require("./Category")(sequelize);

const Project = require("./Project")(sequelize);
const ProjectImage = require("./ProjectImage")(sequelize);

const Package = require("./Package")(sequelize);
const PackageImage = require("./PackageImage")(sequelize);
const PackageTag = require("./PackageTag")(sequelize);

const Amenity = require("./Amenity")(sequelize);
const ProjectAmenity = require("./ProjectAmenity")(sequelize);
const Facility = require("./Facility")(sequelize);
const TravelRoute = require("./TravelRoute")(sequelize);

const BuyingStep = require("./BuyingStep")(sequelize);
const WhyPaliSlide = require("./WhyPaliSlide")(sequelize);
const WhyChooseCard = require("./WhyChooseCard")(sequelize);
const PhilosophyCard = require("./PhilosophyCard")(sequelize);
const Faq = require("./Faq")(sequelize);
const Testimonial = require("./Testimonial")(sequelize);
const SocialLink = require("./SocialLink")(sequelize);

const Blog = require("./Blog")(sequelize);
const BlogChecklist = require("./BlogChecklist")(sequelize);

const Enquiry = require("./Enquiry")(sequelize);
const WebsiteContent = require("./WebsiteContent")(sequelize);
const Setting = require("./Setting")(sequelize);

/* ── Associations ────────────────────────────────────────────────────────── */

// Categories
Category.hasMany(Project, { foreignKey: "category_id", as: "projects" });
Project.belongsTo(Category, { foreignKey: "category_id", as: "category" });

Category.hasMany(Package, { foreignKey: "category_id", as: "packages" });
Package.belongsTo(Category, { foreignKey: "category_id", as: "category" });

Category.hasMany(Blog, { foreignKey: "category_id", as: "blogs" });
Blog.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// Project → images / packages / sub-content.
// Sub-content cascades on delete: a facility or FAQ has no meaning without
// the project it describes, whereas an enquiry must outlive it (see below).
Project.hasMany(ProjectImage, { foreignKey: "project_id", as: "images", onDelete: "CASCADE" });
ProjectImage.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(Package, { foreignKey: "project_id", as: "packages", onDelete: "CASCADE" });
Package.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Package.hasMany(PackageImage, { foreignKey: "package_id", as: "images", onDelete: "CASCADE" });
PackageImage.belongsTo(Package, { foreignKey: "package_id", as: "package" });

Package.hasMany(PackageTag, { foreignKey: "package_id", as: "tags", onDelete: "CASCADE" });
PackageTag.belongsTo(Package, { foreignKey: "package_id", as: "package" });

Project.belongsToMany(Amenity, {
  through: ProjectAmenity,
  foreignKey: "project_id",
  otherKey: "amenity_id",
  as: "amenities",
});
Amenity.belongsToMany(Project, {
  through: ProjectAmenity,
  foreignKey: "amenity_id",
  otherKey: "project_id",
  as: "projects",
});

Project.hasMany(Facility, { foreignKey: "project_id", as: "facilities", onDelete: "CASCADE" });
Facility.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(TravelRoute, { foreignKey: "project_id", as: "routes", onDelete: "CASCADE" });
TravelRoute.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(Faq, { foreignKey: "project_id", as: "faqs", onDelete: "CASCADE" });
Faq.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(WhyChooseCard, {
  foreignKey: "project_id",
  as: "whyChooseCards",
  onDelete: "CASCADE",
});
WhyChooseCard.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(BuyingStep, {
  foreignKey: "project_id",
  as: "buyingSteps",
  onDelete: "CASCADE",
});
BuyingStep.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Project.hasMany(Testimonial, {
  foreignKey: "project_id",
  as: "testimonials",
  onDelete: "CASCADE",
});
Testimonial.belongsTo(Project, { foreignKey: "project_id", as: "project" });

// Blog
Blog.hasMany(BlogChecklist, { foreignKey: "blog_id", as: "checklist", onDelete: "CASCADE" });
BlogChecklist.belongsTo(Blog, { foreignKey: "blog_id", as: "blog" });

// Enquiries keep their link but survive the project being removed — a lead is
// a business record and must never disappear because a listing was archived.
Project.hasMany(Enquiry, { foreignKey: "project_id", as: "enquiries", onDelete: "SET NULL" });
Enquiry.belongsTo(Project, { foreignKey: "project_id", as: "project" });

Package.hasMany(Enquiry, { foreignKey: "package_id", as: "enquiries", onDelete: "SET NULL" });
Enquiry.belongsTo(Package, { foreignKey: "package_id", as: "package" });

Admin.hasMany(Enquiry, { foreignKey: "handled_by", as: "handledEnquiries", onDelete: "SET NULL" });
Enquiry.belongsTo(Admin, { foreignKey: "handled_by", as: "handler" });

const db = {
  sequelize,
  Sequelize,
  Admin,
  Category,
  Project,
  ProjectImage,
  Package,
  PackageImage,
  PackageTag,
  Amenity,
  ProjectAmenity,
  Facility,
  TravelRoute,
  BuyingStep,
  WhyPaliSlide,
  WhyChooseCard,
  PhilosophyCard,
  Faq,
  Testimonial,
  SocialLink,
  Blog,
  BlogChecklist,
  Enquiry,
  WebsiteContent,
  Setting,
};

module.exports = db;
