import { useState } from "react";
import { Star, X, ImagePlus } from "lucide-react";

function AdminProductForm() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState(null); // { type: "success" | "error", message: string }
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = [
    { label: "Fashion", value: "fashion" },
    { label: "Mobiles", value: "mobiles" },
    { label: "Electronics", value: "electronics" },
    { label: "Beauty", value: "beauty" },
    { label: "Decor", value: "decor" },
    { label: "Toys", value: "toys" },
    { label: "Sports", value: "sports" },
    { label: "Furniture", value: "furniture" },
  ];

  const handleStockChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setStockQuantity(value);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const resetForm = () => {
    setProductName("");
    setDescription("");
    setCategory("");
    setRating(0);
    setPrice("");
    setStockQuantity("");
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);

    // Using FormData (not JSON) because we're sending an actual image file
    // alongside the text fields — the backend's multer middleware expects
    // multipart/form-data, not application/json.
    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("stockQuantity", stockQuantity);
    formData.append("rating", rating);
    if (images[0]) {
      formData.append("image", images[0].file); // one image per product, matches upload.single("image")
    }

    try {
      const res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        body: formData, // no Content-Type header — browser sets the multipart boundary automatically
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload product.");
      }

      setStatus({ type: "success", message: "Product uploaded successfully!" });
      resetForm();
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Add New Product
      </h2>

      {status && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Product Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Product Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description"
            rows={4}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            required
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Product Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Star Rating */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Product Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={26}
                  className={
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                {rating} / 5
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Product Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              ₹
            </span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        {/* Stock Quantity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Stock Quantity
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={stockQuantity}
            onChange={handleStockChange}
            placeholder="Enter available stock"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Image Upload (multiple selectable, only the first is sent) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Product Image{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          <label
            htmlFor="product-images"
            className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors w-fit"
          >
            <ImagePlus size={18} className="text-purple-600" />
            Add image
          </label>
          <input
            id="product-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={img.previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-purple-600/90 text-white text-[10px] text-center py-0.5">
                      Used
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <p className="text-xs text-gray-400">
              No image selected yet — you can upload one, or skip this.
            </p>
          )}
          {images.length > 1 && (
            <p className="text-xs text-amber-600">
              Only the first image (marked "Used") is uploaded — the backend
              currently stores one image per product.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {submitting ? "Uploading..." : "Upload Product"}
        </button>
      </form>
    </div>
  );
}

export default AdminProductForm;