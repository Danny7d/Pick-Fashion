import { supabase } from "../supabaseClient";

export const PRODUCT_STATUSES = ["active", "hidden", "sold_out"];
export const ORDER_STATUSES = [
  "pending_manual",
  "confirmed",
  "delivered",
  "cancelled",
];

export function formatCurrency(amount, currency = "ETB") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

export function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString();
}

export function getProductStatusTone(status) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "hidden") return "bg-slate-200 text-slate-700";
  return "bg-rose-100 text-rose-700";
}

export function getOrderStatusTone(status) {
  if (status === "pending_manual") return "bg-amber-100 text-amber-700";
  if (status === "confirmed") return "bg-sky-100 text-sky-700";
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function requireNoError(error, context) {
  if (error) {
    throw new Error(error.message || context);
  }
}

export async function fetchDashboardStats() {
  const { data, error } = await supabase.rpc("admin_dashboard_summary");
  requireNoError(error, "Failed to load dashboard stats");
  return data?.[0] || {
    total_products: 0,
    active_products: 0,
    pending_orders: 0,
    delivered_orders: 0,
    revenue_estimate: 0,
    items_sold: 0,
    customers_count: 0,
    low_stock_products: 0,
  };
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  requireNoError(error, "Failed to load products");
  return data || [];
}

export async function saveProduct(product, imageFile) {
  const payload = {
    name: product.name.trim(),
    description: product.description.trim(),
    category: product.category.trim(),
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    status: product.status,
    image_url: product.image_url?.trim() || null,
  };

  if (imageFile) {
    const uploaded = await uploadProductImage(imageFile);
    if (uploaded) {
      payload.image_url = uploaded;
    }
  }

  if (product.id) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", product.id);
    requireNoError(error, "Failed to update product");
    return product.id;
  }

  const { data, error } = await supabase
    .from("products")
    .insert([payload])
    .select("id")
    .single();
  requireNoError(error, "Failed to create product");
  return data.id;
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  requireNoError(error, "Failed to delete product");
}

export async function setProductVisibility(product, nextStatus) {
  const { error } = await supabase
    .from("products")
    .update({ status: nextStatus })
    .eq("id", product.id);
  requireNoError(error, "Failed to update product visibility");
}

export async function fetchOrderSummaries() {
  const { data, error } = await supabase.rpc("admin_order_summaries");
  requireNoError(error, "Failed to load orders");
  return data || [];
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  requireNoError(error, "Failed to update order");
  return data;
}

export async function fetchCustomerSummaries() {
  const { data, error } = await supabase.rpc("admin_customer_summaries");
  requireNoError(error, "Failed to load customers");
  return data || [];
}

export async function fetchAnalyticsSnapshot() {
  const [dashboard, orders, products] = await Promise.all([
    fetchDashboardStats(),
    fetchOrderSummaries(),
    fetchProducts(),
  ]);

  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );
  const averageOrderValue = deliveredOrders.length
    ? totalRevenue / deliveredOrders.length
    : 0;

  const topProducts = [...products]
    .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
    .slice(0, 5);

  return {
    dashboard,
    totalRevenue,
    totalOrders: orders.length,
    averageOrderValue,
    topProducts,
    recentOrders: orders.slice(0, 8),
  };
}

export async function fetchAdminSettings() {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  requireNoError(error, "Failed to load settings");
  return (
    data || {
      id: 1,
      store_name: "Pick Fashion",
      store_email: "pickfashionzr@gmail.com",
      store_phone: "",
      currency: "ETB",
      low_stock_threshold: 3,
      notify_new_orders: true,
      notify_low_stock: true,
      notify_customer_messages: true,
    }
  );
}

export async function saveAdminSettings(settings) {
  const payload = {
    id: 1,
    store_name: settings.store_name.trim(),
    store_email: settings.store_email.trim(),
    store_phone: settings.store_phone.trim(),
    currency: settings.currency,
    low_stock_threshold: Number(settings.low_stock_threshold || 0),
    notify_new_orders: Boolean(settings.notify_new_orders),
    notify_low_stock: Boolean(settings.notify_low_stock),
    notify_customer_messages: Boolean(settings.notify_customer_messages),
  };

  const { error } = await supabase.from("admin_settings").upsert(payload);
  requireNoError(error, "Failed to save settings");
}

export async function uploadProductImage(file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `products/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });

  requireNoError(error, "Failed to upload image");

  const { data: publicData } = supabase.storage
    .from("product-images")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}
