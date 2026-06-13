const STORAGE_KEY = "tasks";

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    console.error("无法读取本地任务数据：", error);
    return [];
  }
}

let tasks = loadTasks();
let mode = "all";

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("无法保存本地任务数据：", error);
    alert("任务保存失败，请检查浏览器是否允许本地存储。");
  }
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

    if (mode === "focus" && (task.done || info.diffDays > 2)) {
      return;
    }

    const li = document.createElement("li");
    li.classList.add(info.statusClass);

    if (task.done) {
      li.classList.add("done");
    }

    const doneButton = document.createElement("button");
    doneButton.textContent = task.done ? "✓" : "";
    doneButton.setAttribute("aria-label", task.done ? "标记为未完成" : "标记为已完成");

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
      if (content.querySelector(".note-editor")) {
        return;
      }

      const editor = document.createElement("div");
      editor.className = "note-editor";

      const noteInput = document.createElement("textarea");
      noteInput.rows = 3;
      noteInput.value = task.note || "";
      noteInput.placeholder = "输入备注或当前进度...（Shift + Enter 换行）";

      const actions = document.createElement("div");
      actions.className = "editor-actions";

      const saveButton = document.createElement("button");
      saveButton.textContent = "保存";

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "取消";

      const saveNote = function () {
        task.note = noteInput.value.trim();
        saveTasks();
        renderTasks();
      };

      saveButton.onclick = function (event) {
        event.stopPropagation();
        saveNote();
      };

      cancelButton.onclick = function (event) {
        event.stopPropagation();
        renderTasks();
      };

      noteInput.onclick = function (event) {
        event.stopPropagation();
      };

      noteInput.onkeydown = function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          saveNote();
        } else if (event.key === "Escape") {
          renderTasks();
        }
      };

      actions.appendChild(saveButton);
      actions.appendChild(cancelButton);
      editor.appendChild(noteInput);
      editor.appendChild(actions);
      note.replaceWith(editor);
      noteInput.focus();
    };

    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(note);

    const editButton = document.createElement("button");
    editButton.textContent = "改期";
    editButton.className = "task-action edit-action";

    editButton.onclick = function () {
      const editor = document.createElement("div");
      editor.className = "date-editor";

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = task.deadline;

      const confirmButton = document.createElement("button");
      confirmButton.textContent = "确认";

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "取消";

      confirmButton.onclick = function () {
        if (!dateInput.value) {
          return;
        }

        task.deadline = dateInput.value;
        saveTasks();
        renderTasks();
      };

      cancelButton.onclick = function () {
        renderTasks();
      };

      dateInput.onkeydown = function (event) {
        if (event.key === "Enter") {
          confirmButton.click();
        } else if (event.key === "Escape") {
          renderTasks();
        }
      };

      editor.appendChild(dateInput);
      editor.appendChild(confirmButton);
      editor.appendChild(cancelButton);
      li.replaceChild(editor, editButton);
      dateInput.focus();
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "删除";
    deleteButton.className = "task-action delete-action";

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
  const noteInput = document.getElementById("noteInput");
  const deadlineInput = document.getElementById("deadlineInput");

  const taskText = taskInput.value.trim();
  const note = noteInput.value.trim();
  const deadline = deadlineInput.value;

  if (taskText === "" || deadline === "") {
    alert("请输入任务和 deadline");
    return;
  }

  tasks.push({
    text: taskText,
    deadline: deadline,
    note: note,
    done: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();

  taskInput.value = "";
  noteInput.value = "";
  deadlineInput.value = "";
}

renderTasks();
updateModeUI();
