function isValidId(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function validateTask(input, partial = false) {
  const errors = [];
  if (!partial || input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 160) {
      errors.push("Title is required and must be 160 characters or fewer.");
    }
  }
  if (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 2000)) {
    errors.push("Notes must be 2,000 characters or fewer.");
  }
  if (input.estimated_minutes !== undefined &&
      (!Number.isInteger(input.estimated_minutes) || input.estimated_minutes < 5 || input.estimated_minutes > 720)) {
    errors.push("Study time must be a whole number from 5 to 720 minutes.");
  }
  if (input.due_date !== undefined && input.due_date !== null &&
      (typeof input.due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.due_date) ||
       Number.isNaN(Date.parse(`${input.due_date}T00:00:00Z`)) ||
       new Date(`${input.due_date}T00:00:00Z`).toISOString().slice(0, 10) !== input.due_date)) {
    errors.push("Due date must be a valid date in YYYY-MM-DD format.");
  }
  if (input.subject_id !== undefined && input.subject_id !== null && !isValidId(input.subject_id)) {
    errors.push("Subject selection is invalid.");
  }
  return errors;
}
function validateSubject(input) {
  if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 80) {
    return ["Subject name is required and must be 80 characters or fewer."];
  }
  return [];
}
module.exports = { isValidId, validateTask, validateSubject };
