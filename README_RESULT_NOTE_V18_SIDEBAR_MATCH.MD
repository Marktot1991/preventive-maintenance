PM Dashboard V18 — Result Note Sidebar matches PM form Sidebar

Based on V17.
- Result Note > department > collapsible PM group > equipment code with optional short description.
- Department and group both expand/collapse on repeat click.
- Only forms with a nonempty saved Result Note appear (as before).
- No note count badges in the dropdown lists.
- Click on a form to filter the Result Note page to just that equipment.
- No database schema changes. PDF and Login untouched.
- Updated files: index.html, js/ui.js, js/result-notes-v9.js, css/result-note-sidebar-v18.css.

Deployment: upload all the contents of preventive-maintenance-main to GitHub Pages and hard refresh (Ctrl+F5).
Test with EM1 -> Flow Meter Unit -> FMU-004 (requires that form to have saved notes).
