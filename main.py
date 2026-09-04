import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import time
import os

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MODEL_PATH = os.getenv("MODEL_PATH", "Mental_Health_Predict.pkl")

TOP_COUNTRIES = {
    'India', 'Pakistan', 'USA', 'Canada', 'Australia',
    'UK', 'Germany', 'Mexico', 'Turkey', 'France', 'Other',
}

STRESS_LEVEL_MAP: dict[str, str] = {
    'Low':       'Low',
    'Medium':    'Medium',
    'High':      'High',
    'Very High': 'Very High',
    'Too High':  'Very High',
}

MAX_DAILY_UNLOCKS  = 500
MAX_STUDY_HOURS    = 20
MAX_ACTIVITY_HOURS = 16

WELLNESS_BANDS = [
    (8.0, "Excellent", "green",  "Your lifestyle indicators reflect strong mental wellness. Keep it up!"),
    (6.0, "Good",      "teal",   "You're doing well overall. A few small tweaks could push you higher."),
    (4.0, "Moderate",  "amber",  "Some lifestyle factors may be weighing on you. Small consistent changes make a big difference."),
    (0.0, "Low",       "red",    "Your results suggest significant stressors. Please consider speaking with a mental health professional."),
]

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
ml_model: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading model from '%s'...", MODEL_PATH)
    try:
        ml_model["instance"] = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully.")
    except Exception as exc:
        logger.critical("Model load failed: %s", exc)
        raise RuntimeError(f"Model load failed: {exc}") from exc
    yield
    ml_model.clear()
    logger.info("Model released. Shutting down.")

# ---------------------------------------------------------------------------
# App & Middleware
# ---------------------------------------------------------------------------
app = FastAPI(
    title="MindMetric — Mental Health Predictor API",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s → %d  (%.1fms)", request.method, request.url.path, response.status_code, duration_ms)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "Something went wrong. Please try again."},
    )

# ---------------------------------------------------------------------------
# Schemas & Validation
# ---------------------------------------------------------------------------
class PredictionInput(BaseModel):
    Age: int = Field(..., ge=5, le=100)
    Gender: Literal['Male', 'Female'] = Field(...)
    Country: str = Field(..., min_length=1, max_length=100)
    Academic_Level: Literal['High School', 'Undergraduate', 'Graduate', 'Postgraduate'] = Field(...)
    Most_Used_Platform: Literal['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Snapchat', 'TikTok'] = Field(...)
    Purpose_Of_Use: Literal['Socializing', 'Networking', 'Entertainment', 'Information', 'Other'] = Field(...)
    Avg_Daily_Usage_Hours: float = Field(..., ge=0, le=24)
    Daily_Unlocks: int = Field(..., ge=0, le=MAX_DAILY_UNLOCKS)
    Study_Hours: int = Field(..., ge=0, le=MAX_STUDY_HOURS)
    Physical_Activity_Hours: int = Field(..., ge=0, le=MAX_ACTIVITY_HOURS)
    Sleep_Hours_Per_Night: float = Field(..., ge=0, le=14)
    Stress_Level: Literal['Low', 'Medium', 'High', 'Very High', 'Too High'] = Field(...)

    @model_validator(mode='after')
    def check_hours_fit_in_a_day(self) -> 'PredictionInput':
        committed = (
            self.Avg_Daily_Usage_Hours
            + self.Study_Hours
            + self.Physical_Activity_Hours
            + self.Sleep_Hours_Per_Night
        )
        if committed > 24:
            raise ValueError(f"Total committed hours ({committed:.1f}h) exceeds 24 hours in a day.")
        return self

class DimensionScore(BaseModel):
    dimension: str
    score: float = Field(..., ge=0, le=10)
    insight: str

class PredictionResponse(BaseModel):
    predicted_score: float
    score_label: str
    color: str
    note: str
    dimensions: list[DimensionScore]
    assessed_at: str

class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: str | None = None

# ---------------------------------------------------------------------------
# Advanced Heuristic & Dynamic Logic Engine
# ---------------------------------------------------------------------------
def _get_band(score: float) -> tuple[str, str, str]:
    for threshold, label, color, note in WELLNESS_BANDS:
        if score >= threshold:
            return label, color, note
    return WELLNESS_BANDS[-1][1], WELLNESS_BANDS[-1][2], WELLNESS_BANDS[-1][3]

