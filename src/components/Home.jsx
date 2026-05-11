import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFilteredProducts } from "./productUtils";
import TopBar from "./TopBar";

function Home() {
  const [currentProduct, setCurrentProduct] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [narrow, setNarrow] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  const allProducts = useMemo(() => getFilteredProducts(), []);

  useEffect(() => {
    const productInterval = setInterval(() => {
      setCurrentProduct((prev) => (prev + 1) % allProducts.length);
    }, 4000);
    return () => {
      clearInterval(productInterval);
    };
  }, [allProducts.length]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const set = () => setNarrow(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const scrollDivisor = narrow ? 320 : 380;
  const revealStart = narrow ? 160 : 220;
  const revealSpan = narrow ? 280 : 340;
  const scrollProgress = clamp(scrollY / scrollDivisor, 0, 1);
  const revealProgress = clamp((scrollY - revealStart) / revealSpan, 0, 1);
  const heroOpacity = 1 - scrollProgress * 0.6;
  const product = allProducts[currentProduct];

  const hShift = narrow ? 36 : 42;
  const vShift = narrow ? 40 : 45;
  const scaleAmt = narrow ? 0.5 : 0.55;
  // Start higher on mobile to avoid overlapping description
  const startV = narrow ? 38 : 52;

  const movingBrandStyle = {
    transform: `translate(${50 - scrollProgress * hShift}vw, ${
      startV - scrollProgress * vShift
    }vh) translate(-50%, -50%) scale(${1 - scrollProgress * scaleAmt})`,
  };

  const fadeStart = narrow ? 0.78 : 0.82;
  const fadeSpan = narrow ? 0.18 : 0.14;
  const movingBrandFade = clamp(
    1 - (scrollProgress - fadeStart) / fadeSpan,
    0,
    1,
  );

  return (
    <div className="relative bg-[#FDF8F3] text-gray-800 min-h-screen">
      <TopBar brandOpacity={scrollProgress} />

      <div
        className="pointer-events-none fixed left-0 top-0 z-50 transition-transform duration-100"
        style={{
          ...movingBrandStyle,
          opacity: movingBrandFade,
          visibility: movingBrandFade <= 0.01 ? "hidden" : "visible",
        }}
      >
        <Link to="/" className="pointer-events-auto touch-action-manipulation">
          <h2 className="max-w-[90vw] text-center text-3xl sm:mb-32 font-black tracking-tight text-gray-900 drop-shadow-xl sm:text-5xl md:text-7xl">
            Pick Fashion
          </h2>
        </Link>
      </div>

      <section
        className={`relative overflow-hidden px-4 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:px-8 md:px-16 ${
          narrow ? "min-h-[145vh]" : "min-h-[165vh]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-0 h-56 w-56 rounded-full bg-orange-300/30 blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-rose-300/30 blur-3xl sm:top-32 sm:h-80 sm:w-80 md:right-10" />
          <div className="absolute bottom-16 left-1/4 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl sm:bottom-20 sm:h-72 sm:w-72 md:left-1/3" />
        </div>
        <div
          className="sticky top-0 flex min-h-[100dvh] items-center"
          style={{ opacity: heroOpacity }}
        >
          <div className="max-w-3xl space-y-5 pt-4 sm:space-y-7 sm:pt-12">
            <p className="inline-flex rounded-full border border-orange-300/60 bg-orange-50/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-orange-600 sm:px-4 sm:text-xs sm:tracking-[0.2em]">
              Style Marketplace
            </p>
            <p className="text-lg font-medium leading-snug text-gray-800 sm:text-xl md:text-3xl md:leading-tight">
              Discover curated fashion pieces, accessories, and trend-forward
              picks in one place.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base md:text-lg">
              Scroll down to reveal the full catalog with product visuals,
              descriptions, and prices.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-orange-500/25 active:scale-95 sm:px-10 sm:py-4.5 sm:text-lg"
              >
                <svg
                  className="mr-3 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Shop Now
              </Link>
              <a
                href="https://t.me/Rutha_5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border-2 border-orange-400/50 bg-white/80 px-8 py-4 text-base font-bold text-orange-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:bg-orange-50/50 hover:text-orange-700 active:scale-95 sm:px-10 sm:py-4.5 sm:text-lg"
              >
                <svg
                  className="mr-3 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Order via Telegram
              </a>
            </div>

            {/* Trust Signals */}
            <div className="mt-8 rounded-2xl border border-orange-200 bg-white/90 p-4 shadow-lg shadow-orange-100/30 sm:mt-10 sm:p-6">
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Secure Payment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Fast Delivery
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-purple-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    24/7 Support
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-orange-500/90">
              <span className="flex h-9 w-6 shrink-0 items-start justify-center rounded-full border border-orange-400/50 p-1">
                <span className="mt-0.5 block h-2 w-2 rounded-full bg-orange-500 animate-bounce" />
              </span>
              <span className="text-xs uppercase tracking-wider sm:text-sm">
                Scroll to explore more
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="px-4 pb-16 pt-4 sm:px-8 sm:pb-24 md:px-16"
        style={{
          opacity: revealProgress,
          transform: `translateY(${(1 - revealProgress) * 48}px)`,
          transition: "opacity 300ms ease, transform 300ms ease",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-semibold text-gray-800 sm:mb-8 sm:text-3xl">
            Products ({allProducts.length})
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-8">
            {allProducts.slice(0, visibleCount).map((item) => (
              <Link
                to={`/product/${item.id}`}
                key={`${item.id}-${item.title}`}
                className="group touch-action-manipulation overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/50 backdrop-blur-sm transition-all duration-300 active:scale-[0.99] sm:hover:-translate-y-1 sm:hover:border-orange-300/60"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 sm:aspect-auto sm:h-52 group-hover:scale-105"
                />
                <div className="space-y-1 p-2 sm:space-y-2 sm:p-4">
                  <h3 className="truncate text-sm font-bold text-gray-800 sm:text-base md:text-lg">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 sm:line-clamp-3 sm:text-sm">
                    {item.description ||
                      "Premium quality item crafted for everyday style and comfort."}
                  </p>
                  <p className="text-xs font-semibold text-orange-500 sm:text-sm">
                    ${item.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* See More and All Products Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            {visibleCount < allProducts.length && (
              <button
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-orange-500/25 active:scale-95 sm:px-8 sm:py-3.5 sm:text-base"
                onClick={() =>
                  setVisibleCount((prev) =>
                    Math.min(prev + 6, allProducts.length),
                  )
                }
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                See More
              </button>
            )}
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-xl border-2 border-orange-400/50 bg-white/80 px-6 py-3 text-sm font-semibold text-orange-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:bg-orange-50/50 hover:text-orange-700 active:scale-95 sm:px-8 sm:py-3.5 sm:text-base"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              All Products
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-orange-200 bg-white/90 p-4 shadow-lg shadow-orange-100/30 sm:mt-10 sm:p-6">
            <p className="text-xs uppercase tracking-widest text-orange-500 sm:text-sm">
              Now Highlighting
            </p>
            <h3 className="mt-2 text-xl font-bold text-gray-800 sm:text-2xl">
              {product.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 sm:text-base">
              {product.description ||
                "Limited-time featured product from our curated collection."}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <footer className="mt-16 border-t border-gray-200 bg-gray-50 px-6 py-12 sm:mt-20 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            Contact Us
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 sm:text-base">
            We&apos;re here to help you with any questions or orders
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:mt-10 sm:flex-row sm:gap-10">
            {/* Phone */}
            <a
              href="tel:+251913950321"
              className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-md shadow-gray-100/50 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 sm:h-12 sm:w-12">
                <svg
                  className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 sm:text-sm">Phone</p>
                <p className="text-sm font-semibold text-gray-800 sm:text-base">
                  +251 913 950 321
                </p>
              </div>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/Rutha_5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-md shadow-gray-100/50 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 sm:h-12 sm:w-12">
                <svg
                  className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 sm:text-sm">Telegram</p>
                <p className="text-sm font-semibold text-gray-800 sm:text-base">
                  @Rutha_5
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:pickfashionzr@gmail.com"
              className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-md shadow-gray-100/50 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 sm:h-12 sm:w-12">
                <svg
                  className="h-5 w-5 text-violet-500 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 sm:text-sm">Email</p>
                <p className="text-sm font-semibold text-gray-800 sm:text-base">
                  pickfashionzr@gmail.com
                </p>
              </div>
            </a>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center sm:mt-12 sm:pt-8">
            <p className="text-xs text-gray-400 sm:text-sm">
              &copy; {new Date().getFullYear()} Pick Fashion. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default Home;
