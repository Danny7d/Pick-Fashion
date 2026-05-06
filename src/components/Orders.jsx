import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import TopBar from "./TopBar";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please login to view your orders");
        setLoading(false);
        return;
      }

      // Use RPC function or direct query
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_manual":
        return "bg-amber-100 text-amber-600 border-amber-300";
      case "confirmed":
        return "bg-blue-100 text-blue-600 border-blue-300";
      case "delivered":
        return "bg-green-100 text-green-600 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-600 border-red-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_manual":
        return "Pending Confirmation";
      case "confirmed":
        return "Confirmed";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const handleCancel = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const { error } = await supabase.rpc("cancel_order", {
        p_order_id: orderId,
      });

      if (error) throw error;

      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error("Cancel failed:", error);
      alert("Failed to cancel order. It may already be confirmed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] text-gray-800">
        <TopBar brandOpacity={1} />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-lg text-gray-500">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-gray-800">
      <TopBar brandOpacity={1} />

      <div className="px-4 pb-24 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-8 md:px-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              My Orders
            </h1>
            <Link
              to="/"
              className="text-sm text-orange-500 transition-colors hover:text-orange-600"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && orders.length === 0 && !error && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg shadow-gray-100/50">
              <div className="mb-4 text-6xl">📦</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                No Orders Yet
              </h3>
              <p className="mb-6 text-gray-500">
                You haven&apos;t placed any orders yet. Start shopping!
              </p>
              <Link
                to="/products"
                className="inline-block rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                Browse Products
              </Link>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-100/30 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Product Image */}
                  {order.product_image && (
                    <img
                      src={order.product_image}
                      alt={order.product_name}
                      className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24"
                    />
                  )}

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mb-1 font-semibold text-gray-800">
                      {order.product_name}
                    </h3>

                    <div className="mb-3 text-sm text-gray-500">
                      <p>
                        Qty: {order.quantity} × ${order.unit_price}
                      </p>
                      <p className="text-orange-500 font-semibold">
                        Total: ${order.total_amount}
                      </p>
                    </div>

                    <div className="text-xs text-gray-400">
                      <p>📱 {order.phone_number}</p>
                      <p>💬 @{order.telegram_handle}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {order.status === "pending_manual" && (
                      <>
                        <a
                          href={`https://t.me/Rutha_5?text=Hello, I'm following up on Order ${order.id.slice(0, 8)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-500 transition-colors hover:bg-blue-100"
                        >
                          Message on Telegram
                        </a>
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-center text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}

                    {order.status === "confirmed" && (
                      <span className="rounded-lg bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-600">
                        Being Prepared
                      </span>
                    )}

                    {order.status === "delivered" && (
                      <span className="rounded-lg bg-green-50 px-4 py-2 text-center text-sm font-medium text-green-600">
                        ✅ Delivered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;
