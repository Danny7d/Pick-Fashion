import { useEffect, useState } from "react";
import {
  fetchAnalyticsSnapshot,
  formatCurrency,
  formatDate,
  getOrderStatusTone,
} from "./adminUtils";

const Analytics = () => {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchAnalyticsSnapshot();
        if (!cancelled) setSnapshot(data);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!snapshot) {
    return <div className="h-48 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="motion-page space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lightweight revenue and order monitoring for the owner dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={formatCurrency(snapshot.totalRevenue)}
        />
        <MetricCard label="Orders" value={snapshot.totalOrders} />
        <MetricCard
          label="Average order"
          value={formatCurrency(snapshot.averageOrderValue)}
        />
        <MetricCard
          label="Items sold"
          value={snapshot.dashboard.items_sold}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="motion-card admin-surface rounded-3xl p-6">
          <h2 className="text-lg font-black text-slate-950">Top products</h2>
          <div className="mt-5 space-y-3">
            {snapshot.topProducts.map((product) => (
              <div
                key={product.id}
                className="motion-card flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-950">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-950">
                    {product.sold_count || 0} sold
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="motion-card admin-surface rounded-3xl p-6">
          <h2 className="text-lg font-black text-slate-950">Recent orders</h2>
          <div className="mt-5 space-y-3">
            {snapshot.recentOrders.map((order) => (
              <div
                key={order.id}
                className="motion-card rounded-2xl bg-stone-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {order.product_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.customer_name || order.customer_email || "Customer"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(order.created_at)}</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="motion-card admin-surface rounded-3xl p-6">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
  </div>
);

export default Analytics;
