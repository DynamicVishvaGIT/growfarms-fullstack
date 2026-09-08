"use strict";

/**
 * Move the existing hard-coded frontend data into MySQL.
 *
 *   node src/scripts/seed.js            → insert anything missing (idempotent)
 *   node src/scripts/seed.js --fresh    → wipe the content tables first
 *
 * Rows are matched on their natural key (slug / name / setting key), so
 * re-running never duplicates and never overwrites an admin's edits.
 */

const env = require("../config/env");
const db = require("../models");
const { uniqueSlug } = require("../services/slugService");
const data = require("./seedData");

const fresh = process.argv.includes("--fresh");

let created = 0;
let skipped = 0;

const log = (label, didCreate) => {
  if (didCreate) created += 1;
  else skipped += 1;
  process.stdout.write(didCreate ? "." : "-");
};

/** findOrCreate on a natural key, reporting which happened. */
async function ensure(Model, where, values) {
  const [row, wasCreated] = await Model.findOrCreate({ where, defaults: { ...where, ...values } });
  log(Model.name, wasCreated);
  return row;
}

async function seedAdmin() {
  console.log("\n[seed] admin account");
  const { Admin } = db;
  const email = env.seedAdmin.email.toLowerCase();

  const existing = await Admin.findOne({ where: { email } });
  if (existing) {
    console.log(`       admin already exists: ${email}`);
    return;
  }

  const admin = Admin.build({
    name: env.seedAdmin.name,
    email,
    role: "super_admin",
    is_active: true,
  });
  await admin.setPassword(env.seedAdmin.password);
  await admin.save();

  console.log(`       created ${email}`);
  console.log(`       password: ${env.seedAdmin.password}  ← change this after first login`);
}

async function seedCategories() {
  console.log("\n[seed] categories");
  const map = {};
  for (const c of data.categories) {
    const row = await ensure(db.Category, { slug: c.slug }, c);
    map[c.slug] = row.id;
  }
  return map;
}

async function seedProjects(categoryMap) {
  console.log("\n[seed] projects");
  const map = {};

  for (const p of data.projects) {
    const { category_slug: catSlug, ...rest } = p;
    const row = await ensure(db.Project, { slug: p.slug }, {
      ...rest,
      category_id: categoryMap[catSlug] || null,
    });
    map[p.slug] = row.id;

    // Every project gets its hero image as the first gallery entry so the
    // admin's image manager has something to show immediately.
    if (p.hero_image) {
      const count = await db.ProjectImage.count({ where: { project_id: row.id } });
      if (count === 0) {
        await db.ProjectImage.create({
          project_id: row.id,
          image_path: p.hero_image,
          alt_text: p.title,
          is_primary: true,
          sort_order: 0,
        });
      }
    }
  }
  return map;
}

async function seedPackages(projectMap, categoryMap) {
  console.log("\n[seed] packages");

  for (const p of data.packages) {
    const { project_slug: projSlug, category_slug: catSlug, images, tags, ...rest } = p;

    const [row, wasCreated] = await db.Package.findOrCreate({
      where: { slug: p.slug },
      defaults: {
        ...rest,
        slug: p.slug,
        project_id: projectMap[projSlug] || null,
        category_id: categoryMap[catSlug] || null,
      },
    });
    log("Package", wasCreated);

    if (!wasCreated) continue;

    if (images && images.length) {
      await db.PackageImage.bulkCreate(
        images.map((src, i) => ({
          package_id: row.id,
          image_path: src,
          alt_text: p.title,
          is_primary: i === 0,
          sort_order: i,
        })),
      );
    }

    if (tags && tags.length) {
      await db.PackageTag.bulkCreate(
        tags.map((t, i) => ({ ...t, package_id: row.id, sort_order: i })),
      );
    }
  }
}

async function seedAmenities(projectMap) {
  console.log("\n[seed] amenities");
  const ids = [];
  for (const a of data.amenities) {
    const row = await ensure(db.Amenity, { name: a.name }, a);
    ids.push(row.id);
  }

  // Attach the full amenity set to every project — the live site shows the
  // same eight on each detail page.
  for (const projectId of Object.values(projectMap)) {
    const existing = await db.ProjectAmenity.count({ where: { project_id: projectId } });
    if (existing > 0) continue;
    await db.ProjectAmenity.bulkCreate(
      ids.map((amenity_id, i) => ({ project_id: projectId, amenity_id, sort_order: i })),
    );
  }
}

async function seedProjectSubContent(projectMap) {
  const sarasview = projectMap.sarasview || null;

  console.log("\n[seed] facilities");
  for (const f of data.facilities) {
    await ensure(db.Facility, { name: f.name, project_id: sarasview }, { ...f, project_id: sarasview });
  }

  console.log("\n[seed] travel routes");
  for (const r of data.travelRoutes) {
    await ensure(db.TravelRoute, { label: r.label, project_id: sarasview }, { ...r, project_id: sarasview });
  }

  console.log("\n[seed] why-choose cards");
  for (const c of data.whyChooseCards) {
    await ensure(db.WhyChooseCard, { title: c.title, project_id: sarasview }, { ...c, project_id: sarasview });
  }

  console.log("\n[seed] faqs");
  for (const f of data.faqs) {
    await ensure(db.Faq, { question: f.question }, f);
  }
}

