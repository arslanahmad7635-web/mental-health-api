import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from starlette.concurrency import run_in_threadpool
import logging
import time
import os

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("MindMetricCore")

# ---------------------------------------------------------------------------
# Constants & Configuration
# ---------------------------------------------------------------------------
MODEL_PATH = os.getenv("MODEL_PATH", "Mental_Health_Predict.pkl")

TOP_COUNTRIES = {
    'Pakistan', 'India', 'USA', 'Canada', 'Australia',
    'UK', 'Germany', 'Mexico', 'Turkey', 'France', 'Other'
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
    (8.0, "Optimal Wellbeing", "emerald", "Outstanding results! Your dedication to balanced habits, strong recovery, and digital discipline has built a phenomenal wellness foundation."),
    (5.0, "Moderate Wellbeing", "amber", "You're maintaining a steady baseline. Fine-tuning a few digital and rest routines could easily elevate you into peak wellness."),
    (3.0, "Below Average", "orange", "Lifestyle indicators reflect elevated friction. Restricting late-night screen exposure and establishing clear boundaries is strongly advised."),
    (0.0, "Critical Priority", "rose", "Data suggests significant distress and lifestyle imbalance. Immediate intervention, structural rest recovery, or consultation with a professional is advised.")
]

# ---------------------------------------------------------------------------
# Async Lifespan for Memory Efficiency & Performance Pre-Warm
# ---------------------------------------------------------------------------
ml_model: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing system architecture. Pre-loading predictive model...")
    if not os.path.exists(MODEL_PATH):
        logger.critical("Model file not found at path: %s", MODEL_PATH)
        raise FileNotFoundError(f"Predictive model asset missing: {MODEL_PATH}")
    
    try:
        # Load model non-blocking during startup hook
        model_instance = await run_in_threadpool(joblib.load, MODEL_PATH)
        ml_model["instance"] = model_instance
        logger.info("Model loaded successfully into shared memory context.")
    except Exception as exc:
        logger.critical("Model load failed during startup initialization: %s", exc)
        raise RuntimeError(f"Initialization failure: {exc}") from exc
    yield
    ml_model.clear()
    logger.info("Deallocated shared resources. Application shutdown complete.")

# ---------------------------------------------------------------------------
# FastAPI Instance Instantiation
# ---------------------------------------------------------------------------
app = FastAPI(
    title="MindMetric — Core Engine API",
    version="2.0.0",
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# Enforce secure CORS parameters for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# ---------------------------------------------------------------------------
# High-Frequency Log Middleware & Latency Tracer
# ---------------------------------------------------------------------------
@app.middleware("http")
async def latency_tracker_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "Method: %s | Path: %s | Status: %d | Latency: %.2fms",
        request.method, request.url.path, response.status_code, duration_ms
    )
    return response

# ---------------------------------------------------------------------------
# Structured Validation Schemas (Pydantic v2)
# ---------------------------------------------------------------------------
class PredictionInput(BaseModel):
    Age: int = Field(..., ge=5, le=100)
    Gender: Literal['Male', 'Female'] = Field(...)
    Country: str = Field(..., min_length=1, max_length=100)
    Academic_Level: Literal['High School', 'Undergraduate', 'Graduate', 'Postgraduate'] = Field(...)
    Most_Used_Platform: Literal['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Snapchat', 'TikTok'] = Field(...)
    Purpose_Of_Use: Literal['Socializing', 'Networking', 'Entertainment', 'Information', 'Other'] = Field(...)
    Avg_Daily_Usage_Hours: float = Field(..., ge=0, le=24.0)
    Daily_Unlocks: int = Field(..., ge=0, le=MAX_DAILY_UNLOCKS)
    Study_Hours: int = Field(..., ge=0, le=MAX_STUDY_HOURS)
    Physical_Activity_Hours: int = Field(..., ge=0, le=MAX_ACTIVITY_HOURS)
    Sleep_Hours_Per_Night: float = Field(..., ge=0, le=14.0)
    Stress_Level: Literal['Low', 'Medium', 'High', 'Very High', 'Too High'] = Field(...)

    @model_validator(mode='after')
    def validate_daily_time_allocation(self) -> 'PredictionInput':
        total_time = (
            self.Avg_Daily_Usage_Hours
            + self.Study_Hours
            + self.Physical_Activity_Hours
            + self.Sleep_Hours_Per_Night
        )
        if total_time > 24.0:
            raise ValueError(
                f"Combined allocation ({total_time:.2f} hours) exceeds astronomical limits (24 hours/day)."
            )
        return self

