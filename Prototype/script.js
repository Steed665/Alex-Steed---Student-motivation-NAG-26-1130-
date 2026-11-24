
// Demo data. Changes reset when the page reloads.
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
        id: 3,
        name: "ACW",
        module: "Digital Infrastructure",
        date: "2026-11-27",
        done: false,
        tasks: [
          { id: 6, name: "Research", done: true },
          { id: 7, name: "Implementation", done: false },
          { id: 8, name: "Write-up", done: false }
        ]
      },
      {
        id: 5,
        name: "ACW",
        module: "Machine Learning",
        date: "2026-12-11",
        done: false,
        tasks: [
          { id: 9, name: "Prepare dataset", done: false },
          { id: 10, name: "Train model", done: false },
          { id: 11, name: "Write results", done: false }
        ]
      }
    ],
    personalEvents: [
      { id: 4, name: "Study session", date: "2026-11-19", time: "15:00" }
    ]
  }
];

const get = id => document.getElementById(id);
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

let currentUser = null;
let nextId = 12;
let signupOpen = false;
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// Login and signup
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

// Dashboard tabs
const tabNames = ["calendar", "assignments", "motivation", "add"];

function showTab(name) {
  for (const tabName of tabNames) {
    const selected = tabName === name;
    get(`panel-${tabName}`).hidden = !selected;
    get(`tab-${tabName}`).setAttribute("aria-selected", String(selected));
    get(`tab-${tabName}`).tabIndex = selected ? 0 : -1;
  }
}

for (const tabName of tabNames) {
  get(`tab-${tabName}`).addEventListener("click", function () {
    showTab(tabName);
  });
}

// Allow keyboard navigation between tabs
document.querySelector(".tabs").addEventListener("keydown", function (event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

  const currentIndex = tabNames.findIndex(name =>
    get(`tab-${name}`) === document.activeElement
  );

  if (currentIndex < 0) return;
  event.preventDefault();

  let nextIndex = currentIndex;

  if (event.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + tabNames.length) % tabNames.length;
  }

  if (event.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % tabNames.length;
  }

  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabNames.length - 1;

  showTab(tabNames[nextIndex]);
  get(`tab-${tabNames[nextIndex]}`).focus();
});

function openDashboard(user) {
  currentUser = user;
  get("account-section").hidden = true;
  get("dashboard").hidden = false;
  get("user-name").textContent = user.name;

  displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  showTab("calendar");
  renderDashboard();
}

get("login-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const email = get("login-email").value.trim().toLowerCase();
  const password = get("login-password").value;

  const user = users.find(user =>
    user.email === email && user.password === password
  );

  if (user) {
    get("login-form").reset();
    openDashboard(user);
  } else {
    get("account-error").textContent = "Incorrect email or password.";
  }
});

get("signup-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = get("signup-name").value.trim();
  const email = get("signup-email").value.trim().toLowerCase();
  const password = get("signup-password").value;

  if (!name || password.length < 6) {
    get("account-error").textContent =
      "Enter a name and a password of at least 6 characters.";
    return;
  }

  if (users.some(user => user.email === email)) {
    get("account-error").textContent = "This email is already in use.";
    return;
  }

  const user = {
    name,
    email,
    password,
    classes: [],
    assignments: [],
    personalEvents: []
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
});

// Calendar navigation
get("previous-month").addEventListener("click", function () {
  displayedMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth() - 1,
    1
  );
  renderDashboard();
});

get("next-month").addEventListener("click", function () {
  displayedMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth() + 1,
    1
  );
  renderDashboard();
});

get("current-month").addEventListener("click", function () {
  displayedMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  renderDashboard();
});

// Adding classes
get("class-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const start = get("class-start").value;
  const end = get("class-end").value;
  const firstDate = get("class-first-date").value;
  const lastDate = get("class-last-date").value;

  if (end <= start) {
    get("class-error").textContent = "End time must be after start time.";
    return;
  }

  if (lastDate < firstDate) {
    get("class-error").textContent =
      "Last date must be on or after the first date.";
    return;
  }

  currentUser.classes.push({
    id: nextId++,
    name: get("class-name").value.trim(),
    day: get("class-day").value,
    start,
    end,
    firstDate,
    lastDate
  });

  get("class-error").textContent = "";
  get("class-form").reset();
  showMonthOf(firstDate);
});

