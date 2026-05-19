import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiImage,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import {
  deleteProduct,
  fetchProducts,
  formatCurrency,
  getProductStatusTone,
  PRODUCT_STATUSES,
  saveProduct,
  setProductVisibility,
} from "./adminUtils";

const initialForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: 0,
  status: "active",
  image_url: "",
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await fetchProducts());
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(productId);
    await loadProducts();
  };

  const handleVisibility = async (product) => {
    const nextStatus = product.status === "hidden" ? "active" : "hidden";
    await setProductVisibility(product, nextStatus);
    await loadProducts();
  };

  return (
    <div className="motion-page space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add, edit, hide, and monitor inventory from one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="motion-button animated-sheen inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
        >
          <FiPlus size={18} />
          <span>Add product</span>
        </button>
      </div>

      <div className="motion-card admin-surface grid gap-4 rounded-3xl p-5 lg:grid-cols-[1fr,220px]">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, category, or description"
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
        >
          <option value="all">All statuses</option>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
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
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Sold</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={7}>
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-stone-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FiImage className="text-slate-400" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {product.name}
                          </p>
                          <p className="max-w-md text-xs text-slate-500">
                            {product.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{product.category}</td>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{product.stock}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {product.sold_count}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getProductStatusTone(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowModal(true);
                          }}
                          className="motion-button rounded-xl border border-stone-200 bg-white p-2 text-slate-600"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVisibility(product)}
                          className="motion-button rounded-xl border border-stone-200 bg-white p-2 text-slate-600"
                        >
                          {product.status === "hidden" ? (
                            <FiEye size={16} />
                          ) : (
                            <FiEyeOff size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="motion-button rounded-xl border border-rose-200 bg-white p-2 text-rose-600"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={7}>
                    No products match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            await loadProducts();
          }}
        />
      )}
    </div>
  );
};

const ProductModal = ({ product, onClose, onSaved }) => {
  const [form, setForm] = useState(product || initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await saveProduct(form, imageFile);
      await onSaved();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="motion-scale-in max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              {product?.id ? "Edit product" : "Add product"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Stock `0` automatically becomes `sold_out`.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="motion-button rounded-xl border border-stone-200 px-3 py-2 text-sm text-slate-600"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name">
              <input
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </Field>
            <Field label="Category">
              <input
                required
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Price">
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </Field>
            <Field label="Stock">
              <input
                required
                min="0"
                type="number"
                value={form.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              >
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Image URL">
              <input
                value={form.image_url || ""}
                onChange={(event) => updateField("image_url", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
              />
            </Field>
            <Field label="Upload image">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] || null)
                }
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm"
              />
            </Field>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="motion-button rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="motion-button animated-sheen rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">
      {label}
    </span>
    {children}
  </label>
);

export default Products;
