"use strict";

/**
 * Every value below was lifted verbatim from the existing React source.
 * Nothing here is invented — the file references, in comments, where each
 * block came from, so the seed can be re-checked against the frontend.
 *
 * Image paths point at uploads/seed/, which holds a COPY of
 * src/assets/images/. The originals are untouched.
 */

const IMG = (name) => `uploads/seed/${name}`;

/* ── Categories ──────────────────────────────────────────────────────────── */

const categories = [
  { name: "Farmland Projects", slug: "farmland-projects", type: "project", sort_order: 1 },
  { name: "Residential Farmland", slug: "residential-farmland", type: "project", sort_order: 2 },
  { name: "Land Packages", slug: "land-packages", type: "package", sort_order: 1 },
  { name: "Bungalow Packages", slug: "bungalow-packages", type: "package", sort_order: 2 },
  // Blogs.jsx renders "Mixed Farming" as the badge on every card.
  { name: "Mixed Farming", slug: "mixed-farming", type: "blog", sort_order: 1 },
  { name: "Agriculture", slug: "agriculture", type: "blog", sort_order: 2 },
  { name: "Investment", slug: "investment", type: "blog", sort_order: 3 },
];

/* ── Projects — from AerialMapSection.jsx `pins` ─────────────────────────── */

const projects = [
  {
    slug: "skybreez",
    title: "Skybreez",
    short_description: "Serene hillside farmhouse plots with panoramic valley views.",
    full_description:
      "Skybreez by Grow Farms is a tranquil farmhouse community nestled in the rolling hills near Mumbai. Designed for those who seek a peaceful escape, each plot offers sweeping valley views, fresh mountain air, and a chance to reconnect with nature — while staying close to city conveniences.",
    location: "Near Mumbai, Maharashtra",
    category_slug: "farmland-projects",
    hero_image: IMG("home_banner_2.jpg"),
    map_pin_top: 78.7,
    map_pin_left: 19.1,
    status: "active",
    is_featured: false,
    show_on_map: true,
    sort_order: 1,
  },
  {
    slug: "sarasview",
    title: "Sarasview",
    short_description: "Premium plots overlooking the rocky peaks and lush canopy.",
    full_description:
      "Sarasview by Grow Farms is a sprawling 140-acre residential farmland development located in the peaceful surroundings of Aptavane Village, just 2 km away from the historic Pali city in Maharashtra.",
    location: "Aptavane Village, Pali, Maharashtra",
    total_area: "140 acres",
    category_slug: "residential-farmland",
    hero_image: IMG("Details_Banner.jpg"),
    map_pin_top: 61.1,
    map_pin_left: 49.4,
    status: "active",
    // Sarasview is the project the existing /details page renders.
    is_featured: true,
    show_on_map: true,
    sort_order: 2,
    meta_title: "Sarasview — 140-acre Residential Farmland near Pali | Grow Farms",
    meta_description:
      "Scenic river-touch farmland plots at Aptavane Village, 2 km from Pali, Maharashtra. Gated, plotted and ready to own.",
  },
  {
    slug: "xyzview",
    title: "Xyzview",
    short_description: "Premium plots overlooking the rocky peaks and lush canopy.",
    full_description:
      "Xyzview offers premium farmland plots with breathtaking views of the surrounding peaks and verdant canopy. A rare opportunity to own land in one of Maharashtra's most scenic corridors.",
    location: "Pali, Maharashtra",
    category_slug: "farmland-projects",
    hero_image: IMG("home_banner_2.jpg"),
    map_pin_top: 51.4,
    map_pin_left: 83.8,
    status: "active",
    is_featured: false,
    show_on_map: true,
    sort_order: 3,
  },
  {
    slug: "syview-2",
    title: "Syview 2",
    short_description: "Premium plots overlooking the rocky peaks and lush canopy.",
    full_description:
      "Syview 2 expands on the success of our first phase, offering larger plots with enhanced amenities and unobstructed views of the natural landscape.",
    location: "Pali, Maharashtra",
    category_slug: "farmland-projects",
    hero_image: IMG("home_banner_2.jpg"),
    map_pin_top: 78.7,
    map_pin_left: 74.4,
    status: "active",
    is_featured: false,
    show_on_map: true,
    sort_order: 4,
  },
];

/* ── Packages — from LandPackages.jsx `packages` ─────────────────────────── */

