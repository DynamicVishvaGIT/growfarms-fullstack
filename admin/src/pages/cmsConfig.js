/**
 * Declarative descriptions of the ten simple CMS lists.
 *
 * Each entry names the fields, so one page component (CmsList) can render a
 * table and an edit form for every resource without nine bespoke screens.
 * Field types map onto the shared <Field> control.
 */

const TEXT = (name, label, extra = {}) => ({ name, label, type: "text", ...extra });
const AREA = (name, label, extra = {}) => ({ name, label, type: "textarea", ...extra });
const NUM = (name, label, extra = {}) => ({ name, label, type: "number", ...extra });
const BOOL = (name, label, extra = {}) => ({ name, label, type: "checkbox", ...extra });
const SELECT = (name, label, options, extra = {}) => ({
  name,
  label,
  type: "select",
  options,
  ...extra,
});

const SORT = NUM("sort_order", "Sort order", { hint: "Lower numbers appear first." });
const ACTIVE = BOOL("is_active", "Active", { default: true });

export const CMS_CONFIG = {
  amenities: {
    title: "Amenities",
    subtitle: "The icon grid shown on each project page.",
    singular: "Amenity",
    image: { field: "icon_image", label: "Custom icon (optional)" },
    columns: ["name", "icon_key", "sort_order", "is_active"],
    fields: [
      TEXT("name", "Name", { required: true, placeholder: "Water Facility" }),
      SELECT(
        "icon_key",
        "Built-in icon",
        [
          ["", "— Use uploaded image —"],
          ["water", "Water"],
          ["electricity", "Electricity"],
          ["gated", "Gated community"],
          ["plantation", "Plantation"],
          ["security", "Security"],
          ["title", "Clear title"],
          ["garden", "Garden"],
          ["road", "Road"],
        ],
        {
          hint: "Built-in icons keep the site's original hover animation. Upload an image only for a new amenity type.",
        },
      ),
      AREA("description", "Description", { rows: 2 }),
      SORT,
      ACTIVE,
    ],
  },

  facilities: {
    title: "Local Facilities",
    subtitle: "Hospital, school, market and the rest of the nearby-amenities row.",
    singular: "Facility",
    image: { field: "icon_image", label: "Icon" },
    projectScoped: true,
    columns: ["name", "distance", "sort_order", "is_active"],
    fields: [
      TEXT("name", "Name", { required: true, placeholder: "Hospital" }),
      TEXT("distance", "Distance", { placeholder: "2 km" }),
      SORT,
      ACTIVE,
    ],
  },

  "travel-routes": {
    title: "How to Reach",
    subtitle: "The by road / by train / by air panels.",
    singular: "Route",
    image: { field: "icon_image", label: "Icon" },
    projectScoped: true,
    columns: ["label", "mode", "sort_order", "is_active"],
    fields: [
      TEXT("label", "Label", { required: true, placeholder: "By Road" }),
      SELECT("mode", "Mode", [
        ["road", "Road"],
        ["train", "Train"],
        ["air", "Air"],
        ["other", "Other"],
      ]),
      AREA("description", "Description", { rows: 4 }),
      SORT,
      ACTIVE,
    ],
  },

  "buying-steps": {
    title: "Buying Steps",
    subtitle: "The numbered how-to-buy journey.",
    singular: "Step",
    projectScoped: true,
    columns: ["step_number", "title", "scope", "project_id", "sort_order", "is_active"],
    fields: [
      SELECT(
        "scope",
        "Shown on",
        [
          ["details", "Project page (animated S-curve)"],
          ["blog", "Blog article"],
        ],
        { hint: "The project page positions cards along a curve; the blog uses a plain list." },
      ),
      TEXT("step_number", "Step number", { required: true, placeholder: "01" }),
      TEXT("title", "Title", { required: true, placeholder: "Explore Available Plots" }),
      AREA("description", "Description", { rows: 3 }),
      TEXT("pos_top", "Position from top", { placeholder: "22%", group: "layout" }),
      TEXT("pos_left", "Position from left", { placeholder: "57%", group: "layout" }),
      NUM("width", "Card width (px)", { placeholder: "236", group: "layout" }),
      NUM("rotate", "Rotation (deg)", { step: "0.5", group: "layout" }),
      BOOL("default_open", "Open by default"),
      SORT,
      ACTIVE,
    ],
    note: "The project page draws a fixed four-card curve, so only the first four active steps with that scope appear there — a fifth would land on top of the first. The position, width and rotation fields only affect that animated layout.",
  },

  "why-pali-slides": {
    title: "Why Pali Slides",
    subtitle: "The rotating carousel of reasons to invest.",
    singular: "Slide",
    image: { field: "image", label: "Slide image" },
    columns: ["title", "sort_order", "is_active"],
    fields: [
      TEXT("title", "Title", { required: true, placeholder: "Smart Investment" }),
      AREA("description", "Description", { rows: 3 }),
      SORT,
      ACTIVE,
    ],
  },

  "why-choose-cards": {
    title: "Why Choose Cards",
    subtitle: "The three-card row on the project page.",
    singular: "Card",
    image: { field: "image", label: "Card image" },
    projectScoped: true,
    columns: ["title", "position", "sort_order", "is_active"],
    fields: [
      TEXT("title", "Title", { required: true, placeholder: "Green Environment" }),
      AREA("body", "Body", { rows: 3 }),
      SELECT(
        "position",
        "Position",
        [
          ["left", "Left"],
          ["center", "Center"],
          ["right", "Right"],
        ],
        { hint: "Each slot animates in from its own direction." },
      ),
      TEXT("alt_text", "Image alt text"),
      TEXT("object_position", "Image focus", { placeholder: "center" }),
      SORT,
      ACTIVE,
    ],
    note: "The row has exactly three slots. One active card per position — a second card set to the same position never appears on the site.",
  },

  "philosophy-cards": {
    title: "Core Philosophy",
    subtitle: "Mission, vision and values.",
    singular: "Card",
    columns: ["title", "icon_key", "sort_order", "is_active"],
    fields: [
      TEXT("title", "Title", { required: true, placeholder: "Mission" }),
      AREA("body", "Body", { rows: 4 }),
      SELECT("icon_key", "Icon", [
        ["mission", "Mission"],
        ["vision", "Vision"],
        ["values", "Values"],
      ]),
      SORT,
      ACTIVE,
    ],
  },

  faqs: {
    title: "FAQs",
    subtitle: "The accordion on the project page.",
    singular: "FAQ",
    projectScoped: true,
    columns: ["question", "sort_order", "is_active"],
    fields: [
      AREA("question", "Question", { rows: 2, required: true }),
      AREA("answer", "Answer", { rows: 5, required: true }),
      SORT,
      ACTIVE,
    ],
  },

  testimonials: {
    title: "Testimonials",
    subtitle: "The 3D video carousel on the home and project pages.",
    singular: "Testimonial",
    projectScoped: true,
    image: { field: "thumbnail", label: "Custom thumbnail (optional)" },
    columns: ["youtube_id", "author_name", "project_id", "sort_order", "is_active"],
    fields: [
      TEXT("youtube_id", "YouTube video ID", {
        required: true,
        placeholder: "fcx0LV7C2pE",
        hint: "Just the ID — the part after ?v= in the URL.",
      }),
      TEXT("author_name", "Customer name"),
      TEXT("author_role", "Role / location"),
      AREA("quote", "Quote", { rows: 3 }),
      NUM("rating", "Rating (1-5)", { min: 1, max: 5 }),
      SORT,
      ACTIVE,
    ],
  },

  "social-links": {
    title: "Social Media Links",
    subtitle: "The icon row in the website footer.",
    singular: "Social link",
    columns: ["name", "platform", "url", "sort_order", "is_active"],
    fields: [
      TEXT("name", "Platform name", { required: true, placeholder: "Facebook" }),
      SELECT(
        "platform",
        "Icon",
        [
          ["facebook", "Facebook"],
          ["instagram", "Instagram"],
          ["youtube", "YouTube"],
          ["twitter", "X (Twitter)"],
          ["linkedin", "LinkedIn"],
          ["whatsapp", "WhatsApp"],
          ["other", "Other (generic link icon)"],
        ],
        { hint: "Chooses which icon the footer draws. The name above is what screen readers announce." },
      ),
      TEXT("url", "Profile URL", {
        required: true,
        placeholder: "https://www.facebook.com/growfarms",
        hint: "Paste the full link, including https://. For WhatsApp a plain phone number works too.",
      }),
      SORT,
      ACTIVE,
    ],
    note: "Only active links appear on the site, and the footer's social row is hidden entirely while none are active. The rows that ship with the site point at each platform's home page — replace the URL with your own profile before switching one on.",
  },
};

/** Human-readable column headers for the generic table. */
export const COLUMN_LABELS = {
  project_id: "Project",
  name: "Name",
  title: "Title",
  label: "Label",
  question: "Question",
  icon_key: "Icon",
  platform: "Icon",
  url: "URL",
  youtube_id: "Video ID",
  author_name: "Customer",
  step_number: "No.",
  scope: "Shown on",
  mode: "Mode",
  position: "Position",
  distance: "Distance",
  sort_order: "Order",
  is_active: "Status",
};
