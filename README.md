# Employee Self-Service Portal

<p align="center">
  <img width="500" height="350" src="hero.jpg">
</p>    

A full-stack employee self-service portal with role-based access control, leave management, AI recommendations, and chatbot functionality.
WorkHub is an open‑source Employee Self‑Service Portal built as a hackathon project to explore how modern web stacks and AI features can simplify everyday HR workflows.

The goal of this project is not perfection — it’s learning, collaboration, and experimentation. If you’re a developer who enjoys full‑stack systems, dashboards, or AI integrations, you’re very welcome here.


## Features

- Role-based access control (Employee, Manager, HR Admin)
- Leave application and approval workflow
- Dashboard personalization
- AI-driven learning and compliance recommendations
- Echo chatbot assistant
- Responsive design for laptop and mobile browsers

## Tech Stack

- **Frontend**: React, Material-UI, Vite
- **Backend**: Python FastAPI, SQLAlchemy, SQLite
- **Authentication**: JWT tokens
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Git (optional, for cloning) but useful.

## Getting Started

### Using Docker Compose (Recommended)

1. Clone or navigate to the project directory
2. Run the following command:

```bash
docker-compose up --build
```

This will:
- Build and start the backend service on port 8000
- Build and start the frontend service on port 3000
- Create the database and seed initial data

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Setup Environment Variables

Before running the backend, create your `.env` file from the example:

```bash
# On Linux / Mac
cp backend/.env.example backend/.env

# On Windows PowerShell
Copy-Item backend\.env.example backend\.env

### Demo Credentials

The database is seeded with the following test users:

**Employee:**
- Email: `employee@company.com`
- Password: `password123`

**Manager:**
- Email: `manager@company.com`
- Password: `password123`

**HR Admin:**
- Email: `hr@company.com`
- Password: `password123`

## Project Structure

```

```
WorkHub/
├── backend/
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # Authentication logic
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── seed_data.py        # Database seeding script
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context
│   │   └── services/       # API client
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Dashboard
- `GET /dashboard` - Get dashboard data
- `POST /dashboard/config` - Update dashboard preferences

### Leave Management
- `POST /leave/apply` - Apply for leave
- `GET /leave/my` - Get user's leave requests
- `GET /leave/pending` - Get pending leaves (Manager)
- `POST /leave/approve` - Approve/reject leave (Manager)

### Admin
- `POST /admin/user` - Create user (HR)
- `DELETE /admin/user/{id}` - Delete user (HR)
- `POST /admin/compliance` - Add compliance policy (HR)
- `POST /admin/learning` - Add learning content (HR)

### AI & Chatbot
- `GET /recommendations` - Get AI recommendations
- `POST /chatbot/echo` - Chat with Echo bot

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Seeding Database

```bash
cd backend
python seed_data.py
```

## Role-Based Access

- **Employee**: Can view own profile, apply for leave, view dashboard
- **Manager**: Can view team members, approve/reject leaves in their department
- **HR Admin**: Can create/delete users, manage compliance policies and learning content

## Notes

- All authentication is handled via JWT tokens
- Role and department checks are enforced server-side
- The database file is stored in a Docker volume for persistence
- The application is designed for demo purposes and uses SQLite for simplicity

## Troubleshooting

- If ports 3000 or 8000 are already in use, modify the port mappings in `docker-compose.yml`
- To reset the database, remove the Docker volume: `docker-compose down -v`
- Check container logs: `docker-compose logs backend` or `docker-compose logs frontend`

## Contributing
WorkHub is open to contributors of all levels.
You can help by:
- Improving UI/UX
- Fixing bugs
- Adding new features
- Improving documentation
- Refactoring code
Please read CONTRIBUTING.md before opening a pull request.

## License
This project is licensed under the MIT License.

## Acknowledgements
Built during a hackathon with curiosity, caffeine, and a lot of Docker rebuilds.
- If this project helps you learn something,that’s a win already ⭐
