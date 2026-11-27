import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COOLDOWN_MS, SMS_MAX, alertText, cooledDown, gsmSafe, notifyKind, otpText } from './messages.mjs';

const SITE = 'https://j-isaac007.github.io/BahAlert';
const alert = (from, to, extra = {}) => ({
  deviceId: 'bah-001',
  name: 'Prototype sensor — BatStateU Alangilan',
  barangay: 'Alangilan',
  from,
  to,
  levelCm: 22.4,
  ...extra,
});

test('only rises and the return to safe send a message', () => {
  assert.equal(notifyKind('green', 'yellow'), 'rise');
  assert.equal(notifyKind('yellow', 'red'), 'rise');
  assert.equal(notifyKind('green', 'red'), 'rise');
  assert.equal(notifyKind('red', 'green'), 'safe');
  assert.equal(notifyKind('yellow', 'green'), 'safe');
  assert.equal(notifyKind('red', 'yellow'), null);
  assert.equal(notifyKind('green', 'green'), null);
  assert.equal(notifyKind('green', 'offline'), null);
});

test('texts fit one plain SMS and say what to do', () => {
  const red = alertText(alert('yellow', 'red'), SITE);
  assert.match(red, /^BahAlert DANGER: .*22 cm.*Move to a safe zone now\. https:\/\/.*\/sensor\/bah-001$/);
  assert.ok(red.length <= SMS_MAX, red);
  assert.equal(red, gsmSafe(red));
  assert.match(alertText(alert('green', 'yellow'), SITE), /WARNING.*Get your family and documents ready/);
  assert.match(alertText(alert('red', 'green'), SITE), /back to a safe level/);
  assert.equal(alertText(alert('red', 'yellow'), SITE), null);
});

test('a very long sensor name is shortened, never the instructions', () => {
  const text = alertText(alert('yellow', 'red', { name: 'Sensor 4 — '.repeat(20), barangay: 'Kumintang Ilaya' }), SITE);
  assert.ok(text.length <= SMS_MAX, `${text.length}: ${text}`);
  assert.match(text, /\.\.\..*Move to a safe zone now\./);
});

test('gsmSafe swaps characters that would split or garble an SMS', () => {
  assert.equal(gsmSafe('Sensor 1 — Sitio “3” Road… Ñ'), 'Sensor 1 - Sitio "3" Road... N');
});

test('cooldown blocks the same level for 15 minutes', () => {
  const t0 = 1_000_000;
  assert.equal(cooledDown(undefined, t0), true);
  assert.equal(cooledDown(t0, t0 + COOLDOWN_MS - 1), false);
  assert.equal(cooledDown(t0, t0 + COOLDOWN_MS), true);
});

test('code text', () => {
  assert.match(otpText('012345'), /^BahAlert code: 012345\./);
  assert.ok(otpText('012345').length <= SMS_MAX);
});
