import useApiData from "../hooks/useApiData";
import { getSocialLinks } from "../lib/api";
import { iconFor, toHref } from "../lib/socialIcons";

/** Matches the column headings in the footer so the label sits in the same key. */
const HEADING_STYLE = { fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em" };

/**
 * The site's social icon row, driven by the Social Media Links CMS list.
 *
 * The footer has never carried social icons, so unlike the rest of the site
 * there is no original hard-coded version to fall back to: the fallback is an
 * empty list, and the whole block — heading included — renders nothing until an
 * admin activates a link. That keeps a backend outage looking like today's
 * footer rather than a heading over a row of dead icons.
 *
 * Rendering its own wrapper is what makes that possible, and is why the heading
 * is a prop rather than something the caller puts above it. Kept out of
 * FooterSection so the same row can be dropped into a header or contact panel
 * later — omit `heading` there and pass different wrapper classes.
 */
export default function SocialLinks({ heading, className = "", iconSize = 17 }) {
  const { data: links } = useApiData((signal) => getSocialLinks(signal), []);

  // Guard the href here as well as on the server: a row written before the
  // model's validator existed could still hold something unlinkable.
  const usable = links
    .map((link) => ({ ...link, href: toHref(link.url, link.platform) }))
    .filter((link) => link.href);

  if (!usable.length) return null;

  return (
    <div className={className}>
   
      <ul className="flex flex-wrap items-center gap-3">
        {usable.map((link) => {
          const Icon = iconFor(link.platform);

          return (
            <li key={link.id}>
              <a
                href={link.href}
                target="_blank"
                // `noopener` is the security half — the new tab must not get a
                // handle on this window; `noreferrer` covers older browsers.
                rel="noopener noreferrer"
                aria-label={link.name}
                title={link.name}
                className="flex h-10 w-10 items-center justify-center rounded-full
                  border border-white/20 text-white/70 transition-all duration-200
                  hover:-translate-y-0.5 hover:border-white hover:bg-white
                  hover:text-[#224E28] focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Icon size={iconSize} aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
