from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, dashboard, leave, admin, recommendations, chatbot, career, learning, wellness, complaints

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Employee Self-Service Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(leave.router)
app.include_router(admin.router)
app.include_router(recommendations.router)
app.include_router(chatbot.router)
app.include_router(career.router)
app.include_router(learning.router)
app.include_router(wellness.router)
app.include_router(complaints.router)


@app.get("/")
def root():
    return {"message": "Employee Self-Service Portal API"}


@app.get("/health")
def health():
    """Health check endpoint for monitoring and deployment checks."""
    return {
        "status": "healthy",
        "service": "Employee Self-Service Portal API"
    }
