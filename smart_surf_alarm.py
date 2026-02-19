#!/usr/bin/env python3
"""
Smart Surf Alarm - Multi-user surf condition checker with per-beach wind logic.
Fetches user preferences from Supabase and sends personalized alerts via Resend.
"""

import os
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests

# Timezone for surf hours (AEST)
TIMEZONE = ZoneInfo("Australia/Brisbane")

# =============================================================================
# CONFIGURATION
# =============================================================================

WILLYWEATHER_API_KEY = os.environ.get("WILLYWEATHER_API_KEY", "YOUR_API_KEY_HERE")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "YOUR_RESEND_API_KEY")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "alerts@swellcheck.com")

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://edbdbpnkphybctejcvxl.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

BASE_URL = "https://api.willyweather.com.au/v2"

# =============================================================================
# BEACH DATA - Wind direction ranges (matches webapp/src/data/beaches.ts)
# =============================================================================

BEACHES = {
    # Queensland (QLD)
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
    # New South Wales (NSW)
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
    # Victoria (VIC)
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
    # Western Australia (WA)
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
    # South Australia (SA)
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

# Compass direction to degrees mapping
COMPASS_TO_DEGREES = {
    "N": 0, "NNE": 22.5, "NE": 45, "ENE": 67.5,
    "E": 90, "ESE": 112.5, "SE": 135, "SSE": 157.5,
    "S": 180, "SSW": 202.5, "SW": 225, "WSW": 247.5,
    "W": 270, "WNW": 292.5, "NW": 315, "NNW": 337.5,
}


# =============================================================================
# SUPABASE
# =============================================================================

def get_active_users() -> list:
    """Fetch all active users from Supabase."""
    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY not set")
        return []
    
    url = f"{SUPABASE_URL}/rest/v1/users"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    params = {
        "is_active": "eq.true",
        "select": "*",
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        users = response.json()
        print(f"  Fetched {len(users)} active user(s) from Supabase")
        return users
    except Exception as e:
        print(f"  Error fetching users: {e}")
        return []


def update_user_last_alert(user_id: str):
    """Update user's last_alert_at timestamp."""
    if not SUPABASE_KEY:
        return
    
    url = f"{SUPABASE_URL}/rest/v1/users"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    params = {"id": f"eq.{user_id}"}
    data = {"last_alert_at": datetime.now(TIMEZONE).isoformat()}
    
    try:
        requests.patch(url, headers=headers, params=params, json=data)
    except Exception as e:
        print(f"    Warning: Could not update last_alert_at: {e}")


# =============================================================================
# WILLYWEATHER API
# =============================================================================

def get_forecast(location_id: int, days: int = 1) -> dict:
    """Get swell, tide, and wind forecast for a location."""
    url = f"{BASE_URL}/{WILLYWEATHER_API_KEY}/locations/{location_id}/weather.json"
    
    params = {
        "forecasts": "swell,tides,wind",
        "days": days,
        "startDate": datetime.now().strftime("%Y-%m-%d"),
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


def get_wind_observations(location_id: int) -> dict:
    """Get current wind observations."""
    url = f"{BASE_URL}/{WILLYWEATHER_API_KEY}/locations/{location_id}/weather.json"
    params = {"observational": "true"}
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


# =============================================================================
# WIND DIRECTION LOGIC
# =============================================================================

def compass_to_degrees(direction: str) -> float:
    """Convert compass direction to degrees."""
    return COMPASS_TO_DEGREES.get(direction.upper(), -1)


def is_in_range(degrees: float, range_tuple: tuple) -> bool:
    """
    Check if degrees is within range, handling wrap-around at 360/0.
    Range is (start, end) where we go clockwise from start to end.
    """
    start, end = range_tuple
    
    if start <= end:
        # Normal range (e.g., 135 to 225)
        return start <= degrees <= end
    else:
        # Wrap-around range (e.g., 315 to 45 means 315-360 OR 0-45)
        return degrees >= start or degrees <= end


def classify_wind_direction(degrees: float, beach_id: int) -> str:
    """
    Classify wind direction as 'offshore', 'cross_shore', or 'onshore' for a beach.
    Returns the wind type string.
    """
    beach = BEACHES.get(beach_id)
    if not beach:
        return "unknown"
    
    # Check offshore first (ideal)
    if is_in_range(degrees, beach["offshoreRange"]):
        return "offshore"
    
    # Check cross-shore ranges
    for cross_range in beach["crossShoreRange"]:
        if is_in_range(degrees, cross_range):
            return "cross_shore"
    
    # Otherwise it's onshore
    return "onshore"


def is_good_wind_for_user(wind: dict, user: dict, beach_id: int) -> tuple:
    """
    Check if wind conditions are acceptable for a specific user.
    Returns (is_good: bool, wind_type: str, reason: str)
    """
    speed = wind.get("speed", 999)
    direction = wind.get("direction", "")
    
    # Convert compass to degrees
    degrees = compass_to_degrees(direction)
    if degrees < 0:
        return False, "unknown", f"Unknown wind direction: {direction}"
    
    # Classify the wind direction for this beach
    wind_type = classify_wind_direction(degrees, beach_id)
    
    # Get user's max wind speed for this wind type
    if wind_type == "offshore":
        max_speed = user.get("offshore_max_wind", 25)
        type_label = "Offshore (ideal)"
    elif wind_type == "cross_shore":
        max_speed = user.get("cross_shore_max_wind", 10)
        type_label = "Cross-shore (marginal)"
    else:  # onshore
        max_speed = user.get("onshore_max_wind", 5)
        type_label = "Onshore (avoid)"
    
    if speed <= max_speed:
        return True, wind_type, f"{type_label}: {speed} km/h {direction} (max: {max_speed})"
    else:
        return False, wind_type, f"{type_label}: {speed} km/h {direction} exceeds max {max_speed}"


# =============================================================================
# CONDITION CHECKING
# =============================================================================

def parse_forecast_windows(forecast: dict, user: dict) -> list:
    """
    Parse forecast data to find windows matching user's swell/tide preferences.
    Returns list of window dictionaries.
    """
    windows = []
    forecasts = forecast.get("forecasts", {})
    
    # User preferences
    min_swell = user.get("min_swell", 1.0)
    max_swell = user.get("max_swell", 3.0)
    min_tide = user.get("min_tide", 0)
    max_tide = user.get("max_tide", 2.0)
    start_hour = user.get("start_hour", 5)
    end_hour = user.get("end_hour", 18)
    
    # Parse swell data
    swell_data = {}
    for day in forecasts.get("swell", {}).get("days", []):
        for entry in day.get("entries", []):
            dt_str = entry.get("dateTime")
            swell_data[dt_str] = entry.get("height", 0)
    
    # Parse tide data
    tide_data = {}
    for day in forecasts.get("tides", {}).get("days", []):
        for entry in day.get("entries", []):
            dt_str = entry.get("dateTime")
            tide_data[dt_str] = entry.get("height", 0)
    
    # Parse wind forecast data
    wind_data = {}
    for day in forecasts.get("wind", {}).get("days", []):
        for entry in day.get("entries", []):
            dt_str = entry.get("dateTime")
            wind_data[dt_str] = {
                "speed": entry.get("speed", 0),
                "direction": entry.get("directionText", ""),
            }
    
    now = datetime.now(TIMEZONE)
    next_24h = now + timedelta(hours=24)
    
    for dt_str, swell_height in swell_data.items():
        try:
            dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            dt = dt.replace(tzinfo=TIMEZONE)
        except ValueError:
            continue
        
        if dt < now or dt > next_24h:
            continue
        
        # Check user's preferred hours
        if dt.hour < start_hour or dt.hour >= end_hour:
            continue
        
        # Check swell range
        if not (min_swell <= swell_height <= max_swell):
            continue
        
        # Find closest tide reading
        tide_height = tide_data.get(dt_str)
        if tide_height is None:
            closest_tide = None
            min_diff = float('inf')
            for tide_dt_str, height in tide_data.items():
                try:
                    tide_dt = datetime.strptime(tide_dt_str, "%Y-%m-%d %H:%M:%S")
                    tide_dt = tide_dt.replace(tzinfo=TIMEZONE)
                    diff = abs((tide_dt - dt).total_seconds())
                    if diff < min_diff:
                        min_diff = diff
                        closest_tide = height
                except ValueError:
                    continue
            tide_height = closest_tide if closest_tide is not None else 999
        
        # Check tide range
        if not (min_tide <= tide_height <= max_tide):
            continue
        
        wind_info = wind_data.get(dt_str, {"speed": 999, "direction": "N/A"})
        windows.append({
            "datetime": dt,
            "swell": swell_height,
            "tide": tide_height,
            "wind_forecast": wind_info,
        })
    
    return windows


def check_current_wind(location_id: int, forecast_wind: dict = None) -> dict:
    """Get current wind, falling back to forecast if observations unavailable."""
    try:
        obs = get_wind_observations(location_id)
        wind_obs = obs.get("observational", {}).get("observations", {}).get("wind", {})
        
        if wind_obs:
            speed = wind_obs.get("speed")
            direction = wind_obs.get("directionText")
            if speed is not None and direction:
                return {
                    "speed": speed,
                    "direction": direction,
                    "gust": wind_obs.get("gustSpeed", 0),
                    "source": "live"
                }
    except Exception as e:
        print(f"    Warning: Could not get wind observations: {e}")
    
    # Fall back to forecast
    if forecast_wind:
        return {
            "speed": forecast_wind.get("speed", 0),
            "direction": forecast_wind.get("direction", "N/A"),
            "gust": 0,
            "source": "forecast"
        }
    
    return {"speed": 999, "direction": "N/A", "gust": 0, "source": "none"}


# =============================================================================
# EMAIL
# =============================================================================

def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email via Resend API."""
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


def format_alert_email(user: dict, beach_name: str, window: dict, wind: dict, wind_reason: str) -> tuple:
    """Format the surf alert email."""
    dt = window["datetime"]
    
    subject = f"🏄 Surf's On! {beach_name} - Good conditions at {dt.strftime('%H:%M')}"
    
    body = f"""OUT THERE! SURF CONDITIONS ARE MET!
{'=' * 40}

Location: {beach_name}
Time: {dt.strftime('%A %d %B %Y at %H:%M')}

CONDITIONS:
-----------
Swell Height: {window['swell']:.1f}m ✓
  (Your range: {user.get('min_swell', 1.0)}m – {user.get('max_swell', 3.0)}m)

Tide Height: {window['tide']:.2f}m ✓
  (Your range: {user.get('min_tide', 0):.1f}m – {user.get('max_tide', 2.0):.1f}m)

Wind: {wind['speed']} km/h from {wind['direction']}
  {wind_reason} ✓

Wind Source: {wind.get('source', 'forecast').title()}

---
Generated: {datetime.now(TIMEZONE).strftime('%Y-%m-%d %H:%M:%S')} AEST

Update your settings: https://www.swellcheck.co/account

This is an automated message. Please do not reply to this email.
"""
    
    return subject, body


# =============================================================================
# MAIN LOOP
# =============================================================================

def check_user(user: dict, alerted_users: set) -> bool:
    """
    Check conditions for a single user.
    Returns True if alert was sent.
    """
    user_id = user.get("id")
    email = user.get("email")
    name = user.get("name", "Surfer")
    beach_id = user.get("beach_id")
    beach_name = user.get("beach_name", "Unknown Beach")
    
    # Skip if no beach configured
    if not beach_id:
        return False
    
    # Skip if already alerted today
    alert_key = f"{user_id}:{datetime.now(TIMEZONE).strftime('%Y%m%d')}"
    if alert_key in alerted_users:
        return False
    
    # Check if within user's alert hours
    now = datetime.now(TIMEZONE)
    start_hour = user.get("start_hour", 5)
    end_hour = user.get("end_hour", 18)
    
    if now.hour < start_hour or now.hour >= end_hour:
        return False
    
    print(f"  Checking {name} ({email}) - {beach_name}...")
    
    try:
        # Get forecast for this beach
        forecast = get_forecast(beach_id, days=1)
        
        # Find windows matching user's swell/tide preferences
        windows = parse_forecast_windows(forecast, user)
        
        if not windows:
            print(f"    No matching swell/tide windows")
            return False
        
        print(f"    Found {len(windows)} potential window(s)")
        
        # Check current wind for the best window
        for window in windows:
            time_to_window = (window["datetime"] - now).total_seconds() / 60
            
            # Only check windows within next 2 hours
            if time_to_window > 120:
                continue
            
            # Get current wind
            wind = check_current_wind(beach_id, window.get("wind_forecast"))
            source = wind.get("source", "unknown")
            print(f"    Wind ({source}): {wind['speed']} km/h from {wind['direction']}")
            
            # Check if wind is acceptable for this user
            is_good, wind_type, reason = is_good_wind_for_user(wind, user, beach_id)
            
            if is_good:
                print(f"    ✓ Conditions met! Sending alert...")
                
                subject, body = format_alert_email(user, beach_name, window, wind, reason)
                
                if send_email(email, subject, body):
                    alerted_users.add(alert_key)
                    update_user_last_alert(user_id)
                    return True
            else:
                print(f"    ✗ Wind not ideal: {reason}")
        
        return False
        
    except Exception as e:
        print(f"    Error: {e}")
        return False


def run_alarm():
    """Main alarm loop - checks all users."""
    print("=" * 50)
    print("SWELLCHECK - MULTI-USER SURF ALARM")
    print("=" * 50)
    
    # Validate configuration
    if not WILLYWEATHER_API_KEY or WILLYWEATHER_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: WILLYWEATHER_API_KEY not set!")
        return
    
    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_KEY not set!")
        return
    
    print(f"Supabase: {SUPABASE_URL}")
    print(f"Check interval: 30 minutes")
    print()
    
    alerted_users = set()  # Track who we've alerted today
    last_date = None
    
    while True:
        now = datetime.now(TIMEZONE)
        today = now.date()
        
        # Reset alerts at midnight
        if last_date and last_date != today:
            alerted_users.clear()
            print(f"\n[{now.strftime('%H:%M:%S')}] New day - cleared alert history")
        last_date = today
        
        print(f"\n[{now.strftime('%H:%M:%S')}] Checking conditions...")
        
        # Fetch active users
        users = get_active_users()
        
        if not users:
            print("  No active users to check")
        else:
            alerts_sent = 0
            for user in users:
                if check_user(user, alerted_users):
                    alerts_sent += 1
            
            print(f"  Done. Sent {alerts_sent} alert(s).")
        
        # Wait 30 minutes
        print(f"  Next check at {(now + timedelta(minutes=30)).strftime('%H:%M')}")
        time.sleep(30 * 60)


def test_user(email: str):
    """Test mode - check a specific user's conditions."""
    print(f"Testing conditions for: {email}")
    
    users = get_active_users()
    user = next((u for u in users if u.get("email") == email), None)
    
    if not user:
        print(f"User not found: {email}")
        return
    
    print(f"\nUser: {user.get('name')}")
    print(f"Beach: {user.get('beach_name')} (ID: {user.get('beach_id')})")
    print(f"Swell: {user.get('min_swell')}m - {user.get('max_swell')}m")
    print(f"Tide: {user.get('min_tide')}m - {user.get('max_tide')}m")
    print(f"Offshore max wind: {user.get('offshore_max_wind')} km/h")
    print(f"Cross-shore max wind: {user.get('cross_shore_max_wind')} km/h")
    print(f"Onshore max wind: {user.get('onshore_max_wind')} km/h")
    print(f"Hours: {user.get('start_hour')}:00 - {user.get('end_hour')}:00")
    print()
    
    alerted = set()
    check_user(user, alerted)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--test" and len(sys.argv) > 2:
            test_user(sys.argv[2])
        elif sys.argv[1] == "--test-email":
            print("Sending test email...")
            send_email(
                os.environ.get("TEST_EMAIL", "test@example.com"),
                "🏄 SwellCheck Test Email",
                f"Test email sent at {datetime.now(TIMEZONE).strftime('%Y-%m-%d %H:%M:%S')}\n\nYour surf alarm is working!"
            )
        else:
            print("Usage:")
            print("  python smart_surf_alarm.py                  # Run alarm loop")
            print("  python smart_surf_alarm.py --test <email>   # Test specific user")
            print("  python smart_surf_alarm.py --test-email     # Send test email")
    else:
        run_alarm()
