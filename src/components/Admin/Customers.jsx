import { useEffect, useMemo, useState } from "react";
import {
  fetchCustomerSummaries,
  formatCurrency,
  formatDate,
} from "./adminUtils";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const nextCustomers = await fetchCustomerSummaries();
        if (!cancelled) setCustomers(nextCustomers);
      } catch (nextError) {
        if (!cancelled) setError(nextError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const haystack = [
        customer.username,
        customer.email,
        customer.phone_number,
        customer.telegram_handle,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesFilter =
        filterType === "all" ||
        (filterType === "active" && customer.orders_count > 0) ||
        (filterType === "new" && customer.orders_count === 0) ||
        (filterType === "frequent" && customer.orders_count >= 5);

      return matchesSearch && matchesFilter;
    });
  }, [customers, filterType, search]);

  const activeCustomers = customers.filter((customer) => customer.orders_count > 0)
    .length;
  const frequentCustomers = customers.filter(
    (customer) => customer.orders_count >= 5,
  ).length;

  return (
    <div className="motion-page space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search customers, review order history, and spot frequent buyers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total customers" value={customers.length} />
        <StatCard label="Active customers" value={activeCustomers} />
        <StatCard label="Frequent buyers" value={frequentCustomers} />
      </div>

      <div className="motion-card admin-surface grid gap-4 rounded-3xl p-5 lg:grid-cols-[1fr,220px]">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by username, email, phone, or Telegram"
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
        />
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
        >
          <option value="all">All customers</option>
          <option value="active">Active customers</option>
          <option value="new">New customers</option>
          <option value="frequent">Frequent buyers</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="motion-card admin-surface overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Telegram</th>
                <th className="px-6 py-4 font-semibold">Orders</th>
                <th className="px-6 py-4 font-semibold">Total purchases</th>
                <th className="px-6 py-4 font-semibold">Last order</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={7}>
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.customer_id} className="border-t border-stone-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-950">
                        {customer.username || "Customer"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {customer.email || "No email"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {customer.customer_id}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {customer.phone_number || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {customer.telegram_handle
                        ? `@${customer.telegram_handle}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {customer.orders_count}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {formatCurrency(customer.total_purchases)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(customer.last_order_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(customer.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={7}>
                    No customers match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="motion-card admin-surface rounded-3xl p-6">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
  </div>
);

export default Customers;
