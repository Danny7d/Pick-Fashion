import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getFilteredProducts } from "./productUtils";
import TopBar from "./TopBar";

function AllProducts() {
  const allProducts = useMemo(() => getFilteredProducts(), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-gray-950 text-white">
      <TopBar brandOpacity={1} />

      <div className="px-4 pb-24 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-8 md:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              All Products
            </h1>
            <Link
              to="/"
              className="text-sm text-cyan-400 transition-colors hover:text-cyan-300 sm:text-base"
            >
              ← Back to Home
            </Link>
          </div>

          <p className="mb-6 text-slate-400 sm:mb-8">
            Showing all {allProducts.length} products
          </p>

          {/* Mobile: 2 columns, Desktop: 3-4 columns */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {allProducts.map((item) => (
              <Link
                to={`/product/${item.id}`}
                key={`${item.id}-${item.title}`}
                className="group touch-action-manipulation overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80 shadow-lg backdrop-blur-sm transition-all duration-300 active:scale-[0.99] sm:rounded-2xl sm:shadow-xl sm:hover:-translate-y-1 sm:hover:border-cyan-400/60"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-auto sm:h-40 md:h-48"
                />
                <div className="space-y-1 p-2 sm:space-y-2 sm:p-4">
                  <h3 className="truncate text-sm font-bold text-white sm:text-base">
                    {item.title}
                  </h3>
                  {/* Truncated description with ... on mobile */}
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-300 sm:line-clamp-3 sm:text-sm">
                    {item.description ||
                      "Premium quality item crafted for everyday style and comfort."}
                  </p>
                  <p className="text-xs font-semibold text-cyan-300 sm:text-sm">
                    ${item.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllProducts;