def _dimension_scores(data: PredictionInput) -> list[DimensionScore]:
    dims = []

    # Sleep
    sleep = data.Sleep_Hours_Per_Night
    if sleep >= 7:
        s_score, s_insight = min(10.0, 6 + (sleep - 7) * 1.5), "Your sleep duration looks healthy."
    elif sleep >= 5:
        s_score, s_insight = 4 + (sleep - 5), "Slightly below the recommended 7–9 hrs."
    else:
        s_score, s_insight = max(0.0, sleep * 0.8), "Critical sleep deficit detected. Highly impacts resilience."
    dims.append(DimensionScore(dimension="Sleep", score=round(s_score, 1), insight=s_insight))

    # Activity
    activity = data.Physical_Activity_Hours
    if activity >= 1:
        a_score, a_insight = min(10.0, 5 + activity * 2.5), "Good activity level supporting mental clarity."
    else:
        a_score, a_insight = activity * 5, "Low physical activity. Movement is vital for stress reduction."
    dims.append(DimensionScore(dimension="Physical Activity", score=round(a_score, 1), insight=a_insight))

    # Screen Time
    screen = data.Avg_Daily_Usage_Hours
    if screen <= 2:
        sc_score, sc_insight = 9.0, "Excellent digital discipline."
    elif screen <= 6:
        sc_score, sc_insight = max(3.0, 9.0 - (screen * 0.8)), "Moderate-to-high screen exposure."
    else:
        sc_score, sc_insight = max(0.0, 10 - screen * 0.9), "Excessive screen time causing heavy cognitive fatigue."
    dims.append(DimensionScore(dimension="Screen Time", score=round(sc_score, 1), insight=sc_insight))

    # Stress
    stress_scores = {'Low': 9.5, 'Medium': 7.0, 'High': 4.5, 'Very High': 2.0, 'Too High': 1.0}
    stress_insights = {
        'Low': "Low stress baseline.", 'Medium': "Moderate daily friction.",
        'High': "High pressure impacting well-being.", 'Very High': "Severe stress load.", 'Too High': "Critical burnout risk."
    }
    dims.append(DimensionScore(dimension="Stress", score=stress_scores.get(data.Stress_Level, 5.0), insight=stress_insights.get(data.Stress_Level, "")))

    # Study/Work
    study = data.Study_Hours
    w_score = max(0.0, 10 - (study * 0.4))
    w_insight = "Balanced workload." if study <= 6 else "Heavy cognitive load; ensure rest."
    dims.append(DimensionScore(dimension="Study Load", score=round(w_score, 1), insight=w_insight))

    return dims

def _compute_risk_penalty(data: PredictionInput, base_score: float) -> float:
    """
    Compound risk logic override: 
    Applies aggressive mathematical penalties if dangerous combination metrics occur,
    preventing the model from returning unrealistic 'moderate' scores during total burnout.
    """
    penalty = 0.0

    # Severe sleep deprivation penalty
    if data.Sleep_Hours_Per_Night < 3.0:
        penalty += 3.5
    elif data.Sleep_Hours_Per_Night < 5.0:
        penalty += 1.8

    # Extreme screen time penalty
    if data.Avg_Daily_Usage_Hours >= 14.0:
        penalty += 2.5
    elif data.Avg_Daily_Usage_Hours >= 10.0:
        penalty += 1.2

    # Stress multiplicative penalty
    if data.Stress_Level in ('High', 'Very High', 'Too High'):
        penalty += 1.5

    # Zero activity penalty
    if data.Physical_Activity_Hours == 0:
        penalty += 0.5

    adjusted_score = base_score - penalty
    return max(0.0, min(10.0, adjusted_score))

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": "instance" in ml_model}

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictionInput):
    model = ml_model.get("instance")
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    grouped_country = data.Country if data.Country in TOP_COUNTRIES else 'Other'
    mapped_stress = STRESS_LEVEL_MAP.get(data.Stress_Level)

    input_dict = {
        'Age': data.Age, 'Gender': data.Gender, 'Grouped_countries': grouped_country,
        'Academic_Level': data.Academic_Level, 'Most_Used_Platform': data.Most_Used_Platform,
        'Purpose_Of_Use': data.Purpose_Of_Use, 'Avg_Daily_Usage_Hours': data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks': data.Daily_Unlocks, 'Study_Hours': data.Study_Hours,
        'Physical_Activity_Hours': data.Physical_Activity_Hours, 'Sleep_Hours_Per_Night': data.Sleep_Hours_Per_Night,
        'Stress_Level': mapped_stress,
    }
    
    try:
        raw_score = float(model.predict(pd.DataFrame([input_dict]))[0])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}")

    # Apply compound safeguard heuristic penalty engine
    final_score = _compute_risk_penalty(data, raw_score)
    predicted_score = round(final_score, 2)

    label, color, note = _get_band(predicted_score)
    dimensions = _dimension_scores(data)

    return PredictionResponse(
        predicted_score=predicted_score,
        score_label=label,
        color=color,
        note=note,
        dimensions=dimensions,
        assessed_at=datetime.now(timezone.utc).isoformat(),
    )