const packages = [
  {
    slug: "farm-land",
    project_slug: "sarasview",
    category_slug: "land-packages",
    title: "Farm Land",
    description:
      "21,780 Sq. Ft. Agricultural Land With Basic Plantation, Fencing, Water, Electricity, Road Access, And All Essential Common Amenities.",
    price: 599000,
    price_label: "₹5.99 Lakh",
    area_sqft: 21780,
    button_variant: "outline",
    button_color: "#D4AF37",
    button_label: "Book Now",
    card_rotate: -5,
    status: "active",
    sort_order: 1,
    images: [IMG("Land_Pakages_1.jpg"), IMG("Land_Pakages_1.jpg"), IMG("Land_Pakages_1.jpg")],
    tags: [
      { label: "Road Access", accent_color: null },
      { label: "Fencing", accent_color: null },
      { label: "₹5.99 Lakh", accent_color: "#D4AF37" },
    ],
  },
  {
    slug: "farmland-with-2bhk-bungalow",
    project_slug: "sarasview",
    category_slug: "bungalow-packages",
    title: "Farmland With 2BHK Bungalow",
    description:
      "21,780 Sq. Ft. Agricultural Land With An 800 Sq. Ft. 2BHK Bungalow And All Essential Basic Amenities Included.",
    price: 1598000,
    price_label: "₹15.98 Lakh",
    area_sqft: 21780,
    built_up_sqft: 800,
    configuration: "2BHK",
    button_variant: "solid",
    button_color: "#D4AF37",
    button_label: "Book Now",
    card_rotate: 5,
    status: "active",
    sort_order: 2,
    images: [IMG("Land_Pakages_2.jpg"), IMG("Land_Pakages_2.jpg"), IMG("Land_Pakages_2.jpg")],
    tags: [
      { label: "21,780 Sq. Ft.", accent_color: null },
      { label: "2BHK", accent_color: null },
      { label: "₹15.98 Lakh", accent_color: "#4C7A4F" },
    ],
  },
];

/* ── Amenities — from Amenitiessection.jsx `amenities` ───────────────────── */

const amenities = [
  { name: "Water Facility", icon_key: "water", sort_order: 1 },
  { name: "Electricity", icon_key: "electricity", sort_order: 2 },
  { name: "Gated Community", icon_key: "gated", sort_order: 3 },
  { name: "Plantation", icon_key: "plantation", sort_order: 4 },
  { name: "24x7 Security", icon_key: "security", sort_order: 5 },
  { name: "Clear Title", icon_key: "title", sort_order: 6 },
  { name: "Common Garden", icon_key: "garden", sort_order: 7 },
  { name: "Tar Road", icon_key: "road", sort_order: 8 },
];

/* ── Local facilities — from Details.jsx `FACILITIES` ────────────────────── */

const facilities = [
  { name: "Hospital", icon_image: IMG("Hospital.png"), sort_order: 1 },
  { name: "School", icon_image: IMG("school.png"), sort_order: 2 },
  { name: "College", icon_image: IMG("College.png"), sort_order: 3 },
  { name: "Local Market", icon_image: IMG("local_market.png"), sort_order: 4 },
  { name: "Highway", icon_image: IMG("Highway.png"), sort_order: 5 },
];

/* ── How to reach — from Details.jsx `ROUTES` ────────────────────────────── */

const travelRoutes = [
  {
    mode: "road",
    label: "By Road",
    icon_image: IMG("By_Road.png"),
    description:
      "Pali is approximately 112 kilometers away from Mumbai. You can drive by car or hire a taxi. State transport buses and private buses also operate between Mumbai and Pali.",
    sort_order: 1,
  },
  {
    mode: "train",
    label: "By Train",
    icon_image: IMG("By_Train.png"),
    description:
      "Pali is approximately 112 kilometers away from Mumbai. You can drive by car or hire a taxi. State transport buses and private buses also operate between Mumbai and Pali.",
    sort_order: 2,
  },
  {
    mode: "air",
    label: "By Air",
    icon_image: IMG("By_Air.png"),
    description:
      "Pali is approximately 112 kilometers away from Mumbai. You can drive by car or hire a taxi. State transport buses and private buses also operate between Mumbai and Pali.",
    sort_order: 3,
  },
];

/* ── Buying steps — from HowToBuyFarmLand.jsx `STEPS` ────────────────────── */