class DimensionScore(BaseModel):
    dimension: str
    score: float = Field(..., ge=0.0, le=10.0)
    insight: str

class PredictionResponse(BaseModel):
    predicted_score: float = Field(..., ge=0.0, le=10.0)
    score_label: str
    color: str
    note: str
    dimensions: list[DimensionScore]
    assessed_at: str

# ---------------------------------------------------------------------------
# Core Heuristic Calculation & Multi-Variable Evaluation Layer
# ---------------------------------------------------------------------------
def calculate_dynamic_dimensions(data: PredictionInput) -> list[DimensionScore]:
    dimensions = []

    # Dimension 1: Sleep Habits (Strongly impacted by sleep duration)
    sleep = data.Sleep_Hours_Per_Night
    if sleep == 0:
        sleep_score, sleep_insight = 0.0, "CRITICAL RISK: Complete sleep deprivation recorded. Immediate medical hazard."
    elif sleep >= 7.0:
        sleep_score, sleep_insight = min(10.0, 6.0 + (sleep - 7.0) * 1.5), "Excellent rest profile supporting restorative health."
    elif sleep >= 5.0:
        sleep_score, sleep_insight = 4.0 + (sleep - 5.0), "Mild sleep restriction. Optimal performance requires 7-9 hours."
    else:
        sleep_score, sleep_insight = max(1.0, sleep * 0.8), "High sleep deficit. Restorative cycle is heavily disrupted."
    dimensions.append(DimensionScore(dimension="Sleep", score=round(sleep_score, 1), insight=sleep_insight))

    # Dimension 2: Physical Movement
    act = data.Physical_Activity_Hours
    if act >= 1.5:
        act_score, act_insight = min(10.0, 7.5 + (act - 1.5) * 1.0), "Optimal level of daily metabolic activation."
    elif act >= 0.5:
        act_score, act_insight = 5.0 + (act - 0.5) * 2.5, "Moderate movement. Consider elevating to support neurogenesis."
    else:
        act_score, act_insight = max(0.0, act * 8.0), "Sedentary warning. Minimal movement impairs cognitive resilience."
    dimensions.append(DimensionScore(dimension="Physical Activity", score=round(act_score, 1), insight=act_insight))

    # Dimension 3: Screen Time & Digital Habituation
    screen = data.Avg_Daily_Usage_Hours
    if screen <= 2.0:
        screen_score, screen_insight = 10.0 - (screen * 0.5), "Incredible focus control and digital limits."
    elif screen <= 5.0:
        screen_score, screen_insight = 8.0 - (screen - 2.0) * 1.0, "Moderate usage. Protect your focus thresholds."
    else:
        screen_score, screen_insight = max(0.0, 5.0 - (screen - 5.0) * 0.5), "High screen exposure driving mental overload."
    dimensions.append(DimensionScore(dimension="Screen Time", score=round(screen_score, 1), insight=screen_insight))

    # Dimension 4: Stress Perception Matrix
    stress_scores = {'Low': 9.5, 'Medium': 7.0, 'High': 4.0, 'Very High': 1.5, 'Too High': 0.5}
    stress_insights = {
        'Low': "Superb stress baseline indicating clear cognitive space.",
        'Medium': "Standard daily friction. Handled efficiently.",
        'High': "Elevated demands. Active stress reduction protocols recommended.",
        'Very High': "Severe psychological overload impacting executive function.",
        'Too High': "Extreme risk of burnout and nervous system depletion."
    }
    dimensions.append(DimensionScore(
        dimension="Stress",
        score=stress_scores.get(data.Stress_Level, 5.0),
        insight=stress_insights.get(data.Stress_Level, "Evaluation threshold unestablished.")
    ))

    # Dimension 5: Work / Study Equilibrium
    study = data.Study_Hours
    if study <= 6:
        study_score, study_insight = min(10.0, 8.0 + (study * 0.3)), "Healthy educational load management."
    elif study <= 10:
        study_score, study_insight = max(5.0, 8.0 - (study - 6) * 0.75), "Dense cognitive focus. Keep dynamic breaks scheduled."
    else:
        study_score, study_insight = max(1.0, 5.0 - (study - 10) * 0.5), "Prolonged intensive load elevating cerebral fatigue."
    dimensions.append(DimensionScore(dimension="Study Load", score=round(study_score, 1), insight=study_insight))

    return dimensions

