"use strict";

/**
 * The ten simple CMS lists.
 *
 * Each is the same shape — a flat, sortable, toggleable row with at most one
 * image — so they share `crudFactory` rather than ten near-identical files.
 * Every field list here is a whitelist: nothing outside it can be written.
 */

const crudFactory = require("../services/crudFactory");
const {
  Amenity,
  Facility,
  TravelRoute,
  BuyingStep,
  WhyPaliSlide,
  WhyChooseCard,
  PhilosophyCard,
  Faq,
  Testimonial,
  SocialLink,
} = require("../models");

const amenities = crudFactory({
  model: Amenity,
  label: "Amenity",
  fields: ["name", "icon_key", "description", "sort_order", "is_active"],
  imageField: "icon_image",
  imageFolder: "amenities",
});

const facilities = crudFactory({
  model: Facility,
  label: "Facility",
  projectScoped: true,
  fields: ["project_id", "name", "distance", "sort_order", "is_active"],
  imageField: "icon_image",
  imageFolder: "facilities",
});

const travelRoutes = crudFactory({
  model: TravelRoute,
  label: "Travel route",
  projectScoped: true,
  fields: ["project_id", "mode", "label", "description", "sort_order", "is_active"],
  imageField: "icon_image",
  imageFolder: "facilities",
});

const buyingSteps = crudFactory({
  model: BuyingStep,
  label: "Buying step",
  projectScoped: true,
  fields: [
    "project_id",
    "scope",
    "step_number",
    "title",
    "description",
    "pos_top",
    "pos_left",
    "width",
    "rotate",
    "default_open",
    "sort_order",
    "is_active",
  ],
});

const whyPaliSlides = crudFactory({
  model: WhyPaliSlide,
  label: "Slide",
  fields: ["title", "description", "sort_order", "is_active"],
  imageField: "image",
  imageFolder: "misc",
});

const whyChooseCards = crudFactory({
  model: WhyChooseCard,
  label: "Card",
  projectScoped: true,
  fields: [
    "project_id",
    "position",
    "title",
    "body",
    "alt_text",
    "object_position",
    "sort_order",
    "is_active",
  ],
  imageField: "image",
  imageFolder: "misc",
});

const philosophyCards = crudFactory({
  model: PhilosophyCard,
  label: "Philosophy card",
  fields: ["title", "body", "icon_key", "sort_order", "is_active"],
});

const faqs = crudFactory({
  model: Faq,
  label: "FAQ",
  projectScoped: true,
  fields: ["project_id", "question", "answer", "sort_order", "is_active"],
});

const testimonials = crudFactory({
  model: Testimonial,
  label: "Testimonial",
  projectScoped: true,
  fields: [
    "project_id",
    "youtube_id",
    "author_name",
    "author_role",
    "quote",
    "rating",
    "sort_order",
    "is_active",
  ],
  imageField: "thumbnail",
  imageFolder: "misc",
});

const socialLinks = crudFactory({
  model: SocialLink,
  label: "Social link",
  fields: ["name", "platform", "url", "sort_order", "is_active"],
});

module.exports = {
  amenities,
  facilities,
  travelRoutes,
  buyingSteps,
  whyPaliSlides,
  whyChooseCards,
  philosophyCards,
  faqs,
  testimonials,
  socialLinks,
};
