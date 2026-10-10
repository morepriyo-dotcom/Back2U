"""001_initial_schema

Revision ID: 9e57a75628fb
Revises: 
Create Date: 2026-10-09 23:30:17.587695

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '9e57a75628fb'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. users
    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("firebase_uid", sa.String(length=128), nullable=True, unique=True),
            sa.Column("email", sa.String(length=255), nullable=True, unique=True),
            sa.Column("phone_number", sa.String(length=20), nullable=True, unique=True),
            sa.Column("is_phone_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("hashed_password", sa.String(length=255), nullable=True),
            sa.Column("full_name", sa.String(length=150), nullable=False),
            sa.Column("avatar_url", sa.String(length=500), nullable=True),
            sa.Column("role", sa.String(length=50), nullable=False, server_default="user"),
            sa.Column("trust_score", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("penalty_points", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("points_balance", sa.Integer(), nullable=False, server_default="100"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("is_restricted", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("restriction_reason", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_users_id", "users", ["id"])
        op.create_index("ix_users_email", "users", ["email"])
        op.create_index("ix_users_phone_number", "users", ["phone_number"])
        op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"])

    # 2. items
    if "items" not in existing_tables:
        op.create_table(
            "items",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("report_type", sa.String(length=20), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("lr_number", sa.String(length=50), nullable=True, unique=True),
            sa.Column("is_govt_id", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("govt_id_type", sa.String(length=50), nullable=True),
            sa.Column("masked_identifier", sa.String(length=100), nullable=True),
            sa.Column("location_name", sa.String(length=200), nullable=False),
            sa.Column("latitude", sa.Float(), nullable=True),
            sa.Column("longitude", sa.Float(), nullable=True),
            sa.Column("incident_date", sa.DateTime(), nullable=False),
            sa.Column("image_url", sa.String(length=500), nullable=True),
            sa.Column("brand", sa.String(length=100), nullable=True),
            sa.Column("model", sa.String(length=100), nullable=True),
            sa.Column("private_clues", sa.Text(), nullable=True),
            sa.Column("custody_status", sa.String(length=50), nullable=False, server_default="IN_POSSESSION"),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="REPORTED"),
            sa.Column("text_embedding", sa.Text(), nullable=True),
            sa.Column("image_embedding", sa.Text(), nullable=True),
            sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("flag_reason", sa.String(length=255), nullable=True),
            sa.Column("is_demo_seed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("reporter_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_items_id", "items", ["id"])
        op.create_index("ix_items_title", "items", ["title"])
        op.create_index("ix_items_category", "items", ["category"])
        op.create_index("ix_items_lr_number", "items", ["lr_number"])
        op.create_index("idx_items_report_status_date", "items", ["report_type", "status", "incident_date"])
        op.create_index("idx_items_category_type", "items", ["category", "report_type"])
        op.create_index("idx_items_reporter", "items", ["reporter_id"])
        op.create_index("idx_items_flagged_status", "items", ["is_flagged", "status"])

    # 3. phone_otps
    if "phone_otps" not in existing_tables:
        op.create_table(
            "phone_otps",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("phone_number", sa.String(length=20), nullable=False),
            sa.Column("otp_hash", sa.String(length=255), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_phone_otps_id", "phone_otps", ["id"])
        op.create_index("ix_phone_otps_phone_number", "phone_otps", ["phone_number"])

    # 4. claims
    if "claims" not in existing_tables:
        op.create_table(
            "claims",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
            sa.Column("claimant_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="SUBMITTED"),
            sa.Column("challenge_answers", sa.Text(), nullable=True),
            sa.Column("evidence_photos", sa.Text(), nullable=True),
            sa.Column("purchase_receipt_url", sa.String(length=500), nullable=True),
            sa.Column("serial_number_provided", sa.String(length=100), nullable=True),
            sa.Column("supporting_notes", sa.Text(), nullable=True),
            sa.Column("risk_score", sa.Float(), nullable=False, server_default="0.0"),
            sa.Column("is_disputed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("admin_notes", sa.Text(), nullable=True),
            sa.Column("rejection_reason", sa.String(length=255), nullable=True),
            sa.Column("finder_confirmed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("owner_confirmed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("handover_meeting_notes", sa.Text(), nullable=True),
            sa.Column("handover_date", sa.DateTime(), nullable=True),
            sa.Column("points_awarded", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("closed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_claims_id", "claims", ["id"])

    # 5. requests_to_buy
    if "requests_to_buy" not in existing_tables:
        op.create_table(
            "requests_to_buy",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
            sa.Column("requester_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("offer_amount", sa.Float(), nullable=False),
            sa.Column("currency_type", sa.String(length=20), nullable=False, server_default="POINTS"),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
            sa.Column("finder_response", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_requests_to_buy_id", "requests_to_buy", ["id"])

    # 6. auction_listings
    if "auction_listings" not in existing_tables:
        op.create_table(
            "auction_listings",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
            sa.Column("starting_points", sa.Integer(), nullable=False, server_default="50"),
            sa.Column("current_bid_points", sa.Integer(), nullable=False, server_default="50"),
            sa.Column("current_highest_bidder_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("resolution_type", sa.String(length=50), nullable=False, server_default="AUCTION"),
            sa.Column("admin_approved", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="ACTIVE"),
            sa.Column("end_date", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_auction_listings_id", "auction_listings", ["id"])

    # 7. point_transactions
    if "point_transactions" not in existing_tables:
        op.create_table(
            "point_transactions",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("transaction_type", sa.String(length=50), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=False),
            sa.Column("related_item_id", sa.Integer(), nullable=True),
            sa.Column("related_claim_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_point_transactions_id", "point_transactions", ["id"])

    # 8. notifications
    if "notifications" not in existing_tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("notification_type", sa.String(length=50), nullable=False, server_default="INFO"),
            sa.Column("link_url", sa.String(length=300), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_notifications_id", "notifications", ["id"])

    # 9. audit_logs
    if "audit_logs" not in existing_tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
            sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("actor_email", sa.String(length=255), nullable=True),
            sa.Column("action", sa.String(length=100), nullable=False),
            sa.Column("resource_type", sa.String(length=50), nullable=False),
            sa.Column("resource_id", sa.Integer(), nullable=True),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(length=50), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_audit_logs_id", "audit_logs", ["id"])

def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("point_transactions")
    op.drop_table("auction_listings")
    op.drop_table("requests_to_buy")
    op.drop_table("claims")
    op.drop_table("phone_otps")
    op.drop_table("items")
    op.drop_table("users")