const buyingSteps = [
  {
    scope: "details",
    step_number: "01",
    title: "Explore Available Plots",
    description:
      "Browse our curated selection of verified farmland plots across prime agricultural zones suited to your investment goals.",
    pos_top: "22%",
    pos_left: "57%",
    width: 236,
    rotate: 0,
    sort_order: 1,
  },
  {
    scope: "details",
    step_number: "02",
    title: "Schedule A Site Visit",
    description:
      "Book a guided on-site visit with our land experts to experience the property firsthand before making any commitment.",
    pos_top: "46%",
    pos_left: "32%",
    width: 214,
    rotate: 0,
    sort_order: 2,
  },
  {
    scope: "details",
    step_number: "03",
    title: "Verify & Complete Documentation",
    description:
      "Review all legal documents, verify the property details, and complete the purchase process securely.",
    pos_top: "70%",
    pos_left: "60%",
    width: 242,
    rotate: -4,
    default_open: true,
    sort_order: 3,
  },
  {
    scope: "details",
    step_number: "04",
    title: "Become A Proud Land Owner",
    description:
      "Complete payment and registration to officially become a proud farmland owner and begin your agricultural journey.",
    pos_top: "90%",
    pos_left: "30%",
    width: 236,
    rotate: 20,
    sort_order: 4,
  },
  // From BlogDetails.jsx `steps`
  {
    scope: "blog",
    step_number: "01",
    title: "Choose Your Plot",
    description:
      "Explore our premium agricultural land options and select the perfect location.",
    sort_order: 1,
  },
  {
    scope: "blog",
    step_number: "02",
    title: "Visit the Site",
    description:
      "Schedule a site visit with our experts to experience the project firsthand.",
    sort_order: 2,
  },
  {
    scope: "blog",
    step_number: "03",
    title: "Complete Your Investment",
    description:
      "Our team assists you throughout the documentation process, ensuring a smooth and transparent purchase.",
    sort_order: 3,
  },
];

/* ── Why Pali slides — from WhyPaliSection.jsx `SLIDES` ──────────────────── */

const whyPaliSlides = [
  {
    title: "Smart Investment",
    description:
      "Buying Farm Land In Pali Supports The Local Community. It Can Create Jobs And Help Growth.",
    image: IMG("Why_Pali_1.png"),
    sort_order: 1,
  },
  {
    title: "Helps The Local Area",
    description:
      "Buying Farm Land In Pali Supports The Local Community. It Can Create Jobs And Help Job Growth.",
    image: IMG("Why_Pali_2.png"),
    sort_order: 2,
  },
  {
    title: "Sustainable Land",
    description:
      "Every Acre In Pali Is Farmed Responsibly, Protecting Soil Health For Generations To Come.",
    image: IMG("Why_Pali_3.png"),
    sort_order: 3,
  },
  {
    title: "Long Term Value",
    description:
      "Farmland In Pali Has Steadily Appreciated, Making It A Reliable Store Of Value Over Time.",
    image: IMG("Why_Pali_1.png"),
    sort_order: 4,
  },
  {
    title: "Trusted Partnership",
    description:
      "Our Local Team Manages Every Plot Directly, So You Invest With Full Transparency.",
    image: IMG("Why_Pali_2.png"),
    sort_order: 5,
  },
];

/* ── Why Choose cards — from WhyChoose.jsx `CARDS` ───────────────────────── */

const whyChooseCards = [
  {
    position: "left",
    title: "History & Culture",
    body: "Buying farm land in Pali supports the community. It can create jobs and strengthen local heritage.",
    image: IMG("animals.png"),
    alt_text: "Animals in Pali farmland",
    object_position: "center",
    sort_order: 1,
  },
  {
    position: "center",
    title: "Green Environment",
    body: "Pali offers open spaces, cleaner air, and a nature-centric lifestyle without sacrificing convenience.",
    image: IMG("Why_Pali_1.png"),
    alt_text: "Green farm life in Pali",
    object_position: "center",
    sort_order: 2,
  },
  {
    position: "right",
    title: "Helps The Local Area",
    body: "Buying farm land in Pali supports the local community. It can create jobs and help the local economy.",
    image: IMG("Why_Pali_2.png"),
    alt_text: "Farm workers in Pali",
    object_position: "center",
    sort_order: 3,
  },
];

/* ── Social links ──────────────────────────────────────────────────────────── */

