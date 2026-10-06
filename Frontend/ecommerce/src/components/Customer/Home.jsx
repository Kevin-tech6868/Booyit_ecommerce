import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Elements from "./Elements";
import Foot from "./Foot";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";

import BooyitAd from "../../assets/Booyit_ad.png";
import FashionBanner from "../../assets/Fashion.png";
import MobilesBanner from "../../assets/Mobiles.png";
import ElectronicsBanner from "../../assets/Electronics.png";
import BeautyBanner from "../../assets/Beauty.png";
import DecorBanner from "../../assets/Decor.png";
import SportsBanner from "../../assets/Sports.png";
import ToysBanner from "../../assets/Toys.png";

// Navbar is h-20 (80px) + 1px border
const NAVBAR_HEIGHT = "81px";

// Order of the slides. `to` is the page each banner links to.
const slides = [
  { src: BooyitAd, alt: "Booyit: everything you need, all in one place", fit: "contain" },
  { src: FashionBanner, alt: "Fashion: style that fits you", to: "/fashion" },
  { src: MobilesBanner, alt: "Mobiles: the latest in your hands", to: "/mobiles" },
  { src: ElectronicsBanner, alt: "Electronics: power your everyday", to: "/electronics" },
  { src: BeautyBanner, alt: "Beauty: be you naturally", to: "/beauty" },
  { src: DecorBanner, alt: "Home and kitchen: make your home more you", to: "/decor" },
  { src: SportsBanner, alt: "Sports: gear up for more", to: "/sports" },
  { src: ToysBanner, alt: "Toys: big smiles for little moments", to: "/toys" },
];

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/products/recommended")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch(() => setError("Failed to load recommendations."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Sticky navbar */}
      <div className="sticky top-0 z-50 bg-white">
        <Navbar />
      </div>

      <div className="flex items-start">
        {/* Sticky sidebar: sits just below the navbar and scrolls on its own if it's taller than the screen */}
        <div
          className="sticky shrink-0 overflow-y-auto bg-white"
          style={{
            top: NAVBAR_HEIGHT,
            height: `calc(100vh - ${NAVBAR_HEIGHT})`,
          }}
        >
          <Elements />
        </div>

        <div className="flex-1 min-w-0 p-4">
          {/* Banner slider */}
          <div className="w-full max-w-7xl mx-auto">
            <BannerSlider slides={slides} interval={4000} />
          </div>

          {/* For You section */}
          <section className="mt-8 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">
              For You
            </h2>

            {loading && (
              <p className="text-sm text-gray-500">Loading recommendations...</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !error && products.length === 0 && (
              <p className="text-sm text-gray-500">
                No products yet — upload some from the admin page.
              </p>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Foot />
    </>
  );
}

export default Home;