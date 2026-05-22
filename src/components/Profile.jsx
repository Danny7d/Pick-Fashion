import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TopBar from "./TopBar";
import { UserAuth } from "./context/AuthContext";
import { formatMoney } from "./currency";
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
      <div className="min-h-dvh bg-[#FDF8F3] px-4 pb-8 pt-[calc(5.25rem+env(safe-area-inset-top))] text-gray-800 sm:px-6 sm:py-24">
        <TopBar />
        <div className="mx-auto max-w-lg rounded-2xl border border-orange-100 bg-white p-6 text-center shadow-lg shadow-orange-100/30 sm:p-8">
          <p className="text-gray-500">Sign in to view your profile.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              to="/login"
              className="touch-action-manipulation rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 min-h-[48px] flex items-center justify-center hover:border-orange-400 hover:text-orange-500"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="touch-action-manipulation rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-md min-h-[48px] flex items-center justify-center hover:shadow-lg"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="motion-page min-h-dvh bg-[#FDF8F3] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(5.25rem+env(safe-area-inset-top))] text-gray-800 sm:px-6 md:px-10 md:py-24">
      <TopBar />
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-black sm:text-3xl">Your profile</h1>
        <p className="mt-1 text-base text-gray-800 sm:text-lg">
          {profileUsername || session.user.user_metadata?.username || "—"}
        </p>
        <p className="mt-0.5 break-all text-xs text-gray-500 sm:text-sm">
          {session.user.email}
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-8 sm:flex-wrap sm:overflow-visible sm:border-b sm:border-gray-200 sm:pb-4 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSearchParams({ tab: t.id })}
              className={`motion-button touch-action-manipulation min-h-[44px] shrink-0 rounded-md px-4 py-2.5 text-sm font-semibold sm:py-2 ${
                tab === t.id
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 sm:bg-transparent sm:hover:bg-gray-100"
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
                <p className="text-gray-500">No orders yet.</p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="motion-card rounded-xl border border-gray-200 bg-white p-4 shadow-md"
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
                        <p className="font-semibold text-gray-800">{o.title}</p>
                        <p className="price-chip mt-1 text-sm">
                          {formatMoney(o.price)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {o.purchasedAt &&
                            new Date(o.purchasedAt).toLocaleString()}
                        </p>
                        {o.trackingCode && (
                          <p className="mt-1 break-all text-sm text-emerald-600">
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
                <p className="text-gray-500">No saved items.</p>
              ) : (
                saved.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="motion-card touch-action-manipulation flex gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-md hover:border-orange-300"
                  >
                    <img
                      src={p.thumbnail}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{p.title}</p>
                      <p className="price-chip mt-1 text-sm">
                        {formatMoney(p.price)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "account" && (
            <div className="motion-card rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-md sm:p-6 sm:text-base">
              <p>
                Username:{" "}
                <span className="text-gray-900 font-medium">
                  {profileUsername ||
                    session.user.user_metadata?.username ||
                    "—"}
                </span>
              </p>
              <p className="mt-2 break-all">
                Email:{" "}
                <span className="text-gray-900 font-medium">
                  {session.user.email}
                </span>
              </p>
              <p className="mt-4 text-xs text-gray-500 sm:text-sm">
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
