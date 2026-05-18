import { Link } from "react-router-dom";
import { UserAuth } from "./context/AuthContext";
import { useState } from "react";
import ProfileMenu from "./ProfileMenu";

function TopBar({ brandOpacity = 1, onSearchResults, products = [] }) {
  const { session } = UserAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (term) => {
    setSearchTerm(term);

    if (term.trim() === "") {
      onSearchResults?.(products, false);
      return;
    }

    const filtered = products.filter((product) => {
      const search = term.toLowerCase();
      const titleMatch = product.title?.toLowerCase().includes(search);
      const descriptionMatch = product.description
        ?.toLowerCase()
        .includes(search);
      return titleMatch || descriptionMatch;
    });

    onSearchResults?.(filtered, true);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-xl border border-orange-100/70 bg-white/95 px-3 py-2.5 shadow-md shadow-orange-100/30 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3">
        <Link
          to="/"
          className="touch-action-manipulation text-lg font-black tracking-tight text-gray-800 transition-opacity sm:text-xl md:text-3xl min-h-[44px] min-w-[44px] flex items-center"
          style={{ opacity: brandOpacity }}
        >
          Pick Fashion
        </Link>

        {/* Desktop Search Bar - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              placeholder="Search products..."
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={() => handleSearch("")}
                  className="mr-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {session ? (
            <ProfileMenu />
          ) : (
            <>
              <Link
                to="/login"
                className="touch-action-manipulation rounded-md border border-gray-300 px-3 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-orange-400 hover:text-orange-500 sm:px-4 sm:text-sm min-h-[44px] flex items-center"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="touch-action-manipulation rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg sm:px-4 sm:text-sm min-h-[44px] flex items-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
