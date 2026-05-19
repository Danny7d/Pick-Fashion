import { useState } from "react";
import { formatMoney } from "./currency";

// Simple Buy Button that redirects to Telegram with full product details
// No database storage, no forms - just direct contact

function SimpleTelegramBuy({ product }) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Your Telegram bot username
  const TELEGRAM_USERNAME = "Pick_Fashion_bot"; // Your bot handle

  const generateTelegramMessage = () => {
    const message = `🛒 *New Order Inquiry*

📦 *Product:* ${product.title}
💰 *Price:* ${formatMoney(product.price)}
📝 *Description:* ${product.description || "No description available"}

🔗 *Product Link:* ${window.location.origin}/product/${product.id}

---

Hello! I'm interested in buying this product. Please contact me to complete the order.`;

    return encodeURIComponent(message);
  };

  const handleBuyClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    const telegramUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${generateTelegramMessage()}`;
    window.open(telegramUrl, "_blank");
    setShowConfirmation(false);
  };

  return (
    <>
      {/* Buy Button */}
      <button
        onClick={handleBuyClick}
        className="motion-button w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white"
      >
        Buy on Telegram
      </button>

      {/* Simple Confirmation Modal */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setShowConfirmation(false)
          }
        >
          <div className="motion-scale-in w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <div className="mb-4 text-5xl">💬</div>

            <h3 className="mb-2 text-xl font-bold text-white">
              Continue on Telegram?
            </h3>

            <p className="mb-6 text-sm text-slate-400">
              We&apos;ll send the product details to @{TELEGRAM_USERNAME} and
              you can complete your order there.
            </p>

            <div className="mb-4 rounded-lg bg-slate-800 p-3 text-left">
              <p className="text-xs text-slate-500">Product:</p>
              <p className="font-semibold text-white">{product.title}</p>
              <p className="text-cyan-400">{formatMoney(product.price)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 py-3 font-semibold text-slate-300 transition-all hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-blue-500 py-3 font-semibold text-white transition-all hover:bg-blue-600"
              >
                Open Telegram
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Even simpler version - just a direct link, no modal
function DirectTelegramBuy({ product, className = "" }) {
  const TELEGRAM_USERNAME = "Pick_Fashion_bot"; // Your bot handle

  // For bots, we use ?start parameter with encoded data
  const telegramUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(
    `🛒 Order Inquiry: ${product.title}
💰 Price: ${formatMoney(product.price)}
📍 View: ${window.location.origin}/product/${product.id}

Hi! I want to buy this.`,
  )}`;

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`motion-button inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 ${className}`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
      Buy on Telegram
    </a>
  );
}

// Product card with Telegram buy button
function ProductCardWithTelegramBuy({ product }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl">
      <img
        src={product.thumbnail}
        alt={product.title}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="p-4">
        <h3 className="truncate text-lg font-bold text-white">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-slate-400 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="price-chip text-lg">
            {formatMoney(product.price)}
          </span>
          <DirectTelegramBuy product={product} className="px-4 py-2 text-sm" />
        </div>
      </div>
    </div>
  );
}

// Product detail page with large Telegram buy button
function ProductDetailWithTelegramBuy({ product }) {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-4 md:flex-row md:p-8">
      <div className="flex-1">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-full rounded-2xl object-cover"
        />
      </div>
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold text-white">{product.title}</h1>
        <p className="price-chip text-2xl">{formatMoney(product.price)}</p>
        <p className="text-slate-400 leading-relaxed">{product.description}</p>

        <DirectTelegramBuy product={product} className="w-full py-4 text-lg" />

        <div className="rounded-lg bg-slate-800/50 p-4 text-sm text-slate-400 space-y-1">
          <p>📦 How to order:</p>
          <p>1. Click "Buy on Telegram"</p>
          <p>2. Send us the pre-filled message</p>
          <p>3. We&apos;ll contact you to arrange delivery</p>
          <p>4. Pay on delivery or via Telebirr</p>
        </div>
      </div>
    </div>
  );
}

export {
  SimpleTelegramBuy,
  DirectTelegramBuy,
  ProductCardWithTelegramBuy,
  ProductDetailWithTelegramBuy,
};
export default DirectTelegramBuy;
