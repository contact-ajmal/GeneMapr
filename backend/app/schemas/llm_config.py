"""
Pydantic schemas for LLM configuration management.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class LLMConfigResponse(BaseModel):
    id: str | None = None
    provider: str
    model_id: str
    display_name: str
    api_key_set: bool  # Never expose actual key; just indicate if set
    base_url: str
    temperature: float
    max_tokens: int
    updated_at: datetime | None = None
    updated_by: str | None = None


class LLMConfigUpdate(BaseModel):
    provider: str | None = None
    model_id: str | None = None
    display_name: str | None = None
    api_key: str | None = Field(None, description="New API key (omit to keep existing)")
    base_url: str | None = None
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=100, le=16000)


class LLMModelOption(BaseModel):
    id: str
    name: str
    context_window: str = ""
    free: bool = False


class LLMProviderPreset(BaseModel):
    provider: str
    label: str
    base_url: str
    description: str
    models: list[LLMModelOption]


# ── Provider Presets Catalog ──

LLM_PROVIDER_PRESETS: list[LLMProviderPreset] = [
    LLMProviderPreset(
        provider="openrouter",
        label="OpenRouter",
        base_url="https://openrouter.ai/api/v1",
        description="Access hundreds of models through a single API. Supports free-tier models.",
        models=[
            LLMModelOption(id="openrouter/auto:free", name="Auto (Free)", context_window="Varies", free=True),
            LLMModelOption(id="google/gemini-2.0-flash-exp:free", name="Gemini 2.0 Flash", context_window="1M", free=True),
            LLMModelOption(id="google/gemini-2.5-pro-exp-03-25:free", name="Gemini 2.5 Pro", context_window="1M", free=True),
            LLMModelOption(id="meta-llama/llama-3.3-70b-instruct:free", name="Llama 3.3 70B", context_window="128K", free=True),
            LLMModelOption(id="deepseek/deepseek-chat-v3-0324:free", name="DeepSeek V3", context_window="64K", free=True),
            LLMModelOption(id="anthropic/claude-sonnet-4", name="Claude Sonnet 4", context_window="200K"),
            LLMModelOption(id="openai/gpt-4o", name="GPT-4o", context_window="128K"),
            LLMModelOption(id="google/gemini-2.5-pro-preview", name="Gemini 2.5 Pro", context_window="1M"),
            LLMModelOption(id="anthropic/claude-3.5-sonnet", name="Claude 3.5 Sonnet", context_window="200K"),
            LLMModelOption(id="deepseek/deepseek-r1", name="DeepSeek R1", context_window="64K"),
        ],
    ),
    LLMProviderPreset(
        provider="openai",
        label="OpenAI",
        base_url="https://api.openai.com/v1",
        description="GPT-4o, GPT-4 Turbo, and other OpenAI models. Requires an OpenAI API key.",
        models=[
            LLMModelOption(id="gpt-4o", name="GPT-4o", context_window="128K"),
            LLMModelOption(id="gpt-4o-mini", name="GPT-4o Mini", context_window="128K"),
            LLMModelOption(id="gpt-4-turbo", name="GPT-4 Turbo", context_window="128K"),
            LLMModelOption(id="o3-mini", name="o3 Mini", context_window="200K"),
        ],
    ),
    LLMProviderPreset(
        provider="anthropic",
        label="Anthropic",
        base_url="https://api.anthropic.com/v1",
        description="Claude 4, 3.5 Sonnet, and Haiku models. Requires an Anthropic API key.",
        models=[
            LLMModelOption(id="claude-sonnet-4-20250514", name="Claude Sonnet 4", context_window="200K"),
            LLMModelOption(id="claude-3-5-sonnet-20241022", name="Claude 3.5 Sonnet", context_window="200K"),
            LLMModelOption(id="claude-3-5-haiku-20241022", name="Claude 3.5 Haiku", context_window="200K"),
        ],
    ),
    LLMProviderPreset(
        provider="google",
        label="Google AI Studio",
        base_url="https://generativelanguage.googleapis.com/v1beta/openai",
        description="Gemini models via Google AI Studio. Requires a Google AI API key.",
        models=[
            LLMModelOption(id="gemini-2.5-pro", name="Gemini 2.5 Pro", context_window="1M"),
            LLMModelOption(id="gemini-2.5-flash", name="Gemini 2.5 Flash", context_window="1M"),
            LLMModelOption(id="gemini-2.0-flash", name="Gemini 2.0 Flash", context_window="1M"),
        ],
    ),
    LLMProviderPreset(
        provider="custom",
        label="Custom / Self-hosted",
        base_url="",
        description="Connect to any OpenAI-compatible API (vLLM, Ollama, LocalAI, etc.)",
        models=[
            LLMModelOption(id="custom", name="Custom Model", context_window=""),
        ],
    ),
]
