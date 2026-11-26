#pragma once
// Copy to secrets.h (gitignored), or let `node scripts/add-device.mjs ... --secrets` write it.

#define WIFI_SSID "your-wifi"            // 2.4 GHz network (the ESP32 has no 5 GHz)
#define WIFI_PASSWORD "your-wifi-password"

// Same values as web/.env (VITE_FIREBASE_API_KEY / VITE_FIREBASE_DATABASE_URL)
#define FIREBASE_API_KEY "AIza..."
#define FIREBASE_DATABASE_URL "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app"

// The board's own login, made by scripts/add-device.mjs (its UID is in /deviceAuth/{DEVICE_ID})
#define DEVICE_ID "bah-001"
#define DEVICE_EMAIL "bah-001@bahalert.local"
#define DEVICE_PASSWORD "change-me"
