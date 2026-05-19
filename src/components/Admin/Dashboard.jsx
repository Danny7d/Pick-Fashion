import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { fetchDashboardStats, formatCurrency } from "./adminUtils";

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const nextStats = await fetchDashboardStats();
        if (!cancelled) setStats(nextStats);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return <div className="h-48 animate-pulse rounded-3xl bg-white" />;
  }

  const cards = [
    {
      title: "Total products",
      value: stats.total_products,
      icon: FiBox,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      title: "Pending orders",
      value: stats.pending_orders,
      icon: FiClock,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      title: "Delivered orders",
      value: stats.delivered_orders,
      icon: FiCheckCircle,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Revenue estimate",
      value: formatCurrency(stats.revenue_estimate),
      icon: FiCreditCard,
      tone: "bg-orange-50 text-orange-700",
    },
    {
      title: "Items sold",
      value: stats.items_sold,
      icon: FiTrendingUp,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      title: "Customers count",
      value: stats.customers_count,
      icon: FiUsers,
      tone: "bg-stone-100 text-stone-700",
    },
  ];

  return (
    <div className="motion-page space-y-8">
      <section className="animated-sheen rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-8 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-200">
          Owner view
        </p>
        <h1 className="mt-3 text-3xl font-black">Store control center</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Track inventory, process manual orders, and review customer activity
          without touching the public storefront.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/products"
            className="motion-button rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Manage inventory
          </Link>
          <Link
            to="/admin/orders"
            className="motion-button rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white"
          >
            Review orders
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="motion-card admin-surface rounded-3xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${card.tone}`}>
                  <Icon size={20} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="motion-card admin-surface rounded-3xl p-6">
          <h2 className="text-lg font-black text-slate-950">Operational focus</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
              <span>Active products</span>
              <span className="font-semibold text-slate-950">
                {stats.active_products}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
              <span>Low stock products</span>
              <span className="font-semibold text-slate-950">
                {stats.low_stock_products}
              </span>
            </div>
          </div>
        </div>

        <div className="motion-card admin-surface rounded-3xl p-6">
          <h2 className="text-lg font-black text-slate-950">Quick routes</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              to="/admin/products"
              className="motion-button rounded-2xl bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700"
            >
              Add or edit products
            </Link>
            <Link
              to="/admin/orders"
              className="motion-button rounded-2xl bg-sky-50 px-4 py-4 text-sm font-semibold text-sky-700"
            >
              Confirm pending orders
            </Link>
            <Link
              to="/admin/customers"
              className="motion-button rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700"
            >
              Inspect customer activity
            </Link>
            <Link
              to="/admin/analytics"
              className="motion-button rounded-2xl bg-violet-50 px-4 py-4 text-sm font-semibold text-violet-700"
            >
              Review sales trends
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
