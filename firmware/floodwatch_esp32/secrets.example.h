#pragma once
// Copy to secrets.h (gitignored) and fill in.

#define WIFI_SSID "your-wifi"
#define WIFI_PASSWORD "your-wifi-password"

// Firebase console > Project settings
#define FIREBASE_API_KEY "AIza..."
#define FIREBASE_DATABASE_URL "https://floodwatch-lite-default-rtdb.asia-southeast1.firebasedatabase.app"

// Firebase Auth email/password account for this board. Put its UID in /deviceAuth/{DEVICE_ID}.
#define DEVICE_EMAIL "fw-001@floodwatch.local"
#define DEVICE_PASSWORD "change-me"

// Phones that get SMS alerts (international format). Kept on the board, never in Firebase,
// so the numbers don't reach the database or the website.
static const char *SMS_RECIPIENTS[] = {
  "+639XXXXXXXXX",
};
