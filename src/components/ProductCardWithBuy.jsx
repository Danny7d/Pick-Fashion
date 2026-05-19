// Simple Product Card with Buy Button
import { useState } from "react";
import { formatMoney } from "./currency";
import TelegramCheckout from "./TelegramCheckout";

// Example product - replace with your actual product data
const exampleProduct = {
  id: "prod_123",
  title: "Classic White T-Shirt",
  price: 25.0,
  thumbnail: "/images/tshirt.jpg",
  description: "Premium cotton t-shirt",
};

export default function ProductCardWithBuy({ product = exampleProduct }) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="motion-card group relative overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-lg shadow-orange-100/30 hover:shadow-xl hover:shadow-orange-200/40">
      {/* Product Image */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="aspect-[4/3] w-full object-cover"
      />

      {/* Product Info */}
      <div className="p-4">
        <h3 className="truncate text-lg font-bold text-gray-800">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>

        {/* Price and Buy Button */}
        <div className="mt-3 flex items-center justify-between">
          <span className="price-chip text-xl">
            {formatMoney(product.price)}
          </span>
          
          <button
            onClick={() => setShowCheckout(true)}
            className="motion-button animated-sheen rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white hover:from-orange-600 hover:to-amber-600"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Simple Checkout Modal */}
      {showCheckout && (
        <TelegramCheckout
          product={product}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => console.log("Order completed")}
        />
      )}
    </div>
  );
}