def apply_compound_safety_heuristics(data: PredictionInput, base_predicted_score: float) -> tuple[float, str]:
    """
    Evaluates compound safety metrics to prevent false moderate scores during extreme failure parameters.
    Overrides raw model outputs if core physiological indicators violate survival limits.
    """
    score = base_predicted_score
    custom_note = ""

    # Rule 1: CRITICAL ZERO-SLEEP OVERRIDE ENGINE
    if data.Sleep_Hours_Per_Night == 0:
        # Cap score directly, bypassing optimistic regression results
        score = min(score, 1.2)
        custom_note = (
            "CRITICAL WARNING: 0 hours of sleep recorded. Total sleep deprivation is an acute physical hazard "
            "that induces fast cognitive decline, severe emotional dysregulation, and cardiac stress. "
            "Please seek immediate physical rest and suspend high-risk cognitive or motor operations."
        )
        return score, custom_note

    # Rule 2: Compound Stress-Screen burnout threshold
    if data.Stress_Level in ('High', 'Very High', 'Too High') and data.Avg_Daily_Usage_Hours >= 8.0:
        score -= 2.0
        custom_note += " Heavy social media usage paired with high stress values forms a toxic neurological feedback loop."

    # Rule 3: High-load sedentary isolation penalty
    if data.Study_Hours >= 8 and data.Physical_Activity_Hours == 0:
        score -= 1.0

    # Ensure output bounds match limits (0.0 - 10.0)
    final_score = max(0.0, min(10.0, score))
    return round(final_score, 2), custom_note.strip()

def determine_wellness_band(score: float) -> tuple[str, str, str]:
    for threshold, label, color, note in WELLNESS_BANDS:
        if score >= threshold:
            return label, color, note
    return WELLNESS_BANDS[-1][1], WELLNESS_BANDS[-1][2], WELLNESS_BANDS[-1][3]

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", status_code=status.HTTP_200_OK)
async def health():
    """
    High-performance health checks bypassing payload engines. Used for live load balancers.
    """
    model_loaded = "instance" in ml_model
    return {
        "status": "healthy" if model_loaded else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_loaded": model_loaded
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionInput):
    """
    Executes ML prediction offloaded non-blocking to thread pool to preserve event-loop integrity.
    Applies strict clinical logic and compound safety heuristic algorithms.
    """
    model = ml_model.get("instance")
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Predictive engine initialization incomplete."
        )

    # Clean input transformation mapping
    transformed_country = data.Country if data.Country in TOP_COUNTRIES else 'Other'
    mapped_stress = STRESS_LEVEL_MAP.get(data.Stress_Level, 'Medium')

    # Construct dataframe payload matching serialization layout of the model
    input_dict = {
        'Age': data.Age,
        'Gender': data.Gender,
        'Grouped_countries': transformed_country,
        'Academic_Level': data.Academic_Level,
        'Most_Used_Platform': data.Most_Used_Platform,
        'Purpose_Of_Use': data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours': data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks': data.Daily_Unlocks,
        'Study_Hours': data.Study_Hours,
        'Physical_Activity_Hours': data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night': data.Sleep_Hours_Per_Night,
        'Stress_Level': mapped_stress,
    }

    try:
        # Wrap blocking pandas and scikit-learn execution in anyio-driven run_in_threadpool
        df = pd.DataFrame([input_dict])
        raw_prediction = await run_in_threadpool(model.predict, df)
        raw_score = float(raw_prediction[0])
    except Exception as exc:
        logger.error("Inference engine exception: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {exc}"
        )

    # Apply safety logic override filters
    final_score, heuristic_warning = apply_compound_safety_heuristics(data, raw_score)
    label, color, base_note = determine_wellness_band(final_score)
    
    # Prioritize absolute zero-sleep notes or append heuristic outputs securely
    resolved_note = heuristic_warning if heuristic_warning else base_note
    resolved_dimensions = calculate_dynamic_dimensions(data)

    return PredictionResponse(
        predicted_score=final_score,
        score_label=label,
        color=color,
        note=resolved_note,
        dimensions=resolved_dimensions,
        assessed_at=datetime.now(timezone.utc).isoformat(),
    )