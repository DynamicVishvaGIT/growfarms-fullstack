import { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "/logo_1.png";

const ExploreButton = () => {
  const [navOpen, setNavOpen] = useState(false);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Blogs", path: "/blogs" },
    // { name: "Testimonials", path: "/testimonials" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "auto",
      }}
    >
      {/* Navigation */}
      <nav
        className={`flex items-center gap-1 rounded-full px-2 lg:px-4 py-2
          bg-white/85 backdrop-blur-md
          shadow-[0_8px_32px_rgba(0,0,0,0.18)]
          transition-all duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)]
          ${
            navOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-4 scale-95 pointer-events-none absolute"
          }`}
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setNavOpen(false)}
            className={({ isActive }) =>
              `rounded-full whitespace-nowrap font-medium transition-all duration-200
              text-[0.72rem] px-2 py-1
              md:text-[0.88rem] md:px-3 md:py-1.5
              ${
                isActive
                  ? "bg-black text-white"
                  : "text-[#2a2a2a] hover:bg-black/10"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Explore Button */}
      <div className="mt-6">
        {navOpen ? (
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="w-[44px] h-[44px] rounded-full
              border border-white/30 bg-white/15 backdrop-blur-md
              flex items-center justify-center
              cursor-pointer hover:bg-white/25 hover:rotate-90
              transition-all duration-300"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="flex flex-col items-center border-none bg-transparent cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <span
                className="absolute w-[64px] h-[64px] rounded-full border-2 border-white/50 animate-ping"
                style={{ animationDuration: "2.4s" }}
              />

              <div
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center
                  transition-transform duration-300 hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.22)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                  style={{
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={logo}
                    alt="logo"
                    className="w-5 h-5 object-contain"
                  />
                </div>
              </div>
            </div>

            <span
              className="mt-3 text-white tracking-[0.14em]"
              style={{
                fontSize: "1rem",
                fontWeight: "400",
                textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                userSelect: "none",
              }}
            >
              Explore
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ExploreButton;