# Webhook diagnostics and fixed dashboard layouts

## Shared foundations
- Extend the existing webhook server functions with timeout handling and structured failure details for HTTP, invalid-response, and network errors.
- Preserve the centralized four-webhook configuration and make the shared dashboard sync return a diagnostic for each failed source.
- Add reusable table-shell and details-panel components that preserve each page’s columns and controls while standardizing fixed heights, scrolling, counters, and selection behavior.
- Keep the existing customer normalization and maximum Job ID calculation as the single source for remote population and sequential IDs.

## Jobs / Visits
- Replace the page-specific table and details wrappers with the shared components.
- Keep the four existing columns, inline status editing, row click, View/Edit/Delete actions, cached batch reveal, branch filter, and record counter.
- Constrain the desktop page to the viewport and match the table and details-panel heights without nested vertical scrolling.
- Report Post Customer/Job Event failures with the webhook name and exact diagnostic.

## Status
- Use the shared table and details wrappers, add an explicit View action, and retain the existing summary columns plus category.
- Format every service date consistently as `YYYY-MM-DD` and add category badges whose colors match the chart categories.
- Compact the metric summary and stacked bar chart while preserving all severity breakdowns.
- Style negative feedback with a dedicated soft-red semantic surface and keep AI responses in a fixed-height, vertically scrollable, horizontally contained area.
- Match the table and panel heights and prevent desktop window scrolling.

## Verification
- Check compilation diagnostics, detailed webhook failure output, full customer loading and next Job ID behavior, internal table scrolling/counters, both detail panels, date and badge styling, and desktop/mobile layouts.
