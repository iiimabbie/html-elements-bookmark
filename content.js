(async function() {
  const panelURL = chrome.runtime.getURL("panel.html");

  // 注入閃爍動畫的 CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes flash {
      0% { background-color: rgba(255, 255, 0, 0); }
      50% { background-color: rgba(255, 255, 0, 0.7); }
      100% { background-color: rgba(255, 255, 0, 0); }
    }
    .flash-highlight {
      animation: flash 1s;
    }
  `;
  document.head.appendChild(style);

  // 檢查是否已存在
  if (document.querySelector("#swaggerBookmarkPanel")) return;

    // 用一個變數來儲存收合尺寸，以便動態更新
  let collapsedSize = 40;
  let isAnimating = false;
  const animationDuration = 200;

  const iframe = document.createElement("iframe");
  iframe.id = "swaggerBookmarkPanel";
  const pageKey = location.origin + location.pathname;
  iframe.src = panelURL + "?key=" + encodeURIComponent(pageKey);
  iframe.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    width: ${collapsedSize}px;
    height: ${collapsedSize}px;
    border: none;
    z-index: 999999;
    background: transparent;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border-radius: 50%;
    transition: all ${animationDuration / 1000}s ease-in-out;
    overflow: hidden;
  `;
  document.body.appendChild(iframe);

  iframe.addEventListener('mouseenter', () => {
    if (isAnimating) return; // 如果正在執行動畫，則忽略此事件
    isAnimating = true; // 鎖定

    iframe.style.width = '260px';
    iframe.style.height = '320px';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.2)';
    iframe.style.right = '0';
    iframe.contentWindow.postMessage({ type: "expand" }, "*");

    // 在動畫時間結束後解鎖
    setTimeout(() => { isAnimating = false; }, animationDuration);
  });
  iframe.addEventListener('mouseleave', () => {
    if (isAnimating) return; // 如果正在執行動畫，則忽略此事件
    isAnimating = true; // 鎖定

    iframe.style.width = collapsedSize + 'px'; // 使用變數
    iframe.style.height = collapsedSize + 'px'; // 使用變數
    iframe.style.borderRadius = '50%';
    iframe.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    iframe.style.right = '20px';
    iframe.contentWindow.postMessage({ type: "collapse" }, "*");

    // 在動畫時間結束後解鎖
    setTimeout(() => { isAnimating = false; }, animationDuration);
  });

  let selecting = false;
  let currentEl = null;


  const hoverBox = document.createElement("div");
  hoverBox.style.cssText = `
    position: absolute;
    border: 2px solid red;
    pointer-events: none;
    z-index: 999998;
    display: none;
  `;
  document.body.appendChild(hoverBox);

  // 通信：滾動到元素
  window.addEventListener("message", (e) => {
    // 監聽來自 panel 的尺寸更新訊息
    if (e.data.type === "updateCollapsedSize") {
      collapsedSize = e.data.size;
      // 如果當前是收合狀態，立即套用新尺寸
      if (iframe.style.width !== '260px') {
        iframe.style.width = collapsedSize + 'px';
        iframe.style.height = collapsedSize + 'px';
      }
    } else if (e.data.type === "scrollToElement") {
      const el = document.querySelector(e.data.selector);
      if (el) {
        el.scrollIntoView({behavior: "smooth", block: "center"});
        el.classList.add("flash-highlight");
        setTimeout(() => {
          el.classList.remove("flash-highlight");
        }, 1000);
      }
    } else if (e.data.type === "enterSelectMode") {
      selecting = true;
      hoverBox.style.display = "block";
    } else if (e.data.type === "exitSelectMode") {
      selecting = false;
      hoverBox.style.display = "none";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!selecting) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || iframe.contains(el)) return;
    const rect = el.getBoundingClientRect();
    hoverBox.style.display = "block";
    hoverBox.style.top = rect.top + window.scrollY + "px";
    hoverBox.style.left = rect.left + window.scrollX + "px";
    hoverBox.style.width = rect.width + "px";
    hoverBox.style.height = rect.height + "px";
    currentEl = el;
  });

  document.addEventListener("click", (e) => {
    if (!selecting || !currentEl) return;
    e.preventDefault();
    e.stopPropagation();

    const selector = getUniqueSelector(currentEl);
    const name = currentEl.textContent.trim().slice(0, 40) || selector;

    iframe.contentWindow.postMessage({type: "addBookmark", name, selector}, "*");

    selecting = false;
    hoverBox.style.display = "none";
    iframe.contentWindow.postMessage({type: "exitSelectMode"}, "*");
  }, true);

  function getUniqueSelector(el) {
    if (el.id) return "#" + el.id;
    const path = [];
    while (el && el.nodeType === 1 && el.tagName.toLowerCase() !== "html") {
      let index = 1;
      let sibling = el;
      while ((sibling = sibling.previousElementSibling) != null)
        if (sibling.tagName === el.tagName) index++;
      path.unshift(el.tagName.toLowerCase() + `:nth-of-type(${index})`);
      el = el.parentElement;
    }
    return path.join(" > ");
  }
})();