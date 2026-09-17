# TalentMatch AI Backend

## Setup and Installation

This backend uses a split settings configuration suitable for both development and production. Secrets are managed via `python-decouple`.

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment
- **Windows**: `venv\Scripts\activate`
- **Mac/Linux**: `source venv/bin/activate`

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Create a `.env` file in the `backend/` directory (where `manage.py` is located) with the following structure:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 5. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Start the Development Server
```bash
python manage.py runserver
```

You can now visit the browsable API at [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/).
