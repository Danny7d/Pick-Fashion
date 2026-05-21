import { Link } from "react-router-dom";

function BrandHomeLink() {
  return (
    <header className="fixed left-0 top-0 z-40 px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 md:px-8">
      <Link
        to="/"
        className="touch-action-manipulation text-xl font-black tracking-tight text-white drop-shadow-md transition hover:text-cyan-200 sm:text-2xl md:text-3xl inline-flex min-h-[44px] items-center"
      >
        Pick Fashion
      </Link>
    </header>
  );
}

export default BrandHomeLink;
