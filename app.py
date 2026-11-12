from flask import Flask, jsonify, request, send_from_directory
import requests
import csv
import io
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from azure.data.tables import TableServiceClient

app = Flask(__name__, static_folder=".", static_url_path="")
load_dotenv()

connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

table_service = TableServiceClient.from_connection_string(
    conn_str=connection_string
)

table_client = table_service.get_table_client(
    table_name="WeatherRecords"
)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

def save_weather_record(city, temperature, humidity, wind_speed):
    try:
        from datetime import datetime, timezone
        from uuid import uuid4

        entity = {
            "PartitionKey": city.replace(" ", ""),
            "RowKey": str(uuid4()),
            "City": city,
            "Temperature": float(temperature),
            "Humidity": int(humidity),
            "WindSpeed": float(wind_speed),
            "RecordedAt": datetime.now(timezone.utc).isoformat()
        }

        table_client.create_entity(entity=entity)
        print("Weather record saved to Azure!")
        return True

    except Exception as e:
        print("Azure storage error:", e)
        return False

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/<path:page>")
def serve_page(page):
    # Only serve local project files; API routes are matched before this route.
    if page.endswith(".html"):
        return send_from_directory(".", page)
    return send_from_directory(".", page)

@app.get("/api/geocode")
def geocode():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "Please enter a city name."}), 400
    try:
        response = requests.get(
            GEOCODING_URL,
            params={"name": name, "count": 8, "language": "en", "format": "json"},
            timeout=15
        )
        response.raise_for_status()
        data = response.json()
        return jsonify({"results": data.get("results", [])})
    except requests.RequestException:
        return jsonify({"error": "Could not search for this location right now."}), 502

@app.get("/api/weather")
def weather():
    try:
        lat = float(request.args.get("latitude", "17.3850"))
        lon = float(request.args.get("longitude", "78.4867"))
    except ValueError:
        return jsonify({"error": "Latitude and longitude must be numbers."}), 400
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return jsonify({"error": "Coordinates are out of range."}), 400

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,apparent_temperature,cloud_cover",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max",
        "timezone": "auto",
        "forecast_days": 7
    }
   
    try:
        response = requests.get(WEATHER_URL, params=params, timeout=20)
        response.raise_for_status()

        data = response.json()
        current = data.get("current", {})
        city = request.args.get("city", "Unknown")

        if current:
            save_weather_record(
                city,
                current.get("temperature_2m", 0),
                current.get("relative_humidity_2m", 0),
                current.get("wind_speed_10m", 0)
            )

        return jsonify(data)

    except requests.RequestException:
        return jsonify({"error": "Unable to retrieve weather data from the weather provider."}), 502


@app.get("/api/history")
def history():
    try:
        lat = float(request.args.get("latitude", "17.3850"))
        lon = float(request.args.get("longitude", "78.4867"))
        start = request.args.get("start", datetime.now().strftime("%Y-%m-%d"))
        end = request.args.get("end", datetime.now().strftime("%Y-%m-%d"))
        datetime.strptime(start, "%Y-%m-%d")
        datetime.strptime(end, "%Y-%m-%d")
        if start > end:
            return jsonify({"error": "Start date must be on or before end date."}), 400
    except ValueError:
        return jsonify({"error": "Enter valid coordinates and dates (YYYY-MM-DD)."}), 400

    params = {
        "latitude": lat, "longitude": lon,
        "start_date": start, "end_date": end,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
        "timezone": "auto"
    }
    try:
        response = requests.get(ARCHIVE_URL, params=params, timeout=20)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException:
        return jsonify({"error": "Historical data is unavailable for that date range right now."}), 502

@app.get("/api/records")
def get_records():
    try:
        entities = table_client.list_entities()

        records = []

        for entity in entities:
            records.append({
                "City": entity.get("City"),
                "Temperature": entity.get("Temperature"),
                "Humidity": entity.get("Humidity"),
                "WindSpeed": entity.get("WindSpeed"),
                "RecordedAt": entity.get("RecordedAt")
            })

        records.sort(
            key=lambda record: record.get("RecordedAt") or "",
            reverse=True
        )

        return jsonify(records)

    except Exception as e:
        print("Azure records error:", e)
        return jsonify({
            "error": "Unable to retrieve Azure weather records."
        }), 500

@app.get("/api/export")
def export_records():
    # Demo CSV export based on a fresh provider response; persistent records will be added with Azure Storage.
    lat = request.args.get("latitude", "17.3850")
    lon = request.args.get("longitude", "78.4867")
    try:
        response = requests.get(
            WEATHER_URL,
            params={
                "latitude": lat, "longitude": lon,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
                "timezone": "auto", "forecast_days": 7
            },
            timeout=20
        )
        response.raise_for_status()
        daily = response.json().get("daily", {})
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["date", "max_temperature_c", "min_temperature_c", "precipitation_mm", "max_wind_speed_kmh"])
        for i, day in enumerate(daily.get("time", [])):
            writer.writerow([
                day,
                (daily.get("temperature_2m_max") or [None] * len(daily.get("time", [])))[i],
                (daily.get("temperature_2m_min") or [None] * len(daily.get("time", [])))[i],
                (daily.get("precipitation_sum") or [None] * len(daily.get("time", [])))[i],
                (daily.get("wind_speed_10m_max") or [None] * len(daily.get("time", [])))[i]
            ])
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": 'attachment; filename="weather_records.csv"'}
        )
    except requests.RequestException:
        return jsonify({"error": "Could not export weather records right now."}), 502

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