// Adding assignments
get("assignment-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const date = get("assignment-date").value;

  currentUser.assignments.push({
    id: nextId++,
    name: get("assignment-name").value.trim(),
    module: get("assignment-module").value.trim(),
    date,
    done: false,
    tasks: []
  });

  get("assignment-form").reset();
  showMonthOf(date);
});

// Adding personal events
get("personal-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const date = get("personal-date").value;

  currentUser.personalEvents.push({
    id: nextId++,
    name: get("personal-name").value.trim(),
    date,
    time: get("personal-time").value
  });

  get("personal-form").reset();
  showMonthOf(date);
});

// Update the dashboard whenever something changes
function renderDashboard() {
  renderMotivation();
  renderUpcomingDeadlines();
  renderAssignmentTasks();
  renderCalendar();
}

// EXP and achievements
function renderMotivation() {
  const assignments = currentUser.assignments;

  const completedAssignments = assignments.filter(item => item.done).length;

  const completedTasks = assignments.reduce(function (total, assignment) {
    return total + (assignment.tasks || []).filter(task => task.done).length;
  }, 0);

  const exp = completedTasks * 10 + completedAssignments * 30;
  const level = Math.floor(exp / 100) + 1;

  get("user-level").textContent = level;
  get("user-exp").textContent = `${exp} EXP total`;
  get("level-progress").textContent =
    `${exp % 100}/100 EXP towards level ${level + 1}`;

  const achievements = [];

  if (completedTasks >= 1) {
    achievements.push("First subtask completed");
  }

  if (completedAssignments >= 1) {
    achievements.push("First assignment completed");
  }

  if (level >= 2) {
    achievements.push("Reached level 2");
  }

  const list = get("achievements");
  list.replaceChildren();

  if (achievements.length === 0) {
    achievements.push("No achievements yet");
  }

  for (const name of achievements) {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  }
}

// Date and task progress helpers
function formatDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function taskProgress(assignment) {
  const tasks = assignment.tasks || [];
  const completed = tasks.filter(task => task.done).length;

  return `${completed}/${tasks.length} tasks complete`;
}

// Upcoming deadlines
function renderUpcomingDeadlines() {
  const list = get("upcoming-deadlines");
  list.replaceChildren();

  const today = new Date();

  const todayText = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const upcoming = currentUser.assignments
    .filter(item => !item.done && item.date >= todayText)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No upcoming deadlines.";
    list.append(empty);
    return;
  }

  for (const item of upcoming) {
    const entry = document.createElement("li");

    entry.textContent =
      `${formatDate(item.date)} - ${item.name} (${item.module}) - ${taskProgress(item)}`;

    list.append(entry);
  }
}

// Assignment tasks
function renderAssignmentTasks() {
  const container = get("assignment-tasks");
  container.replaceChildren();

  if (currentUser.assignments.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No assignments added.";
    container.append(message);
    return;
  }

  const assignments = [...currentUser.assignments]
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const assignment of assignments) {
    if (!assignment.tasks) assignment.tasks = [];

    const section = document.createElement("section");
    section.className = "assignment-tasks-item";

    const heading = document.createElement("h3");
    heading.textContent =
      `${assignment.name} (${assignment.module}) - due ${formatDate(assignment.date)}`;
    section.append(heading);

    const summary = document.createElement("p");
    summary.textContent = taskProgress(assignment);
    section.append(summary);

    // Mark the whole assignment complete
    const completeLabel = document.createElement("label");
    completeLabel.className = "task-label";

    const completeBox = document.createElement("input");
    completeBox.type = "checkbox";
    completeBox.checked = assignment.done;

    completeBox.addEventListener("change", function () {
      assignment.done = completeBox.checked;
      renderDashboard();
    });

    completeLabel.append(
      completeBox,
      document.createTextNode(" Assignment complete")
    );

    section.append(completeLabel);

    // Display existing subtasks
    const list = document.createElement("ul");

    for (const task of assignment.tasks) {
      const row = document.createElement("li");
      const label = document.createElement("label");
      label.className = "task-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;

      checkbox.addEventListener("change", function () {
        task.done = checkbox.checked;
        renderDashboard();
      });

      const name = document.createElement("span");
      name.textContent = task.name;

      if (task.done) {
        name.className = "task-done";
      }

      label.append(checkbox, name);
      row.append(label);

      makeRemoveButton(row, task.name, function () {
        assignment.tasks = assignment.tasks.filter(
          entry => entry.id !== task.id
        );
        renderDashboard();
      });

      list.append(row);
    }

    section.append(list);

    // Form for adding a subtask
    const form = document.createElement("form");
    form.className = "subtask-form";

    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    input.placeholder = "New task";
    input.setAttribute(
      "aria-label",
      `Add task to ${assignment.module} ${assignment.name}`
    );

    const addButton = document.createElement("button");
    addButton.type = "submit";
    addButton.textContent = "Add task";

    form.append(input, addButton);

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = input.value.trim();
      if (!name) return;

      assignment.tasks.push({
        id: nextId++,
        name,
        done: false
      });

      renderDashboard();
    });

    section.append(form);
    container.append(section);
  }
}