/**
 * The one seed block with nothing behind it in the frontend: the footer has
 * never carried social icons, so there are no real account URLs to lift.
 *
 * Every row is therefore seeded INACTIVE and points at the platform's home
 * page. The public endpoint serves active rows only, so the footer shows no
 * social section at all until someone replaces a URL and ticks Active — which
 * is the right default, since a placeholder link is worse than no link.
 */
const socialLinks = [
  { name: "Facebook", platform: "facebook", url: "https://www.facebook.com/", sort_order: 1, is_active: false },
  { name: "Instagram", platform: "instagram", url: "https://www.instagram.com/", sort_order: 2, is_active: false },
  { name: "YouTube", platform: "youtube", url: "https://www.youtube.com/", sort_order: 3, is_active: false },
  { name: "X (Twitter)", platform: "twitter", url: "https://x.com/", sort_order: 4, is_active: false },
  { name: "LinkedIn", platform: "linkedin", url: "https://www.linkedin.com/", sort_order: 5, is_active: false },
  { name: "WhatsApp", platform: "whatsapp", url: "https://wa.me/", sort_order: 6, is_active: false },
];

/* ── Core philosophy — from CorePhilosophy.jsx `cards` ───────────────────── */

const philosophyCards = [
  {
    title: "Mission",
    icon_key: "mission",
    body: "To build lasting trust with customers and stakeholders through quality products and services. We drive growth and consistency to maintain a leading market reputation.",
    sort_order: 1,
  },
  {
    title: "Vision",
    icon_key: "vision",
    body: "Cultivating a future where agricultural investment is accessible, transparent, and environmentally restorative for generations to come.",
    sort_order: 2,
  },
  {
    title: "Values",
    icon_key: "values",
    body: "Integrity in every transaction, consistency in our delivery, and an unwavering respect for the land that provides our wealth.",
    sort_order: 3,
  },
];

/* ── FAQs — from FAQSection.jsx `faqs` ───────────────────────────────────── */
/* NOTE: this copy is the Spline placeholder text still live on the site.     */
/* It is seeded verbatim so nothing is lost; edit it in Admin → FAQs.         */

const faqs = [
  {
    question: "Can I use Spline for free?",
    answer:
      "Yes, totally! The Basic plan is free. You can have unlimited personal files and file viewers. Maximum 1 team project can be created with 2 team files and 2 editors. You also have access to the Spline Library and can publish your scenes with a Spline logo.",
    sort_order: 1,
  },
  {
    question: "Why should I upgrade to Super or Super Team?",
    answer:
      "Upgrading gives you access to advanced features like custom domains, no Spline branding, unlimited team projects, priority support, and much more to power your professional workflow.",
    sort_order: 2,
  },
  {
    question: "What payment methods can I use?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as PayPal. All payments are securely processed and encrypted.",
    sort_order: 3,
  },
  {
    question: "How does team billing work?",
    answer:
      "Team billing is calculated per seat. Each member added to your team will be charged at the same rate as your plan. You'll be billed at the start of each billing cycle for the total number of seats.",
    sort_order: 4,
  },
  {
    question: "How can I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time from your account settings under Billing. Your plan will remain active until the end of the current billing period.",
    sort_order: 5,
  },
  {
    question: "Can I change from monthly to yearly?",
    answer:
      "Yes! You can switch from monthly to yearly billing at any time. The switch will take effect at the start of your next billing cycle and you'll enjoy a discounted annual rate.",
    sort_order: 6,
  },
  {
    question: "How can I ask other questions about pricing?",
    answer:
      "Feel free to reach out to our support team via the in-app chat or email us at support@spline.design. We're happy to help with any pricing or billing questions.",
    sort_order: 7,
  },
  {
    question: "Interested in Spline for Education?",
    answer:
      "We offer special plans for students and educators. Apply through our Education program page and get access to premium features at no cost or a significantly reduced rate.",
    sort_order: 8,
  },
];

/* ── Testimonials — from Testimonial(3D).jsx `DATA` ──────────────────────── */

const testimonials = [
  { youtube_id: "fcx0LV7C2pE", sort_order: 1 },
  { youtube_id: "DxA4B7bJpRk", sort_order: 2 },
  { youtube_id: "AYSdZFo1Yxw", sort_order: 3 },
  { youtube_id: "1xkuNlpQhvc", sort_order: 4 },
  { youtube_id: "d8ul6Akvu7o", sort_order: 5 },
  { youtube_id: "TJfRcYy5y1M", sort_order: 6 },
];

