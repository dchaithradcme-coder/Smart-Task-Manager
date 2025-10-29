window.onload = () => {
  requestNotificationPermission();
  loadTasksFromLocalStorage();
};

// 🔔 Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        alert('Notifications are blocked. Reminders may not work.');
      }
    });
  }
}

// ➕ Add a new task
function addTask() {
  const taskInput = document.getElementById('taskInput');
  const dateInput = document.getElementById('dateInput');
  const hourInput = document.getElementById('hourInput');
  const minuteInput = document.getElementById('minuteInput');
  const ampmInput = document.getElementById('ampmInput');
  const repeatInput = document.getElementById('repeatInput');
  const priorityInput = document.getElementById('priorityInput');
  const tagsInput = document.getElementById('tagsInput');
  const soundToggle = document.getElementById('soundToggle');

  const taskTitle = taskInput.value.trim();
  const dateValue = dateInput.value;
  const hour = parseInt(hourInput.value);
  const minute = parseInt(minuteInput.value);
  const ampm = ampmInput.value;
  const repeat = repeatInput.value;
  const priority = priorityInput.value;
  const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);

  if (!taskTitle || !dateValue || isNaN(hour) || isNaN(minute)) {
    alert('Please enter a valid task, date, and time.');
    return;
  }

  let adjustedHour = hour;
  if (ampm === 'PM' && hour < 12) adjustedHour += 12;
  if (ampm === 'AM' && hour === 12) adjustedHour = 0;

  const [year, month, day] = dateValue.split('-').map(Number);
  const reminderTime = new Date(year, month - 1, day, adjustedHour, minute);

  if (reminderTime <= new Date()) {
    alert('Reminder time must be in the future.');
    return;
  }

  const task = {
    title: taskTitle,
    date: dateValue,
    hour,
    minute,
    ampm,
    repeat,
    priority,
    tags
  };

  renderTask(task);
  saveTaskToLocalStorage(task);
  scheduleReminder(taskTitle, reminderTime, soundToggle.checked);
  speak(`Task added: ${taskTitle}, due on ${dateValue} at ${hour}:${minute.toString().padStart(2, '0')} ${ampm}, priority ${priority}`);

  // Clear inputs
  taskInput.value = '';
  dateInput.value = '';
  hourInput.value = '';
  minuteInput.value = '';
  ampmInput.value = 'AM';
  repeatInput.value = 'none';
  priorityInput.value = 'low';
  tagsInput.value = '';
}

// 🗣️ Speak a message
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  speechSynthesis.speak(utterance);
}

// 🔔 Schedule reminder
function scheduleReminder(taskTitle, reminderTime, soundEnabled) {
  const delay = reminderTime - new Date();
  if (delay > 0) {
    setTimeout(() => {
      if (soundEnabled) {
        new Audio('https://www.soundjay.com/button/beep-07.wav').play();
      }
      speak(`Reminder: ${taskTitle}`);
      if (Notification.permission === 'granted') {
        new Notification('🔔 Task Reminder', {
          body: `Time to: ${taskTitle}`,
          icon: 'https://via.placeholder.com/100'
        });
      } else {
        alert(`Reminder: ${taskTitle}`);
      }
    }, delay);
  }
}

// 📝 Render task in the list
function renderTask(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.priority}`;
  li.innerHTML = `
    <strong>${task.title}</strong><br>
    <small>📅 ${task.date} ⏰ ${task.hour}:${task.minute.toString().padStart(2, '0')} ${task.ampm} | 🔁 ${task.repeat}</small><br>
    <small>🏷️ Tags: ${task.tags.join(', ')}</small><br>
    <span class="priority-label">🔥 Priority: ${task.priority.toUpperCase()}</span><br>
    <button onclick="deleteTask(this, '${task.title}')">🗑️ Delete</button>
  `;
  document.getElementById('taskList').appendChild(li);
}

// 💾 Save task to localStorage
function saveTaskToLocalStorage(task) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// 📥 Load tasks from localStorage
function loadTasksFromLocalStorage() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach(task => renderTask(task));
}

// 🗑️ Delete task and move to history
function deleteTask(button, title) {
  const taskItem = button.parentElement;
  document.getElementById("taskList").removeChild(taskItem);

  const historyHTML = `✅ ${taskItem.innerHTML}`;
  const historyItem = document.createElement("li");
  historyItem.innerHTML = historyHTML;
  historyItem.querySelector("button")?.remove();
  document.getElementById("historyList")?.appendChild(historyItem);

  saveDeletedTaskToHistory(historyHTML);
  removeTaskFromLocalStorage(title);
}

// 💾 Save deleted task to localStorage
function saveDeletedTaskToHistory(taskHTML) {
  const history = JSON.parse(localStorage.getItem("deletedTasks")) || [];
  history.push({ html: taskHTML, deletedOn: new Date().toLocaleDateString('en-IN') });
  localStorage.setItem("deletedTasks", JSON.stringify(history));
}

// ❌ Remove task from localStorage
function removeTaskFromLocalStorage(title) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks = tasks.filter(task => task.title !== title);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}