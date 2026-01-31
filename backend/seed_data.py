from app.database import SessionLocal, engine
from app.models import Base, User, UserDocument, DashboardConfig, CompliancePolicy, LearningContent, LeaveBalance, UserLearningProgress, UserLearningAssignment
from app.auth import get_password_hash
import json
from datetime import datetime

Base.metadata.create_all(bind=engine)

# Add new User columns if missing (for existing DBs)
with engine.connect() as conn:
    try:
        r = conn.execute(__import__("sqlalchemy").text("PRAGMA table_info(users)"))
        cols = [row[1] for row in r.fetchall()]
    except Exception:
        cols = []
    for col, spec in [
        ("phone", "TEXT"),
        ("address", "TEXT"),
        ("manager_id", "INTEGER"),
        ("interests", "TEXT"),
        ("certifications", "TEXT"),
        ("career_preferences", "TEXT"),
    ]:
        if col not in cols:
            try:
                conn.execute(__import__("sqlalchemy").text(f"ALTER TABLE users ADD COLUMN {col} {spec}"))
                conn.commit()
            except Exception:
                conn.rollback()
    try:
        r = conn.execute(__import__("sqlalchemy").text("PRAGMA table_info(dashboard_configs)"))
        dcols = [row[1] for row in r.fetchall()]
    except Exception:
        dcols = []
    for col in ["show_profile", "show_attendance", "show_payroll", "show_career", "show_wellness"]:
        if col not in dcols:
            try:
                conn.execute(__import__("sqlalchemy").text(f"ALTER TABLE dashboard_configs ADD COLUMN {col} INTEGER DEFAULT 1"))
                conn.commit()
            except Exception:
                conn.rollback()
    try:
        r = conn.execute(__import__("sqlalchemy").text("PRAGMA table_info(leave_requests)"))
        lcols = [row[1] for row in r.fetchall()]
    except Exception:
        lcols = []
    if "created_at" not in lcols:
        try:
            conn.execute(__import__("sqlalchemy").text("ALTER TABLE leave_requests ADD COLUMN created_at TEXT"))
            conn.commit()
        except Exception:
            conn.rollback()

db = SessionLocal()

