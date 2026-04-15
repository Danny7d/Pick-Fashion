import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Kids from "./nav/Kids";
import Women from "./nav/Women";
import Men from "./nav/Men";
import backgroundImage from "../assets/background/background.jpg";
import aloHats from "../assets/Alo Yoga baseball cap.jpeg";
import DiorSauvage from "../assets/DiorSauvage.jpg";
import NBshow from "../assets/NB show.jpg";

const products = [
  {
    image: aloHats,
    name: "Alo Performance Off-Duty Cap",
    description:
      "Get your head in the game in the Performance Off-Duty Hat. It's our classic silhouette-designed with a curved brim and close fit-but done in a durable, sweat-wicking performance fabric. Plus, it's finished with a velcro strap to adjust the fit.",
  },
  {
    image: DiorSauvage,
    name: "Dior Sauvage",
    description:
      "Premium yoga-inspired baseball cap designed for comfort and style during your practice and daily activities.",
  },
  {
    image: NBshow,
    name: "NB Shoe",
    description:
      "The 9060 is a new expression of the refined style and innovation-led design of the classic 99X series. The 9060 reinterprets familiar 99X elements with a warped sensibility inspired by the proudly futuristic, visible tech aesthetic of the Y2K era. Sway bars, taken from the 990, are expanded and utilized throughout the entire upper for a sense of visible motion, while wavy lines and scaled up proportions on a sculpted pod midsole place an exaggerated emphasis on the familiar cushioning platforms of ABZORB and SBS.",
  },
];

function Home() {
  const [currentProduct, setCurrentProduct] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProduct((prev) => (prev + 1) % products.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const product = products[currentProduct];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <Link
        to="/"
        className="text-blue-500 inline-flex text-4xl font-bold mt-4 ml-4 bg-white bg-opacity-80 px-4 py-2 rounded"
      >
        Pick Fashion
      </Link>

      <div className="flex mt-32">
        <div className="flex gap-8">
          {/* Product name on the left */}
          <div className="text-left max-w-md ml-auto">
            <div className="relative ml-12">
              <h2 className="text-white text-5xl font-black mb-4 tracking-wider">
                <span className="relative z-10">{product.name}</span>
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent blur-sm">
                  {product.name}
                </span>
              </h2>
            </div>
            <div className="relative group ml-8">
              <p className="text-white text-base leading-relaxed p-6 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl border border-gray-700">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-20 rounded-2xl blur-xl"></span>
                <span className="relative z-10 font-light tracking-wide">
                  {product.description}
                </span>
              </p>
            </div>
          </div>

          {/* Circular image on the right */}
          <div className="w-96 h-96 fixed right-32 top-1/2 transform -translate-y-1/2 rounded-full overflow-hidden">
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-black opacity-30"></div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
