import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import Navbar from "./Navbar";
import Foot from "./Foot";
import {
  getCart,
  updateQuantity,
  removeFromCart,
  getCartTotal,
} from "../../store/cartStore";

function Cart() {
  const [items, setItems] = useState([]);

  const refresh = () => setItems(getCart());

  useEffect(() => {
    refresh();
    window.addEventListener("cartchange", refresh);
    window.addEventListener("storage", refresh); // cross-tab updates
    return () => {
      window.removeEventListener("cartchange", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const subtotal = getCartTotal();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <div className="sticky top-0 z-50 bg-white">
        <Navbar />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Your Cart {itemCount > 0 && `(${itemCount})`}
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center border border-dashed border-gray-300 rounded-2xl py-20">
            <ShoppingBag size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Your cart is empty
            </p>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              Browse products and add something you like.
            </p>
            <Link
              to="/"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Item list */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border border-gray-200 rounded-2xl p-4 bg-white"
                >
                  <img
                    src={
                      item.image_path
                        ? `http://localhost:4000${item.image_path}`
                        : "https://placehold.co/200x200?text=No+Image"
                    }
                    alt={item.product_name}
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ₹{item.price} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock_quantity}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-white sticky top-24">
              <h2 className="font-semibold text-gray-800 mb-4">
                Order Summary
              </h2>

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900 mb-5">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <Link
                to="/checkout"
                className="w-full block text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Proceed to Buy
              </Link>
            </div>
          </div>
        )}
      </div>

      <Foot />
    </>
  );
}

export default Cart;