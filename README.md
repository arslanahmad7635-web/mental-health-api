# 🧠 Mental Health & Social Media Predictor API🚀

> A production-ready FastAPI backend serving a machine learning pipeline to predict mental health scores based on demographics, lifestyle habits, and social media usage. ✨

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Pipeline-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)](https://github.com/arslanahmad7635-web/mental-health-api)

---

📖 About The Project

As part of my continuous learning journey in data science and machine learning, I wanted to bridge the gap between static Jupyter notebooks and real-world applications. This project takes a trained Scikit-Learn pipeline (`Mental_Health_Predict.pkl`), wraps it inside a high-performance **FastAPI** web service with strict Pydantic validation, and prepares it for seamless integration with modern frontend interfaces.

---

🛠️ Tech Stack & Tools

* **Backend Framework:** ⚡ Python, FastAPI, Uvicorn
* **Data Processing & ML:** 🐼 Pandas, NumPy, Scikit-Learn (Pipelines, ColumnTransformers, OneHotEncoder)
* **Validation & Types:** 🛡️ Pydantic (Custom Literal fields and bounds)
* **Serialization:** 📦 Joblib
* **Version Control & Hosting:** 🐙 Git, GitHub, Render

---

⚙️ Core Features

* **Strict Input Validation:** 🛑 Type checking and value constraints for user inputs (age limits, daily hour caps, and predefined categorical values).
* **Smart Data Preprocessing:** 🗺️ Automated country grouping that maps core regions (like Pakistan 🇵🇰, USA, India, etc.) into designated categories while grouping others into `'Other'`.
* **CORS Middleware Enabled:** 🌐 Ready to communicate smoothly with React/Vite frontends running on different ports.
* **Interactive Documentation:** 📑 Auto-generated Swagger UI (`/docs`) for quick browser-based testing.

---

📁 Project Structure

```text
Mental_Health_predictor/
│
├── main.py                  # FastAPI application & prediction endpoint
├── Mental_Health_Predict.pkl# Serialized Scikit-Learn machine learning pipeline
├── requirements.txt         # Project dependencies for cloud deployment
└── README.md                # Project documentation

💻 Getting Started LocallyClone the RepositoryBashgit clone [https://github.com/arslanahmad7635-web/mental-health-api.git](https://github.com/arslanahmad7635-web/mental-health-api.git)
cd mental-health-api
Install DependenciesBashpip install -r requirements.txt
Run the Development ServerBashpython -m uvicorn main:app --reload
Test the APIOpen your browser and visit:Interactive Docs: http://127.0.0.1:8000/docsRoot Message: http://127.0.0.1:8000/

🧪 Example Test PayloadPaste this JSON payload directly into the /docs POST request body tester:JSON{
  "Age": 20,
  "Gender": "Male",
  "Country": "Pakistan",
  "Academic_Level": "Undergraduate",
  "Most_Used_Platform": "LinkedIn",
  "Purpose_Of_Use": "Networking",
  "Avg_Daily_Usage_Hours": 2.5,
  "Daily_Unlocks": 30,
  "Study_Hours": 4,
  "Physical_Activity_Hours": 2,
  "Sleep_Hours_Per_Night": 8.0,
  "Stress_Level": "Low"
}

🌐 Cloud Deployment (Render)
Link your GitHub repository to Render as a Web Service.
Set the Build Command to:Bashpip install -r requirements.txt
Set the Start Command to:Bashuvicorn main:app --host 0.0.0.0 --port $PORT
