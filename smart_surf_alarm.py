#!/usr/bin/env python3
"""
Smart Surf Alarm - 5-day forecast checker.
Runs daily at 4AM, checks 5-day forecast for each user's beach,
and alerts only when NEW good days appear on the horizon.
"""

import os
import json
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests

# =============================================================================
# CONFIGURATION
# =============================================================================

WILLYWEATHER_API_KEY = os.environ.get("WILLYWEATHER_API_KEY", "YOUR_API_KEY_HERE")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "YOUR_RESEND_API_KEY")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "alerts@swellcheck.co")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

BASE_URL = "https://api.willyweather.com.au/v2"

FORECAST_DAYS = 5

# =============================================================================
# BEACH DATA - Wind direction ranges (matches webapp/src/data/beaches.ts)
# =============================================================================

BEACHES = {
    18159: {
        "name": "Noosa Main Beach",
        "offshoreRange": (135, 225),
        "crossShoreRange": [(90, 135), (225, 270)],
        "onshoreRange": (270, 90),
    },
    18156: {
        "name": "Maroochydore Beach",
        "offshoreRange": (225, 315),
        "crossShoreRange": [(180, 225), (315, 360)],
        "onshoreRange": (0, 180),
    },
    5956: {
        "name": "Burleigh Heads",
        "offshoreRange": (180, 270),
        "crossShoreRange": [(135, 180), (270, 315)],
        "onshoreRange": (315, 135),
    },
    5972: {
        "name": "Currumbin",
        "offshoreRange": (155, 245),
        "crossShoreRange": [(110, 155), (245, 290)],
        "onshoreRange": (290, 110),
    },
    18118: {
        "name": "Coolangatta Beach",
        "offshoreRange": (135, 225),
        "crossShoreRange": [(90, 135), (225, 270)],
        "onshoreRange": (270, 90),
    },
    19017: {
        "name": "Byron Bay Beach",
        "offshoreRange": (135, 225),
        "crossShoreRange": [(90, 135), (225, 270)],
        "onshoreRange": (270, 90),
    },
    3736: {
        "name": "Coffs Harbour",
        "offshoreRange": (225, 315),
        "crossShoreRange": [(180, 225), (315, 360)],
        "onshoreRange": (0, 180),
    },
    17641: {
        "name": "Newcastle Beach",
        "offshoreRange": (225, 315),
        "crossShoreRange": [(180, 225), (315, 360)],
        "onshoreRange": (0, 180),
    },
    17814: {
        "name": "Manly Beach",
        "offshoreRange": (225, 315),
        "crossShoreRange": [(180, 225), (315, 360)],
        "onshoreRange": (0, 180),
    },
    4988: {
        "name": "Bondi Beach",
        "offshoreRange": (225, 315),
        "crossShoreRange": [(180, 225), (315, 360)],
        "onshoreRange": (0, 180),
    },
    3168: {
        "name": "Cronulla",
        "offshoreRange": (245, 335),
        "crossShoreRange": [(200, 245), (335, 20)],
        "onshoreRange": (20, 200),
    },
    13364: {
        "name": "Torquay Surf Beach",
        "offshoreRange": (315, 45),
        "crossShoreRange": [(270, 315), (45, 90)],
        "onshoreRange": (90, 270),
    },
    11642: {
        "name": "Bells Beach",
        "offshoreRange": (270, 360),
        "crossShoreRange": [(225, 270), (0, 45)],
        "onshoreRange": (45, 225),
    },
    19298: {
        "name": "13th Beach",
        "offshoreRange": (315, 45),
        "crossShoreRange": [(270, 315), (45, 90)],
        "onshoreRange": (90, 270),
    },
    13591: {
        "name": "Cape Woolamai",
        "offshoreRange": (335, 65),
        "crossShoreRange": [(290, 335), (65, 110)],
        "onshoreRange": (110, 290),
    },
    13866: {
        "name": "Portsea Back Beach",
        "offshoreRange": (335, 65),
        "crossShoreRange": [(290, 335), (65, 110)],
        "onshoreRange": (110, 290),
    },
    19555: {
        "name": "Scarborough Beach",
        "offshoreRange": (45, 135),
        "crossShoreRange": [(0, 45), (135, 180)],
        "onshoreRange": (180, 0),
    },
    18919: {
        "name": "Trigg Beach",
        "offshoreRange": (45, 135),
        "crossShoreRange": [(0, 45), (135, 180)],
        "onshoreRange": (180, 0),
    },
    15258: {
        "name": "Margaret River",
        "offshoreRange": (65, 155),
        "crossShoreRange": [(20, 65), (155, 200)],
        "onshoreRange": (200, 20),
    },
    19399: {
        "name": "South Port",
        "offshoreRange": (25, 115),
        "crossShoreRange": [(340, 25), (115, 160)],
        "onshoreRange": (160, 340),
    },
    10135: {
        "name": "Middleton",
        "offshoreRange": (315, 45),
        "crossShoreRange": [(270, 315), (45, 90)],
        "onshoreRange": (90, 270),
    },
}

