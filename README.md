# Travel Companion — Full-stack travel community app

A React + Vite frontend with a Django backend. The application includes authentication, destinations, trip planning, community stories with media uploads, likes/saves/comments, travel questions and answers, profiles, search, and a staff dashboard.

## 1. Backend

From `travel/backend/travelBackend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
```

For the fastest local setup, use SQLite:

```powershell
$env:DB_ENGINE="sqlite"
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

For MySQL, set `DB_ENGINE=mysql` and the `MYSQL_*` variables from `.env.example`, create the database, then run migrations and the seed command.

Demo account: `demo` / `demo12345`

## 2. Frontend

From `travel`:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Vite proxies `/api` to Django at `http://127.0.0.1:8000`.

For a production build:

```powershell
npm run build
npm run preview
```

## 3. Included working flows

- Registration, login, logout and session persistence
- Home dashboard with live API content
- Destination search, category filters and detail pages
- One-click trip creation from a destination
- Profile editing and statistics
- Create, list and delete personal trips
- Create travel stories with image/video uploads
- Story detail modal, likes, saves and comments
- Saved stories
- Travel questions, categories, question details and answers
- Global destination/story/user search
- Staff dashboard with platform metrics and destination creation
- Django admin at `/admin/`
- Media serving for local development

## 4. Production notes

Set `DJANGO_DEBUG=False`, use a strong `DJANGO_SECRET_KEY`, configure production `ALLOWED_HOSTS`, HTTPS/secure cookies, persistent media storage, and MySQL/PostgreSQL. Run migrations before deployment.