try:
    users_data = [
        {
            "name": "John Employee",
            "email": "employee@company.com",
            "password": "password123",
            "role": "employee",
            "department": "Engineering",
            "skills": ["Python", "React", "Docker"],
            "phone": "+1-555-0101",
            "address": "123 Tech Park, Engineering Wing",
            "interests": ["AI", "Web Development"],
            "certifications": [{"title": "AWS Certified", "issuer": "Amazon", "date": "2024-01", "expiry": None}],
            "career_preferences": {"goals": ["Tech Lead"], "preferred_roles": ["Senior Developer"], "work_prefs": "Hybrid", "current_role": "Data Scientist"},
        },
        {
            "name": "Jane Manager",
            "email": "manager@company.com",
            "password": "password123",
            "role": "manager",
            "department": "Engineering",
            "skills": ["Leadership", "Project Management"],
            "phone": "+1-555-0102",
            "address": "123 Tech Park, Management",
        },
        {
            "name": "Admin HR",
            "email": "hr@company.com",
            "password": "password123",
            "role": "hr",
            "department": "HR",
            "skills": ["HR Management", "Compliance"],
        },
        {
            "name": "Bob Developer",
            "email": "bob@company.com",
            "password": "password123",
            "role": "employee",
            "department": "Engineering",
            "skills": ["JavaScript", "Node.js"],
            "interests": ["Backend", "APIs"],
            "career_preferences": {"goals": ["Architect"], "work_prefs": "Remote", "current_role": "Software Engineer"},
        },
        {
            "name": "Alice Sales",
            "email": "alice@company.com",
            "password": "password123",
            "role": "employee",
            "department": "Sales",
            "skills": ["Sales", "Communication"],
        }
    ]
    
    manager_ids = {}
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            existing.password_hash = get_password_hash(user_data["password"])
            existing.name = user_data["name"]
            existing.role = user_data["role"]
            existing.department = user_data["department"]
            existing.skills = json.dumps(user_data["skills"])
            if hasattr(existing, "phone"):
                existing.phone = user_data.get("phone")
                existing.address = user_data.get("address")
                existing.interests = json.dumps(user_data.get("interests", []))
                existing.certifications = json.dumps(user_data.get("certifications", []))
                existing.career_preferences = json.dumps(user_data.get("career_preferences", {}))
            db.commit()
            user = existing
        else:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                department=user_data["department"],
                skills=json.dumps(user_data["skills"]),
                phone=user_data.get("phone"),
                address=user_data.get("address"),
                interests=json.dumps(user_data.get("interests", [])),
                certifications=json.dumps(user_data.get("certifications", [])),
                career_preferences=json.dumps(user_data.get("career_preferences", {})),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        if user.role == "manager":
            manager_ids[user.department] = user.id
        config = db.query(DashboardConfig).filter(DashboardConfig.user_id == user.id).first()
        if not config:
            config = DashboardConfig(
                user_id=user.id,
                show_leaves=True,
                show_learning=True,
                show_compliance=True,
                show_profile=True,
                show_attendance=True,
                show_payroll=True,
                show_career=True,
                show_wellness=True,
            )
            db.add(config)
            db.commit()
    for user_data in users_data:
        if user_data["role"] != "employee":
            continue
        u = db.query(User).filter(User.email == user_data["email"]).first()
        if u and hasattr(u, "manager_id"):
            mid = manager_ids.get(u.department)
            if mid:
                u.manager_id = mid
            db.commit()
    
    # Old policies - update them with categories
    # Use raw SQL to update since SQLAlchemy might not see the column if it was added via migration
    from sqlalchemy import text
    try:
        # Update old policies that don't have categories
        conn = db.connection()
        try:
            result = conn.execute(text("""
                UPDATE compliance_policies 
                SET category = CASE 
                    WHEN title LIKE '%Privacy%' OR title LIKE '%Data%' THEN 'IT Security Policy'
                    WHEN title LIKE '%Code%' OR title LIKE '%Review%' THEN 'IT Security Policy'
                    WHEN title LIKE '%Sales%' OR title LIKE '%Ethics%' THEN 'HR Compliance'
                    ELSE 'General Compliance'
                END
                WHERE category IS NULL
            """))
            conn.commit()
            print(f"✓ Updated {result.rowcount} old policies with categories")
            
            # Also ensure rules field exists for all policies
            result2 = conn.execute(text("""
                UPDATE compliance_policies 
                SET rules = '[]'
                WHERE rules IS NULL
            """))
            conn.commit()
            if result2.rowcount > 0:
                print(f"✓ Updated {result2.rowcount} policies with empty rules array")
        finally:
            conn.close()
    except Exception as e:
        print(f"Note: Could not update old policies via SQL: {e}")
        # Fallback: try ORM approach
        all_policies = db.query(CompliancePolicy).all()
        for old_policy in all_policies:
            category = getattr(old_policy, 'category', None)
            if not category:
                title_lower = old_policy.title.lower()
                if "privacy" in title_lower or "data" in title_lower:
                    old_policy.category = "IT Security Policy"
                elif "code" in title_lower or "review" in title_lower:
                    old_policy.category = "IT Security Policy"
                elif "sales" in title_lower or "ethics" in title_lower:
                    old_policy.category = "HR Compliance"
                else:
                    old_policy.category = "General Compliance"
                
                if not getattr(old_policy, 'rules', None):
                    old_policy.rules = "[]"
                
                db.add(old_policy)
        db.commit()
    
    learning_content = [
        {
            "title": "Responsible AI Practices",
            "tags": ["AI", "Ethics", "Engineering"],
            "level": "Intermediate",
            "description": "Learn about ethical AI development and deployment"
        },
        {
            "title": "Advanced React Patterns",
            "tags": ["React", "JavaScript", "Frontend"],
            "level": "Advanced",
            "description": "Master advanced React patterns and best practices"
        },
        {
            "title": "Docker and Containerization",
            "tags": ["Docker", "DevOps", "Engineering"],
            "level": "Intermediate",
            "description": "Comprehensive guide to Docker and container orchestration"
        },
        {
            "title": "Sales Communication Skills",
            "tags": ["Sales", "Communication", "Soft Skills"],
            "level": "Beginner",
            "description": "Improve your sales communication and negotiation skills"
        }
    ]
    
    for content_data in learning_content:
        existing = db.query(LearningContent).filter(
            LearningContent.title == content_data["title"]
        ).first()
        if not existing:
            content = LearningContent(
                title=content_data["title"],
                tags=json.dumps(content_data["tags"]),
                level=content_data["level"],
                description=content_data["description"]
            )
            db.add(content)
    
    current_year = datetime.now().year
    for user in db.query(User).filter(User.role == "employee").all():
        existing_balance = db.query(LeaveBalance).filter(
            LeaveBalance.user_id == user.id,
            LeaveBalance.year == current_year
        ).first()
        if not existing_balance:
            balance = LeaveBalance(
                user_id=user.id,
                total_leaves=20,
                used_leaves=0,
                remaining_leaves=20,
                year=current_year
            )
            db.add(balance)
    
    db.commit()
    print("Database seeded successfully!")
    
except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()
