const savedKey = (userId) => `pick-fashion-saved-${userId}`;
const ordersKey = (userId) => `pick-fashion-orders-${userId}`;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getSavedProducts = (userId) => {
  if (!userId) return [];
  return readJson(savedKey(userId), []);
};

export const setSavedProducts = (userId, items) => {
  if (!userId) return;
  writeJson(savedKey(userId), items);
};

export const toggleSavedProduct = (userId, product) => {
  if (!userId) return getSavedProducts(userId);
  const list = getSavedProducts(userId);
  const exists = list.some((p) => p.id === product.id);
  const next = exists
    ? list.filter((p) => p.id !== product.id)
    : [
        ...list,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          savedAt: new Date().toISOString(),
        },
      ];
  setSavedProducts(userId, next);
  return next;
};

export const isProductSaved = (userId, productId) => {
  return getSavedProducts(userId).some((p) => p.id === productId);
};

export const getOrders = (userId) => {
  if (!userId) return [];
  return readJson(ordersKey(userId), []);
};

export const addOrder = (userId, order) => {
  if (!userId) return null;
  const id = `ord-${Date.now()}`;
  const list = getOrders(userId);
  writeJson(ordersKey(userId), [
    {
      id,
      ...order,
      purchasedAt: new Date().toISOString(),
    },
    ...list,
  ]);
  return id;
};

export const updateOrderTracking = (userId, orderId, trackingCode) => {
  if (!userId) return;
  const list = getOrders(userId);
  const next = list.map((o) =>
    o.id === orderId ? { ...o, trackingCode } : o,
  );
  writeJson(ordersKey(userId), next);
};
