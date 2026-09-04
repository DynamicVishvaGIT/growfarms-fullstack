# Grow Farms — Backend, Admin Panel & Frontend Integration

Three apps in one repository:

| Folder | What it is | Dev port |
|---|---|---|
| `/` (root: `src/`, `public/`) | The existing Grow Farms React website — **design untouched** | 5173 |
| `backend/` | Node.js + Express + MySQL REST API | 5000 |
| `admin/` | React admin panel | 5174 |

> **Note on structure.** The task described moving the website into a `frontend/`
> folder. The move was blocked by a OneDrive/editor file lock on `src/`, and
> forcing it risked a half-copied project, so the website stays at the repo root
> and `backend/` + `admin/` sit alongside it. Nothing else is affected — if you
> want the `frontend/` layout later, close your editor, exit OneDrive, then run
> `git mv src public index.html package.json package-lock.json vite.config.js
> eslint.config.js .htaccess README.md frontend/` and move `node_modules`/`dist`
> across too.

---

## 1. MySQL setup

You need MySQL 8.0+ running. Create the database and a dedicated user:

```sql
CREATE DATABASE growfarms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'growfarms'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON growfarms.* TO 'growfarms'@'localhost';
FLUSH PRIVILEGES;
```

You do **not** need to run any `.sql` file by hand — `npm run db:migrate`
creates every table from the models. The checked-in SQL files are there for
DBAs and for cPanel/phpMyAdmin imports:

- `backend/database/schema.sql` — all 22 tables, indexes and foreign keys
- `backend/database/seed.sql` — every row extracted from the existing frontend

Both are **generated**, never hand-edited. After changing a model, re-run:

```bash
cd backend
node src/scripts/generateSql.js
```

### The 22 tables

```
admins              categories          projects            project_images
packages            package_images      package_tags        amenities
project_amenities   facilities          travel_routes       buying_steps
why_pali_slides     why_choose_cards    philosophy_cards    faqs
testimonials        blogs               blog_checklist      enquiries
website_content     settings
```

**Why this shape.** Your properties are two levels deep, exactly as the site
already renders them:

- **`projects`** — the four pins on the aerial map (Skybreez, Sarasview,
  Xyzview, Syview 2). Carries `map_pin_top` / `map_pin_left`, the percentage
  coordinates the map component uses to place each pin.
- **`packages`** — the purchasable plots inside a project ("Farm Land"
  ₹5.99 Lakh, "Farmland With 2BHK Bungalow" ₹15.98 Lakh).

Layout values that drive existing animations live in the DB too
(`card_rotate`, `button_variant`, `accent_color`, `pos_top`/`pos_left`), so the
admin can add a card without a developer and the design stays byte-identical.

Both public forms write to one **`enquiries`** table with a `source` column, so
the admin has a single inbox.

---

## 2. `.env` configuration

### `backend/.env`

Copy `backend/.env.example` and fill it in:

```ini
NODE_ENV=development
PORT=5000
API_PREFIX=/api
PUBLIC_URL=http://localhost:5000        # origin only, no /api - see note below

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=growfarms
DB_USER=growfarms
DB_PASSWORD=a-strong-password
DB_LOGGING=false

JWT_SECRET=<48+ random bytes>
JWT_EXPIRES_IN=7d

CORS_ORIGINS=http://localhost:5173,http://localhost:5174

UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=5

SEED_ADMIN_NAME=Grow Farms Admin
SEED_ADMIN_EMAIL=admin@growfarms.com
SEED_ADMIN_PASSWORD=Admin@12345

RATE_LIMIT_WINDOW_MIN=15
RATE_LIMIT_MAX=300
LOGIN_RATE_LIMIT_MAX=10
ENQUIRY_RATE_LIMIT_MAX=20
```

Generate a real JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The server refuses to start in production if `JWT_SECRET` is under 32 characters.

`PUBLIC_URL` is the origin the browser reaches the API on, **without** `/api`.
Image URLs are built as `PUBLIC_URL` + `API_PREFIX` + `/uploads/…`, so a seed
image comes back as `http://localhost:5000/api/uploads/seed/x.jpg`. Uploads are
served at `/uploads` **and** `/api/uploads`; the prefixed one is what production
uses, because the host routes only `/api/*` to Node — see §9.

