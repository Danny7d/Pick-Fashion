import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserAuth } from "./context/AuthContext";
import { getFilteredProducts } from "./productUtils";
import TopBar from "./TopBar";
import { isProductSaved, toggleSavedProduct } from "./userData";

function ProductDetail() {
  const { id } = useParams();
  const { session } = UserAuth();
  const [saved, setSaved] = useState(false);
  const [showTelegramConfirm, setShowTelegramConfirm] = useState(false);

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
      <div className="min-h-dvh bg-[#FDF8F3] px-4 pb-8 pt-[calc(5.25rem+env(safe-area-inset-top))] text-gray-800 sm:px-6 sm:py-24">
        <TopBar />
        <div className="mx-auto max-w-3xl rounded-2xl border border-orange-100 bg-white/95 p-6 text-center shadow-lg shadow-orange-100/30 sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Product not found</h1>
          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            This product may have been removed from the catalog.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block min-h-[48px] rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-base font-semibold text-white shadow-md touch-action-manipulation"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const TELEGRAM_BOT = "Pick_Fashion_bot";

  const handleBuy = () => {
    if (!session) {
      setShowTelegramConfirm("needs-account");
      return;
    }
    setShowTelegramConfirm(true);
  };

  const handleConfirmTelegram = () => {
    const message = encodeURIComponent(
      `🛒 Order Inquiry: ${product.title}\n` +
        `💰 Price: $${product.price}\n` +
        `📍 View: ${window.location.origin}/product/${product.id}\n\n` +
        `Hi! I want to buy this product.`,
    );
    window.open(`https://t.me/${TELEGRAM_BOT}?text=${message}`, "_blank");
    setShowTelegramConfirm(false);
  };

  const handleSaveToggle = () => {
    if (!session?.user?.id) {
      setShowTelegramConfirm("needs-account");
      return;
    }
    const next = toggleSavedProduct(session.user.id, product);
    setSaved(next.some((p) => p.id === product.id));
  };

  return (
    <div className="min-h-dvh bg-[#FDF8F3] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(5.25rem+env(safe-area-inset-top))] text-gray-800 sm:px-6 md:px-12 md:py-24">
      <TopBar />
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="mb-4 inline-flex min-h-[44px] items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 touch-action-manipulation hover:border-orange-400 hover:text-orange-500 sm:mb-6"
        >
          Back to products
        </Link>

        <div className="grid gap-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-lg shadow-orange-100/30 sm:gap-8 sm:p-6 md:grid-cols-2 md:p-8">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="aspect-square w-full rounded-xl object-cover sm:aspect-auto sm:max-h-[28rem] sm:h-80 md:h-96"
          />

          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              {product.title}
            </h1>
            <p className="text-lg text-orange-500 sm:text-xl">
              ${product.price}
            </p>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              {product.description ||
                "Premium quality piece from Pick Fashion's catalog."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleBuy}
                className="touch-action-manipulation min-h-[48px] rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-base font-semibold text-white shadow-md hover:shadow-lg"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={handleSaveToggle}
                className={`touch-action-manipulation min-h-[48px] rounded-md border px-6 py-3 text-base font-semibold transition ${
                  saved
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-300 text-gray-600 hover:border-orange-400"
                }`}
              >
                {saved ? "Saved" : "Save for later"}
              </button>
            </div>

            {showTelegramConfirm === "needs-account" && (
              <div className="space-y-3 rounded-md border border-orange-300/40 bg-orange-50/80 p-4 text-orange-800">
                <p className="text-sm sm:text-base">
                  Sign in or create an account to buy or save this product.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Link
                    to="/login"
                    className="touch-action-manipulation inline-flex min-h-[48px] items-center justify-center rounded-md border border-orange-300/60 px-4 py-2 text-center text-sm font-semibold text-orange-700 hover:bg-orange-100/50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="touch-action-manipulation inline-flex min-h-[48px] items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-md hover:shadow-lg"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}

            {showTelegramConfirm === true && (
              <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/80 p-5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">💬</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Continue on Telegram?
                    </h3>
                    <p className="text-sm text-gray-500">
                      We&apos;ll send the product details to @{TELEGRAM_BOT}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white/80 p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Product:</p>
                  <p className="font-semibold text-gray-800">{product.title}</p>
                  <p className="text-orange-500">${product.price}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTelegramConfirm(false)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmTelegram}
                    className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    Open Telegram
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
