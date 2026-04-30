let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let mode = "all";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function setMode(newMode) {
  mode = newMode;
  updateModeUI();
  renderTasks();
}

function updateModeUI() {
  const allBtn = document.getElementById("allBtn");
  const focusBtn = document.getElementById("focusBtn");

  allBtn.classList.remove("active");
  focusBtn.classList.remove("active");

  if (mode === "all") {
    allBtn.classList.add("active");
  } else {
    focusBtn.classList.add("active");
  }
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDeadlineInfo(deadline) {
  const today = getTodayStart();
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let statusText = "";
  let statusClass = "";

  if (diffDays < 0) {
    statusText = "已过期";
    statusClass = "overdue";
  } else if (diffDays === 0) {
    statusText = "今天截止";
    statusClass = "today";
  } else if (diffDays === 1) {
    statusText = "明天截止";
    statusClass = "soon";
  } else {
    statusText = "剩余 " + diffDays + " 天";
    statusClass = "normal";
  }

  return {
    diffDays,
    statusText,
    statusClass
  };
}

function formatDate(deadline) {
  const date = new Date(deadline);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return month + "-" + day;
}

function updateStats() {
  const today = getTodayStart();

  let todayDoneCount = 0;
  let pendingCount = 0;
  let urgentCount = 0;
  let overdueCount = 0;

  tasks.forEach((task) => {
    const info = getDeadlineInfo(task.deadline);

    if (!task.done) {
      pendingCount++;

      if (info.diffDays <= 2) {
        urgentCount++;
      }

      if (info.diffDays < 0) {
        overdueCount++;
      }
    }

    if (task.done && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      completedDate.setHours(0, 0, 0, 0);

      if (completedDate.getTime() === today.getTime()) {
        todayDoneCount++;
      }
    }
  });

  document.getElementById("todayDoneCount").textContent = todayDoneCount;
  document.getElementById("pendingCount").textContent = pendingCount;
  document.getElementById("urgentCount").textContent = urgentCount;
  document.getElementById("overdueCount").textContent = overdueCount;
}

function renderTasks() {
    updateStats();

  document.getElementById("urgentList").innerHTML = "";
  document.getElementById("normalList").innerHTML = "";

  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done - b.done;

    const aInfo = getDeadlineInfo(a.deadline);
    const bInfo = getDeadlineInfo(b.deadline);

    return aInfo.diffDays - bInfo.diffDays;
  });

  tasks.forEach((task, index) => {
    const info = getDeadlineInfo(task.deadline);
if (mode === "focus") {
  if (task.done || info.diffDays > 2) {
    return;
  }
}
    const li = document.createElement("li");
    li.classList.add(info.statusClass);

    if (task.done) {
      li.classList.add("done");
    }

    const doneButton = document.createElement("button");
    doneButton.textContent = task.done ? "✔" : "";

 doneButton.onclick = function () {
  task.done = !task.done;

  if (task.done) {
    task.completedAt = new Date().toISOString();
  } else {
    task.completedAt = null;
  }

  saveTasks();
  renderTasks();
};

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.text;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = formatDate(task.deadline) + " ｜ " + info.statusText;

    const note = document.createElement("div");
    note.className = "task-note";
    note.textContent = task.note ? "备注：" + task.note : "点击任务添加备注";

    content.onclick = function () {
      const newNote = prompt("输入你的备注（当前进度）：", task.note || "");

      if (newNote !== null) {
        task.note = newNote;
        saveTasks();
        renderTasks();
      }
    };

    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(note);

const editButton = document.createElement("button");
editButton.textContent = "改期";

editButton.onclick = function () {
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = task.deadline;

  dateInput.onchange = function () {
    task.deadline = dateInput.value;
    saveTasks();
    renderTasks();
  };

  li.replaceChild(dateInput, editButton);
  dateInput.focus();
};
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "删除";

    deleteButton.onclick = function () {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    };

    li.appendChild(doneButton);
    li.appendChild(content);
    li.appendChild(editButton);
    li.appendChild(deleteButton);

    if (info.diffDays <= 2) {
      document.getElementById("urgentList").appendChild(li);
    } else {
      document.getElementById("normalList").appendChild(li);
    }
  });
}

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const deadlineInput = document.getElementById("deadlineInput");

  const taskText = taskInput.value;
  const deadline = deadlineInput.value;

  if (taskText === "" || deadline === "") {
    alert("请输入任务和 deadline");
    return;
  }

  tasks.push({
    text: taskText,
    deadline: deadline,
    note: "",
    done: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
  deadlineInput.value = "";
}

renderTasks();
updateModeUI();