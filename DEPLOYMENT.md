# Travel Companion deployment

## Local development

### MySQL
Create the database:

```sql
CREATE DATABASE travel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Set the values from `.env.example` in your environment.

### Django

```powershell
cd backend\travelBackend
python -m venv env
.\env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

### React

In a second terminal:

```powershell
npm install
npm run dev
```

The Vite development server proxies `/api` to Django.

## Production

Build the frontend with:

```bash
npm ci
npm run build
```

Serve the generated `dist` directory from your web server and proxy `/api/` to Django. Run Django with a production WSGI server such as Gunicorn and set:

- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY` to a strong secret
- `DJANGO_ALLOWED_HOSTS` to your domain
- `MYSQL_*` variables to your production MySQL connection

Use HTTPS and configure your reverse proxy so frontend requests to `/api/` reach Django. The application uses Django sessions, so `/api/` must preserve cookies.
