#pragma once
// Copy to secrets.h (gitignored) and fill in.

#define WIFI_SSID "your-wifi"            // 2.4 GHz network
#define WIFI_PASSWORD "your-wifi-password"

// Same as web/.env VITE_FIREBASE_DATABASE_URL. Sensor data is public-read, so the alarm needs no login.
#define FIREBASE_DATABASE_URL "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app"

// Which sensor this alarm follows
#define WATCH_DEVICE_ID "bah-001"