### `admin/.env`

```ini
VITE_API_URL=http://localhost:5000/api
VITE_SITE_URL=http://localhost:5173     # the panel's "View site" link
```

### `.env` (website, repo root)

```ini
VITE_API_URL=http://localhost:5000/api
```

> Vite only exposes variables prefixed `VITE_`, and it **inlines them at build
> time** — after changing either `.env`, restart the dev server or rebuild.

**These two files are for development only.** Production values live in
`.env.production` and `admin/.env.production`, which are committed and which
Vite loads for `npm run build` in preference to `.env`. That split exists
because the two files are easy to confuse and the failure is silent: a build
that picks up the dev value ships a bundle telling every visitor's browser to
call `http://localhost:5000`, which fails for everyone except the developer who
built it. Leave the localhost values in `.env` and never put a production URL
there.

---

## 3. Running the backend

```bash
cd backend
npm install
npm run db:migrate      # create all tables
npm run db:seed         # load the existing website data + create the admin
npm run dev             # http://localhost:5000
```

`db:seed` is **idempotent** — re-running it never duplicates rows and never
overwrites edits made in the admin panel. It matches on natural keys (slug,
name, setting key).

| Script | What it does |
|---|---|
| `npm run dev` | nodemon, auto-restarts |
| `npm start` | production |
| `npm run db:migrate` | create/alter tables |
| `npm run db:migrate -- --force` | **drops and recreates everything** (refused when `NODE_ENV=production`) |
| `npm run db:seed` | insert missing seed rows |
| `npm run db:seed -- --fresh` | wipe content tables first (keeps admins and enquiries) |
| `npm run db:reset` | force migrate + seed |
| `npm run test:routes` | route smoke test — no database needed |

**First login:** `admin@growfarms.com` / `Admin@12345` — change it immediately
under *My Profile → Change password*.

### Where the seeded images come from

`src/assets/images/` was **copied** (not moved) into `backend/uploads/seed/`.
The originals are untouched, and `backend/uploads/seed/` is protected — the
delete helper refuses to remove anything under it, so an admin edit can never
destroy the images the original design depends on.

New uploads land in `backend/uploads/{projects,packages,blogs,amenities,facilities,misc}/`
with collision-proof filenames.

---

## 4. Running the admin panel

```bash
cd admin
npm install
npm run dev             # http://localhost:5174/admin
```

`base: "/admin/"` applies to the dev server too, so the panel lives under
`/admin` locally as well — matching production exactly. Opening
`http://localhost:5174` redirects there.

Sections: Dashboard · Projects · **Project Content** · Land Packages ·
Categories · Amenities ·
Local Facilities · How to Reach · Enquiries · Blogs · Website Content · FAQs ·
Testimonials · Why Pali Slides · Why Choose Cards · Buying Steps ·
Core Philosophy · Settings · My Profile.

The dashboard shows total properties, active properties, categories, total
enquiries and new enquiries, plus packages, blogs, testimonials, a 14-day
enquiry trend and the most recent leads.

---

## 5. Connecting the frontend

Already done. The integration follows one rule:

> **The site must render exactly as it does today even when the backend is
> unreachable.**

Every component keeps its original hard-coded array, renamed `FALLBACK_*`, and
reads live data through `useApiData(fetcher, fallback)`. Reads never throw — a
failed request resolves to `null` and the fallback stays on screen. An empty
API response is also ignored, so an unseeded database can't blank a section.

**Wired sections**

| Section | Source |
|---|---|
| Aerial map pins | `GET /api/projects/map` |
| Project detail page | `GET /api/projects/:slug` (or `/featured`) |
| Land packages | `GET /api/packages` |
| Amenities, Local facilities | project payload / `GET /api/amenities` |
| FAQs, Testimonials | project payload / `GET /api/faqs`, `/api/testimonials` |
| Why Pali, Why Choose, Core Philosophy | their CMS endpoints |
| Buying steps | project payload / `GET /api/buying-steps?scope=details` |
| About, Why Invest in Pali | project payload (`about_*`, `invest_*`) |
| Blogs + blog detail | `GET /api/blogs`, `GET /api/blogs/:slug` |
| Hero scroll copy | `GET /api/content?page=home` |
| Footer, nav, contact cards, map embed | `/api/content`, `/api/settings` |

