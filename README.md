# 072 Cars Clinic Dashboard

Build a clean, minimalist, highly professional Auto Repair Admin Dashboard for "072 Cars Clinic" (Auto Maintenance & Care Specialists) to manage customer service records and automatically push data updates to an n8n webhook.

### BRAND & VISUAL IDENTITY (Strictly Match Customer Feedback Page):
- Overall Page Background: Subtle light slate/gray (#F4F6F8)
- Primary Accent Color: Crimson Red (#E53E3E) for primary CTA buttons, active status highlights, and interactive elements.
- Header & Container Color: Dark charcoal/navy (#1A202C) for top navigation header, modal header bars, and primary accents.
- Typography: Clean, modern sans-serif (Inter / System UI / Arial). Main text color: Dark Charcoal (#2D3748); Muted text color: (#718096 / #A0AEC0).
- Card & Container Styling: White floating card containers (#FFFFFF) with 8px rounded corners, crisp subtle borders (#E2E8F0), and soft box shadows (0 4px 10px rgba(0,0,0,0.05)).

### HEADER & NAVIGATION:
- Centered or top-bar dark container (#1A202C) featuring:
  - Main Title: "072 CARS CLINIC" in white bold uppercase text.
  - Subtitle: "AUTO MAINTENANCE & CARE SPECIALISTS — ADMIN PORTAL" in muted gray (#A0AEC0) uppercase.
- Include a Settings Icon / Button in the header to open an "n8n Webhook Configuration" modal (to input/store `N8N_WEBHOOK_URL`).
- Include a prominent "+ Add New Customer / Job" button styled in solid Crimson Red (#E53E3E) with bold white text.

### DATA TABLE FIELDS & FORMATS:
Display a clean, responsive data table inside a white rounded container (#FFFFFF) with the following exact columns:
1. Job ID (string, e.g., "jb-10001", auto-generated sequentially)
2. Customer ID (string, e.g., "cust-1001", auto-generated sequentially)
3. Customer Name (text)
4. Customer Phone (text)
5. Customer Email (email)
6. Branch (Dropdown select: "Ikeja Branch (Lagos)", "Victoria Island Branch (Lagos)", "Abuja Main Branch", "Port Harcourt Central")
7. Service Done (Dynamic Dropdown select + Text fallback: see rules below)
8. Job Status (Dropdown select / Badge: "Pending", "In Progress", "Completed", "Cancelled")
9. Completed At (Timestamp format: YYYY-MM-DD HH:mm:ss. Auto-fills dynamically with current date/time when Job Status is changed to "Completed". Clears if changed away from "Completed".)
10. Actions (Quick Edit / Delete buttons)

### SERVICE DONE SELECTION LOGIC (10 Preset Options + Others):
In both the "Add New Customer" modal and inline table editor, the **Service Done** field must be a dropdown selector containing these 10 standard automotive services:
1. Oil Change & Filter Replacement
2. Brake System Inspection & Pad Replacement
3. Transmission Fluid Flush
4. Wheel Alignment & Tire Balancing
5. AC Inspection & Gas Refill
6. Engine Diagnostics & Tuning
7. Battery Test & Replacement
8. Suspension & Shock Absorber Repair
9. Comprehensive Vehicle Inspection
10. Auto Body Repair & Painting
11. Others (Specify)

- **"Others" Dynamic Handling:** When "Others (Specify)" is selected from the dropdown, immediately display an accompanying text input field labeled "Specify Custom Service". The custom text typed by the admin becomes the official string value sent for `service_done`.

### CORE FUNCTIONALITY & DYNAMICS:

1. "Add New Customer / Job" Modal / Slide-Over:
   - Floating modal matching the dark header (#1A202C) and white body card.
   - Form fields: Customer Name, Customer Phone, Customer Email, Branch (select dropdown), Service Done (dropdown with "Others" text reveal), Job Status (select dropdown).
   - Auto-generates the next sequential `job_id` and `customer_id`.
   - On submission, inserts the row and triggers Event 1 (`customer_created`) to n8n.

2. In-Table Editing & Status Logic:
   - Allow inline dropdown editing directly in table cells for `Branch`, `Service Done`, and `Job Status`.
   - Dynamic Timestamp Trigger: Setting `Job Status` to "Completed" immediately generates and attaches the current timestamp (`YYYY-MM-DD HH:mm:ss`) to `completed_at`.
   - On any row modification or status change, trigger Event 2 (`customer_updated`) to n8n.

3. Toast Notifications & Success Feedback:
   - Subtle toast alerts (bottom-right) styled with green checkmarks or Crimson Red accents upon successful row creation, update, or webhook dispatch.

4. n8n Webhook Integration Payload Structure:
   Whenever a record is created or updated, execute a `POST` fetch call to `N8N_WEBHOOK_URL` with this exact JSON structure:

   {
     "event": "customer_updated", // "customer_created" or "customer_updated"
     "job_id": "jb-1001",
     "customer_id": "cust-501",
     "customer_name": "Babatunde Adeleke",
     "customer_phone": "7067102694",
     "customer_email": "edidiongreuben+1@gmail.com",
     "branch": "Ikeja Branch (Lagos)",
     "service_done": "Oil Change & Filter Replacement",
     "job_status": "Completed",
     "completed_at": "2026-09-22 16:12:56"
   }

### FOOTER:
- Centered footer text in light gray (#718096): "072 Cars Clinic — Professional Automotive Service Management" and "Internal Admin Portal".

Maintian prompt as it is, do not change anything. Add Manager Email as one of the customer data details and include it to the payload. all entries are mandetory

This is the n8n webhook https://reubenedidiong.app.n8n.cloud/webhook/costumer_details

This admin page is "Job / Visits"
Later we will add a "Status Check" page with a sidebar naviagtion
## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
