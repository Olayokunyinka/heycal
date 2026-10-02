# Heycal

A modern scheduling platform — a Calendly-style app where users create event types, publish their availability, and let guests book meetings through a public link. Built with the Next.js App Router, Clerk authentication, Drizzle ORM on Turso (libSQL), and Google Calendar integration.

## Features

- 🔐 **Authentication** — sign-up / sign-in and route protection via Clerk
- 📅 **Event types** — create, edit, activate, star, and soft-delete bookable meeting types
- ⏰ **Availability** — define weekly working hours per day with active/inactive toggles
- 🔗 **Public booking pages** — guests book through `/:username/:eventSlug` with no account required
- 📥 **Bookings dashboard** — view, search, and prioritize upcoming meetings
- 🗑️ **Trash & starred** — recover soft-deleted event types and pin favorites
- 🟢 **Google Calendar** — sync confirmed bookings as calendar events
- 🎨 **Polished UI** — shadcn/ui + Radix primitives, Tailwind CSS v4, dark mode via `next-themes`

## Tech Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language       | TypeScript, React 19                        |
| Auth           | [Clerk](https://clerk.com)                  |
| Database       | [Turso](https://turso.tech) / libSQL        |
| ORM            | [Drizzle ORM](https://orm.drizzle.team)     |
| Calendar       | [googleapis](https://github.com/googleapis/google-api-nodejs-client) |
| UI             | shadcn/ui, Radix UI, Tailwind CSS v4, lucide-react |
| Validation     | Zod + React Hook Form                       |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database (or local SQLite file for development)
- A [Clerk](https://clerk.com) application
- A Google Cloud project with the Calendar API enabled (for calendar sync)

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Database (Turso). For local dev you may use a file URL instead: file:local.db
DATABASE_URL=libsql://<your-db>.turso.io
DATABASE_AUTH_TOKEN=<your-turso-auth-token>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Google Calendar (OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

> **Note:** `DATABASE_URL` is required in production — the app throws on startup if it is missing.

### 3. Set up the database

```bash
# Generate migrations from the schema
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

### 4. Run the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `yarn dev`    | Start the development server         |
| `yarn build`  | Create a production build            |
| `yarn start`  | Serve the production build           |
| `yarn lint`   | Run ESLint                           |

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Clerk sign-in / sign-up routes
│   ├── [username]/[eventSlug]/  # Public booking pages
│   └── dashboard/               # Authenticated app
│       ├── availability/        # Weekly availability editor
│       ├── bookings/            # Bookings list
│       ├── events/              # Event type CRUD
│       ├── starred/             # Starred event types
│       └── trash/               # Soft-deleted event types
├── actions/                     # Server actions (events, bookings, availability)
├── components/                  # UI + shared components (shadcn/ui in ui/)
├── db/
│   ├── schema.ts                # Drizzle schema
│   ├── index.ts                 # DB client
│   └── migrations/              # Generated SQL migrations
├── lib/                         # Helpers (availability calculation, utils)
├── hooks/                       # React hooks
└── middleware.ts                # Clerk route protection
```

## Data Model

- **users** — synced from Clerk; owns a unique `username`
- **eventTypes** — bookable meeting templates (duration, slug, active/starred/deleted flags)
- **availability** — per-day working hours for each user
- **bookings** — guest reservations against an event type, optionally linked to a Google Calendar event

## Website Booking Handoff

Set a **Website return URL** when creating or editing an event. After a guest books, Heycal offers a button back to that URL. From the successful-submit handler for a website contact form, redirect to the event URL with the visitor's name and email:

```js
const bookingUrl = new URL("https://cal.heyclift.xyz/your-username/your-event-slug");
bookingUrl.searchParams.set("name", formData.get("name") || "");
bookingUrl.searchParams.set("email", formData.get("email") || "");
window.location.assign(bookingUrl.toString());
```

Replace the example path with the event's public URL. The booking page validates the email and pre-fills both fields; visitors can review or change them. These values travel in the URL, so only pass the name and email needed to complete booking.

## API and Webhooks

Each account can manage one API key and one booking webhook at **Dashboard → Integrations**. The API key is shown once; rotating it immediately invalidates the previous key. Keep it on your website server and never expose it in browser code.

From the website's successful contact-form handler, request a booking URL from your backend:

```bash
curl -X POST https://cal.heyclift.xyz/api/v1/booking-links \
	-H "Authorization: Bearer $HEYCAL_API_KEY" \
	-H "Content-Type: application/json" \
	-d '{"eventSlug":"20-min","name":"Avery Example","email":"avery@example.com"}'
```

The API key is scoped to its owner's active events. The response contains a prefilled `url`; redirect the visitor to it. The URL carries an opaque, one-use token that expires after 30 minutes, not the contact details. API calls are server-to-server and do not support browser CORS.

To enable signed booking webhooks, configure a random `WEBHOOK_SIGNING_SECRET` as a Cloudflare Worker secret (for example, generate one with `openssl rand -hex 32`). Do not put it in `wrangler.jsonc` or expose it to the browser. The Integrations page then shows a per-account `whsec_...` secret for the receiver. Heycal sends `booking.created` with `X-Heycal-Timestamp` and `X-Heycal-Signature: v1=<hex>`. Verify the signature as HMAC-SHA256 over `<timestamp>.<raw request body>` using that per-account secret, and reject stale timestamps. Delivery is currently best-effort with a five-second timeout and no automatic retry; return a 2xx response promptly and queue work on the receiving server if needed.

## Booking Confirmation Emails

Heycal can send a separate confirmation to the guest and a new-booking notification to the organizer through Resend. Configure `RESEND_API_KEY` as a Cloudflare Worker secret and `RESEND_FROM_EMAIL` as a verified sender address. Without both values, bookings still work and Google Calendar invitations continue when the organizer has connected Google Calendar, but Heycal does not send its separate confirmation emails.

## Deployment

### Platform Admin Access

Set the non-secret `ADMIN_EMAILS` variable in the Cloudflare Worker's production environment to a comma-separated list of verified Clerk account emails, for example `admin@example.com,ops@example.com`. Admin access is disabled when this variable is unset. The admin page is read-only and available at `/dashboard/admin` to allowlisted accounts.

The app deploys to [Vercel](https://vercel.com). Set the environment variables from the table above in your Vercel project settings before deploying:

```bash
vercel env add DATABASE_URL production
vercel env add DATABASE_AUTH_TOKEN production
# ...plus Clerk and Google credentials
```

A missing `DATABASE_URL` in production will cause server errors on every database-backed page, so verify all variables are set before promoting a deployment.

## License

Private — all rights reserved.
</content>
</invoke>
