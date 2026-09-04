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
    'Too High':  'Very High',   # frontend alias → model value
}

MAX_DAILY_UNLOCKS  = 500
MAX_STUDY_HOURS    = 20
MAX_ACTIVITY_HOURS = 16

# Wellness bands: (min_score, label, color_hint, note)
WELLNESS_BANDS = [
    (8.0, "Excellent", "green",  "Your lifestyle indicators reflect strong mental wellness. Keep it up!"),
    (6.0, "Good",      "teal",   "You're doing well overall. A few small tweaks could push you higher."),
    (4.0, "Moderate",  "amber",  "Some lifestyle factors may be weighing on you. Small consistent changes make a big difference."),
    (0.0, "Low",       "red",    "Your results suggest significant stressors. Please consider speaking with a mental health professional."),
]

# ---------------------------------------------------------------------------
# Lifespan — load model once at startup, release at shutdown
# ---------------------------------------------------------------------------
ml_model: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Loading model from '%s'...", MODEL_PATH)
    try:
        ml_model["instance"] = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully.")
    except FileNotFoundError:
        logger.critical("Model file not found: '%s'", MODEL_PATH)
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")
    except Exception as exc:
        logger.critical("Model load failed: %s", exc)
        raise RuntimeError(f"Model load failed: {exc}") from exc
    yield
    # Shutdown
    ml_model.clear()
    logger.info("Model released. Shutting down.")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="MindMetric — Mental Health Predictor API",
    description=(
        "Predicts a mental wellness score (0–10) from lifestyle, "
        "digital habits, and demographic inputs. "
        "**Not a clinical tool** — for informational use only."
    ),
    version="1.1.0",
    lifespan=lifespan,
    contact={"name": "MindMetric Team"},
    license_info={"name": "Research & Informational Use Only"},
)

# ---------------------------------------------------------------------------
# CORS
# Note: For strict production security, replace "*" with your exact frontend URL
# (e.g., allow_origins=["https://your-frontend-domain.com"])
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Change this to your frontend URL in production
    allow_credentials=False,    
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request timing middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d  (%.1fms)",
        request.method, request.url.path,
        response.status_code, duration_ms,
    )
    return response

# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # logger.exception automatically captures and logs the full traceback
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "Something went wrong. Please try again.",
            "path": str(request.url.path),
        },
    )

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PredictionInput(BaseModel):
    Age: int = Field(
        ..., ge=5, le=100,
        description="Age of the individual (5–100)",
        examples=[22],
    )
    Gender: Literal['Male', 'Female'] = Field(..., examples=['Male'])
    Country: str = Field(..., min_length=1, max_length=100, examples=['Pakistan'])
    Academic_Level: Literal[
        'High School', 'Undergraduate', 'Graduate', 'Postgraduate'
    ] = Field(..., examples=['Undergraduate'])
    Most_Used_Platform: Literal[
        'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Snapchat', 'TikTok'
    ] = Field(..., examples=['Instagram'])
    Purpose_Of_Use: Literal[
        'Socializing', 'Networking', 'Entertainment', 'Information', 'Other'
    ] = Field(..., examples=['Entertainment'])
    Avg_Daily_Usage_Hours: float = Field(
        ..., ge=0, le=24,
        description="Average daily social media usage (hours)",
        examples=[3.5],
    )
    Daily_Unlocks: int = Field(
        ..., ge=0, le=MAX_DAILY_UNLOCKS,
        description=f"Daily phone unlocks (0–{MAX_DAILY_UNLOCKS})",
        examples=[80],
    )
    Study_Hours: int = Field(
        ..., ge=0, le=MAX_STUDY_HOURS,
        description=f"Study / work hours per day (0–{MAX_STUDY_HOURS})",
        examples=[6],
    )
    Physical_Activity_Hours: int = Field(
        ..., ge=0, le=MAX_ACTIVITY_HOURS,
        description=f"Physical activity hours per day (0–{MAX_ACTIVITY_HOURS})",
        examples=[1],
    )
    Sleep_Hours_Per_Night: float = Field(
        ..., ge=0, le=14,
        description="Sleep hours per night (0–14)",
        examples=[7.0],
    )
    Stress_Level: Literal[
        'Low', 'Medium', 'High', 'Very High', 'Too High'
    ] = Field(..., examples=['Medium'])

    model_config = {
        "json_schema_extra": {
            "example": {
                "Age": 22,
                "Gender": "Male",
                "Country": "Pakistan",
                "Academic_Level": "Undergraduate",
                "Most_Used_Platform": "Instagram",
                "Purpose_Of_Use": "Entertainment",
                "Avg_Daily_Usage_Hours": 3.5,
                "Daily_Unlocks": 80,
                "Study_Hours": 6,
                "Physical_Activity_Hours": 1,
                "Sleep_Hours_Per_Night": 7.0,
                "Stress_Level": "Medium",
            }
        }
    }

    @model_validator(mode='after')
    def check_hours_fit_in_a_day(self) -> 'PredictionInput':
        """
        Cross-field validation: the sum of all time-consuming activities
        cannot exceed 24 hours. Individual field caps can't catch this.
        """
        committed = (
            self.Avg_Daily_Usage_Hours
            + self.Study_Hours
            + self.Physical_Activity_Hours
            + self.Sleep_Hours_Per_Night
        )
        if committed > 24:
            raise ValueError(
                f"Screen time ({self.Avg_Daily_Usage_Hours}h) + "
                f"study ({self.Study_Hours}h) + "
                f"activity ({self.Physical_Activity_Hours}h) + "
                f"sleep ({self.Sleep_Hours_Per_Night}h) = "
                f"{committed:.1f}h — exceeds 24 hours in a day."
            )
        return self


