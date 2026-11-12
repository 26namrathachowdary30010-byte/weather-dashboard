SKYWATCH WEATHER MONITORING DASHBOARD — STARTER PROJECT

WHAT IS INCLUDED
- index.html: Live weather dashboard (home page)
- analytics.html: Historical charts for temperature, rainfall, and wind
- locations.html: Compare multiple cities and set a main city
- records.html: Historical weather table and CSV export
- app.py: Flask backend / API proxy
- common.js, styles.css: Shared navigation, helpers, and visual styling
- dashboard.js, analytics.js, locations.js, records.js: Page behavior

REQUIREMENTS
- Python 3.10 or newer recommended
- Internet connection
- VS Code is recommended but not mandatory

RUN ON WINDOWS
1. Extract this ZIP into a folder, for example Desktop\weather_dashboard_full.
2. Open that extracted folder in VS Code.
3. Open Terminal > New Terminal.
4. Run:
   python -m venv .venv
   .venv\Scripts\activate
   python -m pip install flask requests
   python app.py
5. Open http://127.0.0.1:5000 in your browser.
6. Keep the terminal running while using the website.

IMPORTANT
- Do NOT open index.html by double-clicking it. Use the local Flask address above.
- Use the shared navigation bar to switch pages.
- City selection and the monitored-city list are saved in this browser using localStorage.
- Current and historical weather are fetched live through Open-Meteo.
- CSV export currently exports a 7-day forecast, not the filtered historical table.
- No Azure storage is connected yet. The next phase will add Azure Table Storage and deployment to Azure App Service.
- Chart.js and Google Fonts are loaded from external CDNs, so an internet connection is needed.
