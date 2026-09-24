# Roadmap

## In progress
- [ ] Verify current dashboard build (Playwright add-job flow)

## New requirements (this message)
- [ ] Remove Customer ID everywhere (UI, state, n8n payload)
- [ ] Two-column layout: left table (Name, Phone, Status, Actions; ~20 rows visible, internal scroll, up to 50 loaded), right read-only details panel (row click / View)
- [ ] Settings modal: 4 webhook URL inputs (Post Event, Get Customer/Job, Get Positive Feedback, Get Negative Feedback)
- [ ] Initial load: fetch first 50 records via Get webhooks; infinite scroll fetches next 50 on scroll-to-bottom; cache rows in sessionStorage
- [ ] Toasts: success only after webhook resolves; don't mention "n8n" in success text
- [ ] New "Status" nav tab/page