/* ── Blogs — from Blogs.jsx `posts` ──────────────────────────────────────── */
/* The live site renders every card with the same date/author/category.       */

const blogChecklist = [
  "Make ridges when planting crops on your farm of flat land.",
  "Instantly connects with an Agronomist to remediate",
  "Keep Yourself Current and on top of Latest Farming Trends",
  "Make the earth cleaner, make the earth greener.",
];

const blogTitles = [
  "Better Agriculture for Better Future",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
  "A farmer is a person who works in agriculture.",
];

/* The pair of images the article page shows under the body copy. */
const blogGallery = [IMG("Blog_Banner_2.jpeg"), IMG("Blog_Banner_2.jpeg")];

const blogs = blogTitles.map((title, i) => ({
  title,
  // Duplicate titles in the source would collide on slug; the seeder's
  // uniqueSlug helper appends -2, -3 … automatically.
  //
  // The takeaways block — heading, paragraph and ticked list — is seeded on the
  // first post only, matching the article page the design was drawn from. The
  // rest leave all three blank, which hides the section.
  //
  // The banner wording, the pull-quote and the gallery are seeded on that
  // first post too. Leaving them blank elsewhere is what the site already
  // does: the banner then falls back to the Content block, and the quote
  // card and gallery simply are not drawn.
  hero_title: i === 0 ? "Blog Details" : "",
  hero_subtitle: "",
  sub_heading: i === 0 ? "Everything on our farm is grown" : "",
  second_description:
    i === 0
      ? "They offer adaptability, high nutritional value, and can yield higher yields with minimal agronomic inputs, and provide significant potential for sustainable agriculture and provide nutritional and income security for small and marginal farmers in dry and rainfed semi-arid regions."
      : "",
  content:
    "<p>Grow Farms brings you verified, plotted agricultural land near Pali, Maharashtra. Every plot is documented, fenced and serviced with water, electricity and road access.</p><p>Our team walks you through site selection, a guided visit, full legal verification and registration — so owning farmland is as straightforward as it should be.</p>",
  featured_image: IMG("Blog_Banner_2.jpeg"),
  banner_image: IMG("blog_details.png"),
  category_slug: "mixed-farming",
  author_name: "Admin",
  published_at: "2024-03-28 10:00:00",
  status: "published",
  is_featured: i === 0,
  sort_order: i + 1,
  checklist: i === 0 ? blogChecklist : [],
  quote_text:
    i === 0
      ? "When you listen to yourself, everything come naturally. It come from in, like a kind of will to do something. Try to be sensitive. That is just a few clicks away."
      : "",
  quote_author: i === 0 ? "Satisfied Client" : "",
  gallery: i === 0 ? blogGallery : [],
  // No per-post steps: every article keeps falling back to the shared
  // scope: "blog" buying steps above until an admin overrides them.
  steps: [],
}));

/* ── Website content ─────────────────────────────────────────────────────── */

