import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAlarm, statusFor } from './bridge.mjs';

test("the board's levels map to the website's colours", () => {
  assert.equal(statusFor('NORMAL'), 'green');
  assert.equal(statusFor('LOW'), 'yellow');
  assert.equal(statusFor('MEDIUM'), 'red');
  assert.equal(statusFor('HIGH'), 'red');
  assert.equal(statusFor('critical'), 'red');
  assert.equal(statusFor('banana'), null);
  assert.equal(statusFor(undefined), null);
});

test('the alarm sounds on HIGH or CRITICAL only, like the original server', () => {
  assert.equal(isAlarm('HIGH'), true);
  assert.equal(isAlarm('CRITICAL'), true);
  assert.equal(isAlarm('MEDIUM'), false);
  assert.equal(isAlarm('NORMAL'), false);
});
