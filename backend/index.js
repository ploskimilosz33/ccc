// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err));
process.on("unhandledRejection", (err) => console.error("UNHANDLED:", err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// zawsze ładuj .env z folderu backend/
dotenv.config({ path: path.join(__dirname, ".env") });

// diagnostyka (bez haseł)
console.log("[ENV]", {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_SSL: process.env.DB_SSL,
  MAIL_ENABLED: process.env.MAIL_ENABLED,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER ? "***set***" : undefined,
  MAIL_PASS: process.env.MAIL_PASS ? "***set***" : undefined,
});

// importy po dotenv (ESM kolejność)
const { default: query } = await import("./src/db.js");

const { default: clinicsRouter } = await import("./src/routes/clinics.js");
const { default: doctorsRouter } = await import("./src/routes/doctors.js");
const { default: visitTypesRouter } = await import("./src/routes/visitTypes.js");
const { default: slotsRouter } = await import("./src/routes/slots.js");
const { default: appointmentsRouter } = await import("./src/routes/appointments.js");
const { default: authRouter } = await import("./src/routes/auth.js");
const { default: catalogRouter } = await import("./src/routes/catalog.js");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ping
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// health + DB test
app.get("/api/health", async (req, res) => {
  try {
    const r = await query("SELECT 1 AS ok");
    res.json({ ok: true, db: r.rows[0].ok });
  } catch (e) {
    res.status(500).json({ ok: false, db: "down", code: e.code, message: e.message });
  }
});

// routes
app.use("/api/clinics", clinicsRouter);
app.use("/api/doctors", doctorsRouter);
app.use("/api/visit-types", visitTypesRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/auth", authRouter);
app.use("/api/catalog", catalogRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = Number(process.env.APP_PORT ?? 5000);
app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
