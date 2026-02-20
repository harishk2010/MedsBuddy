# 💊 MedsBuddy

A full-stack medication tracking app built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Patients track their daily medications and mark them as taken. Caretakers get a live read-only dashboard and receive email alerts when medications are missed.

---

## ✨ Features

### Patient
- Add, view, and delete medications
- Mark medications as taken each day (with optimistic UI)
- Progress bar showing daily completion
- Reminder banners for pending medications
- Link a caretaker email for missed-dose alerts

### Caretaker
- Dedicated dark-themed dashboard — completely separate from the patient UI
- Live read-only view of the linked patient's medications and daily status
- Auto-refreshes every 60 seconds
- Receives email alerts when the patient misses a dose past the notification window

### General
- Role-based auth — patients and caretakers see completely different UIs
- Middleware-enforced route guards (no manual redirects needed)
- Email alerts via Nodemailer + Gmail (hourly cron on Vercel)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Email | Nodemailer (Gmail SMTP) |
| Cron | Vercel Cron Jobs |
| Deployment | Vercel |

---

## 📁 Project Structure

```
app/
├── (auth)
│   ├── login/          # Login page
│   └── signup/         # Signup with role selector (Patient / Caretaker)
├── dashboard/          # Patient dashboard (light theme)
├── medications/        # Add & manage medications
├── settings/           # Patient settings — link caretaker email
├── caretaker/          # Caretaker dashboard (dark theme)
├── auth/callback/      # Supabase OAuth callback — redirects by role
├── api/
│   ├── medications/    # CRUD API
│   ├── mark-taken/     # Mark medication as taken
│   ├── check-missed/   # Cron endpoint — detects missed doses & sends emails
│   └── caretaker/      # Caretaker settings API
└── components/
    ├── PatientNavbar   # Light navbar for patient routes
    ├── CaretakerNavbar # Dark navbar for caretaker routes
    ├── Dashboard       # Patient dashboard component
    ├── CaretakerDashboard # Caretaker read-only view
    ├── MedicationCard  # Individual medication card with mark-taken
    ├── MedicationsManager # Add/delete medications page
    └── SettingsForm    # Patient notification settings

middleware.ts           # Role-based route protection
supabase-setup.sql      # Complete DB setup (run once in Supabase)
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/meds-buddy.git
cd meds-buddy
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → New Query
3. Paste the entire contents of `supabase-setup.sql` and run it
4. This creates all tables, RLS policies, and triggers in one shot

### 3. Configure environment variables

Create a `.env.local` file in the root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=you@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx

# Cron protection
CRON_SECRET=any_random_string_you_make_up
```

> **Where to find Supabase keys:** Dashboard → Project Settings → API

> **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → create one for "MedsBuddy"

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄 Database Schema

```
profiles
  id · email · role (patient|caretaker) · caretaker_email
  notification_window_minutes · created_at · updated_at

medications
  id · user_id · name · dosage · frequency · scheduled_time
  notes · is_active · created_at · updated_at

medication_logs
  id · medication_id · user_id · taken_at · date · notes · created_at
```

**RLS rules:**
- Users can only read/write their own data
- Caretakers can read the medications and logs of the patient who has listed their email
- Profiles policy uses `auth.jwt() ->> 'email'` to avoid infinite recursion

---

## 🔐 How Roles Work

1. User picks **Patient** or **Caretaker** on the signup page
2. Role is saved to `raw_user_meta_data` in Supabase Auth
3. A database trigger (`handle_new_user`) reads the metadata and writes it to `profiles.role`
4. Middleware checks the role on every request and enforces routes:
   - Caretakers → always redirected to `/caretaker`
   - Patients → always redirected to `/dashboard`

---

## 📧 Email Alerts (Cron)

`vercel.json` schedules `POST /api/check-missed` to run **every hour**.

The endpoint:
1. Finds all active medications where the patient has a `caretaker_email` set
2. Checks which ones haven't been marked taken today
3. Checks if the `notification_window_minutes` has passed since scheduled time
4. Sends an email to the caretaker via Nodemailer for each missed medication

**Test it locally:**

```bash
curl -X POST http://localhost:3000/api/check-missed \
  -H "Authorization: Bearer your_cron_secret"
```

---

## ☁️ Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in **Project Settings → Environment Variables**
4. Deploy

Vercel automatically picks up the cron schedule from `vercel.json`. Cron jobs require the **Hobby plan or above**.

---

## 🔑 Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `MAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `MAIL_PORT` | SMTP port (use `587`) |
| `MAIL_USER` | Your Gmail address |
| `MAIL_PASS` | Gmail App Password (not your login password) |
| `CRON_SECRET` | Random string to protect the cron endpoint |

---

## 📜 License

-MYSELF 