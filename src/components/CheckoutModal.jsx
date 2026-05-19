import { useState } from "react";
import { formatMoney } from "./currency";
import { supabase } from "./supabaseClient";

function CheckoutModal({ cart, total, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: contact info, 2: payment method
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("chapa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [telebirrInstructions, setTelebirrInstructions] = useState(null);

  const handleSubmitContact = (e) => {
    e.preventDefault();
    if (!phone || !telegram) {
      setError("Please fill in all fields");
      return;
    }
    // Basic phone validation for Ethiopia
    if (!phone.match(/^(\+251|0)?[0-9]{9}$/)) {
      setError("Please enter a valid Ethiopian phone number");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setError("");

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      // Prepare cart items
      const items = cart.map(item => ({
        product_id: item.id,
        name: item.title,
        quantity: item.quantity || 1,
        unit_price: item.price
      }));

      // Call Edge Function to create payment session
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-payment-session",
        {
          body: {
            items,
            total_amount: total,
            phone_number: phone,
            telegram_handle: telegram,
            payment_method: paymentMethod,
            return_url: `${window.location.origin}/payment-success`
          }
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to create order");
      }

      // Handle Chapa - redirect to checkout
      if (paymentMethod === "chapa" && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      // Handle Telebirr - show instructions
      if (paymentMethod === "telebirr" && data.instructions) {
        setTelebirrInstructions(data.instructions);
        return;
      }

      onSuccess(data.order_id);
      onClose();

    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to process checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Close modal on outside click
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
      <div className="motion-scale-in w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {step === 1 ? "Checkout" : "Payment Method"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
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

        {/* Step 1: Contact Info */}
        {step === 1 && (
          <form onSubmit={handleSubmitContact} className="space-y-4">
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
                Format: +251 9XX XXX XXX or 09XX XXX XXX
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Telegram Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value.replace("@", ""))}
                placeholder="username"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                We&apos;ll contact you on Telegram for order updates
              </p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-400">Items:</span>
                <span className="text-white">{cart.length}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total:</span>
                <span className="text-cyan-400">{formatMoney(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="motion-button animated-sheen w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white"
            >
              Continue to Payment
            </button>
          </form>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && !telebirrInstructions && (
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Chapa Option */}
              <label
                className={`motion-button flex cursor-pointer items-center gap-4 rounded-lg border p-4 ${
                  paymentMethod === "chapa"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-600 bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="chapa"
                  checked={paymentMethod === "chapa"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 accent-cyan-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-white">Pay with Chapa</p>
                  <p className="text-sm text-slate-400">Card, Bank, Mobile Money</p>
                </div>
                <div className="text-2xl">💳</div>
              </label>

              {/* Telebirr Option */}
              <label
                className={`motion-button flex cursor-pointer items-center gap-4 rounded-lg border p-4 ${
                  paymentMethod === "telebirr"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-600 bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="telebirr"
                  checked={paymentMethod === "telebirr"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 accent-cyan-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-white">Pay with Telebirr</p>
                  <p className="text-sm text-slate-400">Manual transfer with reference</p>
                </div>
                <div className="text-2xl">📱</div>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="motion-button flex-1 rounded-lg border border-slate-600 bg-slate-800 py-3 font-semibold text-slate-300 hover:bg-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="motion-button flex-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        )}

        {/* Telebirr Instructions */}
        {telebirrInstructions && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-500/10 p-4">
              <h3 className="mb-3 font-semibold text-blue-400">
                Complete Payment via Telebirr
              </h3>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                <li>{telebirrInstructions.step1}</li>
                <li>{telebirrInstructions.step2}</li>
                <li className="font-semibold text-cyan-400">
                  {telebirrInstructions.step3}
                </li>
                <li>{telebirrInstructions.step4}</li>
              </ol>
              
              <div className="mt-4 rounded-lg bg-slate-800 p-3 text-center">
                <p className="text-xs text-slate-500">Your Reference Code</p>
                <p className="text-lg font-mono font-bold text-cyan-400">
                  {telebirrInstructions.reference}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                window.location.href = "/orders";
              }}
              className="motion-button w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white"
            >
              View My Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