**Routing.** `/details` still works and shows the featured project;
`/details/:slug` gives each project its own page. Same for
`/blog-details/:slug`. No component, class or animation was restyled.

Where a layout has a fixed shape — the three-stage hero, the three Why-Choose
slots, the four-card buying-steps curve — the count stays fixed and only the
copy and images are swapped, so the GSAP timelines are unaffected. The 3D
testimonial ring is the exception: its geometry is now derived from the live
list length, and with the original six videos it computes identical numbers.

### Per-project sections

Every section of the project page belongs to one project. Two mechanisms carry
that, and which one a section uses depends on its shape:

| Section (page order) | Per-project via | Falls back to |
|---|---|---|
| Banner | `projects.hero_image` | bundled `Details_Banner.jpg` |
| About | `projects.about_title` / `about_body` / `about_image` | the designed copy |
| Why Choose Us | `why_choose_cards.project_id` | the shared cards |
| Local Facilities | `facilities.project_id` | the bundled five icons |
| Why Invest in Pali | `projects.invest_title` / `invest_body` / `invest_image` | the designed copy |
| Amenities | `project_amenities` (many-to-many) | the full active list |
| Land Packages | `packages.project_id` | the designed three |
| How to Buy | `buying_steps.project_id` | the shared steps |
| Testimonials | `testimonials.project_id` | the shared reel |
| FAQs | `faqs.project_id` | the shared accordion |

`project_id` is nullable throughout and reads as **"NULL means shared"**. A row
with a project belongs to that project alone; a row without one is the default
every project inherits until it defines its own. The public list endpoints
enforce that split — `GET /api/faqs` returns only the shared rows, so one
project's content can never surface on the home page or on a sibling project,
and `?project_id=` asks for one project's own.

Amenities are the deliberate exception: they stay a shared catalogue that each
project ticks its way through, so a single icon and wording stay consistent
across the site instead of being retyped per project.

Everything above is edited in one place — **Project Content** in the admin
panel. Pick a project at the top and the tabs run in the same order as the
page, each locked to that project.

---

## 6. Enquiry forms

Both forms POST to `/api/enquiries`:

- **Contact page** → `source: "contact_page"`, sends `first_name` / `last_name`
- **Property modal** → `source: "enquiry_modal"`, sends `name` plus the project

Server-side validation in `backend/src/validators/index.js` mirrors
`src/lib/validation.js` rule for rule, so the client and server always agree —
and a client that skips validation entirely still hits the same wall.

The admin sees name, email, phone, message, related property, date and status
(**New → Read → Contacted → Closed**), with internal notes and CSV export.
Opening a new enquiry marks it read.

---

## 7. API reference

Public (no auth):

```
GET    /api/health
POST   /api/enquiries                  ← the only public write
GET    /api/projects                   GET /api/projects/:idOrSlug
GET    /api/projects/map               GET /api/projects/featured
GET    /api/packages                   GET /api/packages/:idOrSlug
GET    /api/categories                 GET /api/blogs        GET /api/blogs/:idOrSlug
GET    /api/content                    GET /api/settings
GET    /api/faqs  /amenities  /facilities  /travel-routes
       /buying-steps  /why-pali-slides  /why-choose-cards
       /philosophy-cards  /testimonials
```

Admin (JWT required):

```
POST   /api/auth/login                 GET  /api/auth/me
PUT    /api/auth/profile               PUT  /api/auth/password

GET    /api/dashboard/stats            /recent-enquiries   /enquiry-trend

POST   /api/projects                   PUT /api/projects/:id    DELETE /api/projects/:id
POST   /api/projects/:id/images        DELETE /api/projects/:id/images/:imageId
PUT    /api/projects/:id/images/:imageId/primary

POST   /api/packages                   PUT /api/packages/:id    DELETE /api/packages/:id
POST   /api/categories                 PUT /api/categories/:id  DELETE /api/categories/:id
POST   /api/blogs                      PUT /api/blogs/:id       DELETE /api/blogs/:id

GET    /api/enquiries                  GET /api/enquiries/:id
PUT    /api/enquiries/:id              DELETE /api/enquiries/:id
GET    /api/enquiries/export           ← CSV

POST   /api/content                    PUT /api/content/:id     PUT /api/content/bulk
PUT    /api/settings                   PUT /api/settings/:key
```

