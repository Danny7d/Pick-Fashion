import { useState } from "react";
import { supabase } from "./supabaseClient";

function TelegramCheckout({ product, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);

  const total = (product.price * quantity).toFixed(2);

  // Generate Telegram deep link with order info
  const generateTelegramLink = (orderId) => {
    const message = encodeURIComponent(
      `🛒 New Order from Pick Fashion\n\n` +
      `📦 Product: ${product.title}\n` +
      `💰 Price: $${total}\n` +
      `📊 Quantity: ${quantity}\n` +
      `🆔 Order ID: ${orderId}\n` +
      `📱 Phone: ${phone}\n` +
      `💬 Telegram: @${telegram}\n\n` +
      `Please confirm my order!`
    );

    // Use your Telegram handle (admin account)
    const adminTelegram = "Rutha_5"; // Change to your actual Telegram username
    
    return `https://t.me/${adminTelegram}?text=${message}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phone || !telegram) {
      setError("Please fill in all fields");
      return;
    }

    // Ethiopian phone validation
    const phoneClean = phone.replace(/\s/g, "");
    if (!phoneClean.match(/^(\+251|0)?[0-9]{9}$/)) {
      setError("Please enter a valid Ethiopian phone number (+251 9XX XXX XXX)");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Please login first to place an order");
        setLoading(false);
        return;
      }

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          product_id: product.id,
          product_name: product.title,
          product_image: product.thumbnail,
          quantity: quantity,
          unit_price: product.price,
          total_amount: parseFloat(total),
          phone_number: phone,
          telegram_handle: telegram.replace("@", ""),
          status: "pending_manual"
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      setOrderId(order.id);
      setStep(2);
      onSuccess?.(order.id);

    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.message || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToTelegram = () => {
    if (orderId) {
      const telegramLink = generateTelegramLink(orderId);
      window.open(telegramLink, "_blank");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {step === 1 ? "Order Details" : "Complete Order"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: Order Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Summary */}
            <div className="mb-4 flex gap-3 rounded-lg bg-slate-800 p-3">
              <img 
                src={product.thumbnail} 
                alt={product.title}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white line-clamp-1">{product.title}</h3>
                <p className="text-cyan-400">${product.price}</p>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-8 text-center text-lg font-semibold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 395 0321"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                We&apos;ll contact you for delivery
              </p>
            </div>

            {/* Telegram */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Telegram Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-500">@</span>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value.replace("@", ""))}
                  placeholder="your_username"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 py-3 pl-8 pr-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                We&apos;ll send order updates via Telegram
              </p>
            </div>

            {/* Total */}
            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total:</span>
                <span className="text-cyan-400">${total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Creating Order..." : "Place Order"}
            </button>
          </form>
        )}

        {/* Step 2: Telegram Redirect */}
        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <svg className="h-8 w-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Order Created!</h3>
              <p className="mt-1 text-sm text-slate-400">
                Order ID: <span className="font-mono text-cyan-400">{orderId?.slice(0, 8)}</span>
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4 text-left">
              <p className="text-sm text-slate-300">
                Next step: Send us your order details on Telegram for confirmation.
              </p>
            </div>

            <button
              onClick={handleGoToTelegram}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Continue on Telegram
            </button>

            <button
              onClick={onClose}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-3 font-semibold text-slate-300 transition-all hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelegramCheckout;
