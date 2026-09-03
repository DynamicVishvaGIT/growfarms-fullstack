import { useEffect, useRef, useState } from "react";

/**
 * Fetch CMS data with a guaranteed-safe fallback.
 *
 * The site's existing hard-coded arrays stay in their components and are passed
 * in as `fallback`. Until the request resolves — and forever, if the backend is
 * down or not yet set up — the component renders exactly what it renders today.
 * A successful response simply swaps the data in.
 *
 * @param fetcher  (signal) => Promise<data|null>   `null` means "keep fallback"
 * @param fallback the component's original hard-coded value
 * @param deps     re-fetch when these change
 *
 * `loading` describes the in-flight request; on a deps change the previous
 * data stays on screen until the new response lands, which is what keeps
 * navigation from flashing empty sections.
 */
export default function useApiData(fetcher, fallback, deps = []) {
  const [state, setState] = useState({ data: fallback, loading: true, fromApi: false });

  // Hold the latest fetcher without making it a dependency — callers pass an
  // inline arrow, which would otherwise refetch on every render. Synced in its
  // own effect (declared first, so it runs before the fetch effect below)
  // rather than during render, which React forbids for refs.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    // No synchronous setState here: the effect body only starts the request,
    // and every state update happens once the promise settles.
    Promise.resolve()
      .then(() => fetcherRef.current(controller.signal))
      .then((result) => {
        if (!alive) return;

        // An empty list is a legitimate answer, but replacing the designed
        // content with nothing would look like a broken page — so only adopt
        // a response that actually has something in it.
        const usable =
          result !== null &&
          result !== undefined &&
          (!Array.isArray(result) || result.length > 0);

        setState((prev) =>
          usable
            ? { data: result, loading: false, fromApi: true }
            : { ...prev, loading: false },
        );
      })
      .catch(() => {
        // safeGet already swallows network errors; this guards a fetcher that
        // throws for some other reason, so the fallback simply stays put.
        if (alive) setState((prev) => ({ ...prev, loading: false }));
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