Every CMS list also has `GET /:resource/all`, `POST`, `PUT /:id`,
`DELETE /:id` and `PUT /:resource/reorder`.

**Response shape**

```jsonc
{ "success": true, "data": … , "meta": { "total": 42, "page": 1, … } }
{ "success": false, "message": "…", "errors": { "email": "…" } }
```

---

## 8. Security

- **bcrypt** password hashing, cost 12; hashes never leave the model's default scope
- **JWT** bearer tokens; the admin row is re-read on every request, so
  deactivating an account takes effect immediately rather than at token expiry
- **Role-based access** — deletes require `super_admin` or `admin`
- **Parameterised queries everywhere** via Sequelize; no string-built SQL
- **Whitelisted writes** — controllers copy only known fields, never `...req.body`
- **Validation** on every write with `express-validator`
- **Upload safety** — MIME *and* extension checked, 5 MB cap, UUID-style
  filenames, fixed destination folders, `X-Content-Type-Options: nosniff`, and a
  restrictive CSP on SVGs
- **Rate limiting** — global, plus tighter limits on login and enquiries
- **CORS** restricted to configured origins
- **Helmet** security headers, `x-powered-by` removed
- **Failed requests clean up** any files multer already wrote
- **Login is non-enumerable** — same message and work whether or not the email exists
- **CSV export** prefixes formula characters to prevent spreadsheet injection

---

## 9. Deployment

### How the live site is wired

Everything is served from one domain, `https://growfarm-fullstack.dvworks.in`:

| Path | Served by |
|---|---|
| `/` | the website build (`dist/`) |
| `/admin` | the panel build (`admin/dist/`) |
| `/api/*` | proxied to the Node process |
| `/api/uploads/*` | the same Node process, serving `backend/uploads/` |

One domain is why both front ends build with a **relative** `VITE_API_URL=/api`:
the same bundle is correct on any domain, and no browser request is ever
cross-origin, so CORS cannot break the site.

The one thing to know: **`/uploads` on its own is not routed to Node.** A bare
`/uploads/x.jpg` reaches the static site, misses, and comes back as `200` with
the SPA's `index.html` — so an `<img>` renders broken rather than 404ing. That
is why image URLs are built under the API prefix instead. If you would rather
serve them directly, add the proxy rule (nginx `location /uploads { proxy_pass
http://127.0.0.1:5000; }`) — the `/uploads` mount is still there and both paths
serve the same folder.

### Backend (VPS with nginx)

```bash
git clone <repo> && cd backend
npm ci --omit=dev
cp .env.production.example .env   # then fill in the two CHANGE ME values
npm run db:migrate
npm run db:seed
npm i -g pm2 && pm2 start src/server.js --name growfarms-api && pm2 save
```

The live deployment puts the API on the site's own domain under `/api` (see the
`location /api` block further down). The block below is the **alternative**
layout — the API on a subdomain of its own — kept for reference. On that layout
`PUBLIC_URL` becomes `https://api.growfarms.com` and `CORS_ORIGINS` has to list
the website's domain, because requests then really are cross-origin.

```nginx
server {
    server_name api.growfarms.com;
    client_max_body_size 10M;          # must exceed MAX_UPLOAD_SIZE_MB

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then `certbot --nginx -d api.growfarms.com`. The app sets `trust proxy` in
production so rate limiting sees real client IPs.

### Backend (cPanel / shared hosting)

Create a Node.js app (entry `backend/src/server.js`), add the env vars in the
panel, import `database/schema.sql` then `database/seed.sql` via phpMyAdmin,
and upload `backend/uploads/` with write permission.

### Frontend and admin

Both are static builds, and Vite bakes the API URL **into the bundle** — changing
it later means rebuilding, not re-uploading a `.env`. The production values are
already committed in `.env.production` and `admin/.env.production`, which Vite
loads for `npm run build` ahead of `.env`, so the correct build is just:

```bash
# website  → dist/
npm run build