COMPASS_TO_DEGREES = {
    "N": 0, "NNE": 22.5, "NE": 45, "ENE": 67.5,
    "E": 90, "ESE": 112.5, "SE": 135, "SSE": 157.5,
    "S": 180, "SSW": 202.5, "SW": 225, "WSW": 247.5,
    "W": 270, "WNW": 292.5, "NW": 315, "NNW": 337.5,
}

# Beach timezone mapping
BEACH_TIMEZONES = {
    "QLD": "Australia/Brisbane",
    "NSW": "Australia/Sydney",
    "VIC": "Australia/Melbourne",
    "WA": "Australia/Perth",
    "SA": "Australia/Adelaide",
}

BEACH_STATES = {
    18159: "QLD", 18156: "QLD", 5956: "QLD", 5972: "QLD", 18118: "QLD",
    19017: "NSW", 3736: "NSW", 17641: "NSW", 17814: "NSW", 4988: "NSW", 3168: "NSW",
    13364: "VIC", 11642: "VIC", 19298: "VIC", 13591: "VIC", 13866: "VIC",
    19555: "WA", 18919: "WA", 15258: "WA",
    19399: "SA", 10135: "SA",
}


def get_beach_tz(beach_id: int) -> ZoneInfo:
    state = BEACH_STATES.get(beach_id, "QLD")
    return ZoneInfo(BEACH_TIMEZONES[state])


# =============================================================================
# SUPABASE
# =============================================================================

def _supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def get_active_users() -> list:
    """Fetch all active users from Supabase."""
    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY not set")
        return []

    url = f"{SUPABASE_URL}/rest/v1/users"
    params = {"is_active": "eq.true", "select": "*"}

    try:
        response = requests.get(url, headers=_supabase_headers(), params=params)
        response.raise_for_status()
        users = response.json()
        print(f"  Fetched {len(users)} active user(s) from Supabase")
        return users
    except Exception as e:
        print(f"  Error fetching users: {e}")
        return []


def get_alerted_dates(user_id: str) -> list:
    """Get the list of dates already alerted for this user."""
    url = f"{SUPABASE_URL}/rest/v1/users"
    params = {"id": f"eq.{user_id}", "select": "alerted_dates"}

    try:
        response = requests.get(url, headers=_supabase_headers(), params=params)
        response.raise_for_status()
        rows = response.json()
        if rows and rows[0].get("alerted_dates"):
            return rows[0]["alerted_dates"]
    except Exception as e:
        print(f"    Warning: Could not fetch alerted_dates: {e}")
    return []


def save_alerted_dates(user_id: str, dates: list):
    """Save the updated list of alerted dates for a user."""
    url = f"{SUPABASE_URL}/rest/v1/users"
    headers = {**_supabase_headers(), "Prefer": "return=minimal"}
    params = {"id": f"eq.{user_id}"}

    # Keep only dates in the future or recent past (last 7 days) to avoid unbounded growth
    cutoff = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    clean_dates = [d for d in dates if d >= cutoff]

    try:
        requests.patch(url, headers=headers, params=params, json={
            "alerted_dates": clean_dates,
            "last_alert_at": datetime.utcnow().isoformat(),
        })
    except Exception as e:
        print(f"    Warning: Could not save alerted_dates: {e}")