// Show the month containing a new event
function showMonthOf(date) {
  const [year, month] = date.split("-").map(Number);
  displayedMonth = new Date(year, month - 1, 1);

  renderDashboard();
  showTab("calendar");
}

// Button used to remove events and tasks
function makeRemoveButton(parent, description, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "×";
  button.setAttribute("aria-label", `Remove ${description}`);
  button.title = "Remove";

  button.addEventListener("click", onClick);
  parent.append(button);
}

// Display class entries
function addClassEntry(cell, item) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry";

  const description = document.createElement("span");
  description.textContent = `Class: ${item.start} ${item.name}`;
  entry.append(description);

  makeRemoveButton(entry, item.name, function () {
    currentUser.classes = currentUser.classes.filter(
      c => c.id !== item.id
    );
    renderDashboard();
  });

  cell.append(entry);
}

// Display assignment deadlines
function addAssignmentEntry(cell, item) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry" + (item.done ? " done" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = item.done;
  checkbox.setAttribute("aria-label", `Mark ${item.name} complete`);

  checkbox.addEventListener("change", function () {
    item.done = checkbox.checked;
    renderDashboard();
  });

  const description = document.createElement("span");
  description.className = "entry-text";
  description.textContent =
    `Due: ${item.name} (${item.module}) - ${taskProgress(item)}`;

  entry.append(checkbox, description);

  makeRemoveButton(entry, item.name, function () {
    currentUser.assignments = currentUser.assignments.filter(
      a => a.id !== item.id
    );
    renderDashboard();
  });

  cell.append(entry);
}

// Display personal events
function addPersonalEntry(cell, item) {
  const entry = document.createElement("div");
  entry.className = "calendar-entry";

  const description = document.createElement("span");
  description.textContent =
    `Personal: ${item.time ? item.time + " " : ""}${item.name}`;

  entry.append(description);

  makeRemoveButton(entry, item.name, function () {
    currentUser.personalEvents = currentUser.personalEvents.filter(
      e => e.id !== item.id
    );
    renderDashboard();
  });

  cell.append(entry);
}

// Draw the monthly calendar
function renderCalendar() {
  if (!currentUser) return;

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  get("month-title").textContent = displayedMonth.toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );

  // Make Monday the first day of the week
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarBody = get("calendar-body");
  calendarBody.replaceChildren();

  let dayNumber = 1;

  while (dayNumber <= daysInMonth) {
    const row = document.createElement("tr");

    for (let column = 0; column < 7; column++) {
      const cell = document.createElement("td");

      if (
        (dayNumber !== 1 || column >= firstWeekday) &&
        dayNumber <= daysInMonth
      ) {
        const dateText =
          `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

        const number = document.createElement("strong");
        number.className = "calendar-date";
        number.textContent = dayNumber;
        cell.append(number);

        const events = [];

        // Recurring classes
        for (const item of currentUser.classes) {
          if (
            item.day === days[column] &&
            dateText >= item.firstDate &&
            dateText <= item.lastDate
          ) {
            events.push({
              type: "class",
              item,
              time: item.start
            });
          }
        }

        // Assignment deadlines
        for (const item of currentUser.assignments) {
          if (item.date === dateText) {
            events.push({
              type: "assignment",
              item,
              time: "23:59"
            });
          }
        }

        // Personal events
        for (const item of currentUser.personalEvents) {
          if (item.date === dateText) {
            events.push({
              type: "personal",
              item,
              time: item.time || "00:00"
            });
          }
        }

        // Multiple events can appear on one day
        events.sort((a, b) => a.time.localeCompare(b.time));

        for (const event of events) {
          if (event.type === "class") {
            addClassEntry(cell, event.item);
          }

          if (event.type === "assignment") {
            addAssignmentEntry(cell, event.item);
          }

          if (event.type === "personal") {
            addPersonalEntry(cell, event.item);
          }
        }

        dayNumber++;
      }

      row.append(cell);
    }

    calendarBody.append(row);
  }
}
