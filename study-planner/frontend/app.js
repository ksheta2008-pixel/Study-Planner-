const state = { tasks: [], subjects: [], view: "dashboard" };
const $ = (selector) => document.querySelector(selector);
const taskList = $("#task-list");
const toast = $("#toast");
let toastTimer;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function localDateString(date = new Date()) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}
function prettyDate(value) {
  if (!value) return "No due date";
  const parsed = new Date(`${value}T00:00:00`);
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
function setView(view) {
  state.view = view;
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  $("#page-title").textContent = view === "dashboard" ? "Dashboard" : view === "tasks" ? "My tasks" : "Subjects";
  $("#list-heading").textContent = view === "tasks" ? "All study tasks" : "Upcoming tasks";
  $("#view-all").hidden = view === "tasks";
  $("#task-search").closest(".filter-row").hidden = view === "subjects";
  taskList.hidden = view === "subjects";
  $("#subject-list").closest(".side-panel").hidden = false;
  renderTasks();
}
function renderStats() {
  const now = localDateString();
  const nextWeek = new Date(`${now}T00:00:00`);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const end = localDateString(nextWeek);
  $("#stat-total").textContent = state.tasks.length;
  $("#stat-done").textContent = state.tasks.filter(task => task.completed).length;
  $("#stat-due").textContent = state.tasks.filter(task => !task.completed && task.due_date && task.due_date >= now && task.due_date <= end).length;
  $("#stat-subjects").textContent = state.subjects.length;
}
function renderTasks() {
  const search = $("#task-search").value.trim().toLowerCase();
  const status = $("#status-filter").value;
  let tasks = state.tasks.filter(task => {
    const matchesText = `${task.title} ${task.notes || ""} ${task.subject_name || ""}`.toLowerCase().includes(search);
    const matchesStatus = status === "all" || (status === "completed" ? task.completed : !task.completed);
    return matchesText && matchesStatus;
  });
  if (state.view === "dashboard") {
    tasks = tasks.filter(task => !task.completed).sort((a,b) => (a.due_date || "9999-12-31").localeCompare(b.due_date || "9999-12-31")).slice(0, 6);
  } else if (state.view === "tasks") {
    tasks.sort((a,b) => Number(a.completed) - Number(b.completed) || (a.due_date || "9999-12-31").localeCompare(b.due_date || "9999-12-31"));
  } else {
    tasks = [];
  }
  if (!tasks.length) {
    taskList.innerHTML = `<div class="empty-state">${state.view === "subjects" ? "Choose Dashboard or My tasks to see your tasks." : search ? "No tasks match your search." : "No tasks here yet. Add a task to get started."}</div>`;
    return;
  }
  taskList.innerHTML = tasks.map(task => `
    <article class="task-row ${task.completed ? "done" : ""}">
      <input class="task-check" type="checkbox" data-complete="${task.id}" ${task.completed ? "checked" : ""} aria-label="${task.completed ? "Mark incomplete" : "Mark complete"}: ${escapeHTML(task.title)}">
      <div><div class="task-title">${escapeHTML(task.title)}</div><div class="task-meta">
        ${task.subject_name ? `<span class="subject-pill">${escapeHTML(task.subject_name)}</span>` : ""}
        <span>◷ ${escapeHTML(prettyDate(task.due_date))}</span><span>${Number(task.estimated_minutes)} min</span>
      </div>${task.notes ? `<div class="task-meta">${escapeHTML(task.notes)}</div>` : ""}</div>
      <div class="task-actions"><button class="mini-button" data-edit="${task.id}" aria-label="Edit ${escapeHTML(task.title)}">Edit</button><button class="mini-button" data-delete="${task.id}" aria-label="Delete ${escapeHTML(task.title)}">Delete</button></div>
    </article>`).join("");
}
function renderSubjects() {
  $("#subject-list").innerHTML = state.subjects.length ? state.subjects.map(subject => {
    const count = state.tasks.filter(task => task.subject_id === subject.id).length;
    return `<div class="subject-row"><div class="subject-left"><span class="subject-dot"></span><div><div class="subject-name">${escapeHTML(subject.name)}</div><div class="subject-count">${count} ${count === 1 ? "task" : "tasks"}</div></div></div><button class="mini-button" data-subject-delete="${subject.id}" aria-label="Delete subject ${escapeHTML(subject.name)}">Remove</button></div>`;
  }).join("") : `<div class="empty-state">Add your first subject above.</div>`;
  const select = $("#task-subject");
  const selected = select.value;
  select.innerHTML = `<option value="">No subject</option>` + state.subjects.map(subject => `<option value="${subject.id}">${escapeHTML(subject.name)}</option>`).join("");
  if (state.subjects.some(subject => subject.id === selected)) select.value = selected;
}
async function refresh() {
  const [tasks, subjects] = await Promise.all([api("/tasks"), api("/subjects")]);
  state.tasks = tasks;
  state.subjects = subjects;
  renderStats(); renderSubjects(); renderTasks();
}
function openTaskDialog(task = null) {
  $("#task-form").reset();
  $("#task-id").value = task?.id || "";
  $("#task-dialog-title").textContent = task ? "Edit study task" : "Add a study task";
  $("#task-title").value = task?.title || "";
  $("#task-subject").value = task?.subject_id || "";
  $("#task-due").value = task?.due_date || "";
  $("#task-minutes").value = task?.estimated_minutes || 30;
  $("#task-notes").value = task?.notes || "";
  $("#task-message").textContent = "";
  $("#task-dialog").showModal();
}
async function loadApp() {
  $("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  try { await refresh(); }
  catch (error) {
    taskList.innerHTML = `<div class="empty-state">Could not load the study plan.<br>${escapeHTML(error.message)}<br>Check your backend and Supabase setup, then refresh.</div>`;
  }
}
document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
$("#add-task-top").addEventListener("click", () => openTaskDialog());
$("#view-all").addEventListener("click", () => setView("tasks"));
$("#add-subject-open").addEventListener("click", () => $("#subject-name").focus());
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => $(`#${button.dataset.close}`).close()));
$("#task-search").addEventListener("input", renderTasks);
$("#status-filter").addEventListener("change", renderTasks);
$("#task-form").addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("#task-id").value;
  const body = {
    title: $("#task-title").value.trim(),
    subject_id: $("#task-subject").value || null,
    due_date: $("#task-due").value || null,
    estimated_minutes: Number($("#task-minutes").value),
    notes: $("#task-notes").value.trim()
  };
  try {
    await api(id ? `/tasks/${id}` : "/tasks", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    $("#task-dialog").close();
    await refresh();
    showToast(id ? "Task updated." : "Task added.");
  } catch (error) { $("#task-message").textContent = error.message; }
});
$("#subject-form").addEventListener("submit", async event => {
  event.preventDefault();
  const input = $("#subject-name");
  try {
    await api("/subjects", { method: "POST", body: JSON.stringify({ name: input.value.trim() }) });
    input.value = ""; $("#subject-message").textContent = "";
    await refresh(); showToast("Subject added.");
  } catch (error) { $("#subject-message").textContent = error.message; }
});
taskList.addEventListener("change", async event => {
  const checkbox = event.target.closest("[data-complete]");
  if (!checkbox) return;
  try {
    await api(`/tasks/${checkbox.dataset.complete}/complete`, { method: "PATCH", body: JSON.stringify({ completed: checkbox.checked }) });
    await refresh(); showToast(checkbox.checked ? "Task completed!" : "Task marked pending.");
  } catch (error) { checkbox.checked = !checkbox.checked; showToast(error.message, true); }
});
taskList.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const task = state.tasks.find(item => item.id === editButton.dataset.edit);
    if (task) openTaskDialog(task);
  }
  if (deleteButton) {
    const task = state.tasks.find(item => item.id === deleteButton.dataset.delete);
    if (!task || !confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try { await api(`/tasks/${task.id}`, { method: "DELETE" }); await refresh(); showToast("Task deleted."); }
    catch (error) { showToast(error.message, true); }
  }
});
$("#subject-list").addEventListener("click", async event => {
  const button = event.target.closest("[data-subject-delete]");
  if (!button) return;
  const subject = state.subjects.find(item => item.id === button.dataset.subjectDelete);
  if (!subject || !confirm(`Remove subject "${subject.name}"? Its tasks will remain without a subject.`)) return;
  try { await api(`/subjects/${subject.id}`, { method: "DELETE" }); await refresh(); showToast("Subject removed."); }
  catch (error) { showToast(error.message, true); }
});
loadApp();
