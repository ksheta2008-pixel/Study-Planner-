const express = require("express");
const { supabase } = require("../supabase");
const { isValidId, validateSubject } = require("../utils/validation");
const router = express.Router();

function unavailable(res) {
  return res.status(503).json({ error: "Database is not configured. Add Supabase credentials to backend/.env and restart the server." });
}
function fail(res, error) {
  console.error("Subject database request:", error?.message || "unknown database error");
  if (error?.code === "23505") return res.status(409).json({ error: "That subject already exists." });
  return res.status(500).json({ error: "The database request could not be completed." });
}
router.get("/", async (_req, res) => {
  if (!supabase) return unavailable(res);
  const { data, error } = await supabase.from("subjects").select("id,name,created_at").order("name");
  if (error) return fail(res, error);
  res.json(data);
});
router.post("/", async (req, res) => {
  if (!supabase) return unavailable(res);
  const errors = validateSubject(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
  const { data, error } = await supabase.from("subjects")
    .insert({ name: req.body.name.trim() }).select("id,name,created_at").single();
  if (error) return fail(res, error);
  res.status(201).json(data);
});
router.delete("/:id", async (req, res) => {
  if (!supabase) return unavailable(res);
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid subject ID." });
  // schema.sql uses ON DELETE SET NULL so related tasks are preserved.
  const { data, error } = await supabase.from("subjects").delete().eq("id", req.params.id).select("id").maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: "Subject not found." });
  res.status(204).end();
});
module.exports = router;
