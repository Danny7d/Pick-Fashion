import React, { useState, useEffect } from "react";

function SearchBar({
  products = [],
  onSearchResults,
  placeholder = "Search products...",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchTerm.trim() === "") {
      onSearchResults(products);
      return;
    }

    const timer = setTimeout(() => {
      const filtered = products.filter((product) => {
        const term = searchTerm.toLowerCase();
        const titleMatch = product.title?.toLowerCase().includes(term);
        const descriptionMatch = product.description
          ?.toLowerCase()
          .includes(term);
        return titleMatch || descriptionMatch;
      });

      onSearchResults(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, products, onSearchResults]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
          placeholder={placeholder}
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={handleClear}
              className="mr-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
