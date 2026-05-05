import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TopBar from "./TopBar";
import { UserAuth } from "./context/AuthContext";
import { getOrders, getSavedProducts } from "./userData";
import { supabase } from "./supabaseClient";

const TABS = [
  { id: "orders", label: "Order history" },
  { id: "saved", label: "Saved items" },
  { id: "account", label: "Account" },
];

function Profile() {
  const { session } = UserAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "orders";

  const userId = session?.user?.id;
  const [profileUsername, setProfileUsername] = useState("");

  useEffect(() => {
    if (!userId) {
      setProfileUsername("");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();
      if (!cancelled && !error && data?.username) {
        setProfileUsername(data.username);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const orders = useMemo(() => getOrders(userId), [userId]);
  const saved = useMemo(() => getSavedProducts(userId), [userId]);

  if (!session?.user) {
    return (
      <div className="min-h-dvh bg-slate-950 px-4 pb-8 pt-[calc(5.25rem+env(safe-area-inset-top))] text-white sm:px-6 sm:py-24">
        <TopBar />
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-center sm:p-8">
          <p className="text-slate-300">Sign in to view your profile.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              to="/login"
              className="touch-action-manipulation rounded-md border border-slate-500 px-4 py-3 text-sm font-semibold min-h-[48px] flex items-center justify-center"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="touch-action-manipulation rounded-md bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 min-h-[48px] flex items-center justify-center"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(5.25rem+env(safe-area-inset-top))] text-white sm:px-6 md:px-10 md:py-24">
      <TopBar />
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-black sm:text-3xl">Your profile</h1>
        <p className="mt-1 text-base text-white sm:text-lg">
          {profileUsername || session.user.user_metadata?.username || "—"}
        </p>
        <p className="mt-0.5 break-all text-xs text-slate-400 sm:text-sm">
          {session.user.email}
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-8 sm:flex-wrap sm:overflow-visible sm:border-b sm:border-slate-700 sm:pb-4 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSearchParams({ tab: t.id })}
              className={`touch-action-manipulation shrink-0 rounded-md px-4 py-2.5 text-sm font-semibold transition min-h-[44px] sm:py-2 ${
                tab === t.id
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-slate-800/80 text-slate-300 sm:bg-transparent sm:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          {tab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-slate-400">No orders yet.</p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {o.thumbnail && (
                        <img
                          src={o.thumbnail}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold">{o.title}</p>
                        <p className="text-sm text-cyan-300">${o.price}</p>
                        <p className="text-xs text-slate-500">
                          {o.purchasedAt &&
                            new Date(o.purchasedAt).toLocaleString()}
                        </p>
                        {o.trackingCode && (
                          <p className="mt-1 break-all text-sm text-emerald-300">
                            Tracking: {o.trackingCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "saved" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {saved.length === 0 ? (
                <p className="text-slate-400">No saved items.</p>
              ) : (
                saved.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="touch-action-manipulation flex gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-3 transition hover:border-cyan-500/50"
                  >
                    <img
                      src={p.thumbnail}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-cyan-300">${p.price}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "account" && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300 sm:p-6 sm:text-base">
              <p>
                Username:{" "}
                <span className="text-white">
                  {profileUsername ||
                    session.user.user_metadata?.username ||
                    "—"}
                </span>
              </p>
              <p className="mt-2 break-all">
                Email:{" "}
                <span className="text-white">{session.user.email}</span>
              </p>
              <p className="mt-4 text-xs text-slate-500 sm:text-sm">
                Addresses and payment methods can be added here when your
                backend is connected.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
