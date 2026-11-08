let API = "";
let HEADERS = {};
let editingId = null;

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descInput = document.getElementById("task-description");
const submitBtn = document.getElementById("task-submit");
const list = document.getElementById("task-list");
const statusEl = document.getElementById("status-message");

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

async function loadTasks() {
  try {
    const tasks = await api("/tasks?select=*&order=id.asc");
    render(tasks);
    setStatus(tasks.length ? "" : "No tasks yet. Add your first one above.");
  } catch (e) {
    setStatus("Could not load tasks. " + e.message, true);
  }
}

function render(tasks) {
  list.innerHTML = "";
  for (const t of tasks) {
    const item = document.createElement("div");
    item.className = "task-item" + (t.completed ? " done" : "");
    item.dataset.id = t.id;

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = t.title;

    const desc = document.createElement("div");
    desc.className = "task-description";
    desc.textContent = t.description || "";

    const status = document.createElement("div");
    status.className = "task-status";
    status.textContent = t.completed ? "Completed" : "Not completed";

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(
      button("toggle-task", t.completed ? "Mark incomplete" : "Mark complete", () => toggleTask(t)),
      button("edit-task", "Edit", () => startEdit(t)),
      button("delete-task", "Delete", () => deleteTask(t.id))
    );

    item.append(title, desc, status, actions);
    list.append(item);
  }
}

function button(cls, text, handler) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.textContent = text;
  b.addEventListener("click", handler);
  return b;
}

function startEdit(t) {
  editingId = t.id;
  titleInput.value = t.title;
  descInput.value = t.description || "";
  submitBtn.textContent = "Save changes";
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  submitBtn.textContent = "Add task";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  if (!title) return setStatus("Title is required.", true);
  try {
    if (editingId === null) {
      await api("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ title, description }),
      });
      setStatus("Task added.");
    } else {
      await api(`/tasks?id=eq.${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ title, description }),
      });
      setStatus("Task updated.");
    }
    resetForm();
    await loadTasks();
  } catch (err) {
    setStatus("Could not save the task. " + err.message, true);
  }
});

async function toggleTask(t) {
  try {
    await api(`/tasks?id=eq.${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ completed: !t.completed }),
    });
    await loadTasks();
  } catch (err) {
    setStatus("Could not change the status. " + err.message, true);
  }
}

async function deleteTask(id) {
  try {
    await api(`/tasks?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (editingId === id) resetForm();
    setStatus("Task deleted.");
    await loadTasks();
  } catch (err) {
    setStatus("Could not delete the task. " + err.message, true);
  }
}

(async function init() {
  try {
    const res = await fetch("config.json");
    const cfg = await res.json();
    API = `${cfg.supabaseUrl}/rest/v1`;
    HEADERS = {
      apikey: cfg.supabasePublishableKey,
      Authorization: `Bearer ${cfg.supabasePublishableKey}`,
    };
    await loadTasks();
  } catch (e) {
    setStatus("Could not read config.json. " + e.message, true);
  }
})();
