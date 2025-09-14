import pandas as pd

# Path to your existing CSV
csv_file = "pakistan_districts.csv"

# Load existing CSV
df = pd.read_csv(csv_file)

# Districts to add
missing_districts = [
    {"district": "Qambar Shahdadkot", "province": "Sindh", "latitude": 27.5848, "longitude": 67.9536, "status": "manual"},
    {"district": "Washuk", "province": "Balochistan", "latitude": 27.6911, "longitude": 65.2833, "status": "manual"},
    {"district": "Duki", "province": "Balochistan", "latitude": 30.1531, "longitude": 68.5706, "status": "manual"},
    {"district": "Musakhel", "province": "Balochistan", "latitude": 30.8586, "longitude": 69.8222, "status": "manual"},
    {"district": "Sherani", "province": "Balochistan", "latitude": 32.3036, "longitude": 69.6811, "status": "manual"},
]

# Convert to DataFrame
missing_df = pd.DataFrame(missing_districts)

# Merge with existing data (avoiding duplicates just in case)
updated_df = pd.concat([df, missing_df]).drop_duplicates(subset=["district"], keep="last")

# Save back to CSV
updated_df.to_csv(csv_file, index=False)

print(f"✅ Added {len(missing_districts)} missing districts. Total rows now: {len(updated_df)}")
