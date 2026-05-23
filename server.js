require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const emailTemplate = require("./templates/emailTemplate");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

/* =========================
   MONGODB
========================= */

const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("✅ MongoDB conectado");
}
connectDB();

/* =========================
   EMAIL
========================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================
   UTIL
========================= */

function generateCode(length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* =========================
   JWT
========================= */

function generateToken(user) {
  return jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/* =========================
   AUTH MIDDLEWARE
========================= */

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.json({ success: false });

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET,
    );
    req.user = decoded;
    next();
  } catch {
    return res.json({ success: false });
  }
}

/* =========================
   ENVIAR CÓDIGO
========================= */

app.post("/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false });

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await db
      .collection("codes")
      .updateOne(
        { email },
        { $set: { email, code, expiresAt } },
        { upsert: true },
      );

    await transporter.sendMail({
      from: `"WishWork" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Seu código",
      html: emailTemplate(code),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

/* =========================
   VERIFICAR LOGIN
========================= */

app.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    const record = await db.collection("codes").findOne({ email });

    if (!record) return res.json({ success: false });

    if (Date.now() > record.expiresAt)
      return res.json({ success: false, message: "expirado" });

    if (record.code !== code.toUpperCase())
      return res.json({ success: false, message: "inválido" });

    await db.collection("codes").deleteOne({ email });

    /* USER */
    let user = await db.collection("users").findOne({ email });

    if (!user) {
      const result = await db.collection("users").insertOne({
        email,
        name: "Usuário",
        bio: "",
        createdAt: Date.now(),
      });

      user = { _id: result.insertedId, email };
    }

    const token = generateToken(user);

    return res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

/* =========================
   DASHBOARD
========================= */

app.get("/dashboard", auth, async (req, res) => {
  const user = await db.collection("users").findOne({ email: req.user.email });

  const services = await db
    .collection("services")
    .find({ userEmail: req.user.email })
    .toArray();

  const orders = await db
    .collection("orders")
    .find({
      $or: [{ clientEmail: req.user.email }, { providerEmail: req.user.email }],
    })
    .toArray();

  return res.json({
    success: true,
    user,
    services,
    orders,
  });
});

/* =========================
   CRIAR SERVIÇO
========================= */

app.post("/services", auth, async (req, res) => {
  const { title, description, price } = req.body;

  await db.collection("services").insertOne({
    title,
    description,
    price,
    userEmail: req.user.email,
    createdAt: Date.now(),
  });

  res.json({ success: true });
});

/* =========================
   CONTRATAR SERVIÇO
========================= */

app.post("/order", auth, async (req, res) => {
  const { serviceId, providerEmail } = req.body;

  await db.collection("orders").insertOne({
    serviceId,
    clientEmail: req.user.email,
    providerEmail,
    status: "pendente",
    createdAt: Date.now(),
  });

  res.json({ success: true });
});

/* =========================
   ATUALIZAR STATUS
========================= */

app.post("/order/status", auth, async (req, res) => {
  const { orderId, status } = req.body;

  const allowed = ["pendente", "aceito", "concluido", "cancelado"];

  if (!allowed.includes(status)) {
    return res.json({ success: false });
  }

  await db
    .collection("orders")
    .updateOne(
      { _id: new require("mongodb").ObjectId(orderId) },
      { $set: { status } },
    );

  res.json({ success: true });
});

/* =========================
   SERVER
========================= */

app.get("/services/public", async (req, res) => {
  try {
    const services = await db.collection("services").find().toArray();

    res.json({
      success: true,
      services,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("🚀 http://localhost:3000");
});
