import { Fragment } from "react";

/**
 * Render CMS copy inside the design's existing heading or paragraph.
 *
 * The hard-coded originals stack their lines with `<br />`, so a newline typed
 * in the admin panel has to mean the same thing — otherwise a heading meant to
 * sit on three lines would collapse into one run-on line and the section would
 * no longer match its design.
 *
 * `brClassName` carries through whatever the original break used, so a
 * responsive break like `hidden sm:block` keeps behaving exactly as it does
 * today at every width.
 */
export function withLineBreaks(text, brClassName) {
  // Split on any newline flavour: multipart form posts arrive as CRLF, and
  // older rows may still carry it even though writes are normalised now.
  const lines = String(text ?? "").split(/\r\n|\r|\n/);

  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br className={brClassName} />}
    </Fragment>
  ));
}
