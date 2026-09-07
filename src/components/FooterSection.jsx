import { Link } from "react-router-dom";
import logo_img from "../assets/images/grow-farms-logo.png";
import useApiData from "../hooks/useApiData";
import SocialLinks from "./SocialLinks";
import { getContent, getSettings, contentBlock } from "../lib/api";

/* The footer as it ships today — every value below is the fallback. */
const FALLBACK_FOOTER = {
  watermark: "GROW FARMS",
  navigation: [
    // { label: "Home", url: "/" },
    { label: "About us", url: "/about" },
    { label: "Blog", url: "/blogs" },
    { label: "Contact", url: "/contact-us" },
    { label: "Sitemap", url: "/https://growfarms.co/sitemap.xml" },
  ],
  projects: [
    { label: "Sky Breeze", url: "/details/skybreez" },
    { label: "Sarasview", url: "/details/sarasview" },
  ],

  address:
    "Grow Farms 305, The Landmark, Next to Hotel Three Star, Sector 7, Kharghar, Navi Mumbai, Maharashtra 410210",
  email: "info@growfarms.co",
  phone: "+91 00000 00000",
  copyright: "© 2026 Grow Farms. All rights reserved. | Design by Dynamic Vishva",
};

const FooterSection = () => {
  const { data: footer } = useApiData(async (signal) => {
    const [grouped, settings] = await Promise.all([
      getContent("global", signal),
      getSettings(signal),
    ]);

    const block = contentBlock(grouped, "global", "footer");
    if (!block && !settings) return null;

    const extra = block?.extra_data || {};
    return {
      watermark: block?.title || FALLBACK_FOOTER.watermark,
      navigation: extra.navigation?.length ? extra.navigation : FALLBACK_FOOTER.navigation,
      projects: extra.projects?.length ? extra.projects : FALLBACK_FOOTER.projects,
      address: settings?.contact_address || block?.body || FALLBACK_FOOTER.address,
      // The primary pair from Settings → Contact details, which is the same
      // pair the contact page leads with. There is no `contact_email` /
      // `contact_phone` key — reading those was why the footer ignored the
      // admin panel and always showed the fallbacks below.
      email: settings?.contact_email_1 || FALLBACK_FOOTER.email,
      phone: settings?.contact_phone_1 || FALLBACK_FOOTER.phone,
      copyright: settings?.copyright_text || extra.copyright || FALLBACK_FOOTER.copyright,
      logo: settings?.site_logo || null,
    };
  }, FALLBACK_FOOTER);

  return (
    <footer className="relative w-full sub_font overflow-hidden bg-[#224E28]">
      {/* Watermark — original untouched styling */}
      <p
        className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap
          font-bold leading-none pointer-events-none select-none z-0"
        style={{
          fontSize: "clamp(3rem, 10vw, 9rem)",
          color: "#2B5F33",
          letterSpacing: "0.1em",
        }}
      >
        {footer.watermark}
      </p>

      {/* Content */}
      <div
        className="relative z-10 mx-auto w-full max-w-7xl px-8 md:px-16"
        style={{ padding: "clamp(3rem, 5vw, 5rem) clamp(1.5rem, 6vw, 5rem)" }}
      >
        {/* Main Grid: 2 columns on mobile, custom grid on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-[200px_1fr_1fr_1.6fr] gap-x-6 gap-y-8 md:gap-12 items-start">

       {/* Logo — full width on mobile */}
<div className="col-span-2 md:col-span-1 flex flex-col items-start">
  <Link to="/">
    <img
      src={footer.logo || logo_img}
      alt="Grow Farms"
      className="h-[70px] w-auto object-contain cursor-pointer"
    />
  </Link>
</div>

          {/* Navigation — left side on mobile */}
          <div className="col-span-1">
            <h3
              className="mb-4 text-white"
              style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em" }}
            >
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {footer.navigation.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.url || "/"}
                    className="text-white/65 text-sm hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Projects — right side on mobile */}
          <div className="col-span-1">
            <h3
              className="mb-4 text-white"
              style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em" }}
            >
              Our Projects
            </h3>
            <ul className="space-y-2.5">
              {footer.projects.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.url || "/"}
                    className="text-white/65 text-sm hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Address — full width on mobile */}
          <div className="col-span-2 md:col-span-1">
  <h3
    className="mb-4 text-white"
    style={{
      fontSize: "1.05rem",
      fontWeight: 500,
      letterSpacing: "0.02em",
    }}
  >
    Reach to us
  </h3>

  {/* Address */}
  <p className="text-white/65 text-sm leading-7 max-w-[300px] mb-3">
    {footer.address}
  </p>

  {/* Email */}
  <a
    href={`mailto:${footer.email}`}
    className="block text-white/65 text-sm hover:text-white transition-colors duration-200 mb-2"
  >
    {footer.email}
  </a>

  {/* Contact */}
  <a
    href={`tel:${footer.phone}`}
    className="block text-white/65 text-sm hover:text-white transition-colors duration-200"
  >
    {footer.phone}
  </a>
</div>

        </div>

        {/* Follow us — its own full-width row rather than a fifth grid column,
            so all six icons sit on one line on desktop and wrap cleanly on
            mobile. Renders nothing at all when no link is active.

            The bottom margin is sized against the copyright below, which is
            pulled upward (bottom-5, lg:bottom-15) to sit over the watermark:
            the margin has to cover that offset before it buys any clearance,
            so it steps up at lg for the same reason the offset does. */}
        <SocialLinks
          className="mb-12 flex flex-col gap-4
             items-start md:items-end"
        />

        {/* Divider + Copyright */}
        <div className="relative bottom-5 lg:bottom-15">
          <p className="text-center text-[10px] text-white tracking-widest uppercase">
            {footer.copyright}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default FooterSection;