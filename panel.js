const ul = document.getElementById("list");
const addBtn = document.getElementById("add");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const collapsedSizeInput = document.getElementById("collapsed-size");
const collapsedSizeValue = document.getElementById("collapsed-size-value");
const primaryColorInput = document.getElementById("primary-color");
const iconColorInput = document.getElementById("icon-color");
const panelBgColorInput = document.getElementById("panel-bg-color");

// --- Initialization ---
const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get('key');
let bookmarks = JSON.parse(localStorage.getItem("swaggerBookmarks_" + key) || "[]");
let selecting = false;
let draggedItem = null;

// 預設設定
const defaultSettings = {
  collapsedSize: 40,
  primaryColor: '#0078d7',
  iconColor: '#ffffff',
  panelBgColor: '#fafafa',
};

// --- Functions ---
function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty('--collapsed-size', settings.collapsedSize + 'px');
  root.style.setProperty('--primary-color', settings.primaryColor);
  root.style.setProperty('--icon-color', settings.iconColor);
  root.style.setProperty('--panel-bg-color', settings.panelBgColor);

  // 通知 content script 更新 iframe 尺寸
  parent.postMessage({ type: "updateCollapsedSize", size: settings.collapsedSize }, "*");
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
  collapsedSizeInput.value = settings.collapsedSize;
  collapsedSizeValue.textContent = settings.collapsedSize + 'px';
  primaryColorInput.value = settings.primaryColor;
  iconColorInput.value = settings.iconColor;
  panelBgColorInput.value = settings.panelBgColor;
}

/** 離開選取模式 */
function exitSelectMode() {
  selecting = false;
  addBtn.textContent = "＋";
  addBtn.style.background = "";
  parent.postMessage({ type: "exitSelectMode" }, "*");
}

/** 渲染書籤列表 */
function render() {
  ul.innerHTML = "";
  bookmarks.forEach((b, i) => {
    const li = document.createElement("li");
    li.dataset.index = i;
    li.draggable = true;

    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      </svg>
    `;
    li.appendChild(handle);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = b.name;
    nameSpan.style.flexGrow = "1";
    nameSpan.onclick = () => {
      parent.postMessage({ type: "scrollToElement", selector: b.selector }, "*");
    };
    li.appendChild(nameSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
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
  draggedItem = e.target;
  // 使用 setTimeout 讓瀏覽器有時間渲染拖曳影像
  setTimeout(() => {
    draggedItem.classList.add('dragging');
  }, 0);
});

// 當拖曳經過其他元素時
ul.addEventListener('dragover', (e) => {
  e.preventDefault(); // 必須阻止預設行為才能觸發 drop
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
  const target = e.target.closest('li');
  if (target && draggedItem) {
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
    addBtn.style.background = "#ff5252";
    parent.postMessage({ type: "enterSelectMode" }, "*");
  } else {
    exitSelectMode();
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
    collapsedSize: parseInt(collapsedSizeInput.value, 10),
    primaryColor: primaryColorInput.value,
    iconColor: iconColorInput.value,
    panelBgColor: panelBgColorInput.value,
  };
  localStorage.setItem("swaggerBookmarks_settings", JSON.stringify(newSettings));
  applySettings(newSettings);
  settingsPanel.classList.add("hidden");
};

// 即時顯示尺寸滑桿的數值
collapsedSizeInput.oninput = () => {
  collapsedSizeValue.textContent = collapsedSizeInput.value + 'px';
};


// --- Initial Run ---
document.body.classList.add("collapsed");
loadSettings(); // 首次載入時就讀取並套用設定
render();