const websiteContent = [
  /* Home — HomeBanner.jsx TEXT_STAGES */
  {
    page: "home",
    section_key: "hero_stage_1",
    label: "Hero — scroll stage 1",
    title: "Own a Piece of\nNature, Not Just Land.",
    subtitle:
      "Premium farmhouse plots designed for peaceful living, smart investment, and future generations.",
    sort_order: 1,
  },
  {
    page: "home",
    section_key: "hero_stage_2",
    label: "Hero — scroll stage 2",
    title: "Where Serenity Meets\nSmart Investment.",
    subtitle:
      "Curated land that appreciates over time while giving you a sanctuary away from city chaos.",
    sort_order: 2,
  },
  {
    page: "home",
    section_key: "hero_stage_3",
    label: "Hero — scroll stage 3",
    title: "Build Memories That\nOutlast Generations.",
    subtitle:
      "Lush greenery, clean air, and space to breathe — right at your doorstep, near Mumbai.",
    sort_order: 3,
  },
  /* Home — AerialMapSection.jsx background */
  {
    page: "home",
    section_key: "aerial_map",
    label: "Aerial map — background image",
    // Used as the image's alt text; the section draws no heading of its own.
    title: "Aerial farmland view",
    image: IMG("home_banner_2.jpg"),
    sort_order: 4,
  },
  /* Home — TestimonialSection.jsx */
  {
    page: "home",
    section_key: "testimonial_heading",
    label: "Testimonial section heading",
    title: "Testimonial",
    subtitle: "A place that grows in value while giving peace today.",
    link_label: "View All",
    link_url: "/testimonials",
    sort_order: 5,
  },

  /* About — About.jsx hero */
  {
    page: "about",
    section_key: "hero",
    label: "About hero",
    title: "Where Nature Meets Smart Investment",
    subtitle: "About GrowFarms",
    body:
      "We help you own premium farmland with complete transparency, expert guidance, and long-term value.",
    image: IMG("About_Banner.png"),
    sort_order: 1,
  },
  /* About — TrustSection.jsx */
  {
    page: "about",
    section_key: "trust_section",
    label: "15 Years of Cultivating Trust",
    title: "15 Years of Cultivating Trust",
    // The gold pill above the heading.
    subtitle: "Our Legacy",
    body:
      "Grow Farms has a strong foothold in the market, with 15 years of experience. We guarantee reliable delivery of agricultural land, merging the grit of traditional farming with the precision of modern financial management.",
    image: IMG("trust_img.jpg"),
    // The two animated counters and the pull-quote beneath them.
    extra_data: {
      stats: [
        { value: 15, suffix: "+", label: "Years Experience" },
        { value: 7, suffix: "-8", label: "Avg. Team Tenure" },
      ],
      quote:
        "Our commitment extends beyond transactions; we prioritize environmental and health considerations in every acre we manage.",
      // The white card floating over the photograph.
      card_title: "Certified Stability",
      card_text: "We understand your dream of a second home surrounded by nature.",
    },
    sort_order: 2,
  },
  {
    page: "about",
    section_key: "philosophy_heading",
    label: "Core Philosophy heading",
    title: "Core Philosophy",
    sort_order: 3,
  },

  /* Details — Aboutsarasview.jsx */
  {
    page: "details",
    section_key: "about_project",
    label: "About the project",
    title: "About Sarasview",
    body:
      "Sarasview by Grow Farms is a sprawling 140-acre residential farmland development located in the peaceful surroundings of Aptavane Village, just 2 km away from the historic Pali city in Maharashtra. This project provides an ideal opportunity for nature lovers and investors alike to own a piece of pristine land. It offers scenic river-touch plots, making it a perfect retreat for those who seek tranquility, yet desire modern conveniences.",
    image: IMG("About_Img_1.png"),
    sort_order: 1,
  },
  {
    page: "details",
    section_key: "facilities_heading",
    label: "Local Facilities heading",
    title: "Local Facilities",
    sort_order: 2,
  },
  {
    page: "details",
    section_key: "invest_in_pali",
    label: "Why should invest in Pali",
    title: "Why should invest in Pali",
    image: IMG("newlandscapeimg.png"),
    sort_order: 3,
  },
  {
    page: "details",
    section_key: "amenities_heading",
    label: "Amenities heading",
    title: "Amenities",
    sort_order: 4,
  },
  {
    page: "details",
    section_key: "packages_heading",
    label: "Land Packages heading",
    title: "Land Packages",
    subtitle: "Offerings",
    sort_order: 5,
  },
  {
    page: "details",
    section_key: "why_pali_heading",
    label: "Why Pali heading",
    title: "Why Pali?",
    sort_order: 6,
  },

  /* Blogs — the two page-wide labels on BlogDetails.jsx */
  {
    page: "blogs",
    section_key: "detail_hero",
    label: "Article hero",
    // What sits over the banner when a post names no hero wording of its own.
    // Blank here too and the banner falls through to the post's title.
    title: "Blog Details",
    link_label: "All blogs",
    sort_order: 1,
  },
  {
    page: "blogs",
    section_key: "detail_related",
    label: "Other Blog heading",
    title: "Other Blog",
    sort_order: 2,
  },

  /* Contact — Contact.jsx infoCards + map */
  {
    page: "contact",
    section_key: "hero",
    label: "Contact hero",
    title: "Contact Us",
    image: IMG("Contact_banner.png"),
    sort_order: 1,
  },
  {
    page: "contact",
    section_key: "info_cards",
    label: "Contact info cards",
    // Placeholder values still live on the site — edit in Admin → Contact Page.
    // `link` is what the card's arrow bubble opens; left blank the site derives
    // one from the card's own lines (mailto:, tel:) or the map link setting.
    extra_data: {
      cards: [
        {
          icon: "mail",
          title: "Mail us 24/7",
          lines: ["pbminfo@admin.com", "pbmadmin@info.com"],
          link: "",
        },
        {
          icon: "phone",
          title: "Call us 24/7",
          lines: ["Phone : (+55) 654 - 545 - 5418", "Mobile : (+01) 654 - 545 - 1235"],
          link: "",
        },
        {
          icon: "map",
          title: "Our Locations",
          lines: ["4821 Ride Top, Anch St, Alaska", "997998, USA main city."],
          link: "",
        },
      ],
    },
    sort_order: 2,
  },

  /* Global — FooterSection.jsx */
  {
    page: "global",
    section_key: "footer",
    label: "Footer",
    title: "GROW FARMS",
    body:
      "Grow Farms 305, The Landmark, Next to Hotel Three Star, Sector 7, Kharghar, Navi Mumbai, Maharashtra 410210",
    extra_data: {
      navigation: [
        { label: "Home", url: "/" },
        { label: "About us", url: "/about" },
        { label: "Testimonials", url: "/testimonials" },
        { label: "Blog", url: "/blogs" },
      ],
      projects: [
        { label: "Sky Breeze", url: "/details/skybreez" },
        { label: "Sarasview", url: "/details/sarasview" },
      ],
      copyright: "©2026 Grow Farms. All rights reserved.",
    },
    sort_order: 1,
  },
  {
    page: "global",
    section_key: "navigation",
    label: "Main navigation",
    extra_data: {
      items: [
        { name: "Home", path: "/" },
        { name: "About Us", path: "/about" },
        { name: "Blogs", path: "/blogs" },
        { name: "Contact Us", path: "/contact" },
      ],
    },
    sort_order: 2,
  },
];

