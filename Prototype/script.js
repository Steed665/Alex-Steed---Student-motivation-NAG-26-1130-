
const users = [
  {
    name: "Demo Student",
    email: "demo@student.hull.ac.uk",
    password: "Password123",
    classes: [
      { id: 1, name: "Digital Infrastructure", day: "Monday", start: "10:00", end: "12:00", firstDate: "2026-09-28", lastDate: "2026-12-18" },
      { id: 2, name: "Machine Learning", day: "Wednesday", start: "14:00", end: "16:00", firstDate: "2026-09-28", lastDate: "2026-12-18" }
    ],
    assignments: [
      {
        id: 3, name: "ACW", module: "Digital Infrastructure", date: "2026-11-27", done: false,
        tasks: [
          { id: 6, name: "Research", date: "2026-11-20", done: true, completedOn: "2026-11-20" },
          { id: 7, name: "Implementation", date: "2026-11-26", done: false },
          { id: 8, name: "Write-up", date: "2026-11-27", done: false }
        ]
      },
      {
        id: 5, name: "ACW", module: "Machine Learning", date: "2026-12-11", done: false,
        tasks: [
          { id: 9, name: "Prepare dataset", date: "2026-12-02", done: false },
          { id: 10, name: "Train model", date: "2026-12-07", done: false },
          { id: 11, name: "Write results", date: "2026-12-10", done: false }
        ]
      }
    ],
    personalEvents: [
      { id: 4, name: "Study session", date: "2026-11-19", time: "15:00", repeatWeekly: true, lastDate: "2026-12-17" }
    ],
    weeklyGoal: 5,
    notes: [
      { id: 12, module: "Digital Infrastructure", text: "Review the ACW requirements before implementation." }
    ]
  }
];

const get = id => document.getElementById(id);
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const tabNames = ["calendar", "assignments", "motivation", "wellbeing", "add"];
let currentUser = null;
let nextId = 13;
let signupOpen = false;
let editing = null;
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function showAccountForm() {
  get("login-form").hidden = signupOpen;
  get("signup-form").hidden = !signupOpen;
  get("account-heading").textContent = signupOpen ? "Sign up" : "Log in";
  get("switch-form").textContent = signupOpen ? "Back to login" : "Create an account";
  get("account-error").textContent = "";
}

get("switch-form").addEventListener("click", function () {
  signupOpen = !signupOpen;
  showAccountForm();
});

function showTab(name) {
  for (const tabName of tabNames) {
    const selected = tabName === name;
    get(`panel-${tabName}`).hidden = !selected;
    get(`tab-${tabName}`).setAttribute("aria-selected", String(selected));
    get(`tab-${tabName}`).tabIndex = selected ? 0 : -1;
  }
}

for (const name of tabNames) {
  get(`tab-${name}`).addEventListener("click", () => showTab(name));
}

document.querySelector(".tabs").addEventListener("keydown", function (event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const index = tabNames.findIndex(name => get(`tab-${name}`) === document.activeElement);
  if (index === -1) return;
  event.preventDefault();
  let next = index;
  if (event.key === "ArrowLeft") next = (index - 1 + tabNames.length) % tabNames.length;
  if (event.key === "ArrowRight") next = (index + 1) % tabNames.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = tabNames.length - 1;
  showTab(tabNames[next]);
  get(`tab-${tabNames[next]}`).focus();
});

function openDashboard(user) {
  currentUser = user;
  get("account-section").hidden = true;
  get("dashboard").hidden = false;
  get("user-name").textContent = user.name;
  get("weekly-goal").value = user.weeklyGoal || 5;
  for (const type of ["classes", "assignments", "subtasks", "personal"]) {
    get(`filter-${type}`).checked = true;
  }
  displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  showTab("calendar");
  renderDashboard();
}

get("login-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const email = get("login-email").value.trim().toLowerCase();
  const password = get("login-password").value;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    get("account-error").textContent = "Incorrect email or password.";
    return;
  }
  get("login-form").reset();
  openDashboard(user);
});

