import { Link } from "react-router-dom";
import { UserAuth } from "./context/AuthContext";
import ProfileMenu from "./ProfileMenu";

function TopBar({ brandOpacity = 1 }) {
  const { session } = UserAuth();

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
