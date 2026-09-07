# Sudhar — Lahore Civic Issue Reporting Platform

> سدھار — Urdu for "improvement/repair"

A crowdsourced civic issue reporting website scoped to **Lahore, Pakistan**. Citizens report infrastructure problems (potholes, broken streetlights, garbage, water leaks) with a photo and GPS location. Reports are automatically routed to the real Lahore government agency responsible for that category. Each agency's staff triages and resolves issues on their own dashboard.

**This is a student portfolio project, not a production deployment for an actual government body.**

---

## The Problem

Citizens have no easy way to report civic infrastructure problems with photo evidence and exact location, and no way to track resolution. City departments have no centralized, filterable, prioritized system to triage and resolve reports.

## How It Works

```
Citizen picks a CATEGORY (not a department)
        ↓
Backend auto-maps category → department (fixed lookup, no human involved)
        ↓
The issue appears DIRECTLY on that department's own staff dashboard
        ↓
That department's own staff assigns and resolves it
```

### Category → Department Mapping

| Category    | Department | Responsibility                  |
|-------------|------------|---------------------------------|
| pothole     | TEPA       | Traffic Engineering & Planning Agency — roads/traffic |
| streetlight | LESCO      | Lahore Electric Supply Company — electrical |
| garbage     | LWMC       | Lahore Waste Management Company — waste |
| water       | WASA       | Water and Sanitation Agency — water/drainage/sewage |
| other       | null       | No auto-route — lands in admin's manual triage queue |

## Roles

### Citizen
- Report issues with photo + auto-captured GPS
- See all issues on a live map
- Upvote existing nearby reports instead of creating duplicates
- Track submitted/upvoted reports
- Get notified when status changes
- Confirm resolution with a photo

### Department Staff (WASA / LWMC / TEPA / LESCO)
- See only issues auto-routed to their department
- Filterable/sortable queue by status, priority, SLA-overdue
- Assign issues to colleagues within their department
- Move issues through enforced status workflow with notes

### Admin (cross-department oversight)
- Analytics dashboard aggregating all departments
- Manually route `other` category and mis-tagged reports
- Manage staff accounts
- Handle escalations and disputed resolutions
- View any issue across any department

## Competitive Landscape

Real Pakistani platforms exist in this space (MarkSafe, FixPak, Pakistan Citizen's Portal), all built as nationwide, citizen-facing-first tools. **Sudhar** differentiates by being **Lahore-specific with real departments and a proper staff operations workflow** — the internal operations layer that competitors lack.

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | React (Vite)                        |
| Routing       | React Router v6                     |
| Maps          | Leaflet.js + marker clustering      |
| Charts        | Recharts                            |
| HTTP Client   | Axios                               |
| Real-time     | Socket.io                           |
| Backend       | Node.js + Express                   |
| Database      | MongoDB Atlas (Mongoose, 2dsphere)  |
| Auth          | JWT + bcrypt                        |
| Image Storage | Cloudflare R2 (S3-compatible)       |
| Frontend Host | Cloudflare Pages                    |
| Backend Host  | Render (free tier)                  |

## Key Features

- **Automatic department routing** — citizens pick a category, backend maps to the correct Lahore agency
- **Geospatial duplicate detection** — `$near` query (~50m radius) prompts upvote instead of duplicate creation
- **Enforced status state machine** — server-side enforced with full audit trail in `statusHistory`
- **Department-scoped RBAC** — staff only see their department's issues from the moment of submission
- **SLA/deadline tracking** — computed per category, flags overdue issues
- **Citizen-verified resolution** — reporter confirms fix with a photo
- **Real-time updates** — Socket.io for live dashboard and notification updates
- **Admin analytics** — MongoDB aggregation pipelines for resolution time, issue density, workload, SLA compliance

## Demo Strategy

Since there is no actual government partnership, staff and admin accounts are **seeded demo accounts** created via a seed script, alongside realistic fake issues with Lahore coordinates. This is standard for a portfolio project and is stated plainly here, not hidden.

## Project Structure

```
Sudhar/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── seeds/
├── frontend/                # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── hooks/
│       └── services/
└── README.md
```

## Getting Started

*Setup instructions will be added as the project develops.*

## License

This is a student portfolio project.
