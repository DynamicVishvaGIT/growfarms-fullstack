import { ProjectContext } from "./projectContext";

export default function ProjectProvider({ project, children }) {
  return <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>;
}