get("signup-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const name = get("signup-name").value.trim();
  const email = get("signup-email").value.trim().toLowerCase();
  const password = get("signup-password").value;
  if (!name || password.length < 6) {
    get("account-error").textContent = "Enter a name and password of at least 6 characters.";
    return;
  }
  if (users.some(u => u.email === email)) {
    get("account-error").textContent = "This email is already in use.";
    return;
  }
  const user = {
    name, email, password, classes: [], assignments: [], personalEvents: [],
    weeklyGoal: 5, notes: []
  };
  users.push(user);
  get("signup-form").reset();
  openDashboard(user);
});

get("logout").addEventListener("click", function () {
  currentUser = null;
  get("dashboard").hidden = true;
  get("account-section").hidden = false;
  signupOpen = false;
  showAccountForm();
  closeEdit();
  get("wellbeing-form").reset();
  get("wellbeing-response").textContent = "";
  get("wellbeing-support").hidden = true;
  resetTimer();
});

// Calendar navigation
get("previous-month").addEventListener("click", function () {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});
get("next-month").addEventListener("click", function () {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});
get("current-month").addEventListener("click", function () {
  displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  renderCalendar();
});

// Calendar filters only affect what is displayed, not the stored events.
for (const type of ["classes", "assignments", "subtasks", "personal"]) {
  get(`filter-${type}`).addEventListener("change", renderCalendar);
}

// Display the end-date field when weekly repetition is selected.
function updateRepeatFields(prefix) {
  const repeating = get(`${prefix}-repeat`).checked;
  get(`${prefix}-repeat-fields`).hidden = !repeating;
  get(`${prefix}-last`).required = repeating;
  if (!repeating) get(`${prefix}-last`).value = "";
}
get("personal-repeat").addEventListener("change", () => updateRepeatFields("personal"));
get("edit-personal-repeat").addEventListener("change", () => updateRepeatFields("edit-personal"));

// Adding events
get("class-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const start = get("class-start").value;
  const end = get("class-end").value;
  const firstDate = get("class-first-date").value;
  const lastDate = get("class-last-date").value;
  if (end <= start || lastDate < firstDate) {
    get("class-error").textContent = "Check that the end time and last date are after the start.";
    return;
  }
  currentUser.classes.push({
    id: nextId++, name: get("class-name").value.trim(), day: get("class-day").value,
    start, end, firstDate, lastDate
  });
  get("class-error").textContent = "";
  get("class-form").reset();
  showMonthOf(firstDate);
});

get("assignment-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const date = get("assignment-date").value;
  currentUser.assignments.push({
    id: nextId++, name: get("assignment-name").value.trim(),
    module: get("assignment-module").value.trim(), date, done: false, tasks: []
  });
  get("assignment-form").reset();
  showMonthOf(date);
});

get("personal-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const date = get("personal-date").value;
  const repeatWeekly = get("personal-repeat").checked;
  const lastDate = repeatWeekly ? get("personal-last").value : "";
  if (repeatWeekly && (!lastDate || lastDate < date)) {
    alert("The repeat end date must be on or after the event date.");
    return;
  }
  currentUser.personalEvents.push({
    id: nextId++, name: get("personal-name").value.trim(),
    date, time: get("personal-time").value, repeatWeekly, lastDate
  });
  get("personal-form").reset();
  updateRepeatFields("personal");
  showMonthOf(date);
});

// Edit calendar entries. Editing a class changes its whole recurring series.
function beginEdit(type, item) {
  editing = { type, item };
  get("edit-section").hidden = false;
  get("edit-error").textContent = "";
  for (const formType of ["class", "assignment", "personal"]) {
    get(`edit-${formType}-form`).hidden = formType !== type;
  }
  if (type === "class") {
    for (const key of ["name", "day", "start", "end"]) get(`edit-class-${key}`).value = item[key];
    get("edit-class-first").value = item.firstDate;
    get("edit-class-last").value = item.lastDate;
  } else if (type === "assignment") {
    for (const key of ["name", "module", "date"]) get(`edit-assignment-${key}`).value = item[key];
  } else {
    for (const key of ["name", "date", "time"]) get(`edit-personal-${key}`).value = item[key];
    get("edit-personal-repeat").checked = Boolean(item.repeatWeekly);
    updateRepeatFields("edit-personal");
    get("edit-personal-last").value = item.lastDate || "";
  }
  showTab("add");
  get("edit-section").scrollIntoView({ block: "start" });
}

