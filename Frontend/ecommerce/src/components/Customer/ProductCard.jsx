import { useState } from "react";
import { Star, ShoppingCart } from "lucide-react";
import { addToCart } from "../../store/cartStore";

function ProductCard({ product }) {
  const {
    product_name,
    description,
    price,
    stock_quantity,
    rating,
    image_path,
  } = product;

  const [added, setAdded] = useState(false);
  const outOfStock = stock_quantity <= 0;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product);
    window.location.href = "/cart";
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-shadow flex flex-col">
      <img
        src={
          image_path
            ? `http://localhost:4000${image_path}`
            : "https://placehold.co/400x400?text=No+Image"
        }
        alt={product_name}
        className="w-full h-72 object-cover"
      />

      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {product_name}
        </h3>

        <p className="text-sm text-gray-500 line-clamp-2">{description}</p>

        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={18}
              className={
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-200"
              }
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xl font-bold text-gray-900">₹{price}</span>
          <span className="text-sm text-gray-400">
            {stock_quantity > 0 ? `${stock_quantity} in stock` : "Out of stock"}
          </span>
        </div>

        {/* Buttons pinned to the bottom so cards with shorter descriptions still line up */}
        <div className="flex items-center gap-2 mt-auto pt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              outOfStock
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-purple-600 text-purple-600 hover:bg-purple-50"
            }`}
          >
            <ShoppingCart size={16} strokeWidth={2.25} />
            {added ? "Added!" : "Add to Cart"}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
              outOfStock
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {outOfStock ? "Out of Stock" : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;