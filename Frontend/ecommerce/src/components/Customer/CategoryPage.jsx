import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Elements from "./Elements";
import Foot from "./Foot";
import ProductCard from "./ProductCard";

function CategoryPage({ category, title }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:4000/api/products?category=${category}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch(() => setError(`Failed to load ${title.toLowerCase()} products.`))
      .finally(() => setLoading(false));
  }, [category, title]);

  return (
    <>
      <Navbar />

      <div className="flex">
        <Elements />

        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">{title}</h2>

          {loading && <p className="text-sm text-gray-500">Loading products...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p className="text-sm text-gray-500">
              No {title.toLowerCase()} products yet.
            </p>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Foot />
    </>
  );
}

export default CategoryPage;