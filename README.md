Pakistan Map District Guessing Game 🎯🗺️

An interactive district guessing game for Pakistan, built with React (frontend) and FastAPI (backend).
Players can test their knowledge by typing district names — correct guesses appear on the map in real-time.

Screenshots of UI

<img width="1366" height="620" alt="Screenshot (216)" src="https://github.com/user-attachments/assets/f1dd87c6-442e-4d5a-ac00-a20a30fa205d" />



<img width="1366" height="622" alt="Screenshot (217)" src="https://github.com/user-attachments/assets/6a3d8c84-96af-475b-bf20-8b72d626222d" />



<img width="1366" height="620" alt="Screenshot (218)" src="https://github.com/user-attachments/assets/59cc93cf-007c-42ad-a01f-823db3d4b06d" />



🚀 Features

🗺️ Interactive Pakistan map with provinces and districts.

📝 Type a district name to guess — correct ones show up in red on the map.

📊 Score tracking (guessed vs total districts).

🌍 Select individual provinces or play across All Pakistan.

🏳️ Give Up mode to reveal all missed districts.

⚡ Preprocessed GeoJSON & CSV data for clean map rendering.

🔗 Backend powered by FastAPI with CORS support for frontend communication.

📂 Project Structure
Pakistans Map/
│── .venv/                         # Virtual environment
│── csv/                           # Raw data
│   ├── pakistan_districts.csv
│   └── pakistan_provinces.json
│
│── frontend/                      # React frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── pakistan_districts_clean.csv
│   │   ├── pakistan_provinces_clean.json
│   │   └── ...
│   ├── src/
│   │   ├── App.js
│   │   ├── PakistanMap.js
│   │   ├── PakistanMap.css
│   │   └── ...
│   ├── package.json
│   └── ...
│
│── scripts/                       # Node.js preprocessing scripts
│   └── preprocess_data.js
│
│── main.py                        # FastAPI backend
│── pakistan_map_csv.py            # CSV preprocessing (Python - automated geocoding)
│── pakistan_map_manual_district_csv.py # Adds missing districts manually
│── package.json                   # Root Node.js config
│── package-lock.json
│── README.md                      # Documentation

⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/rajaanastariq/Pakistan-Map-District-Game.git
cd Pakistan-Map-District-Game

2️⃣ Frontend (React) Setup
cd frontend
npm install
npm start


👉 Runs the React app on http://localhost:3000.

3️⃣ Backend (FastAPI) Setup

Create a virtual environment and install dependencies:

python -m venv .venv
source .venv/bin/activate   # (Linux/Mac)
.venv\Scripts\activate      # (Windows)

pip install fastapi uvicorn pandas geopy


Run backend:

uvicorn main:app --reload


👉 Runs the API on http://127.0.0.1:8000.

4️⃣ Data Preprocessing

With Node.js script (merges FATA → KPK, removes Islamabad, produces clean GeoJSON & CSV):

cd scripts
node preprocess_data.js


With Python script (fetches district lat/long using Geopy):

python pakistan_map_csv.py
python pakistan_map_manual_district_csv.py


👉 Outputs cleaned data into frontend/public/ for React to use.

🕹️ How to Play

Open the frontend (http://localhost:3000).

Choose All Pakistan or a specific province.

Start typing district names in the input box.

✅ Correct guesses appear on the map with red labels.

❌ Click Give Up to see all missed districts.

🛠️ Tech Stack

Frontend: React, React-Leaflet, Papaparse

Backend: FastAPI, Uvicorn

Data Processing: Node.js, Python (pandas, geopy)

Map Data: GeoJSON & CSV (custom cleaned)

📜 License
Author : Raja Anas Tariq
This project is open-source and available under the MIT License.
