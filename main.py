from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Enable CORS so frontend (localhost:3000) can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:3000"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load districts data
df = pd.read_csv("pakistan_districts.csv")

@app.get("/")
def home():
    return {"message": "Backend is running"}

@app.get("/districts")
def get_all_districts():
    return df.to_dict(orient="records")

@app.get("/districts/{province}")
def get_districts_by_province(province: str):
    filtered = df[df["province"].str.lower() == province.lower()]
    return filtered.to_dict(orient="records")
