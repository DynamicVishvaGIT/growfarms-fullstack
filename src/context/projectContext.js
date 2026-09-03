import { createContext, useContext } from "react";

/**
 * Carries the currently-viewed project down to the sections of the detail page.
 *
 * Deliberately optional: components read it with `useProject()`, which returns
 * `null` when there is no provider (the home page, for instance). Every
 * consumer then falls back to its own built-in content, so nothing breaks when
 * a section is rendered outside a project page or before the fetch resolves.
 *
 * The context and hook live here, apart from the provider component, so React
 * Fast Refresh keeps working for the provider's module.
 */
export const ProjectContext = createContext(null);

export function useProject() {
  return useContext(ProjectContext);
}