async function seedSimpleLists() {
  console.log("\n[seed] buying steps");
  for (const s of data.buyingSteps) {
    await ensure(db.BuyingStep, { scope: s.scope, step_number: s.step_number }, s);
  }

  console.log("\n[seed] why-pali slides");
  for (const s of data.whyPaliSlides) {
    await ensure(db.WhyPaliSlide, { title: s.title, sort_order: s.sort_order }, s);
  }

  console.log("\n[seed] philosophy cards");
  for (const c of data.philosophyCards) {
    await ensure(db.PhilosophyCard, { title: c.title }, c);
  }

  console.log("\n[seed] testimonials");
  for (const t of data.testimonials) {
    await ensure(db.Testimonial, { youtube_id: t.youtube_id }, t);
  }

  console.log("\n[seed] social links");
  for (const l of data.socialLinks) {
    await ensure(db.SocialLink, { platform: l.platform }, l);
  }
}

async function seedBlogs(categoryMap) {
  console.log("\n[seed] blogs");

  for (const b of data.blogs) {
    const { category_slug: catSlug, checklist, gallery, steps, ...rest } = b;

    // Several source posts share a title, so the slug is made unique here.
    const slug = await uniqueSlug(db.Blog, b.title);

    const existing = await db.Blog.findOne({ where: { title: b.title, sort_order: b.sort_order } });
    if (existing) {
      log("Blog", false);
      continue;
    }

    const row = await db.Blog.create({
      ...rest,
      slug,
      category_id: categoryMap[catSlug] || null,
    });
    log("Blog", true);

    if (checklist && checklist.length) {
      await db.BlogChecklist.bulkCreate(
        checklist.map((item_text, i) => ({ blog_id: row.id, item_text, sort_order: i })),
      );
    }

    if (gallery && gallery.length) {
      await db.BlogImage.bulkCreate(
        gallery.map((image_path, i) => ({
          blog_id: row.id,
          image_path,
          alt_text: b.title,
          sort_order: i,
        })),
      );
    }

    if (steps && steps.length) {
      await db.BlogStep.bulkCreate(
        steps.map((st, i) => ({ blog_id: row.id, sort_order: i, ...st })),
      );
    }
  }
}

async function seedContent() {
  console.log("\n[seed] website content");
  for (const c of data.websiteContent) {
    await ensure(db.WebsiteContent, { page: c.page, section_key: c.section_key }, c);
  }
}

async function seedSettings() {
  console.log("\n[seed] settings");
  for (const s of data.settings) {
    await ensure(db.Setting, { key: s.key }, { type: "text", group: "general", ...s });
  }
}

/** Truncate every content table, leaving admins and enquiries untouched. */
async function wipe() {
  console.log("[seed] --fresh: clearing content tables (admins and enquiries are kept)");
  const order = [
    db.PackageTag, db.PackageImage, db.Package,
    db.ProjectImage, db.ProjectAmenity,
    db.Facility, db.TravelRoute, db.WhyChooseCard, db.Faq,
    db.BlogChecklist, db.BlogImage, db.BlogStep, db.BlogRelated, db.Blog,
    db.BuyingStep, db.WhyPaliSlide, db.PhilosophyCard, db.Testimonial, db.SocialLink,
    db.Amenity, db.WebsiteContent, db.Setting,
    db.Project, db.Category,
  ];

  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const Model of order) {
    await Model.destroy({ where: {}, truncate: true, force: true });
  }
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
}

async function run() {
  await db.sequelize.authenticate();
  console.log(`[seed] connected to ${env.db.name}`);

  if (fresh) {
    if (env.isProduction) {
      console.error("[seed] --fresh is refused in production. Aborting.");
      process.exit(1);
    }
    await wipe();
  }

  await seedAdmin();

  const categoryMap = await seedCategories();
  const projectMap = await seedProjects(categoryMap);

  await seedPackages(projectMap, categoryMap);
  await seedAmenities(projectMap);
  await seedProjectSubContent(projectMap);
  await seedSimpleLists();
  await seedBlogs(categoryMap);
  await seedContent();
  await seedSettings();

  console.log(`\n\n[seed] done — ${created} rows created, ${skipped} already present.`);
  console.log(`[seed] images were read from ${env.upload.dir}/seed/ (copies of src/assets/images).`);

  await db.sequelize.close();
}

run().catch((err) => {
  console.error("\n[seed] failed:", err.message);
  if (err.original) console.error("       ", err.original.sqlMessage || err.original.message);
  process.exit(1);
});
