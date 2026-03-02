"""
LLM Configuration model for storing admin-configurable AI settings.
Singleton pattern: only one active config row at a time.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class LLMConfig(Base):
    __tablename__ = "llm_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(100), nullable=False, default="openrouter")
    model_id = Column(String(200), nullable=False, default="openrouter/auto:free")
    display_name = Column(String(200), nullable=False, default="Auto (Free)")
    api_key = Column(Text, nullable=False, default="")
    base_url = Column(String(500), nullable=False, default="https://openrouter.ai/api/v1")
    temperature = Column(Float, default=0.4)
    max_tokens = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(320), nullable=True)