function closeEdit() {
  editing = null;
  get("edit-section").hidden = true;
  for (const type of ["class", "assignment", "personal"]) get(`edit-${type}-form`).hidden = true;
  get("edit-error").textContent = "";
}

get("cancel-edit").addEventListener("click", closeEdit);

get("edit-class-form").addEventListener("submit", function (event) {
  event.preventDefault();
  if (!editing || editing.type !== "class") return;
  const start = get("edit-class-start").value;
  const end = get("edit-class-end").value;
  const firstDate = get("edit-class-first").value;
  const lastDate = get("edit-class-last").value;
  if (end <= start || lastDate < firstDate) {
    get("edit-error").textContent = "Check that the end time and last date are after the start.";
    return;
  }
  Object.assign(editing.item, {
    name: get("edit-class-name").value.trim(), day: get("edit-class-day").value,
    start, end, firstDate, lastDate
  });
  closeEdit();
  renderDashboard();
  showTab("calendar");
});

get("edit-assignment-form").addEventListener("submit", function (event) {
  event.preventDefault();
  if (!editing || editing.type !== "assignment") return;
  const date = get("edit-assignment-date").value;
  Object.assign(editing.item, {
    name: get("edit-assignment-name").value.trim(),
    module: get("edit-assignment-module").value.trim(), date
  });
  closeEdit();
  showMonthOf(date);
});

get("edit-personal-form").addEventListener("submit", function (event) {
  event.preventDefault();
  if (!editing || editing.type !== "personal") return;
  const date = get("edit-personal-date").value;
  const repeatWeekly = get("edit-personal-repeat").checked;
  const lastDate = repeatWeekly ? get("edit-personal-last").value : "";
  if (repeatWeekly && (!lastDate || lastDate < date)) {
    get("edit-error").textContent = "The repeat end date must be on or after the event date.";
    return;
  }
  Object.assign(editing.item, {
    name: get("edit-personal-name").value.trim(), date,
    time: get("edit-personal-time").value, repeatWeekly, lastDate
  });
  closeEdit();
  showMonthOf(date);
});

// Optional wellbeing check-in. The response is displayed, not stored.
get("wellbeing-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const answer = new FormData(event.currentTarget).get("feeling");
  const messages = {
    good: "Glad to hear it. Remember to take regular breaks.",
    okay: "Remember to make time for breaks and ask for support if you need it.",
    struggling: "You can find advice and support through the university's wellbeing service."
  };
  get("wellbeing-response").textContent = messages[answer] || "Please choose an option.";
  get("wellbeing-support").hidden = answer === "good" || !answer;
});

// 25-minute study timer
let remainingSeconds = 25 * 60;
let timerInterval = null;
let timerEndsAt = 0;

function updateTimer() {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  get("timer-display").textContent = `${minutes}:${seconds}`;
  get("timer-start").disabled = timerInterval !== null;
  get("timer-pause").disabled = timerInterval === null;
}

function stopTimer() {
  if (timerInterval !== null) clearInterval(timerInterval);
  timerInterval = null;
}

function tickTimer() {
  remainingSeconds = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
  if (remainingSeconds === 0) {
    stopTimer();
    get("timer-message").textContent = "Study session finished. Take a short break.";
  }
  updateTimer();
}

get("timer-start").addEventListener("click", function () {
  if (timerInterval !== null) return;
  if (remainingSeconds === 0) remainingSeconds = 25 * 60;
  get("timer-message").textContent = "";
  timerEndsAt = Date.now() + remainingSeconds * 1000;
  timerInterval = setInterval(tickTimer, 1000);
  updateTimer();
});

get("timer-pause").addEventListener("click", function () {
  if (timerInterval === null) return;
  tickTimer();
  stopTimer();
  updateTimer();
});

function resetTimer() {
  stopTimer();
  remainingSeconds = 25 * 60;
  get("timer-message").textContent = "";
  updateTimer();
}

get("timer-reset").addEventListener("click", resetTimer);
updateTimer();

