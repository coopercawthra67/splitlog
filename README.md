# ⚡ SplitLog

Track & Field Coaching Platform for Wendel McRaven.

---

## Step 1 — Set up the database

1. Go to your Supabase project: https://abrxnpmqcdeewegvommp.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase_setup.sql` from this project, copy everything, paste it in, and click **Run**
5. You should see "Success. No rows returned."

---

## Step 2 — Push this code to GitHub

If you haven't already:
```bash
git init
git add .
git commit -m "Initial SplitLog"
git remote add origin https://github.com/YOUR_USERNAME/splitlog.git
git push -u origin main
```

---

## Step 3 — Deploy on Netlify (free)

1. Go to https://netlify.com and sign in
2. Click **Add new site → Import an existing project**
3. Connect your GitHub and select the splitlog repo
4. Build settings are auto-detected (or set manually):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy** — you'll get a URL like `splitlog.netlify.app`

---

## Step 4 — Create Wendel's account

1. In Supabase → **Authentication → Users → Invite User**
2. Enter Wendel's real email address
3. He'll receive a link to set his password
4. Go to **Table Editor → profiles** — find Wendel's row
5. Set `role` to `coach`
6. Set `name` to `Wendel McRaven`
7. Set `avatar_initials` to `WM`
8. Set `color` to `#34d399`

---

## Step 5 — Create athlete accounts

Repeat the invite process for each athlete:

| Name | role | avatar_initials | color |
|------|------|----------------|-------|
| Elise Smoot | athlete | ES | #f472b6 |
| Carter Gordy | athlete | CG | #fb923c |
| Jack Johnston | athlete | JJ | #60a5fa |

---

## Step 6 — Send the URL

Send Wendel (and each athlete) the Netlify URL. They log in with the email/password they set.

---

## Local development (optional)

```bash
npm install
npm run dev
```

Then open http://localhost:5173
