import { useEffect, useMemo, useState } from "react";
import {
  fetchOrderSummaries,
  formatCurrency,
  formatDate,
  getOrderStatusTone,
  updateOrderStatus,
} from "./adminUtils";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await fetchOrderSummaries());
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const haystack = [
        order.customer_name,
        order.customer_email,
        order.phone_number,
        order.telegram_handle,
        order.product_name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleStatus = async (orderId, status) => {
    setError("");
    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manual order processing with customer contact details and status
          transitions.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr,220px]">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by customer, email, phone, Telegram, or product"
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
        >
          <option value="all">All statuses</option>
          <option value="pending_manual">Pending manual</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={8}>
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-stone-100">
                    <td className="px-6 py-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {order.customer_name || "Customer"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.customer_email || "No email"}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <p>{order.phone_number || "—"}</p>
                      <p className="text-xs">@{order.telegram_handle || "—"}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {order.product_name}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Unit {formatCurrency(order.unit_price)}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {order.status === "pending_manual" && (
                          <>
                            <ActionButton
                              label="Confirm"
                              tone="bg-sky-600"
                              onClick={() =>
                                handleStatus(order.id, "confirmed")
                              }
                            />
                            <ActionButton
                              label="Cancel"
                              tone="bg-rose-600"
                              onClick={() =>
                                handleStatus(order.id, "cancelled")
                              }
                            />
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <>
                            <ActionButton
                              label="Deliver"
                              tone="bg-emerald-600"
                              onClick={() =>
                                handleStatus(order.id, "delivered")
                              }
                            />
                            <ActionButton
                              label="Cancel"
                              tone="bg-rose-600"
                              onClick={() =>
                                handleStatus(order.id, "cancelled")
                              }
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={8}>
                    No orders match the current filter.
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

const ActionButton = ({ label, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl px-3 py-2 text-xs font-semibold text-white ${tone}`}
  >
    {label}
  </button>
);

export default Orders;
