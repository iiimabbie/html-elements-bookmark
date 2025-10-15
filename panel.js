'use strict';
const ul = document.getElementById("list");
const addBtn = document.getElementById("add");
const deleteModeBtn = document.getElementById("delete-mode-btn");
const deleteControls = document.getElementById("delete-controls");
const selectAllCheckbox = document.getElementById("select-all-checkbox");
const deleteSelectedBtn = document.getElementById("delete-selected-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const primaryColorInput = document.getElementById("primary-color");
const iconColorInput = document.getElementById("icon-color");
const panelBgColorInput = document.getElementById("panel-bg-color");

// --- Initialization ---
const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get('key');
let bookmarks = JSON.parse(localStorage.getItem("swaggerBookmarks_" + key) || "[]");
let selecting = false;
let deleteMode = false;
let draggedItem = null;

// 預設設定
const defaultSettings = {
  primaryColor: '#0078d7',
  iconColor: '#ffffff',
  panelBgColor: '#fafafa',
};

// --- Functions ---
function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', settings.primaryColor);
  root.style.setProperty('--icon-color', settings.iconColor);
  root.style.setProperty('--panel-bg-color', settings.panelBgColor);

}

/** 從 localStorage 載入設定 */
function loadSettings() {
  const savedSettings = JSON.parse(localStorage.getItem("swaggerBookmarks_settings"));
  // 合併已儲存設定與預設值
  const settings = { ...defaultSettings, ...savedSettings };
  applySettings(settings);
  return settings;
}

/** 將設定表單的值更新為目前的設定 */
function populateSettingsForm(settings) {
  primaryColorInput.value = settings.primaryColor;
  iconColorInput.value = settings.iconColor;
  panelBgColorInput.value = settings.panelBgColor;
}

/** 進入刪除模式 */
function enterDeleteMode() {
  deleteMode = true;
  addBtn.classList.add("hidden");
  settingsBtn.classList.add("hidden");
  deleteControls.classList.remove("hidden");
  document.body.classList.add("delete-mode");
  render();
}

/** 離開刪除模式 */
function exitDeleteMode() {
  deleteMode = false;
  addBtn.classList.remove("hidden");
  settingsBtn.classList.remove("hidden");
  deleteControls.classList.add("hidden");
  selectAllCheckbox.checked = false;
  document.body.classList.remove("delete-mode");
  render();
}

/** 離開選取模式 */
function exitSelectMode() {
  selecting = false;
  addBtn.textContent = "＋";
  addBtn.classList.remove('cancel-select-btn');
  parent.postMessage({ type: "exitSelectMode" }, "*");
  // 如果在選取模式下，也退出刪除模式
  if (deleteMode) {
    exitDeleteMode();
  }
}

/** 進入編輯模式 */
function enterEditMode(li, bookmark, index) {
  const nameSpan = li.querySelector('span');
  const editBtn = li.querySelector('.edit-btn');
  const deleteBtn = li.querySelector('button:not(.edit-btn)'); // Assuming delete button is the other button

  nameSpan.classList.add('hidden');
  editBtn.classList.add('hidden');
  if (deleteBtn) deleteBtn.classList.add('hidden');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = bookmark.name;
  input.className = 'edit-input';
  li.insertBefore(input, nameSpan);
  input.focus();

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'O';
  saveBtn.className = 'save-btn';
  li.appendChild(saveBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'X';
  cancelBtn.className = 'cancel-btn';
  li.appendChild(cancelBtn);

  saveBtn.onclick = () => {
    bookmark.name = input.value;
    localStorage.setItem("swaggerBookmarks_" + key, JSON.stringify(bookmarks));
    render();
  };

  cancelBtn.onclick = () => {
    render(); // Simply re-render to exit edit mode without saving
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    } else if (e.key === 'Escape') {
      cancelBtn.click();
    }
  });
}

/** 渲染書籤列表 */
function render() {
  ul.innerHTML = "";
  bookmarks.forEach((b, i) => {
    const li = document.createElement("li");
    li.dataset.index = i;
    li.draggable = !deleteMode; // 在刪除模式下不可拖曳

    // 根據是否為刪除模式，決定要顯示 checkbox 還是拖曳 handle
    if (deleteMode) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "delete-checkbox";
      checkbox.dataset.index = i;
      li.appendChild(checkbox);
    } else {
      const handle = document.createElement("div");
      handle.className = "drag-handle";
      handle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
        </svg>
      `;
      li.appendChild(handle);
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = b.name;
    nameSpan.style.flexGrow = "1";
    nameSpan.onclick = () => {
      // 在刪除模式下，點擊 span 也會勾選 checkbox
      if (deleteMode) {
        const checkbox = li.querySelector(".delete-checkbox");
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      } else {
        parent.postMessage({ type: "scrollToElement", selector: b.selector }, "*");
      }
    };
    li.appendChild(nameSpan);

    const editBtn = document.createElement("button");
    editBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    `;
    editBtn.className = "edit-btn";
    editBtn.style.display = deleteMode ? "none" : "block";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      enterEditMode(li, b, i);
    };
    li.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.style.display = deleteMode ? "none" : "block"; // 在刪除模式下隱藏
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      bookmarks.splice(i, 1);
      localStorage.setItem("swaggerBookmarks_" + key, JSON.stringify(bookmarks));
      render();
    };
    li.appendChild(deleteBtn);
    ul.appendChild(li);
  });
}

// --- Event Listeners ---
// 當開始拖曳時
ul.addEventListener('dragstart', (e) => {
  if (deleteMode) {
    e.preventDefault();
    return;
  }
  draggedItem = e.target;
  // 使用 setTimeout 讓瀏覽器有時間渲染拖曳影像
  setTimeout(() => {
    if (draggedItem) {
      draggedItem.classList.add('dragging');
    }
  }, 0);
});

