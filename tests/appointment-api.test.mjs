import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAppointment, SLOTS } from '../lib/appointment-validation.js';

const valid = {
  name: 'Ana Pérez',
  insurance: 'Particular',
  reason: 'Consulta inicial',
  date: '2026-11-01',
  period: 'morning',
  time: '11:30',
  consent: true,
  website: ''
};

test('accepts valid requests and the final morning/afternoon slots', () => {
  assert.equal(validateAppointment(valid, new Date('2026-10-27T15:00:00Z')).ok, true);
  assert.ok(SLOTS.morning.includes('11:30'));
  assert.ok(SLOTS.afternoon.includes('19:30'));
});

test('rejects missing consent and malformed or past dates', () => {
  assert.equal(validateAppointment({ ...valid, consent: false }, new Date('2026-10-27T15:00:00Z')).ok, false);
  assert.equal(validateAppointment({ ...valid, date: '2026-02-31' }, new Date('2026-01-01T15:00:00Z')).ok, false);
  assert.equal(validateAppointment({ ...valid, date: '2026-10-26' }, new Date('2026-10-27T15:00:00Z')).ok, false);
});

test('rejects a time that does not belong to the selected period', () => {
  assert.equal(validateAppointment({ ...valid, period: 'morning', time: '19:30' }, new Date('2026-10-27T15:00:00Z')).ok, false);
  assert.equal(validateAppointment({ ...valid, period: 'afternoon', time: '12:00' }, new Date('2026-10-27T15:00:00Z')).ok, false);
});

test('rejects oversized fields and spam honeypot', () => {
  assert.equal(validateAppointment({ ...valid, name: 'x'.repeat(121) }, new Date('2026-10-27T15:00:00Z')).ok, false);
  assert.equal(validateAppointment({ ...valid, website: 'spam' }, new Date('2026-10-27T15:00:00Z')).ok, false);
});
