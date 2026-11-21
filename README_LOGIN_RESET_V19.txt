PM Dashboard V19 — Login always opens PM Progress Dashboard

- Every new login/session bootstrap opens PM Progress Dashboard instead of the last equipment/form previously viewed.
- Clears the previous UI's selected PM equipment, expanded PM/Result Note sidebar and active Result Note filters.
- Does not delete, reset, or modify any existing PM inspection data in Supabase.
- Stops writing shared lastSavedTank/lastSavedTankType keys when selecting a form; old keys are left in the database but no longer used on login.
- Keeps the Glass UI, Administrator + Delete, Result Note dropdown V18, theme, PDF, and existing permission setup.
- On a normal active session, navigating between forms works as before; refresh resets to the PM Progress Dashboard.

Install: replace the old site's files with the contents of preventive-maintenance-main, then hard-refresh (Ctrl+F5). Test: log in, open a form/Result Note, log out, then log in again: PM Progress Dashboard should appear first.