function renderDashboard() {
  renderMotivation();
  renderUpcomingDeadlines();
  renderAssignmentTasks();
  renderNotes();
  renderCalendar();
}

function formatDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function taskProgress(assignment) {
  const tasks = assignment.tasks || [];
  return `${tasks.filter(task => task.done).length}/${tasks.length} tasks complete`;
}

function renderMotivation() {
  const assignments = currentUser.assignments;
  const completedAssignments = assignments.filter(a => a.done).length;
  const completedTasks = assignments.reduce((total, a) =>
    total + a.tasks.filter(t => t.done).length, 0);
  const exp = completedTasks * 10 + completedAssignments * 30;
  const level = Math.floor(exp / 100) + 1;
  get("user-level").textContent = level;
  get("user-exp").textContent = `${exp} EXP total`;
  get("level-progress").textContent = `${exp % 100}/100 EXP towards level ${level + 1}`;
  renderWeeklyGoal();

  const achievements = [];
  if (completedTasks > 0) achievements.push("First subtask completed");
  if (completedAssignments > 0) achievements.push("First assignment completed");
  if (level >= 2) achievements.push("Reached level 2");
  const list = get("achievements");
  list.replaceChildren();
  for (const label of achievements.length ? achievements : ["No achievements yet"]) {
    const li = document.createElement("li");
    li.textContent = label;
    list.append(li);
  }
}

// Each week runs from Monday to Sunday. Only completed subtasks count.
function weekDates() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const asText = date => [
    date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
  return { start: asText(monday), end: asText(sunday) };
}

function renderWeeklyGoal() {
  const { start, end } = weekDates();
  const completed = currentUser.assignments.reduce((total, assignment) =>
    total + assignment.tasks.filter(task =>
      task.done && task.completedOn && task.completedOn >= start && task.completedOn <= end
    ).length, 0);
  const goal = currentUser.weeklyGoal || 5;
  get("weekly-progress").textContent =
    `This week (${formatDate(start)} - ${formatDate(end)}): ${completed}/${goal} subtasks completed` +
    (completed >= goal ? " - Goal reached!" : "");
}

get("weekly-goal-form").addEventListener("submit", function (event) {
  event.preventDefault();
  if (!currentUser) return;
  const goal = Number(get("weekly-goal").value);
  if (!Number.isInteger(goal) || goal < 1 || goal > 30) return;
  currentUser.weeklyGoal = goal;
  renderWeeklyGoal();
});

// Study notes are attached to a named module or assignment.
get("note-form").addEventListener("submit", function (event) {
  event.preventDefault();
  if (!currentUser) return;
  const module = get("note-module").value.trim();
  const note = get("note-text").value.trim();
  if (!module || !note) return;
  currentUser.notes.push({ id: nextId++, module, text: note });
  get("note-form").reset();
  renderNotes();
});

function renderNotes() {
  const list = get("notes-list");
  list.replaceChildren();
  for (const note of currentUser.notes || []) {
    const row = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = note.module + ": ";
    const content = document.createElement("span");
    content.textContent = note.text;
    row.append(strong, content);
    row.append(makeButton("Remove", `Remove note for ${note.module}`, () => {
      currentUser.notes = currentUser.notes.filter(item => item.id !== note.id);
      renderNotes();
    }));
    list.append(row);
  }
  if (!list.children.length) {
    const row = document.createElement("li");
    row.textContent = "No notes added.";
    list.append(row);
  }
}

function todayText() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function renderUpcomingDeadlines() {
  const list = get("upcoming-deadlines");
  list.replaceChildren();
  const upcoming = [];
  for (const assignment of currentUser.assignments) {
    if (assignment.done) continue;
    if (assignment.date >= todayText()) {
      upcoming.push({ date: assignment.date, label: `${assignment.name} (${assignment.module})` });
    }
    for (const task of assignment.tasks) {
      if (task.date && !task.done && task.date >= todayText()) {
        upcoming.push({ date: task.date, label: `${task.name} - ${assignment.module} ${assignment.name}` });
      }
    }
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of upcoming.slice(0, 3)) {
    const li = document.createElement("li");
    li.textContent = `${formatDate(entry.date)} - ${entry.label}`;
    list.append(li);
  }
  if (!list.children.length) {
    const li = document.createElement("li");
    li.textContent = "No upcoming deadlines.";
    list.append(li);
  }
}

