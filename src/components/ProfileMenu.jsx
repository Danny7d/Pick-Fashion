import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserAuth } from "./context/AuthContext";
import { supabase } from "./supabaseClient";

function ProfileMenu() {
  const { session, signOut, isAdmin } = UserAuth();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setDisplayName("");
      return;
    }

    const meta = user.user_metadata?.username;
    if (typeof meta === "string" && meta.trim()) {
      setDisplayName(meta.trim());
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || error) return;
      if (data?.username) {
        setDisplayName(data.username);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const label = displayName || "Member";

  const requestLogout = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="touch-action-manipulation flex max-w-[min(100vw-8rem,200px)] items-center gap-2 rounded-md border border-cyan-300/40 bg-slate-900/60 px-2.5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 sm:px-3 min-h-[44px]"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/30 text-sm font-bold text-white">
            {label.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{label}</span>
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),16rem)] rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
            <Link
              to="/profile?tab=orders"
              className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 sm:py-2"
              onClick={() => setOpen(false)}
            >
              Order history
            </Link>
            <Link
              to="/profile?tab=saved"
              className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 sm:py-2"
              onClick={() => setOpen(false)}
            >
              Saved items
            </Link>
            <Link
              to="/profile?tab=account"
              className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 sm:py-2"
              onClick={() => setOpen(false)}
            >
              Account
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="block px-4 py-3 text-sm text-cyan-200 hover:bg-slate-800 sm:py-2"
                onClick={() => setOpen(false)}
              >
                Admin dashboard
              </Link>
            )}
            <hr className="my-1 border-slate-700" />
            <button
              type="button"
              className="touch-action-manipulation w-full px-4 py-3 text-left text-sm text-rose-200 hover:bg-slate-800 sm:py-2"
              onClick={requestLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <h3 className="text-lg font-bold text-white">Log out?</h3>
            <p className="mt-2 text-sm text-slate-300">
              You will need to sign in again to buy or view your saved items on
              this device.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                className="touch-action-manipulation rounded-md border border-slate-500 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 sm:py-2"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="touch-action-manipulation rounded-md bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500 sm:py-2"
                onClick={confirmLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileMenu;