class DimensionScore(BaseModel):
    """A single scored lifestyle dimension returned alongside the main result."""
    dimension: str
    score: float = Field(..., ge=0, le=10)
    insight: str


class PredictionResponse(BaseModel):
    predicted_score: float            = Field(..., ge=0, le=10, description="Overall wellness score (0–10)")
    score_label:     str              = Field(..., description="Wellness band label")
    color:           str              = Field(..., description="Color hint for the frontend (green/teal/amber/red)")
    note:            str              = Field(..., description="Contextual message for the user")
    dimensions:      list[DimensionScore] = Field(..., description="Per-dimension breakdown")
    assessed_at:     str              = Field(..., description="ISO-8601 UTC timestamp")


class ErrorResponse(BaseModel):
    error:   str
    message: str
    detail:  str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_band(score: float) -> tuple[str, str, str]:
    """Return (label, color, note) for a score in [0, 10]."""
    for threshold, label, color, note in WELLNESS_BANDS:
        if score >= threshold:
            return label, color, note
    return WELLNESS_BANDS[-1][1], WELLNESS_BANDS[-1][2], WELLNESS_BANDS[-1][3]


def _dimension_scores(data: PredictionInput) -> list[DimensionScore]:
    """
    Heuristic per-dimension scores for the frontend breakdown panel.
    Rule-based estimates — not model outputs.
    """
    dims: list[DimensionScore] = []

    # --- Sleep ---
    sleep = data.Sleep_Hours_Per_Night
    if sleep >= 7:
        s_score   = min(10.0, 6 + (sleep - 7) * 1.5)
        s_insight = "Your sleep duration looks healthy."
    elif sleep >= 5:
        s_score   = 4 + (sleep - 5)
        s_insight = "Slightly below the recommended 7–9 hrs."
    else:
        s_score   = max(0.0, sleep * 0.8)
        s_insight = "Short sleep is strongly linked to poor mental health."
    dims.append(DimensionScore(dimension="Sleep", score=round(s_score, 1), insight=s_insight))

    # --- Physical activity ---
    activity = data.Physical_Activity_Hours
    if activity >= 1:
        a_score   = min(10.0, 5 + activity * 2.5)
        a_insight = "Good activity level — exercise is one of the best mental health tools."
    else:
        a_score   = activity * 5
        a_insight = "Low physical activity. Even 30 min/day of walking makes a measurable difference."
    dims.append(DimensionScore(dimension="Physical Activity", score=round(a_score, 1), insight=a_insight))

    # --- Screen time ---
    screen = data.Avg_Daily_Usage_Hours
    if screen <= 2:
        sc_score, sc_insight = 9.0, "Excellent screen discipline."
    elif screen <= 4:
        sc_score, sc_insight = 7.0, "Moderate screen time — within a healthy range."
    elif screen <= 6:
        sc_score, sc_insight = 5.0, "Above-average screen time. Consider digital wind-down periods."
    else:
        sc_score   = max(0.0, 10 - screen * 0.8)
        sc_insight = "High screen time is associated with increased anxiety and disrupted sleep."
    dims.append(DimensionScore(dimension="Screen Time", score=round(sc_score, 1), insight=sc_insight))

    # --- Stress ---
    stress_scores = {
        'Low':       9.5,
        'Medium':    7.0,
        'High':      4.5,
        'Very High': 2.0,
        'Too High':  1.0,
    }
    stress_insights = {
        'Low':       "Low stress — great baseline for mental wellness.",
        'Medium':    "Moderate stress is normal; keep an eye on trends.",
        'High':      "High stress — try to identify and reduce key stressors.",
        'Very High': "Very high stress. Prioritise recovery and consider professional support.",
        'Too High':  "Critically high stress. Please speak with a mental health professional.",
    }
    dims.append(DimensionScore(
        dimension="Stress",
        score=round(stress_scores.get(data.Stress_Level, 5.0), 1),
        insight=stress_insights.get(data.Stress_Level, ""),
    ))

    # --- Study / work load ---
    study = data.Study_Hours
    if study <= 4:
        w_score, w_insight = 8.0, "Well-balanced study load."
    elif study <= 8:
        w_score, w_insight = 6.0, "Moderate workload — ensure regular breaks."
    elif study <= 12:
        w_score, w_insight = 4.0, "Heavy study hours. Schedule downtime deliberately."
    else:
        w_score   = max(0.0, 10 - study * 0.5)
        w_insight = "Extremely high study load — burnout risk is elevated."
    dims.append(DimensionScore(dimension="Study Load", score=round(w_score, 1), insight=w_insight))

    return dims


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", tags=["Meta"])
def read_root():
    return {
        "service": "MindMetric Mental Health Predictor API",
        "version": "1.1.0",
        "docs":    "/docs",
        "health":  "/health",
    }


