PM Dashboard V20 — Selecta (Emulsion 2)
-----------------------------------------
Source: PM Selecta_261121_135512.pdf (7 pages).
Added group: EM2 > Selecta > Selecta / Selecta D01 / Selecta D02
Functional Locations from PDF:
- Selecta: T-M-01-01-SEL (page 1; 2 equipment sections, 8 actual tasks)
- Selecta D01: T-M-01-01-SEL-001 (pages 2-4; 9 equipment sections, 28 actual tasks)
- Selecta D02: T-M-01-01-SEL-002 (pages 5-7; 9 equipment sections, 28 actual tasks)
Total: 3 forms, 20 equipment sections, 64 real inspection checks, package 6M.

The six numbered rows shown per equipment in PDF include blank reserve slots;
the app displays and counts only rows with actual task names, consistent with
its existing buildTaskRows behavior. Administrators can add checks if needed.

Functions covered by existing app: PM Checklist, OK/NO, Result Note, Progress,
History, Next Due, print A4 group, and Supabase pm_data with separate keys.
No SQL changes are required for the template itself.

Install: back up existing files and Supabase database, unzip, and upload all
web files in preventive-maintenance-main/ to GitHub Pages. Hard refresh once.
Test EM2 > Selecta > Selecta D01: first section has 4 checks and total is 28.

Not tested against your production Supabase credentials/data.
