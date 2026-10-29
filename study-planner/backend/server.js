require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const taskRoutes = require("./routes/tasks");
const subjectRoutes = require("./routes/subjects");

const app = express();
const port = Number(process.env.PORT) || 3000;
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.NODE_ENV === "production" ? false : true }));
app.use(express.json({ limit: "30kb" }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "study-planner-api" }));
app.use("/api/tasks", taskRoutes);
app.use("/api/subjects", subjectRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ error: "Request body must contain valid JSON." });
  console.error("Server error:", error.message);
  res.status(500).json({ error: "Unexpected server error." });
});
app.listen(port, () => {
  console.log(`Study Planner running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
