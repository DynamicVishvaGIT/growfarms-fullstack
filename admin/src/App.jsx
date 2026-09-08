import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Loading } from "./components/ui";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectForm from "./pages/ProjectForm";
import ProjectContent from "./pages/ProjectContent";
import Packages from "./pages/Packages";
import PackageForm from "./pages/PackageForm";
import Categories from "./pages/Categories";
import Blogs from "./pages/Blogs";
import BlogForm from "./pages/BlogForm";
import Enquiries from "./pages/Enquiries";
import Content from "./pages/Content";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import CmsList from "./pages/CmsList";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

/** Gate for everything behind the sign-in screen. */
function RequireAuth({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) return <Loading label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/** Keep a signed-in admin off the login screen. */
function RedirectIfAuthed({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) return <Loading />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />

          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<ProjectForm />} />
            <Route path="projects/:id/edit" element={<ProjectForm />} />
            <Route path="project-content" element={<ProjectContent />} />

            <Route path="packages" element={<Packages />} />
            <Route path="packages/new" element={<PackageForm />} />
            <Route path="packages/:id/edit" element={<PackageForm />} />

            <Route path="categories" element={<Categories />} />

            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/new" element={<BlogForm />} />
            <Route path="blogs/:id/edit" element={<BlogForm />} />

            <Route path="enquiries" element={<Enquiries />} />
            <Route path="content" element={<Content />} />
            <Route path="contact-page" element={<ContactPage />} />
            <Route path="about-page" element={<AboutPage />} />

            {/* One page serves all nine simple CMS lists. */}
            <Route path="cms/:resource" element={<CmsList />} />

            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
