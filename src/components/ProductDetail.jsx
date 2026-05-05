import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserAuth } from "./context/AuthContext";
import { getFilteredProducts } from "./productUtils";
import TopBar from "./TopBar";
import {
  addOrder,
  isProductSaved,
  toggleSavedProduct,
  updateOrderTracking,
} from "./userData";

function ProductDetail() {
  const { id } = useParams();
  const { session } = UserAuth();
  const [purchaseState, setPurchaseState] = useState("idle");
  const [trackingCode, setTrackingCode] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [saved, setSaved] = useState(false);

  const product = useMemo(() => {
    const allProducts = getFilteredProducts();
    return allProducts.find((item) => String(item.id) === id);
  }, [id]);

  useEffect(() => {
    if (session?.user?.id && product) {
      setSaved(isProductSaved(session.user.id, product.id));
    }
  }, [session?.user?.id, product]);

  if (!product) {
    return (
      <div className="min-h-dvh bg-slate-950 px-4 pb-8 pt-[calc(5.25rem+env(safe-area-inset-top))] text-white sm:px-6 sm:py-24">
        <TopBar />
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/70 p-6 text-center sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Product not found</h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            This product may have been removed from the catalog.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block min-h-[48px] rounded-md bg-cyan-500 px-5 py-3 text-base font-semibold text-slate-950 touch-action-manipulation"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleBuy = () => {
    if (!session) {
      setPurchaseState("needs-account");
      return;
    }
    const orderId = addOrder(session.user.id, {
      productId: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
    });
    setActiveOrderId(orderId);
    setPurchaseState("purchased");
  };

  const handleTrack = () => {
    const code = `PF-${product.id}-${Date.now().toString().slice(-6)}`;
    setTrackingCode(code);
    if (session?.user?.id && activeOrderId) {
      updateOrderTracking(session.user.id, activeOrderId, code);
    }
    setPurchaseState("tracking");
  };

  const handleSaveToggle = () => {
    if (!session?.user?.id) {
      setPurchaseState("needs-account");
      return;
    }
    const next = toggleSavedProduct(session.user.id, product);
    setSaved(next.some((p) => p.id === product.id));
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(5.25rem+env(safe-area-inset-top))] text-white sm:px-6 md:px-12 md:py-24">
      <TopBar />
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-4 inline-flex min-h-[44px] items-center rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100 touch-action-manipulation hover:border-cyan-400 sm:mb-6"
        >
          Back to products
        </Link>

        <div className="grid gap-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-2xl sm:gap-8 sm:p-6 md:grid-cols-2 md:p-8">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="aspect-square w-full rounded-xl object-cover sm:aspect-auto sm:max-h-[28rem] sm:h-80 md:h-96"
          />

          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              {product.title}
            </h1>
            <p className="text-lg text-cyan-300 sm:text-xl">${product.price}</p>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              {product.description ||
                "Premium quality piece from Pick Fashion's catalog."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleBuy}
                className="touch-action-manipulation min-h-[48px] rounded-md bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={handleSaveToggle}
                className={`touch-action-manipulation min-h-[48px] rounded-md border px-6 py-3 text-base font-semibold transition ${
                  saved
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                    : "border-slate-500 text-slate-200 hover:border-cyan-400"
                }`}
              >
                {saved ? "Saved" : "Save for later"}
              </button>
            </div>

            {purchaseState === "needs-account" && (
              <div className="space-y-3 rounded-md border border-amber-300/40 bg-amber-300/10 p-4 text-amber-200">
                <p className="text-sm sm:text-base">
                  Sign in or create an account to buy or save this product.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Link
                    to="/login"
                    className="touch-action-manipulation inline-flex min-h-[48px] items-center justify-center rounded-md border border-amber-200/60 px-4 py-2 text-center text-sm font-semibold text-amber-100 hover:bg-amber-200/20"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="touch-action-manipulation inline-flex min-h-[48px] items-center justify-center rounded-md bg-amber-200 px-4 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-amber-100"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}

            {(purchaseState === "purchased" || purchaseState === "tracking") && (
              <div className="space-y-3 rounded-md border border-emerald-300/30 bg-emerald-300/10 p-4">
                <p className="text-sm text-emerald-200 sm:text-base">
                  Purchase successful. You can now track this order.
                </p>
                <button
                  type="button"
                  onClick={handleTrack}
                  className="touch-action-manipulation min-h-[48px] rounded-md border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20 sm:min-h-[44px]"
                >
                  Track Product
                </button>
                {trackingCode && (
                  <p className="break-all text-sm text-emerald-100">
                    Tracking code:{" "}
                    <span className="font-semibold">{trackingCode}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
