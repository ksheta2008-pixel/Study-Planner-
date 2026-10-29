const express = require("express");
const { supabase } = require("../supabase");
const { isValidId, validateTask } = require("../utils/validation");
const router = express.Router();

function databaseUnavailable(res) {
  return res.status(503).json({ error: "Database is not configured. Add Supabase credentials to backend/.env and restart the server." });
}
function safeError(res, error, operation) {
  console.error(`${operation}:`, error?.message || "unknown database error");
  if (error?.code === "23503") return res.status(400).json({ error: "That subject does not exist. Refresh the page and try again." });
  if (error?.code === "23505") return res.status(409).json({ error: "A record with that value already exists." });
  return res.status(500).json({ error: "The database request could not be completed." });
}
router.get("/", async (_req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const { data, error } = await supabase.from("tasks")
    .select("id,title,notes,due_date,estimated_minutes,completed,subject_id,created_at,updated_at,subjects(name)")
    .order("completed", { ascending: true }).order("due_date", { ascending: true, nullsFirst: false });
  if (error) return safeError(res, error, "List tasks");
  res.json(data.map(row => ({ ...row, subject_name: row.subjects?.name || null, subjects: undefined })));
});
router.post("/", async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  const input = req.body || {};
  const errors = validateTask(input);
  if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
  const record = {
    title: input.title.trim(),
    notes: (input.notes || "").trim() || null,
    subject_id: input.subject_id || null,
    due_date: input.due_date || null,
    estimated_minutes: input.estimated_minutes === undefined ? 30 : input.estimated_minutes
  };
  const { data, error } = await supabase.from("tasks").insert(record)
    .select("id,title,notes,due_date,estimated_minutes,completed,subject_id,created_at,updated_at").single();
  if (error) return safeError(res, error, "Create task");
  res.status(201).json(data);
});
router.put("/:id", async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid task ID." });
  const input = req.body || {};
  const errors = validateTask(input);
  if (errors.length) return res.status(400).json({ error: errors[0], details: errors });
  const record = {
    title: input.title.trim(),
    notes: (input.notes || "").trim() || null,
    subject_id: input.subject_id || null,
    due_date: input.due_date || null,
    estimated_minutes: input.estimated_minutes === undefined ? 30 : input.estimated_minutes,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from("tasks").update(record).eq("id", req.params.id)
    .select("id,title,notes,due_date,estimated_minutes,completed,subject_id,created_at,updated_at").maybeSingle();
  if (error) return safeError(res, error, "Update task");
  if (!data) return res.status(404).json({ error: "Task not found." });
  res.json(data);
});
router.patch("/:id/complete", async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid task ID." });
  if (typeof req.body?.completed !== "boolean") return res.status(400).json({ error: "completed must be true or false." });
  const { data, error } = await supabase.from("tasks")
    .update({ completed: req.body.completed, updated_at: new Date().toISOString() })
    .eq("id", req.params.id).select("id,completed").maybeSingle();
  if (error) return safeError(res, error, "Complete task");
  if (!data) return res.status(404).json({ error: "Task not found." });
  res.json(data);
});
router.delete("/:id", async (req, res) => {
  if (!supabase) return databaseUnavailable(res);
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid task ID." });
  const { data, error } = await supabase.from("tasks").delete().eq("id", req.params.id).select("id").maybeSingle();
  if (error) return safeError(res, error, "Delete task");
  if (!data) return res.status(404).json({ error: "Task not found." });
  res.status(204).end();
});
module.exports = router;
