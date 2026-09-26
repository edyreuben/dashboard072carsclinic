# Roadmap

## Done
- [x] Base dashboard build (header, table, add/edit modal, webhook dispatch)
- [x] Removed Customer ID everywhere (UI, state, n8n payload)
- [x] Two-column layout: left table (Name, Phone, Status, Actions; 20-row fixed height, internal scroll), right read-only details panel
- [x] Settings modal with 4 webhook URL inputs (Post Event, Get Jobs, Get Positive/Negative Feedback)
- [x] Initial load fetches first 50 via Get webhooks; infinite scroll loads next 50; rows cached in sessionStorage
- [x] Success toasts only after webhook resolves; no "n8n" mention in success text
- [x] Status nav tab/page added

## Open
- [ ] Show the exact failing webhook name, status, and returned error details
- [ ] Load customer jobs from the Get Customer / Job response and continue from its highest Job ID
- [ ] Refine Status category colors, date formatting, feedback panels, details layout, and chart spacing

## Global sync and feedback dashboard
- [x] Centralize all four default webhook URLs and pre-fill settings
- [x] Refresh all datasets on load, refresh, and completed actions with connection-error feedback
- [x] Cache full fetched datasets and render jobs incrementally from cache
- [x] Add jobs branch filter and visible/total record counter
- [x] Build Status metrics chart, branch filter, categorized summary table, and editable/copyable details
- [x] Verify centered shared header and both pages end to end
