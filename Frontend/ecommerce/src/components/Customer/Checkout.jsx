import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Wallet, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import Navbar from "./Navbar";
import Foot from "./Foot";
import { getCart, getCartTotal, clearCart } from "../../store/cartStore";

const paymentOptions = [
  { value: "cod", label: "Cash on Delivery", icon: Truck, desc: "Pay when your order arrives" },
  { value: "upi", label: "UPI", icon: Wallet, desc: "Pay using any UPI app" },
  { value: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
];

// Luhn algorithm — catches most typos/fake card numbers (not whether the card is real or has funds)
function isValidCardNumber(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isExpiryInFuture(expiry) {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

function Checkout() {
  const [items, setItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [payment, setPayment] = useState("cod");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = getCartTotal();

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    // Name: required, letters/spaces only, at least 2 characters
    if (!name) next.name = "Name is required.";
    else if (name.length < 2) next.name = "Name is too short.";
    else if (!/^[A-Za-z\s.'-]+$/.test(name))
      next.name = "Name can only contain letters, spaces, and ' . -";

    // Email
    if (!email) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      next.email = "Enter a valid email address.";

    // Phone: Indian mobile numbers start with 6-9, exactly 10 digits
    if (!phone) next.phone = "Phone number is required.";
    else if (!/^[6-9]\d{9}$/.test(phone))
      next.phone = "Enter a valid 10-digit mobile number.";

    // Address: required, reasonable minimum length so it's not just "a"
    if (!address) next.address = "Address is required.";
    else if (address.length < 10)
      next.address = "Please enter a complete address (at least 10 characters).";

    // Payment-specific validation (UI-only — never sent to the backend)
    if (payment === "upi") {
      const id = upiId.trim();
      if (!id) next.upiId = "UPI ID is required.";
      else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/.test(id))
        next.upiId = "Enter a valid UPI ID, e.g. yourname@bank.";
    }

    if (payment === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (!digits) next.cardNumber = "Card number is required.";
      else if (!/^\d{13,16}$/.test(digits))
        next.cardNumber = "Card number must be 13-16 digits.";
      else if (!isValidCardNumber(digits))
        next.cardNumber = "This card number doesn't look valid.";

      if (!card.expiry) next.cardExpiry = "Expiry date is required.";
      else if (!/^\d{2}\/\d{2}$/.test(card.expiry))
        next.cardExpiry = "Use MM/YY format.";
      else if (!isExpiryInFuture(card.expiry))
        next.cardExpiry = "Card has expired or date is invalid.";

      if (!card.cvv) next.cardCvv = "CVV is required.";
      else if (!/^\d{3,4}$/.test(card.cvv))
        next.cardCvv = "CVV must be 3 or 4 digits.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (items.length === 0) return;
    if (!validate()) return;

    setPlacing(true);

    // Only shipping details + chosen payment mode are sent/stored.
    // Card/UPI details stay in the UI for validation only, never sent anywhere.
    const orderData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      paymentMethod: payment,
      items,
      total: subtotal,
    };

    try {
      const res = await fetch("http://localhost:4000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to place order.");

      clearCart();
      setPlaced(true);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Something went wrong placing your order. Please try again." });
    } finally {
      setPlacing(false);
    }
  }

  const errorCount = Object.keys(errors).filter((k) => k !== "submit").length;

  if (placed) {
    return (
      <>
        <div className="sticky top-0 z-50 bg-white">
          <Navbar />
        </div>
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order placed!</h1>
          <p className="text-sm text-gray-500 mb-6">
            A confirmation would normally be sent to {form.email}.
          </p>
          <Link
            to="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
        <Foot />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="sticky top-0 z-50 bg-white">
          <Navbar />
        </div>
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <p className="text-lg font-medium text-gray-700 mb-2">
            Your cart is empty.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Add something to your cart before checking out.
          </p>
          <Link
            to="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
        <Foot />
      </>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-50 bg-white">
        <Navbar />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {(errors.submit || (submitAttempted && errorCount > 0)) && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            <AlertCircle size={18} className="shrink-0" />
            {errors.submit ||
              `Please fix ${errorCount} ${errorCount === 1 ? "error" : "errors"} below before placing your order.`}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" noValidate>
          {/* Left: shipping + payment */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Shipping details */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-white">
              <h2 className="font-semibold text-gray-800 mb-4">Shipping Details</h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Enter your full name"
                    className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                      errors.name ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="you@example.com"
                      className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        errors.email ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                      }`}
                    />
                    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) =>
                        updateForm("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit mobile number"
                      className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        errors.phone ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    placeholder="House no, street, city, state, PIN code"
                    rows={3}
                    className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none ${
                      errors.address ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                    }`}
                  />
                  {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Payment options */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-white">
              <h2 className="font-semibold text-gray-800 mb-4">Payment Method</h2>

              <div className="flex flex-col gap-3">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = payment === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                        active
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={opt.value}
                        checked={active}
                        onChange={() => setPayment(opt.value)}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <Icon size={20} className={active ? "text-purple-600" : "text-gray-500"} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* UPI fields */}
              {payment === "upi" && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@bank"
                    className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                      errors.upiId ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                    }`}
                  />
                  {errors.upiId && <p className="text-xs text-red-600">{errors.upiId}</p>}
                </div>
              )}

              {/* Card fields */}
              {payment === "card" && (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Card Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={card.number}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, "").slice(0, 16) }))
                      }
                      placeholder="1234 5678 9012 3456"
                      className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                        errors.cardNumber ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                      }`}
                    />
                    {errors.cardNumber && <p className="text-xs text-red-600">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={card.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                          if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                          setCard((c) => ({ ...c, expiry: v }));
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                          errors.cardExpiry ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                        }`}
                      />
                      {errors.cardExpiry && <p className="text-xs text-red-600">{errors.cardExpiry}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">CVV</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={card.cvv}
                        onChange={(e) =>
                          setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                        }
                        placeholder="123"
                        className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                          errors.cardCvv ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-purple-500"
                        }`}
                      />
                      {errors.cardCvv && <p className="text-xs text-red-600">{errors.cardCvv}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: order summary */}
          <div className="border border-gray-200 rounded-2xl p-5 bg-white sticky top-24">
            <h2 className="font-semibold text-gray-800 mb-4">Order Summary</h2>

            <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={
                      item.image_path
                        ? `http://localhost:4000${item.image_path}`
                        : "https://placehold.co/100x100?text=No+Image"
                    }
                    alt={item.product_name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900 mb-5">
              <span>Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={placing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {placing ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>

      <Foot />
    </>
  );
}

export default Checkout;