require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// Logs every incoming request (method + URL) to the backend terminal
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ---------------- MySQL connection (for products) ----------------
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "ecommerce",
  waitForConnections: true,
  connectionLimit: 10,
});

// ---------------- MongoDB Atlas connection (for orders) ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Each item in an order: snapshot of the product at time of purchase
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image_path: { type: String },
  },
  { _id: false }
);

// Order schema: shipping details + chosen payment mode only.
// No card/UPI details are ever stored here.
// productNames is a flat summary list, auto-filled from items below.
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  paymentMethod: { type: String, required: true }, // "cod" | "upi" | "card"
  items: { type: [orderItemSchema], required: true },
  productNames: { type: [String], required: true }, // e.g. ["Nike T-shirt", "Adidas Hoodie"]
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

// ---------------- Image upload setup (multer) ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Serve uploaded images as static files at http://localhost:4000/uploads/<filename>
app.use("/uploads", express.static("uploads"));

// ---------------- Health check ----------------
// Open http://localhost:4000/api/health to confirm both databases are working
app.get("/api/health", async (req, res) => {
  const status = { server: "ok" };

  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM products");
    status.mysql = "ok";
    status.totalProducts = rows[0].total;
  } catch (err) {
    status.mysql = "error";
    status.mysqlMessage = err.message;
  }

  status.mongo = mongoose.connection.readyState === 1 ? "ok" : "not connected";

  res.json(status);
});

// ---------------- Accounts (JSON file, unchanged) ----------------
const DATA_FILE = path.resolve("../Frontend/ecommerce/src/data/accounts.json");
console.log("Accounts file:", DATA_FILE);

async function loadAccounts() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAccounts(accounts) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(accounts, null, 2));
}

// ---- Sign up ----
app.post("/api/accounts", async (req, res) => {
  const { name, email, password, createdAt } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing fields." });
  }

  const accounts = await loadAccounts();

  const exists = accounts.some(
    (a) => typeof a.email === "string" && a.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: "Email already registered." });
  }

  accounts.push({
    name,
    email,
    password,
    createdAt: createdAt || new Date().toISOString(),
  });

  await saveAccounts(accounts);
  res.status(201).json({ ok: true });
});

// ---- Log in ----
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const accounts = await loadAccounts();
  const account = accounts.find(
    (a) =>
      typeof a.email === "string" &&
      a.email.toLowerCase() === email.toLowerCase() &&
      a.password === password
  );

  if (!account) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  res.json({ name: account.name, email: account.email });
});

// ---------------- Products (MySQL + local image upload) ----------------

// Create a product (accepts multipart/form-data with an "image" field)
app.post("/api/products", upload.single("image"), async (req, res) => {
  const { productName, description, category, price, stockQuantity, rating } = req.body || {};
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!productName || !description || !category || !price || !stockQuantity) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO products (product_name, description, category, price, stock_quantity, rating, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productName, description, category, price, stockQuantity, rating || 0, imagePath]
    );
    res.status(201).json({ id: result.insertId, message: "Product added.", imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add product." });
  }
});

// Get all products, optionally filtered by category
app.get("/api/products", async (req, res) => {
  const { category } = req.query;
  try {
    const [rows] = category
      ? await pool.query("SELECT * FROM products WHERE category = ?", [category])
      : await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Category-wise counts, for your analysis page
app.get("/api/products/stats", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT category, COUNT(*) AS count FROM products GROUP BY category"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// Search + filters
// Example: /api/products/search?q=nike&category=fashion&minPrice=200&maxPrice=1000&minRating=4&inStock=true&sort=price_asc
app.get("/api/products/search", async (req, res) => {
  const { q, category, minPrice, maxPrice, minRating, inStock, sort } = req.query;

  const validCategories = [
    "fashion",
    "mobiles",
    "electronics",
    "beauty",
    "decor",
    "toys",
    "sports",
    "furniture",
  ];

  const conditions = [];
  const params = [];
  const searchTerm = q && q.trim() ? q.trim() : "";

  if (searchTerm) {
    const like = `%${searchTerm}%`;
    conditions.push("(product_name LIKE ? OR description LIKE ? OR category LIKE ?)");
    params.push(like, like, like);
  }

  if (category && validCategories.includes(category)) {
    conditions.push("category = ?");
    params.push(category);
  }

  if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice))) {
    conditions.push("price >= ?");
    params.push(Number(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice))) {
    conditions.push("price <= ?");
    params.push(Number(maxPrice));
  }

  if (minRating !== undefined && minRating !== "" && !isNaN(Number(minRating))) {
    conditions.push("rating >= ?");
    params.push(Number(minRating));
  }

  if (inStock === "true") {
    conditions.push("stock_quantity > 0");
  }

  // Sort options are whitelisted, never inserted straight from user input
  const sortMap = {
    newest: "created_at DESC",
    price_asc: "price ASC",
    price_desc: "price DESC",
    rating: "rating DESC, created_at DESC",
  };

  let orderBy;
  if (sortMap[sort]) {
    orderBy = sortMap[sort];
  } else if (searchTerm) {
    // Default "relevance": name matches first, then newest
    orderBy = "(product_name LIKE ?) DESC, created_at DESC";
    params.push(`%${searchTerm}%`);
  } else {
    orderBy = "created_at DESC";
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await pool.query(
      `SELECT * FROM products ${where} ORDER BY ${orderBy}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search products." });
  }
});

// "For You" recommendations: up to 10 random products from each category
// (1-10 if a category has fewer), shuffled together so categories are mixed
app.get("/api/products/recommended", async (req, res) => {
  const categories = [
    "fashion",
    "mobiles",
    "electronics",
    "beauty",
    "decor",
    "toys",
    "sports",
    "furniture",
  ];

  try {
    const results = await Promise.all(
      categories.map(async (category) => {
        const [rows] = await pool.query(
          "SELECT * FROM products WHERE category = ? ORDER BY RAND() LIMIT 10",
          [category]
        );
        return rows;
      })
    );

    // Debug: how many products were found per category
    const summary = {};
    categories.forEach((c, i) => (summary[c] = results[i].length));
    console.log("Recommended per category:", summary);

    const all = results.flat();

    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    console.log("Recommended total returned:", all.length);
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recommendations." });
  }
});

// ---------------- Orders (MongoDB Atlas) ----------------

// Create an order — called from Checkout.jsx
app.post("/api/orders", async (req, res) => {
  const { name, email, phone, address, paymentMethod, items, total } = req.body || {};

  if (!name || !email || !phone || !address || !paymentMethod || !Array.isArray(items) || items.length === 0 || total == null) {
    return res.status(400).json({ error: "Missing required order fields." });
  }

  // Map cart item fields (id, product_name) to the schema's expected
  // fields (productId, productName). This is the piece that was missing
  // before — without it, productId/productName stay undefined and
  // Mongoose rejects the whole order.
  const mappedItems = items.map((item) => ({
    productId: item.id ?? item.productId,
    productName: item.product_name ?? item.productName,
    price: item.price,
    quantity: item.quantity,
    image_path: item.image_path,
  }));

  const productNames = mappedItems.map((item) => item.productName);

  try {
    const order = await Order.create({
      name,
      email,
      phone,
      address,
      paymentMethod,
      items: mappedItems,
      productNames,
      total,
    });
    res.status(201).json({ id: order._id, message: "Order placed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to place order." });
  }
});

// Get all orders (for your /orders page later)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));