# =============================================================================
# WILLYWEATHER API
# =============================================================================

def get_forecast(location_id: int, days: int = 5) -> dict:
    """Get swell, tide graph, and wind forecast for a location."""
    url = f"{BASE_URL}/{WILLYWEATHER_API_KEY}/locations/{location_id}/weather.json"

    params = {
        "forecasts": "swell,tides,wind",
        "forecastGraphs": "tides",
        "days": days,
        "startDate": datetime.utcnow().strftime("%Y-%m-%d"),
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


# =============================================================================
# WIND DIRECTION LOGIC
# =============================================================================

def compass_to_degrees(direction: str) -> float:
    return COMPASS_TO_DEGREES.get(direction.upper(), -1)


def is_in_range(degrees: float, range_tuple: tuple) -> bool:
    start, end = range_tuple
    if start <= end:
        return start <= degrees <= end
    else:
        return degrees >= start or degrees <= end


def classify_wind_direction(degrees: float, beach_id: int) -> str:
    beach = BEACHES.get(beach_id)
    if not beach:
        return "unknown"

    if is_in_range(degrees, beach["offshoreRange"]):
        return "offshore"

    for cross_range in beach["crossShoreRange"]:
        if is_in_range(degrees, cross_range):
            return "cross_shore"

    return "onshore"


def is_good_wind_for_user(wind: dict, user: dict, beach_id: int) -> tuple:
    speed = wind.get("speed", 999)
    direction = wind.get("direction", "")

    degrees = compass_to_degrees(direction)
    if degrees < 0:
        return False, "unknown", f"Unknown wind direction: {direction}"

    wind_type = classify_wind_direction(degrees, beach_id)

    if wind_type == "offshore":
        max_speed = user.get("offshore_max_wind", 25)
        type_label = "Offshore"
    elif wind_type == "cross_shore":
        max_speed = user.get("cross_shore_max_wind", 10)
        type_label = "Cross-shore"
    else:
        max_speed = user.get("onshore_max_wind", 5)
        type_label = "Onshore"

    # Allow 20% tolerance to account for forecast inaccuracy
    tolerance_max = max_speed * 1.2

    if speed <= max_speed:
        return True, wind_type, f"{type_label}: {speed} km/h {direction}"
    elif speed <= tolerance_max:
        return True, wind_type, f"{type_label}: {speed} km/h {direction} (within 20% tolerance of {max_speed})"
    else:
        return False, wind_type, f"{type_label}: {speed} km/h {direction} exceeds max {max_speed}"


# =============================================================================
# FORECAST EVALUATION
# =============================================================================

def build_tide_timeline(forecast: dict) -> list:
    """
    Build a tide height timeline from forecastGraphs (interpolated) data,
    falling back to plain forecast tide events.
    """
    tide_points = []

    # Try forecastGraphs first (interpolated continuous data)
    graph_data = forecast.get("forecastGraphs", {}).get("tides", {})
    if graph_data:
        for day in graph_data.get("dataConfig", {}).get("series", {}).get("groups", []):
            for point in day.get("points", []):
                tide_points.append({
                    "dt_str": None,
                    "x": point.get("x"),
                    "height": point.get("y"),
                })
        if tide_points:
            return tide_points

    # Fallback: use forecast tide events (high/low only)
    for day in forecast.get("forecasts", {}).get("tides", {}).get("days", []):
        for entry in day.get("entries", []):
            tide_points.append({
                "dt_str": entry.get("dateTime"),
                "height": entry.get("height", 0),
                "type": entry.get("type"),
            })

    return tide_points


def get_tide_at_time(tide_points: list, target_dt: datetime, tz: ZoneInfo) -> float:
    """Interpolate tide height at a given time from tide data points."""
    if not tide_points:
        return None

    # If we have graph data with x timestamps
    if tide_points[0].get("x") is not None:
        target_ts = target_dt.timestamp()
        best = None
        best_diff = float("inf")
        for p in tide_points:
            diff = abs(p["x"] - target_ts)
            if diff < best_diff:
                best_diff = diff
                best = p["height"]
        return best

    # Fallback: find closest tide event by datetime string
    best = None
    best_diff = float("inf")
    for p in tide_points:
        try:
            pdt = datetime.strptime(p["dt_str"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz)
            diff = abs((pdt - target_dt).total_seconds())
            if diff < best_diff:
                best_diff = diff
                best = p["height"]
        except (ValueError, TypeError):
            continue

    return best


def evaluate_forecast(forecast: dict, user: dict, beach_id: int) -> list:
    """
    Evaluate 5-day forecast and return list of good dates with details.
    Each entry: { "date": "YYYY-MM-DD", "windows": [...] }
    """
    tz = get_beach_tz(beach_id)
    forecasts = forecast.get("forecasts", {})

    min_swell = user.get("min_swell", 1.0)
    max_swell = user.get("max_swell", 3.0)
    min_tide = user.get("min_tide", 0)
    max_tide = user.get("max_tide", 2.0)
    start_hour = user.get("start_hour", 5)
    end_hour = user.get("end_hour", 18)

    # Parse swell entries across all days
    swell_entries = []
    for day in forecasts.get("swell", {}).get("days", []):
        for entry in day.get("entries", []):
            swell_entries.append(entry)

    # Parse wind entries across all days
    wind_by_time = {}
    for day in forecasts.get("wind", {}).get("days", []):
        for entry in day.get("entries", []):
            wind_by_time[entry["dateTime"]] = {
                "speed": entry.get("speed", 0),
                "direction": entry.get("directionText", ""),
            }

    # Build tide timeline
    tide_points = build_tide_timeline(forecast)

    # Evaluate each swell entry
    good_days = {}  # date_str -> { windows: [...] }

    for entry in swell_entries:
        dt_str = entry.get("dateTime")
        swell_height = entry.get("height", 0)

        try:
            dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz)
        except (ValueError, TypeError):
            continue

        # Check user's preferred hours
        if dt.hour < start_hour or dt.hour >= end_hour:
            continue

        # Check swell range
        if not (min_swell <= swell_height <= max_swell):
            continue

        # Get tide height at this time
        tide_height = get_tide_at_time(tide_points, dt, tz)
        if tide_height is None:
            continue

        # Check tide range
        if not (min_tide <= tide_height <= max_tide):
            continue

        # Get wind at this time (exact or nearest)
        wind = wind_by_time.get(dt_str)
        if not wind:
            nearest_wind = None
            min_diff = float("inf")
            for wdt_str, wdata in wind_by_time.items():
                try:
                    wdt = datetime.strptime(wdt_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz)
                    diff = abs((wdt - dt).total_seconds())
                    if diff < min_diff:
                        min_diff = diff
                        nearest_wind = wdata
                except (ValueError, TypeError):
                    continue
            wind = nearest_wind or {"speed": 999, "direction": "N/A"}

        # Check wind
        is_good, wind_type, wind_reason = is_good_wind_for_user(wind, user, beach_id)
        if not is_good:
            continue

        # This time window is good!
        date_str = dt.strftime("%Y-%m-%d")
        if date_str not in good_days:
            good_days[date_str] = []

        good_days[date_str].append({
            "time": dt.strftime("%H:%M"),
            "swell": swell_height,
            "swell_period": entry.get("period", 0),
            "swell_dir": entry.get("directionText", ""),
            "tide": tide_height,
            "wind_speed": wind["speed"],
            "wind_dir": wind["direction"],
            "wind_type": wind_type,
        })

    return good_days


# =============================================================================
# EMAIL
# =============================================================================

def send_email(to_email: str, subject: str, body: str) -> bool:
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": EMAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "text": body,
            },
        )

        if response.status_code in (200, 201):
            print(f"    ✓ Email sent: {subject}")
            return True
        else:
            print(f"    ✗ Email failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"    ✗ Email error: {e}")
        return False


def format_forecast_email(user: dict, beach_name: str, good_days: dict, new_dates: list) -> tuple:
    """Format the 5-day forecast alert email."""
    tz = get_beach_tz(user.get("beach_id", 0))
    name = user.get("name", "Surfer")

    # Build subject with the dates
    date_labels = []
    for date_str in sorted(new_dates):
        dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=tz)
        date_labels.append(dt.strftime("%a %d %b"))

    if len(date_labels) == 1:
        subject = f"🏄 Surf window ahead! {beach_name} looks good on {date_labels[0]}"
    else:
        subject = f"🏄 Surf windows ahead! {beach_name} — {', '.join(date_labels)}"

    body = f"Hey {name}!\n\n"
    body += f"We've spotted good conditions coming up at {beach_name}.\n\n"

    for date_str in sorted(new_dates):
        dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=tz)
        body += f"{'=' * 44}\n"
        body += f"📅 {dt.strftime('%A %d %B %Y')}\n"
        body += f"{'=' * 44}\n\n"

        windows = good_days[date_str]

        # Show the best window (lowest wind, best swell)
        best = min(windows, key=lambda w: w["wind_speed"])

        # Show time range
        times = sorted(set(w["time"] for w in windows))
        if len(times) == 1:
            body += f"  ⏰ Best around {times[0]}\n"
        else:
            body += f"  ⏰ Good windows: {times[0]} – {times[-1]}\n"

        body += f"  🌊 Swell: {best['swell']:.1f}m"
        if best.get("swell_period"):
            body += f" @ {best['swell_period']:.0f}s"
        if best.get("swell_dir"):
            body += f" ({best['swell_dir']})"
        body += "\n"

        body += f"  🌊 Tide: {best['tide']:.2f}m\n"

        wind_label = {"offshore": "Offshore ✓", "cross_shore": "Cross-shore ~", "onshore": "Onshore"}
        body += f"  💨 Wind: {best['wind_speed']} km/h {best['wind_dir']}"
        body += f" — {wind_label.get(best['wind_type'], best['wind_type'])}\n"
        body += "\n"

    body += "—\n"
    body += f"Your thresholds:\n"
    body += f"  Swell: {user.get('min_swell', 1.0)}m – {user.get('max_swell', 3.0)}m\n"
    body += f"  Tide: {user.get('min_tide', 0):.1f}m – {user.get('max_tide', 2.0):.1f}m\n"
    body += f"  Offshore wind: up to {user.get('offshore_max_wind', 25)} km/h\n"
    body += f"  Cross-shore wind: up to {user.get('cross_shore_max_wind', 10)} km/h\n"
    body += f"  Onshore wind: up to {user.get('onshore_max_wind', 5)} km/h\n"
    body += f"  Hours: {user.get('start_hour', 5)}:00 – {user.get('end_hour', 18)}:00\n"
    body += "\n"
    body += "Update your settings: https://www.swellcheck.co/account\n\n"
    body += "This is an automated message. Please do not reply to this email.\n"

    return subject, body


