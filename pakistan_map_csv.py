import time
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

# ✅ Master list of all Pakistan districts (as of 2023–24)
pakistan_districts = {
    "Punjab": [
        "Attock", "Bahawalnagar", "Bahawalpur", "Bhakkar", "Chakwal", "Chiniot",
        "Dera Ghazi Khan", "Faisalabad", "Gujranwala", "Gujrat", "Hafizabad",
        "Jhang", "Jhelum", "Kasur", "Khanewal", "Khushab", "Lahore", "Layyah",
        "Lodhran", "Mandi Bahauddin", "Mianwali", "Multan", "Muzaffargarh",
        "Nankana Sahib", "Narowal", "Okara", "Pakpattan", "Rahim Yar Khan",
        "Rajanpur", "Rawalpindi", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot",
        "Toba Tek Singh", "Vehari", "Talagang", "Murree", "Taunsa", "Kot Addu", "Wazirabad"
    ],
    "Sindh": [
        "Badin", "Dadu", "Ghotki", "Hyderabad", "Jacobabad", "Jamshoro", "Karachi Central",
        "Karachi East", "Karachi South", "Karachi West", "Kashmore", "Keamari", "Khairpur",
        "Korangi", "Larkana", "Malir", "Matiari", "Mirpur Khas", "Naushahro Feroze",
        "Qambar Shahdadkot", "Sanghar", "Shaheed Benazirabad", "Shikarpur", "Sujawal",
        "Sukkur", "Tando Allahyar", "Tando Muhammad Khan", "Tharparkar", "Thatta", "Umerkot"
    ],
    "Khyber Pakhtunkhwa": [
        "Abbottabad", "Allai", "Battagram", "Haripur", "Kolai Palas", "Torghar",
        "Upper Kohistan", "Lower Kohistan", "Mansehra", "Hangu", "Karak", "Kohat",
        "Kurram", "Orakzai", "Bannu", "Lakki Marwat", "North Waziristan", "Khyber",
        "Mohmand", "Nowshera", "Peshawar", "Charsadda", "Dera Ismail Khan",
        "Upper South Waziristan", "Lower South Waziristan", "Tank", "Mardan", "Swabi",
        "Upper Chitral", "Upper Dir", "Lower Chitral", "Lower Dir", "Malakand",
        "Shangla", "Swat", "Bajaur", "Buner", "Central Dir District"
    ],
    "Balochistan": [
        "Awaran", "Hub", "Lasbela", "Surab", "Mastung", "Khuzdar", "Kalat", "Chaman",
        "Pishin", "Quetta", "Qila Abdullah", "Sohbatpur", "Nasirabad", "Usta Muhammad",
        "Jafarabad", "Jhal Magsi", "Kachhi", "Chagai", "Washuk", "Kharan", "Nushki",
        "Ziarat", "Harnai", "Kohlu", "Dera Bugti", "Sibi", "Barkhan", "Duki",
        "Musakhel", "Loralai", "Panjgur", "Gwadar", "Kech", "Zhob", "Qilla Saifullah", "Sherani"
    ],
    "Azad Jammu and Kashmir": [
        "Muzaffarabad", "Hattian Bala", "Neelam Valley", "Mirpur", "Bhimber",
        "Kotli", "Poonch", "Bagh", "Haveli", "Sudhanoti"
    ],
    "Gilgit-Baltistan": [
        "Ghanche", "Skardu", "Roundu", "Kharmang", "Shigar", "Astore", "Diamer",
        "Darel", "Tangir", "Ghizer", "Nagar", "Gupis–Yasin", "Gilgit", "Hunza"
    ],
    "Islamabad Capital Territory": ["Islamabad"]
}

def main():
    # Setup geocoder
    geolocator = Nominatim(user_agent="PakistanDistricts/1.0", timeout=10)
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

    results = []

    for province, districts in pakistan_districts.items():
        for district in districts:
            query = f"{district}, {province}, Pakistan"
            try:
                location = geocode(query)
                if location:
                    lat, lon, status = location.latitude, location.longitude, "ok"
                else:
                    lat, lon, status = None, None, "not_found"
            except Exception as e:
                lat, lon, status = None, None, f"error:{e}"

            print(f"{district} ({province}) -> {status}")
            results.append({
                "district": district,
                "province": province,
                "latitude": lat,
                "longitude": lon,
                "status": status
            })

            time.sleep(0.5)  # prevent overload

    # Save to CSV
    df = pd.DataFrame(results)
    df.to_csv("pakistan_districts.csv", index=False, encoding="utf-8")
    print("✅ Saved pakistan_districts.csv with", len(df), "rows.")

if __name__ == "__main__":
    main()

