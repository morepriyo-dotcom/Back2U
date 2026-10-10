import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Force test configuration
os.environ["APP_ENV"] = "development"
os.environ["SECRET_KEY"] = "test_secret_key_for_automated_testing_purposes_only_32_chars"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ENABLE_DEMO_LOGIN"] = "true"
os.environ["ENABLE_AUTO_SEED"] = "false"

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.item import Item
from app.services.auth_service import get_password_hash, create_access_token

# Test in-memory SQLite database
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_users(db_session):
    """Creates a standard set of test personas: admin, finder, owner, claimant."""
    hashed_pwd = get_password_hash("Password123!")

    admin = User(
        email="admin_test@back2u.org",
        full_name="Admin Test",
        hashed_password=hashed_pwd,
        role="admin",
        trust_score=150,
        points_balance=500
    )
    finder = User(
        email="finder_test@back2u.org",
        full_name="Finder Test",
        hashed_password=hashed_pwd,
        role="user",
        trust_score=110,
        points_balance=100
    )
    owner = User(
        email="owner_test@back2u.org",
        full_name="Owner Test",
        hashed_password=hashed_pwd,
        role="user",
        trust_score=100,
        points_balance=100
    )
    claimant2 = User(
        email="claimant2_test@back2u.org",
        full_name="Claimant Two",
        hashed_password=hashed_pwd,
        role="user",
        trust_score=90,
        points_balance=100
    )

    db_session.add_all([admin, finder, owner, claimant2])
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(finder)
    db_session.refresh(owner)
    db_session.refresh(claimant2)

    return {
        "admin": admin,
        "finder": finder,
        "owner": owner,
        "claimant2": claimant2,
        "admin_token": create_access_token({"sub": str(admin.id), "email": admin.email, "role": admin.role}),
        "finder_token": create_access_token({"sub": str(finder.id), "email": finder.email, "role": finder.role}),
        "owner_token": create_access_token({"sub": str(owner.id), "email": owner.email, "role": owner.role}),
        "claimant2_token": create_access_token({"sub": str(claimant2.id), "email": claimant2.email, "role": claimant2.role})
    }