# =============================================================================
# MAIN
# =============================================================================

def check_user_forecast(user: dict) -> bool:
    """
    Check 5-day forecast for a user. Alert only on NEW good dates
    that haven't been alerted before.
    """
    user_id = user.get("id")
    email = user.get("email")
    name = user.get("name", "Surfer")
    beach_id = user.get("beach_id")
    beach_name = user.get("beach_name", "Unknown Beach")

    if not beach_id:
        return False

    print(f"  Checking {name} ({email}) — {beach_name}...")

    try:
        forecast = get_forecast(beach_id, days=FORECAST_DAYS)

        # Get location timezone from API response if available
        location_tz_str = forecast.get("location", {}).get("timeZone")
        if location_tz_str:
            # Update for this run (more accurate than our mapping)
            pass

        good_days = evaluate_forecast(forecast, user, beach_id)

        if not good_days:
            print(f"    No good days in the next {FORECAST_DAYS} days")
            return False

        print(f"    Found good conditions on: {', '.join(sorted(good_days.keys()))}")

        # Check which dates are new (not yet alerted)
        previously_alerted = set(get_alerted_dates(user_id))
        new_dates = [d for d in sorted(good_days.keys()) if d not in previously_alerted]

        if not new_dates:
            print(f"    Already alerted for these dates — skipping")
            return False

        print(f"    NEW dates to alert: {', '.join(new_dates)}")

        # Send forecast email
        subject, body = format_forecast_email(user, beach_name, good_days, new_dates)

        if send_email(email, subject, body):
            # Save all good dates (new + old) as alerted
            all_alerted = list(previously_alerted | set(good_days.keys()))
            save_alerted_dates(user_id, all_alerted)
            return True

        return False

    except Exception as e:
        print(f"    Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_once():
    """Run a single check for all users (called by cron/scheduler)."""
    print("=" * 50)
    print(f"SWELLCHECK — {FORECAST_DAYS}-DAY FORECAST CHECK")
    print(f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print("=" * 50)

    if not WILLYWEATHER_API_KEY or WILLYWEATHER_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: WILLYWEATHER_API_KEY not set!")
        return

    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY not set!")
        return

    users = get_active_users()

    if not users:
        print("  No active users to check")
        return

    alerts_sent = 0
    for user in users:
        if check_user_forecast(user):
            alerts_sent += 1
        time.sleep(1)  # rate limit WillyWeather

    print(f"\nDone. Sent {alerts_sent} forecast alert(s) to {len(users)} user(s).")


def run_loop():
    """Run in a loop, checking daily at 4AM AEST."""
    print("SWELLCHECK — DAILY FORECAST LOOP")
    print(f"Will check at 4:00 AM AEST daily\n")

    aest = ZoneInfo("Australia/Brisbane")

    while True:
        now = datetime.now(aest)

        # Calculate next 4AM
        next_run = now.replace(hour=4, minute=0, second=0, microsecond=0)
        if now >= next_run:
            next_run += timedelta(days=1)

        wait_secs = (next_run - now).total_seconds()
        print(f"[{now.strftime('%H:%M:%S')}] Next check at {next_run.strftime('%Y-%m-%d %H:%M')} AEST ({wait_secs / 3600:.1f}h)")
        time.sleep(wait_secs)

        run_once()


def test_user(email: str):
    """Test mode — check a specific user's 5-day forecast."""
    print(f"Testing 5-day forecast for: {email}\n")

    users = get_active_users()
    user = next((u for u in users if u.get("email") == email), None)

    if not user:
        print(f"User not found: {email}")
        return

    print(f"User: {user.get('name')}")
    print(f"Beach: {user.get('beach_name')} (ID: {user.get('beach_id')})")
    print(f"Swell: {user.get('min_swell')}m – {user.get('max_swell')}m")
    print(f"Tide: {user.get('min_tide')}m – {user.get('max_tide')}m")
    print(f"Offshore wind: up to {user.get('offshore_max_wind')} km/h")
    print(f"Cross-shore wind: up to {user.get('cross_shore_max_wind')} km/h")
    print(f"Onshore wind: up to {user.get('onshore_max_wind')} km/h")
    print(f"Hours: {user.get('start_hour')}:00 – {user.get('end_hour')}:00")
    print(f"Previously alerted dates: {get_alerted_dates(user.get('id'))}")
    print()

    check_user_forecast(user)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "--test" and len(sys.argv) > 2:
            test_user(sys.argv[2])
        elif sys.argv[1] == "--once":
            run_once()
        elif sys.argv[1] == "--loop":
            run_loop()
        elif sys.argv[1] == "--test-email":
            print("Sending test email...")
            send_email(
                os.environ.get("TEST_EMAIL", "test@example.com"),
                "🏄 SwellCheck Test Email",
                f"Test email sent at {datetime.utcnow().isoformat()}\n\nYour surf alarm is working!"
            )
        else:
            print("Usage:")
            print("  python smart_surf_alarm.py --once             # Run single check now")
            print("  python smart_surf_alarm.py --loop             # Run daily at 4AM AEST")
            print("  python smart_surf_alarm.py --test <email>     # Test specific user")
            print("  python smart_surf_alarm.py --test-email       # Send test email")
    else:
        run_once()
