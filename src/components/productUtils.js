import products from "./Products";

const BLOCKED_KEYWORDS = [
  "phone",
  "iphone",
  "realme",
  "vivo",
  "samsung galaxy tab",
  "motorcycle",
  "soft drinks",
  "coke",
];

export const getFallbackProducts = () => {
  const mergedProducts = products.carts.flatMap((cart) => cart.products);
  const uniqueProducts = new Map();

  mergedProducts.forEach((item) => {
    if (!uniqueProducts.has(item.id)) {
      uniqueProducts.set(item.id, item);
    }
  });

  return Array.from(uniqueProducts.values()).filter((item) => {
    const title = item.title?.toLowerCase() || "";
    const description = item.description?.toLowerCase() || "";
    const thumbnail = item.thumbnail?.toLowerCase() || "";

    return !BLOCKED_KEYWORDS.some(
      (keyword) =>
        title.includes(keyword) ||
        description.includes(keyword) ||
        thumbnail.includes(keyword),
    );
  });
};

export const normalizeSupabaseProduct = (product) => ({
  id: String(product.id),
  title: product.name,
  price: Number(product.price || 0),
  description: product.description || "",
  thumbnail: product.image_url || "",
  category: product.category || "",
  stock: product.stock ?? 0,
  status: product.status || "active",
  soldCount: product.sold_count ?? 0,
  createdAt: product.created_at || null,
  updatedAt: product.updated_at || null,
});

export const getFilteredProducts = () => getFallbackProducts();
