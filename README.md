[English](./README.md) | [Traditional Chinese (正體中文)](./README_zh-TW.md)

# HTML Element Bookmarker

A highly customizable Chrome Extension that adds a floating panel to any webpage, allowing you to bookmark any element for quick navigation. Perfect for long, complex pages like Swagger UI, API documentation, or lengthy articles.

---

###  Features

*   **Bookmark Anything**: Click the '+' button, then click any element on the page—an API endpoint, a specific paragraph, an image—to save it as a bookmark.
*   **Quick Navigation**: Instantly scroll to any bookmarked element with a single click.
*   **Visual Cue**: The destination element flashes with a yellow highlight, so you never lose track of where you've landed.
*   **Intuitive Ordering**: Easily reorder your bookmarks using drag-and-drop to create the perfect workflow.
*   **Site-Specific Storage**: Bookmarks are saved independently for each unique URL, keeping your workspaces clean and organized.
*   **Cancel Anytime**: Accidentally entered selection mode? Simply click the "Cancel" button or press the `Esc` key to exit without making a selection.
*   **Highly Customizable**: Click the gear icon to personalize the appearance. Adjust the size of the collapsed button and change the colors (primary, icon, panel background) to match your favorite theme or website design.
*   **Sleek & Unobtrusive UI**: The panel elegantly collapses into a compact floating action button when not in use, and smoothly expands on mouse hover.

> **Suggestion:** Consider adding a short GIF here demonstrating the main features like adding, clicking, reordering, and customizing bookmarks.

###  How to Use

1.  **Add a Bookmark**:
    *   Hover over the floating icon to expand the panel.
    *   Click the `+` button. The button will change to "Cancel".
    *   As you move your mouse over the webpage, elements will be highlighted with a red border.
    *   Click the element you want to bookmark. It will be instantly added to the list.

2.  **Navigate to a Bookmark**:
    *   Simply click on any bookmark in the panel. The page will smoothly scroll to its position.

3.  **Reorder Bookmarks**:
    *   Click and hold the `::` drag handle next to a bookmark's name.
    *   Drag it to your desired position in the list and release.

4.  **Delete a Bookmark**:
    *   Click the `×` button on the right side of the bookmark you wish to remove.

5.  **Customize Appearance**:
    *   Click the gear `⚙️` icon at the bottom-right of the expanded panel.
    *   Adjust the collapsed button size with the slider and pick your preferred colors.
    *   Click "Save". The changes will be applied instantly.

###  Installation for Development

If you wish to modify or inspect the code, follow these steps to install it locally:

1.  Clone or download this repository to your local machine.
2.  Open the Chrome browser and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle in the top-right corner.
4.  Click on the "Load unpacked" button in the top-left corner.
5.  Select the project folder you just downloaded.
6.  The extension is now installed! You should see the floating bookmark panel on any webpage.

### 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