function makeButton(text, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", onClick);
  return button;
}

function renderAssignmentTasks() {
  const container = get("assignment-tasks");
  container.replaceChildren();
  if (!currentUser.assignments.length) {
    container.textContent = "No assignments added.";
    return;
  }
  const assignments = [...currentUser.assignments].sort((a, b) => a.date.localeCompare(b.date));
  for (const assignment of assignments) {
    const section = document.createElement("section");
    section.className = "assignment-tasks-item";
    const heading = document.createElement("h3");
    heading.textContent = `${assignment.name} (${assignment.module}) - due ${formatDate(assignment.date)}`;
    section.append(heading);
    const summary = document.createElement("p");
    summary.textContent = taskProgress(assignment);
    section.append(summary);

    const completeLabel = document.createElement("label");
    completeLabel.className = "task-label";
    const completeBox = document.createElement("input");
    completeBox.type = "checkbox";
    completeBox.checked = assignment.done;
    completeBox.addEventListener("change", () => {
      assignment.done = completeBox.checked;
      renderDashboard();
    });
    completeLabel.append(completeBox, document.createTextNode(" Assignment complete"));
    section.append(completeLabel);

    const list = document.createElement("ul");
    for (const task of assignment.tasks) {
      const row = document.createElement("li");
      const label = document.createElement("label");
      label.className = "task-label";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        task.completedOn = checkbox.checked ? todayText() : "";
        renderDashboard();
      });
      const name = document.createElement("span");
      name.textContent = task.name;
      if (task.done) name.className = "task-done";
      label.append(checkbox, name);
      row.append(label);
      if (task.date) {
        const dateLabel = document.createElement("span");
        dateLabel.className = "subtask-date";
        dateLabel.textContent = `(due ${formatDate(task.date)})`;
        row.append(dateLabel);
      }
      // Allow a task deadline to be moved or cleared.
      const reschedule = document.createElement("form");
      reschedule.className = "subtask-reschedule";
      reschedule.hidden = true;
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = task.date || "";
      dateInput.setAttribute("aria-label", `New deadline for ${task.name}`);
      const saveButton = document.createElement("button");
      saveButton.textContent = "Save date";
      saveButton.type = "submit";
      reschedule.append(dateInput, saveButton);
      reschedule.addEventListener("submit", function (event) {
        event.preventDefault();
        task.date = dateInput.value;
        renderDashboard();
      });
      row.append(makeButton("Reschedule", `Reschedule ${task.name}`, () => {
        reschedule.hidden = !reschedule.hidden;
      }));
      row.append(reschedule);
      row.append(makeButton("×", `Remove ${task.name}`, () => {
        assignment.tasks = assignment.tasks.filter(t => t.id !== task.id);
        renderDashboard();
      }));
      list.append(row);
    }
    section.append(list);

    const form = document.createElement("form");
    form.className = "subtask-form";
    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    input.placeholder = "New task";
    input.setAttribute("aria-label", `New task for ${assignment.module} ${assignment.name}`);
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.setAttribute("aria-label", "Optional subtask deadline");
    const button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Add task";
    form.append(input, dateInput, button);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      assignment.tasks.push({ id: nextId++, name, date: dateInput.value, done: false });
      renderDashboard();
    });
    section.append(form);
    container.append(section);
  }
}

function showMonthOf(date) {
  const [year, month] = date.split("-").map(Number);
  displayedMonth = new Date(year, month - 1, 1);
  renderDashboard();
  showTab("calendar");
}

function addClassEntry(cell, item) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry";
  const description = document.createElement("span");
  description.textContent = `Class: ${item.start} ${item.name}`;
  entry.append(description);
  entry.append(makeButton("Edit", `Edit ${item.name}`, () => beginEdit("class", item)));
  entry.append(makeButton("×", `Remove ${item.name}`, () => {
    currentUser.classes = currentUser.classes.filter(c => c.id !== item.id);
    renderDashboard();
  }));
  cell.append(entry);
}

