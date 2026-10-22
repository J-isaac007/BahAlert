// Writes sample devices (meta + config), safe zones and hotlines. Safe to re-run: overwrites those nodes only.
import { db } from './admin.mjs';
import { DEVICES, HOTLINES, SAFE_ZONES } from './sample-data.mjs';

const updates = {};
for (const [id, d] of Object.entries(DEVICES)) {
  updates[`devices/${id}/meta`] = d.meta;
  updates[`devices/${id}/config`] = d.config;
}
for (const [id, z] of Object.entries(SAFE_ZONES)) updates[`safeZones/${id}`] = z;
for (const [id, h] of Object.entries(HOTLINES)) updates[`hotlines/${id}`] = h;

await db.ref().update(updates);
console.log(
  `Seeded ${Object.keys(DEVICES).length} devices, ${Object.keys(SAFE_ZONES).length} safe zones, ${Object.keys(HOTLINES).length} hotlines.`,
);
process.exit(0);