/* ── Settings ────────────────────────────────────────────────────────────── */

const settings = [
  { key: "site_name", value: "Grow Farms", label: "Site name", group: "general", sort_order: 1 },
  {
    key: "site_tagline",
    value: "Own a Piece of Nature, Not Just Land.",
    label: "Tagline",
    group: "general",
    sort_order: 2,
  },
  {
    key: "site_logo",
    value: IMG("grow-farms-logo.png"),
    label: "Logo",
    group: "media",
    type: "image",
    sort_order: 1,
  },
  {
    key: "site_favicon",
    value: IMG("logo_1.png"),
    label: "Favicon",
    group: "media",
    type: "image",
    sort_order: 2,
  },

  // Placeholder contact values carried over from Contact.jsx.
  { key: "contact_email_1", value: "pbminfo@admin.com", label: "Primary email", group: "contact", type: "email", sort_order: 1 },
  { key: "contact_email_2", value: "pbmadmin@info.com", label: "Secondary email", group: "contact", type: "email", sort_order: 2 },
  { key: "contact_phone_1", value: "(+55) 654 - 545 - 5418", label: "Phone", group: "contact", sort_order: 3 },
  { key: "contact_phone_2", value: "(+01) 654 - 545 - 1235", label: "Mobile", group: "contact", sort_order: 4 },
  {
    key: "contact_address",
    value:
      "Grow Farms 305, The Landmark, Next to Hotel Three Star, Sector 7, Kharghar, Navi Mumbai, Maharashtra 410210",
    label: "Office address",
    group: "contact",
    type: "textarea",
    sort_order: 5,
  },
  {
    key: "google_map_embed",
    value: "https://www.google.com/maps?q=Mumbai,Maharashtra,India&output=embed",
    label: "Google Maps embed URL",
    group: "contact",
    type: "url",
    sort_order: 6,
  },
  {
    key: "google_map_link",
    value: "https://www.google.com/maps?q=Mumbai,Maharashtra,India",
    label: "Google Maps link (opens in a new tab)",
    group: "contact",
    type: "url",
    sort_order: 7,
  },

  { key: "meta_title", value: "Grow Farm", label: "Default meta title", group: "seo", sort_order: 1 },
  {
    key: "meta_description",
    value:
      "Premium farmhouse plots near Pali, Maharashtra — designed for peaceful living, smart investment, and future generations.",
    label: "Default meta description",
    group: "seo",
    type: "textarea",
    sort_order: 2,
  },
  {
    key: "copyright_text",
    value: "©2026 Grow Farms. All rights reserved.",
    label: "Copyright line",
    group: "general",
    sort_order: 3,
  },
];

module.exports = {
  categories,
  projects,
  packages,
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
  blogs,
  websiteContent,
  settings,
};
