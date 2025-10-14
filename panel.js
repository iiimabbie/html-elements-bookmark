const ul = document.getElementById("list");
const addBtn = document.getElementById("add");
const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get('key');

let bookmarks = JSON.parse(localStorage.getItem("swaggerBookmarks_" + key) || "[]");

// Start in collapsed state
document.body.classList.add("collapsed");

render();

let selecting = false;

addBtn.onclick = () => {
  if (!selecting) {
    selecting = true;
    addBtn.textContent = "選取中...";
    addBtn.style.background = "#ff5252";
    parent.postMessage({type: "enterSelectMode"}, "*");
  }
};

window.addEventListener("message", (e) => {
  if (e.data.type === "addBookmark") {
    bookmarks.push({name: e.data.name, selector: e.data.selector});
    localStorage.setItem("swaggerBookmarks_" + key, JSON.stringify(bookmarks));
    render();

    addBtn.textContent = "＋";
    addBtn.style.background = "white";
    selecting = false;
  } else if (e.data.type === "exitSelectMode") {
    addBtn.textContent = "＋";
    addBtn.style.background = "white";
    selecting = false;
  } else if (e.data.type === "expand") {
    document.body.classList.remove("collapsed");
  } else if (e.data.type === "collapse") {
    document.body.classList.add("collapsed");
  }
});

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
