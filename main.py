import joblib 
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app once with proper configuration
app = FastAPI(title="Mental Health Predictor API")

# Configure CORS so your separate frontend static site can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load the model
model = joblib.load("Mental_Health_Predict.pkl")

# Define the allowed top countries globally
top_countries = [
    'Other', 'India', 'Pakistan', 'USA', 'Canada', 'Australia', 
    'UK', 'Germany', 'Mexico', 'Turkey', 'France'
]

class PredictionInput(BaseModel):
    Age: int = Field(..., ge=0, le=120, description="Age of the individual")
    Gender: Literal['Male', 'Female'] = Field(..., description="Gender of the individual")
    Country: str = Field(..., description="Country of residence")
    Academic_Level: Literal['High School', 'Undergraduate', 'Graduate', 'Postgraduate'] = Field(..., description="Academic level of the individual")
    Most_Used_Platform: Literal['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Snapchat', 'TikTok'] = Field(..., description="Most used social media platform")
    Purpose_Of_Use: Literal['Socializing', 'Networking', 'Entertainment', 'Information', 'Other'] = Field(..., description="Purpose of social media use")
    Avg_Daily_Usage_Hours: float = Field(..., ge=0, le=24, description="Average daily usage hours of social media")
    Daily_Unlocks: int = Field(..., ge=0, description="Number of times the phone is unlocked daily")
    Study_Hours: int = Field(..., ge=0, description="Number of study hours per day")
    Physical_Activity_Hours: int = Field(..., ge=0, description="Number of physical activity hours per day")
    Sleep_Hours_Per_Night: float = Field(..., ge=0, le=24, description="Number of sleep hours per night")
    Stress_Level: Literal['Low', 'Medium', 'High', 'Very High', 'Too High'] = Field(..., description="Stress level of the individual")

class PredictionResponse(BaseModel):
    predicted_score: float = Field(..., description="Predicted mental health score")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Mental Health Prediction API!"}

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictionInput):
    # Handle the custom country grouping logic
    grouped_country = data.Country if data.Country in top_countries else 'Other'
    mapped_stress = 'Very High' if data.Stress_Level == 'Too High' else data.Stress_Level
    
    # Build the input dictionary matching pipeline column expectations
    input_dict = {
        'Age': data.Age,
        'Gender': data.Gender,
        'Grouped_countries': grouped_country,
        'Academic_Level': data.Academic_Level,
        'Most_Used_Platform': data.Most_Used_Platform,
        'Purpose_Of_Use': data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours': data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks': data.Daily_Unlocks,
        'Study_Hours': data.Study_Hours,
        'Physical_Activity_Hours': data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night': data.Sleep_Hours_Per_Night,
        'Stress_Level': mapped_stress
    }
    
    # Convert the dictionary to a Pandas DataFrame for the model pipeline
    input_df = pd.DataFrame([input_dict])
    
    # Run the prediction
    prediction = model.predict(input_df)[0]
    
    return PredictionResponse(predicted_score=float(prediction))