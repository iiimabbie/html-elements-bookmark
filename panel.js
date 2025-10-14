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
  parent.postMessage({type: "exitSelectMode"}, "*");
}

/** 渲染書籤列表 */
function render() {
  ul.innerHTML = "";
  bookmarks.forEach((b, i) => {
    const li = document.createElement("li");
    li.textContent = b.name;
    li.onclick = () => {
      parent.postMessage({type: "scrollToElement", selector: b.selector}, "*");
    };

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
// "新增書籤" 按鈕
addBtn.onclick = () => {
  if (!selecting) {
    // 進入選取模式
    selecting = true;
    addBtn.textContent = "取消";
    addBtn.style.background = "#ff5252";
    parent.postMessage({type: "enterSelectMode"}, "*");
  } else {
    exitSelectMode();
  }
};

// 來自 content script 或自身的訊息
window.addEventListener("message", (e) => {
  if (e.data.type === "addBookmark") {
    bookmarks.push({name: e.data.name, selector: e.data.selector});
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