# admin    → admin/dist/
cd admin && npm run build
```

Confirm before uploading — this catches the failure that is otherwise invisible
until the site is live:

```bash
grep -o 'localhost:50*[0-9]*' dist/assets/*.js admin/dist/assets/*.js   # must print nothing
```

(Grepping for bare `localhost` gives a false positive — react-router carries one
internally as a placeholder origin. The port is what tells you a dev API URL got
baked in.)

The admin panel ships **inside the public site at `/admin`**, not on a
subdomain. Three things make that work, and all three are already in the repo:

| File | What it does |
|---|---|
| `admin/vite.config.js` | `base: "/admin/"` — asset URLs become `/admin/assets/…` |
| `admin/src/main.jsx` | `basename` read from `import.meta.env.BASE_URL` so the router strips `/admin` |
| `admin/public/.htaccess` | SPA fallback scoped to `/admin/`; Vite copies it into `admin/dist/` |

`base` in `admin/vite.config.js` is the single source of truth — the router
derives its `basename` from it, so moving the panel to another path (or back to
a subdomain with `base: "/"`) needs that one line changed and a rebuild.

Upload layout:

```
public_html/
├── index.html          ← website dist/
├── assets/
├── .htaccess           ← repo root; passes /admin through untouched
└── admin/
    ├── index.html      ← admin/dist/
    ├── assets/
    └── .htaccess       ← came from admin/dist/, do not drop it
```

Apache does not merge a parent `.htaccess`'s rewrite rules into a child's, so
each folder carries its own SPA fallback. The root file also has an explicit
`RewriteRule ^admin(/|$) - [L]` guard so a panel route can never fall through
to the website's `index.html`.

For nginx, serve the same layout with:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /admin {
    try_files $uri $uri/ /admin/index.html;
}

# Must come before the fallbacks above, or /api requests are answered with
# index.html and every fetch() parses HTML as JSON.
location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 10M;          # must exceed MAX_UPLOAD_SIZE_MB
}
```

The root `.htaccess` carries the same guard for Apache
(`RewriteRule ^(api|uploads)(/|$) - [L]`).

Because the panel is same-origin with the website, `CORS_ORIGINS` only needs
the one domain (plus its `www` form).

### Production checklist

- [ ] `NODE_ENV=production`
- [ ] Strong `JWT_SECRET` (48+ random bytes), never the example value
- [ ] Dedicated MySQL user, not `root`
- [ ] `CORS_ORIGINS` set to your real domains only
- [ ] `PUBLIC_URL` set to the HTTPS domain, origin only with no `/api` on the end
- [ ] `dist/` and `admin/dist/` built with `.env.production` in place —
      `grep -o 'localhost:5[0-9]*' dist/assets/*.js admin/dist/assets/*.js`
      must print nothing
- [ ] An image URL from `/api/projects/map` opens as an image, not as HTML
- [ ] Seed admin password changed after first login
- [ ] HTTPS on both domains (website + API)
- [ ] `admin/dist/.htaccess` uploaded into `public_html/admin/` (hidden file — turn on "show hidden files" in your FTP client)
- [ ] `growfarms.com/admin/projects` opens the panel on a hard refresh, not the website
- [ ] `uploads/` writable, backed up, and outside the web root except via the app
- [ ] Automated `mysqldump` backups
- [ ] `client_max_body_size` ≥ `MAX_UPLOAD_SIZE_MB`

---

## 10. Verification status

| Check | Result |
|---|---|
| `npm run build` (website) | passes |
| `npm run lint` (website) | 31 findings — **identical to the pre-existing baseline**; the integration adds none |
| `npm run build` (admin) | passes |
| `npm run test:routes` (backend) | **39/39 pass** — routing, JWT on 11 protected routes, forged tokens, enquiry + login validation, CORS, static uploads, path-traversal, security headers |
| `db:migrate` / `db:seed` / live API | **not yet run** — needs MySQL credentials |

The lint baseline was measured by linting the pre-change code from git in a
throwaway worktree, so "adds none" is a real diff, not an assumption. The 31
pre-existing findings are in original files (`HomeBanner`, `AerialMapSection`,
`Contact`, `About`, …) and were left alone.

`backend/smoke.test.cjs` runs without a database — it boots the real Express
app and drives it over HTTP.
