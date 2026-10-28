# QuillCraft — Bookshelf Edition

A Minecraft-inspired, local-first, editable Book & Quill notepad.

## What's new
- The **exact day.png and night.png** images supplied by the user are installed as the day/night backgrounds.
- The welcome screen displays the **front-facing librarian villager and lectern** extracted from the supplied screenshots.
- The sidebar is an actual **wall of Chiseled Bookshelves** using the seven screenshots from Bookshelf.zip. Each bookshelf displays 0–6 books and notes occupy the six slots in order, left-to-right, top-to-bottom. Hover or keyboard-focus a book to reveal its note title; click to open.
- Every six notes adds another bookshelf block. Searching temporarily filters the displayed books.
- Existing book editor, autosave, note management, crafting recipe, and backups are preserved.

## Start
Extract the ZIP and open this folder in VS Code. Run `index.html` with the Live Server extension, or from this directory run `python -m http.server 8000` and open http://localhost:8000.

## Data safety
The file `js/storage.js` is unchanged from Librarian Edition. The localStorage key remains `quillcraft.notes.v1`. The saved data is **not** stored inside the project ZIP; it remains in your browser, specific to the same origin (hostname + port + protocol). Export a JSON backup before switching projects, and import it if you use a different URL or browser. No server sync is used.

## Assets
The bookshelf, librarian, lectern, and day/night artwork were supplied by the user. Other item icons are included from the previously supplied icon ZIP. Please verify redistribution rights before publishing third-party game textures or screenshots publicly.

## Important
The book editing behavior is inherited from the previous version. The book spread divides text into approximate page-sized chunks. This release focuses on the bookshelf and supplied artwork.
