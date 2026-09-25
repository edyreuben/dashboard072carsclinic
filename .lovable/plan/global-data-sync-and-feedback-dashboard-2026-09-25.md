# Global data sync and feedback dashboard

## Shared data layer
- Keep the existing four-field webhook settings and centralize the provided defaults so every first session starts pre-filled.
- Add typed normalization and session caching for jobs, positive feedback, and negative feedback.
- Refresh all three data sources on page load, after settings change, and after successful job actions; report any failed or empty source with the requested connection message.
- Fetch complete source datasets into the session cache, then reveal cached jobs in batches as the table scrolls.

## Job / Visits
- Populate jobs from the customer/job source and calculate the next Job ID from the full cached dataset.
- Add one branch/location filter above the table.
- Add a bottom counter showing visible filtered records versus the filtered total.
- Preserve the existing four table columns, forms, details panel, webhook-first success behavior, and centered shared heading.

## Status
- Replace the placeholder with a branch-filtered feedback dashboard backed by both feedback sources.
- Add a professional bar chart for Total Feedback, Ready to Post, Escalated severity groups, and Private Queue severity groups.
- Add a service-date-descending summary table with Service Date, Customer Name, Branch, and Category.
- Add a selectable details panel covering all source fields, with copy for positive comments and editable/copyable AI responses for negative comments.

## Verification
- Check metadata completeness, compilation diagnostics, both desktop pages, filtering, selection, copy/edit controls, counters, and settings defaults.