function addAssignmentEntry(cell, item) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry" + (item.done ? " done" : "");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.done;
  checkbox.setAttribute("aria-label", `Complete ${item.module} ${item.name}`);
  checkbox.addEventListener("change", function () {
    item.done = checkbox.checked;
    renderDashboard();
  });
  const text = document.createElement("span");
  text.className = "entry-text";
  text.textContent = `Due: ${item.name} (${item.module}) - ${taskProgress(item)}`;
  entry.append(checkbox, text);
  entry.append(makeButton("Edit", `Edit ${item.module} ${item.name}`, () => beginEdit("assignment", item)));
  entry.append(makeButton("×", `Remove ${item.module} ${item.name}`, () => {
    currentUser.assignments = currentUser.assignments.filter(a => a.id !== item.id);
    renderDashboard();
  }));
  cell.append(entry);
}

function addSubtaskEntry(cell, task, assignment) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry" + (task.done ? " done" : "");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", `Complete ${task.name}`);
  checkbox.addEventListener("change", function () {
    task.done = checkbox.checked;
    task.completedOn = checkbox.checked ? todayText() : "";
    renderDashboard();
  });
  const text = document.createElement("span");
  text.className = "entry-text";
  text.textContent = `Task: ${task.name} (${assignment.module})`;
  entry.append(checkbox, text);
  cell.append(entry);
}

function addPersonalEntry(cell, item) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry";
  const text = document.createElement("span");
  text.textContent = `Personal: ${item.time ? item.time + " " : ""}${item.name}`;
  entry.append(text);
  entry.append(makeButton("Edit", `Edit ${item.name}`, () => beginEdit("personal", item)));
  entry.append(makeButton("×", `Remove ${item.name}`, () => {
    currentUser.personalEvents = currentUser.personalEvents.filter(p => p.id !== item.id);
    renderDashboard();
  }));
  cell.append(entry);
}

function occursOnDate(item, date) {
  if (!item.repeatWeekly) return item.date === date;
  if (date < item.date || date > item.lastDate) return false;
  const dayNumber = value => {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  return (dayNumber(date) - dayNumber(item.date)) % 7 === 0;
}

function renderCalendar() {
  if (!currentUser) return;
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  get("month-title").textContent = displayedMonth.toLocaleDateString("en-GB", {
    month: "long", year: "numeric"
  });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const body = get("calendar-body");
  body.replaceChildren();
  let dateNumber = 1;

  while (dateNumber <= daysInMonth) {
    const row = document.createElement("tr");
    for (let column = 0; column < 7; column++) {
      const cell = document.createElement("td");
      if ((dateNumber !== 1 || column >= firstWeekday) && dateNumber <= daysInMonth) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(dateNumber).padStart(2, "0")}`;
        const number = document.createElement("strong");
        number.className = "calendar-date";
        number.textContent = dateNumber;
        cell.append(number);
        const events = [];
        for (const item of currentUser.classes) {
          if (get("filter-classes").checked && item.day === days[column] && date >= item.firstDate && date <= item.lastDate) {
            events.push({ type: "class", item, time: item.start });
          }
        }
        for (const item of currentUser.assignments) {
          if (get("filter-assignments").checked && item.date === date) {
            events.push({ type: "assignment", item, time: "23:59" });
          }
          for (const task of item.tasks) {
            if (get("filter-subtasks").checked && task.date && task.date === date) {
              events.push({ type: "subtask", item: task, assignment: item, time: "23:58" });
            }
          }
        }
        for (const item of currentUser.personalEvents) {
          if (get("filter-personal").checked && occursOnDate(item, date)) {
            events.push({ type: "personal", item, time: item.time || "00:00" });
          }
        }
        events.sort((a, b) => a.time.localeCompare(b.time));
        for (const event of events) {
          if (event.type === "class") addClassEntry(cell, event.item);
          if (event.type === "assignment") addAssignmentEntry(cell, event.item);
          if (event.type === "subtask") addSubtaskEntry(cell, event.item, event.assignment);
          if (event.type === "personal") addPersonalEntry(cell, event.item);
        }
        dateNumber++;
      }
      row.append(cell);
    }
    body.append(row);
  }
}
