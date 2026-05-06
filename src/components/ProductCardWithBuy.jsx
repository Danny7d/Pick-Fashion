// Example: How to add Buy button to your existing ProductCard component

import { useState } from "react";
import TelegramCheckout from "./TelegramCheckout";

// Example product data structure (adjust to match your data)
const exampleProduct = {
  id: "prod_123",
  title: "Classic White T-Shirt",
  price: 25.0,
  thumbnail: "/images/tshirt.jpg",
  description: "Premium cotton t-shirt",
  // ... other fields
};

function ProductCardWithBuy({ product = exampleProduct }) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl">
      {/* Product Image */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="aspect-[4/3] w-full object-cover"
      />

      {/* Product Info */}
      <div className="p-4">
        <h3 className="truncate text-lg font-bold text-white">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-slate-400 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-cyan-400">
            ${product.price}
          </span>

          {/* BUY BUTTON */}
          <button
            onClick={() => setShowCheckout(true)}
            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <TelegramCheckout
          product={product}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderId) => {
            console.log("✅ Order created:", orderId);
            // Optional: Show success toast, redirect to orders page, etc.
          }}
        />
      )}
    </div>
  );
}

// Example: Adding to existing Product Detail Page
function ProductDetailPage({ product }) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row gap-8 p-4 md:p-8">
      {/* Left: Product Image */}
      <div className="flex-1">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-full rounded-2xl object-cover"
        />
      </div>

      {/* Right: Product Info */}
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold text-white">{product.title}</h1>
        <p className="text-xl text-cyan-400">${product.price}</p>
        <p className="text-slate-400">{product.description}</p>

        {/* BUY BUTTON - Full Width */}
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Buy Now - ${product.price}
        </button>

        {/* Additional Info */}
        <div className="rounded-lg bg-slate-800/50 p-4 text-sm text-slate-400">
          <p>📦 Free delivery in Addis Ababa</p>
          <p>💬 Order confirmation via Telegram</p>
          <p>⏱️ Usually delivered within 24-48 hours</p>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <TelegramCheckout
          product={product}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            // Redirect to orders page after successful order
            window.location.href = "/orders";
          }}
        />
      )}
    </div>
  );
}

// Add "My Orders" link to your TopBar
function TopBarWithOrders() {
  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-slate-900">
      <a href="/" className="text-xl font-bold text-white">
        Pick Fashion
      </a>

      <div className="flex items-center gap-4">
        <a href="/orders" className="text-slate-300 hover:text-white">
          My Orders
        </a>
        <a href="/profile" className="text-slate-300 hover:text-white">
          Profile
        </a>
      </div>
    </nav>
  );
}

export { ProductCardWithBuy, ProductDetailPage, TopBarWithOrders };
export default ProductCardWithBuy;