// 當拖曳經過其他元素時
ul.addEventListener('dragover', (e) => {
  e.preventDefault(); // 必須阻止預設行為才能觸發 drop
  if (deleteMode || !draggedItem) return;

  const target = e.target.closest('li');
  if (target && target !== draggedItem) {
    // 移除所有預覽線
    ul.querySelectorAll('li').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    const rect = target.getBoundingClientRect();
    const offset = e.clientY - rect.top;

    // 如果滑鼠在目標元素的前半部分，就在上方顯示預覽線，否則在下方
    if (offset < rect.height / 2) {
      target.classList.add('drag-over-top');
    } else {
      target.classList.add('drag-over-bottom');
    }
  }
});

// 當拖曳離開一個可放置區域時
ul.addEventListener('dragleave', (e) => {
  const target = e.target.closest('li');
  if (target) {
    target.classList.remove('drag-over-top', 'drag-over-bottom');
  }
});

// 當拖曳結束 (放下) 時
ul.addEventListener('drop', (e) => {
  e.preventDefault();
  if (deleteMode || !draggedItem) return;

  const target = e.target.closest('li');
  if (target) {
    target.classList.remove('drag-over-top', 'drag-over-bottom');

    const fromIndex = parseInt(draggedItem.dataset.index, 10);
    let toIndex = parseInt(target.dataset.index, 10);

    const rect = target.getBoundingClientRect();
    const offset = e.clientY - rect.top;

    // 如果是放在目標的下半部，目標索引要加 1
    if (offset > rect.height / 2) {
      toIndex++;
    }

    // 如果是從上面移到下面，目標索引要減 1
    if (fromIndex < toIndex) {
      toIndex--;
    }

    // 更新書籤陣列
    const [reorderedItem] = bookmarks.splice(fromIndex, 1);
    bookmarks.splice(toIndex, 0, reorderedItem);

    // 儲存並重新渲染
    localStorage.setItem("swaggerBookmarks_" + key, JSON.stringify(bookmarks));
    render();
  }
});

// 不管成功或失敗，當拖曳操作完全結束時
ul.addEventListener('dragend', () => {
  if (draggedItem) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
    // 清理所有可能殘留的預覽線
    ul.querySelectorAll('li').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }
});

// "新增書籤" 按鈕
addBtn.onclick = () => {
  if (!selecting) {
    // 進入選取模式
    selecting = true;
    addBtn.textContent = "取消";
    addBtn.classList.add('cancel-select-btn');
    parent.postMessage({ type: "enterSelectMode" }, "*");
  } else {
    exitSelectMode();
  }
};

// "刪除模式" 按鈕
deleteModeBtn.onclick = () => {
  if (deleteMode) {
    exitDeleteMode();
  } else {
    enterDeleteMode();
  }
};

// "全選" checkbox
selectAllCheckbox.onchange = (e) => {
  const checkboxes = ul.querySelectorAll(".delete-checkbox");
  checkboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
  });
};

// "刪除選取" 按鈕
deleteSelectedBtn.onclick = () => {
  const checkboxes = ul.querySelectorAll(".delete-checkbox:checked");
  const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index, 10));

  if (indicesToDelete.length === 0) {
    alert("請先選取要刪除的書籤。");
    return;
  }

  // 顯示確認對話框
  if (confirm(`確定要刪除 ${indicesToDelete.length} 個書籤嗎？`)) {
    // 從後往前刪除，避免 index 錯亂
    indicesToDelete.sort((a, b) => b - a).forEach(index => {
      bookmarks.splice(index, 1);
    });

    localStorage.setItem("swaggerBookmarks_" + key, JSON.stringify(bookmarks));
    render(); // 重新渲染以反映刪除後的列表
    exitDeleteMode(); // 刪除完成後退出刪除模式
  }
};


// 來自 content script 或自身的訊息
window.addEventListener("message", (e) => {
  if (e.data.type === "addBookmark") {
    bookmarks.push({ name: e.data.name, selector: e.data.selector });
    localStorage.setItem("swaggerBookmarks_" + key, JSON.stringify(bookmarks));
    render();

    exitSelectMode();
  } else if (e.data.type === "exitSelectMode") {
    selecting = false;
    addBtn.textContent = "＋";
    addBtn.style.background = "";
  } else if (e.data.type === "expand") {
    document.body.classList.remove("collapsed");
  } else if (e.data.type === "collapse") {
    document.body.classList.add("collapsed");
  }
});

window.addEventListener('keydown', (e) => {
  if (selecting && e.key === 'Escape') {
    exitSelectMode();
  }
});

// 打開設定面板
settingsBtn.onclick = () => {
  const currentSettings = loadSettings();
  populateSettingsForm(currentSettings);
  settingsPanel.classList.remove("hidden");
};

// 關閉設定面板
closeSettingsBtn.onclick = () => {
  settingsPanel.classList.add("hidden");
};

// 儲存設定
saveSettingsBtn.onclick = () => {
  const newSettings = {
    primaryColor: primaryColorInput.value,
    iconColor: iconColorInput.value,
    panelBgColor: panelBgColorInput.value,
  };
  localStorage.setItem("swaggerBookmarks_settings", JSON.stringify(newSettings));
  applySettings(newSettings);
  settingsPanel.classList.add("hidden");
};

// --- Initial Run ---
document.body.classList.add("collapsed");
loadSettings(); // 首次載入時就讀取並套用設定
render();