@app.get("/health", tags=["Meta"])
def health_check():
    """Uptime/readiness check — call this from your frontend on page load."""
    return {
        "status":       "ok",
        "model_loaded": "instance" in ml_model,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
    }


@app.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Prediction failure"},
        503: {"model": ErrorResponse, "description": "Model not ready"},
    },
    tags=["Prediction"],
    summary="Predict mental wellness score",
    description=(
        "Accepts lifestyle, digital habit, and demographic inputs and returns "
        "a wellness score (0–10) with a per-dimension breakdown and contextual insight. "
        "**This is not a clinical assessment.**"
    ),
)
def predict(data: PredictionInput):

    # Resolve model instance (loaded at startup via lifespan)
    model = ml_model.get("instance")
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Try again shortly.")

    # Country grouping
    grouped_country = data.Country if data.Country in TOP_COUNTRIES else 'Other'

    # Stress mapping
    mapped_stress = STRESS_LEVEL_MAP.get(data.Stress_Level)
    if mapped_stress is None:
        raise HTTPException(
            status_code=422,
            detail=f"Unrecognised stress level: '{data.Stress_Level}'",
        )

    # Build DataFrame matching the pipeline's expected columns exactly
    input_dict = {
        'Age':                     data.Age,
        'Gender':                  data.Gender,
        'Grouped_countries':       grouped_country,
        'Academic_Level':          data.Academic_Level,
        'Most_Used_Platform':      data.Most_Used_Platform,
        'Purpose_Of_Use':          data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours':   data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks':           data.Daily_Unlocks,
        'Study_Hours':             data.Study_Hours,
        'Physical_Activity_Hours': data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night':   data.Sleep_Hours_Per_Night,
        'Stress_Level':            mapped_stress,
    }
    input_df = pd.DataFrame([input_dict])

    # Predict
    try:
        raw_score = float(model.predict(input_df)[0])
    except ValueError as exc:
        logger.exception("Model input error | input: %s", input_dict)
        raise HTTPException(
            status_code=422,
            detail=f"Model rejected the input: {exc}",
        ) from exc
    except Exception as exc:
        logger.exception("Prediction error | input: %s", input_dict)
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please try again.",
        ) from exc

    # Clip to [0, 10]
    predicted_score = round(max(0.0, min(10.0, raw_score)), 2)

    label, color, note = _get_band(predicted_score)
    dimensions         = _dimension_scores(data)

    logger.info(
        "Prediction | score=%.2f | label=%s | country=%s | stress=%s",
        predicted_score, label, grouped_country, mapped_stress,
    )

    return PredictionResponse(
        predicted_score=predicted_score,
        score_label=label,
        color=color,
        note=note,
        dimensions=dimensions,
        assessed_at=datetime.now(timezone.utc).isoformat(),
    )