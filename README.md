# Hospital Management System

A full-stack Hospital Management System designed to manage hospital operations, including patients, doctors, appointments, admissions, billing, medical records, prescriptions, laboratory tests, departments, rooms, and receptionists.

## 🚀 Live Application

**Live URL:** https://3.109.234.174/

## 🛠️ Technologies Used

### Backend
- Python
- Django
- Django REST Framework
- MySQL
- Gunicorn

### Frontend
- React
- Vite
- HTML
- CSS
- JavaScript

### Database
- MySQL
- Amazon RDS

### Deployment
- Amazon EC2
- Amazon RDS
- Nginx
- Gunicorn
- Let's Encrypt SSL
- GitHub

## ✨ Features

- User authentication and authorization
- Patient management
- Doctor management
- Appointment management
- Patient admissions
- Medical records
- Prescriptions
- Laboratory tests
- Billing management
- Department management
- Room management
- Receptionist management
- RESTful APIs
- Responsive frontend
- Secure HTTPS deployment

## 🏗️ Architecture

```text
                    Internet
                       |
                    HTTPS
                       |
                    Nginx
                  /        \
                 /          \
        React Frontend    Django API
             |                |
             |             Gunicorn
             |                |
             |          Amazon RDS MySQL
             |
          Browser
```

## ☁️ AWS Deployment

The application is deployed on AWS using:

- **Amazon EC2** — application server
- **Amazon RDS MySQL** — production database
- **Nginx** — web server and reverse proxy
- **Gunicorn** — Django application server
- **Let's Encrypt** — HTTPS/SSL certificate

📁 Project Structure
```text
hospital-management-system/
│
├── HMS/
├── accounts/
├── admissions/
├── api/
├── appointments/
├── audit_logs/
├── billing/
├── departments/
├── doctors/
├── frontend/
├── lab_tests/
├── medical_records/
├── patients/
├── prescriptions/
├── receptionists/
├── rooms/
├── manage.py
├── requirements.txt
└── README.md
```

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/944194/hospital-management-system.git
cd hospital-management-system
```

### 2. Create a virtual environment

```bash
python -m venv myenv
```

Activate it:

**Windows:**
```bash
myenv\Scripts\activate
```

**Linux/macOS:**
```bash
source myenv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file and configure the required database and Django settings.

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Start the Django server

```bash
python manage.py runserver
```

### 7. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

🔐 Security
Environment variables are used for sensitive configuration.
Database credentials are not stored in the repository.
Production deployment uses HTTPS.
Amazon RDS is configured without public access.
Database access is restricted through AWS security groups.

👨‍💻 Author
Chethan Potlapelli
GitHub: https://github.com/944194
