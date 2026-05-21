import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFilteredProducts } from "./productUtils";
import TopBar from "./TopBar";

function Home() {
  const [currentProduct, setCurrentProduct] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [narrow, setNarrow] = useState(true);

  const allProducts = useMemo(() => getFilteredProducts(), []);

  useEffect(() => {
    const productInterval = setInterval(() => {
      setCurrentProduct((prev) => (prev + 1) % allProducts.length);
    }, 3500);
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

  const movingBrandStyle = {
    transform: `translate(${50 - scrollProgress * hShift}vw, ${
      52 - scrollProgress * vShift
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
    <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-gray-950 text-white">
      <TopBar brandOpacity={scrollProgress} />

      <div
        className="pointer-events-none fixed left-0 top-0 z-50 transition-transform duration-100"
        style={{
          ...movingBrandStyle,
          opacity: movingBrandFade,
          visibility: movingBrandFade <= 0.01 ? "hidden" : "visible",
        }}
      >
        <Link
          to="/"
          className="pointer-events-auto touch-action-manipulation"
        >
          <h2 className="max-w-[90vw] text-center text-3xl font-black tracking-tight text-white drop-shadow-xl sm:text-5xl md:text-7xl">
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
          <div className="absolute -top-24 left-0 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl sm:h-80 sm:w-80" />
          <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl sm:top-32 sm:h-80 sm:w-80 md:right-10" />
          <div className="absolute bottom-16 left-1/4 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl sm:bottom-20 sm:h-72 sm:w-72 md:left-1/3" />
        </div>
        <div
          className="sticky top-0 flex min-h-[100dvh] items-center"
          style={{ opacity: heroOpacity }}
        >
          <div className="max-w-3xl space-y-5 pt-4 sm:space-y-7 sm:pt-12">
            <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200 sm:px-4 sm:text-xs sm:tracking-[0.2em]">
              Style Marketplace
            </p>
            <p className="text-lg font-medium leading-snug text-slate-100 sm:text-xl md:text-3xl md:leading-tight">
              Discover curated fashion pieces, accessories, and trend-forward
              picks in one place.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base md:text-lg">
              Scroll down to reveal the full catalog with product visuals,
              descriptions, and prices.
            </p>
            <div className="flex items-center gap-3 text-cyan-200/90">
              <span className="flex h-9 w-6 shrink-0 items-start justify-center rounded-full border border-cyan-300/50 p-1">
                <span className="mt-0.5 block h-2 w-2 rounded-full bg-cyan-200 animate-bounce" />
              </span>
              <span className="text-xs uppercase tracking-wider sm:text-sm">
                Scroll to explore
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
          <h2 className="mb-6 text-2xl font-semibold text-slate-100 sm:mb-8 sm:text-3xl">
            All Products ({allProducts.length})
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {allProducts.map((item) => (
              <Link
                to={`/product/${item.id}`}
                key={`${item.id}-${item.title}`}
                className="group touch-action-manipulation overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl backdrop-blur-sm transition-all duration-300 active:scale-[0.99] sm:hover:-translate-y-1 sm:hover:border-cyan-400/60"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 sm:aspect-auto sm:h-52 group-hover:scale-105"
                />
                <div className="space-y-2 p-4 sm:space-y-3 sm:p-5">
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-300 sm:line-clamp-none">
                    {item.description ||
                      "Premium quality item crafted for everyday style and comfort."}
                  </p>
                  <p className="text-sm font-semibold text-cyan-300">
                    ${item.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4 sm:mt-10 sm:p-6">
            <p className="text-xs uppercase tracking-widest text-cyan-300 sm:text-sm">
              Now Highlighting
            </p>
            <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              {product.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
              {product.description ||
                "Limited-time featured product from our curated collection."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
export default Home;
