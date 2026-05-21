import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  FiBarChart2,
  FiBell,
  FiBox,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiShoppingCart,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const navItems = [
  { path: "/admin", icon: FiGrid, label: "Dashboard" },
  { path: "/admin/products", icon: FiBox, label: "Products" },
  { path: "/admin/orders", icon: FiShoppingCart, label: "Orders" },
  { path: "/admin/customers", icon: FiUsers, label: "Customers" },
  { path: "/admin/analytics", icon: FiBarChart2, label: "Analytics" },
  { path: "/admin/settings", icon: FiSettings, label: "Settings" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile } = UserAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isActive = (path) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fafaf9_0%,#fff7ed_48%,#eef2ff_100%)] text-slate-900 lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-stone-200 bg-white/95 shadow-2xl shadow-slate-200/60 backdrop-blur transition-transform lg:static lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-orange-500">
                Pick Fashion
              </p>
              <h1 className="mt-1 text-2xl font-black">Admin</h1>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`motion-button flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                    isActive(item.path)
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                      : "text-slate-600 hover:bg-stone-100"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-stone-200 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <FiLogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-stone-200 p-2 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu size={20} />
              </button>
              <div className="hidden w-full max-w-xs items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-slate-500 md:flex">
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Products, customers, orders"
                  className="w-full bg-transparent outline-none placeholder-slate-400"
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="motion-button relative rounded-xl border border-stone-200 bg-white p-2 hover:bg-stone-50"
              >
                <FiBell size={18} className="text-slate-600" />
              </button>
              <div className="motion-card flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                  {(profile?.username || "A").charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {profile?.username || "Admin"}
                  </p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
