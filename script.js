const STORAGE_KEY = "tasks";
const PRIORITY_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

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
let filterMode = "all";
let confirmedDeadlineValue = "";
let draftDeadlineDate = new Date();

const filterLabels = {
  all: "全部任务",
  pending: "未完成任务",
  priority: "优先任务",
  overdue: "已过期任务",
  todayDone: "今日完成",
  focus: "专注模式"
};

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("无法保存本地任务数据：", error);
    alert("任务保存失败，请检查浏览器是否允许本地存储。");
  }
}

function setFilter(newFilter) {
  filterMode = newFilter;
  updateFilterUI();
  renderTasks();
}

function setMode(newMode) {
  setFilter(newMode);
}

function updateFilterUI() {
  document.querySelectorAll(".filter-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filterMode);
  });

  document.getElementById("activeFilterLabel").textContent =
    filterLabels[filterMode] || filterLabels.all;
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseDeadline(deadline) {
  if (!deadline) {
    return new Date(NaN);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    const [year, month, day] = deadline.split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 0, 0);
  }

  return new Date(deadline);
}

function toDateTimeLocalValue(deadline) {
  const date = parseDeadline(deadline);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatPickerLabel(deadline) {
  const date = parseDeadline(deadline);

  if (Number.isNaN(date.getTime())) {
    return "年/月/日 --:--";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function getDeadlineInfo(deadline) {
  const now = new Date();
  const today = getTodayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(today.getDate() + 2);
  const deadlineDate = parseDeadline(deadline);
  const diffMs = deadlineDate - now;
  const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24)) - 1;

  let statusText = "";
  let statusClass = "";

  if (diffMs < 0) {
    statusText = "已过期";
    statusClass = "overdue";
  } else if (deadlineDate >= today && deadlineDate < tomorrow) {
    statusText = "今天截止";
    statusClass = "today";
  } else if (deadlineDate >= tomorrow && deadlineDate < afterTomorrow) {
    statusText = "明天截止";
    statusClass = "soon";
  } else {
    statusText = "剩余 " + Math.max(diffDays, 0) + " 天";
    statusClass = "normal";
  }

  return {
    deadlineDate,
    diffMs,
    diffDays,
    statusText,
    statusClass
  };
}

function formatDeadline(deadline) {
  const date = parseDeadline(deadline);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${month}-${day} ${hour}:${minute}`;
}

function isCompletedToday(task) {
  if (!task.done || !task.completedAt) {
    return false;
  }

  const today = getTodayStart();
  const completedDate = new Date(task.completedAt);
  completedDate.setHours(0, 0, 0, 0);

  return completedDate.getTime() === today.getTime();
}

function isPriorityTask(task, info) {
  return !task.done && info.diffMs <= PRIORITY_WINDOW_MS;
}

function getTaskSortBucket(task, info) {
  if (task.done) {
    return 2;
  }

  if (info.diffMs < 0) {
    return 1;
  }

  return 0;
}

function compareTasks(a, b) {
  const aInfo = getDeadlineInfo(a.deadline);
  const bInfo = getDeadlineInfo(b.deadline);
  const aBucket = getTaskSortBucket(a, aInfo);
  const bBucket = getTaskSortBucket(b, bInfo);

  if (aBucket !== bBucket) {
    return aBucket - bBucket;
  }

  if (aBucket === 1) {
    return bInfo.deadlineDate - aInfo.deadlineDate;
  }

  if (aBucket === 2) {
    return new Date(b.completedAt || 0) - new Date(a.completedAt || 0);
  }

  return aInfo.deadlineDate - bInfo.deadlineDate;
}

function updateStats() {
  let pendingCount = 0;
  let urgentCount = 0;
  let overdueCount = 0;
  let todayDoneCount = 0;

  tasks.forEach((task) => {
    const info = getDeadlineInfo(task.deadline);

    if (!task.done) {
      pendingCount++;

      if (isPriorityTask(task, info)) {
        urgentCount++;
      }

      if (info.diffMs < 0) {
        overdueCount++;
      }
    }

    if (isCompletedToday(task)) {
      todayDoneCount++;
    }
  });

  document.getElementById("allCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent = pendingCount;
  document.getElementById("urgentCount").textContent = urgentCount;
  document.getElementById("overdueCount").textContent = overdueCount;
  document.getElementById("todayDoneCount").textContent = todayDoneCount;
  document.getElementById("focusCount").textContent = urgentCount;
  updateFilterUI();
}

function shouldShowTask(task, info) {
  if (filterMode === "pending") {
    return !task.done;
  }

  if (filterMode === "priority" || filterMode === "focus") {
    return isPriorityTask(task, info);
  }

  if (filterMode === "overdue") {
    return !task.done && info.diffMs < 0;
  }

  if (filterMode === "todayDone") {
    return isCompletedToday(task);
  }

  return true;
}

function createTitleEditor(task, title, content) {
  if (content.querySelector(".title-editor")) {
    return;
  }

  const editor = document.createElement("div");
  editor.className = "title-editor";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = task.text;
  titleInput.placeholder = "输入任务标题...";

  const actions = document.createElement("div");
  actions.className = "editor-actions";

  const saveButton = document.createElement("button");
  saveButton.textContent = "保存";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "取消";

  const saveTitle = function () {
    const newTitle = titleInput.value.trim();

    if (!newTitle) {
      titleInput.focus();
      return;
    }

    task.text = newTitle;
    saveTasks();
    renderTasks();
  };

  saveButton.onclick = function (event) {
    event.stopPropagation();
    saveTitle();
  };

  cancelButton.onclick = function (event) {
    event.stopPropagation();
    renderTasks();
  };

  titleInput.onclick = function (event) {
    event.stopPropagation();
  };

  titleInput.onkeydown = function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
    } else if (event.key === "Escape") {
      renderTasks();
    }
  };

  actions.appendChild(saveButton);
  actions.appendChild(cancelButton);
  editor.appendChild(titleInput);
  editor.appendChild(actions);
  title.replaceWith(editor);
  titleInput.focus();
  titleInput.select();
}

function createNoteEditor(task, note, content) {
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
}

function createDateEditor(task, li, editButton) {
  const editor = document.createElement("div");
  editor.className = "date-editor";

  const dateInput = document.createElement("input");
  dateInput.type = "datetime-local";
  dateInput.value = toDateTimeLocalValue(task.deadline);

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
}

function renderTasks() {
  updateStats();

  document.getElementById("taskList").innerHTML = "";

  tasks.sort(compareTasks);

  tasks.forEach((task, index) => {
    const info = getDeadlineInfo(task.deadline);

    if (!shouldShowTask(task, info)) {
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
    const isOverdueTask = !task.done && info.diffMs < 0;

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.text;
    title.title = "双击编辑标题";

    if (isOverdueTask) {
      const overdueBadge = document.createElement("span");
      overdueBadge.className = "overdue-badge";
      overdueBadge.textContent = "OVERDUE";
      title.appendChild(overdueBadge);
    }

    title.ondblclick = function (event) {
      event.stopPropagation();
      createTitleEditor(task, title, content);
    };

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = formatDeadline(task.deadline) + " ｜ " + info.statusText;

    const overdueHint = document.createElement("span");
    overdueHint.className = "overdue-hint";
    overdueHint.textContent = "请重新安排时间";

    const note = document.createElement("div");
    note.className = "task-note";
    note.textContent = task.note ? "备注：" + task.note : "点击任务添加备注";

    note.onclick = function (event) {
      event.stopPropagation();
      createNoteEditor(task, note, content);
    };

    content.appendChild(title);
    content.appendChild(meta);
    if (isOverdueTask) {
      content.appendChild(overdueHint);
    }
    content.appendChild(note);

    const editButton = document.createElement("button");
    editButton.textContent = "改期";
    editButton.className = "task-action edit-action";

    editButton.onclick = function () {
      createDateEditor(task, li, editButton);
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

    document.getElementById("taskList").appendChild(li);
  });
}

function updateDeadlineConfirmState() {
  const deadlineInput = document.getElementById("deadlineInput");
  const toggle = document.getElementById("deadlinePickerToggle");

  if (!deadlineInput || !toggle) {
    return;
  }

  toggle.textContent = formatPickerLabel(deadlineInput.value);

  if (!deadlineInput.value) {
    confirmedDeadlineValue = "";
  }
}

function getInitialDraftDeadline() {
  const currentValue = document.getElementById("deadlineInput").value;
  const currentDate = parseDeadline(currentValue);

  if (!Number.isNaN(currentDate.getTime())) {
    return currentDate;
  }

  const nextDate = new Date();
  nextDate.setSeconds(0, 0);
  nextDate.setMinutes(nextDate.getMinutes() + (5 - (nextDate.getMinutes() % 5 || 5)));
  return nextDate;
}

function closeDeadlinePicker() {
  document.getElementById("deadlinePickerPanel").hidden = true;
}

function toggleDeadlinePicker() {
  const panel = document.getElementById("deadlinePickerPanel");

  if (!panel.hidden) {
    closeDeadlinePicker();
    return;
  }

  draftDeadlineDate = getInitialDraftDeadline();
  renderDeadlinePicker();
  panel.hidden = false;
}

function shiftDraftMonth(direction) {
  draftDeadlineDate = new Date(
    draftDeadlineDate.getFullYear(),
    draftDeadlineDate.getMonth() + direction,
    1,
    draftDeadlineDate.getHours(),
    draftDeadlineDate.getMinutes()
  );
  renderDeadlinePicker();
}

function selectDraftDay(day) {
  draftDeadlineDate = new Date(
    draftDeadlineDate.getFullYear(),
    draftDeadlineDate.getMonth(),
    day,
    draftDeadlineDate.getHours(),
    draftDeadlineDate.getMinutes()
  );
  renderDeadlinePicker();
}

function updateDraftTime(unit, value) {
  const nextValue = Number(value);

  if (unit === "hour") {
    draftDeadlineDate.setHours(nextValue);
  } else {
    draftDeadlineDate.setMinutes(nextValue);
  }

  renderDeadlinePicker();
}

function renderDeadlinePicker() {
  const panel = document.getElementById("deadlinePickerPanel");
  const year = draftDeadlineDate.getFullYear();
  const month = draftDeadlineDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const hour = draftDeadlineDate.getHours();
  const minute = draftDeadlineDate.getMinutes();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  let calendarHtml = "";

  weekdays.forEach((weekday) => {
    calendarHtml += `<span class="deadline-weekday">${weekday}</span>`;
  });

  for (let index = 0; index < firstDay; index++) {
    calendarHtml += '<span class="deadline-day empty"></span>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const selected = day === draftDeadlineDate.getDate() ? " selected" : "";
    calendarHtml += `<button class="deadline-day${selected}" type="button" onclick="selectDraftDay(${day})">${day}</button>`;
  }

  panel.innerHTML = `
    <div class="deadline-panel-header">
      <button type="button" aria-label="上个月" onclick="shiftDraftMonth(-1)">‹</button>
      <strong>${year}年${String(month + 1).padStart(2, "0")}月</strong>
      <button type="button" aria-label="下个月" onclick="shiftDraftMonth(1)">›</button>
    </div>
    <div class="deadline-panel-body">
      <div class="deadline-calendar">${calendarHtml}</div>
      <div class="deadline-time">
        <label>
          <span>小时</span>
          <select onchange="updateDraftTime('hour', this.value)">
            ${Array.from({ length: 24 }, (_, index) => `<option value="${index}"${index === hour ? " selected" : ""}>${String(index).padStart(2, "0")}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>分钟</span>
          <select onchange="updateDraftTime('minute', this.value)">
            ${Array.from({ length: 60 }, (_, index) => `<option value="${index}"${index === minute ? " selected" : ""}>${String(index).padStart(2, "0")}</option>`).join("")}
          </select>
        </label>
      </div>
    </div>
    <div class="deadline-panel-footer">
      <span>${formatPickerLabel(toDateTimeLocalValue(draftDeadlineDate.toISOString()))}</span>
      <button class="deadline-confirm-button" type="button" onclick="confirmDeadlineSelection()">确认</button>
    </div>
  `;
}

function confirmDeadlineSelection() {
  const deadlineInput = document.getElementById("deadlineInput");

  if (Number.isNaN(draftDeadlineDate.getTime())) {
    alert("请先选择截止时间");
    return;
  }

  deadlineInput.value = toDateTimeLocalValue(draftDeadlineDate.toISOString());
  confirmedDeadlineValue = deadlineInput.value;
  closeDeadlinePicker();
  updateDeadlineConfirmState();
}

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const noteInput = document.getElementById("noteInput");
  const deadlineInput = document.getElementById("deadlineInput");

  const taskText = taskInput.value.trim();
  const note = noteInput.value.trim();
  const deadline = deadlineInput.value;

  if (taskText === "" || deadline === "") {
    alert("请输入任务和截止时间");
    return;
  }

  if (deadline !== confirmedDeadlineValue) {
    alert("请先确认截止时间");
    deadlineInput.focus();
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
  confirmedDeadlineValue = "";
  updateDeadlineConfirmState();
}

document.addEventListener("click", function (event) {
  const picker = document.getElementById("deadlinePicker");

  if (picker && !picker.contains(event.target)) {
    closeDeadlinePicker();
  }
});

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return Math.round(bytes / 1024) + " KB";
}

function updateDownloadProgress(payload) {
  const progress = document.getElementById("updateProgress");
  const title = document.getElementById("updateProgressTitle");
  const detail = document.getElementById("updateProgressDetail");
  const bar = document.getElementById("updateProgressBar");

  if (!progress || !title || !detail || !bar || !payload) {
    return;
  }

  if (payload.status === "error") {
    progress.hidden = false;
    title.textContent = payload.message || "更新失败";
    detail.textContent = "";
    bar.style.width = "100%";
    progress.classList.add("error");
    return;
  }

  progress.classList.remove("error");
  progress.hidden = false;

  const percent = Math.max(0, Math.min(100, Math.round(payload.percent || 0)));
  bar.style.width = percent + "%";

  if (payload.status === "downloaded") {
    title.textContent = payload.message || "更新已下载";
    detail.textContent = "100%";
    return;
  }

  title.textContent = "更新下载中";

  const transferred = formatBytes(payload.transferred);
  const total = formatBytes(payload.total);
  detail.textContent = transferred && total ? `${percent}% · ${transferred}/${total}` : `${percent}%`;
}

if (window.priorityPlannerUpdates) {
  window.priorityPlannerUpdates.onProgress(updateDownloadProgress);
}

renderTasks();
updateFilterUI();
updateDeadlineConfirmState();
