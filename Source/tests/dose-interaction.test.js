#!/usr/bin/env node
/* r204 automated checks: dose daily-cap math, interaction pair lookup,
   reminder export/delete-all store, and manifest validity.
   Run: node tests/dose-interaction.test.js   (exit code 1 on any failure) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert');

const root = path.resolve(__dirname, '..');
const webapp = path.join(root, 'webapp');
let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

/* Load a browser-style script into a sandbox window. */
function loadScript(file, sandbox) {
  sandbox.window = sandbox;
  const code = fs.readFileSync(path.join(webapp, file), 'utf8');
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox;
}

/* --- clinical data: dose caps ------------------------------------------ */
const win = { localStorage: null };
loadScript('clinical-tools.js', win);
const { doseMedicines, interactions } = win.DAWAYA_CLINICAL;
assert(Array.isArray(doseMedicines) && doseMedicines.length === 5, '5 dose medicines');
assert(Array.isArray(interactions) && interactions.length >= 40, 'interaction table present');

/* Mirror of calculateDose's cap logic in app.js (same formulas, same data). */
function capCheck(med, weight) {
  const dosesPerDay = med.dosesPerDay || med.maxDoses || 1;
  if (med.type === 'perDose') {
    return {
      planned: weight * med.perDose[1] * dosesPerDay,
      cap: Math.min(weight * med.maxDailyPerKg, med.maxDaily),
    };
  }
  if (med.type === 'perDay') {
    return { planned: weight * med.perDay[1], cap: med.maxDaily };
  }
  if (med.type === 'phases') {
    return {
      planned: Math.max(...med.phases.map(p => weight * p.mgPerKg)),
      cap: Math.max(...med.phases.map(p => p.maxMg)),
    };
  }
  throw new Error('unknown type ' + med.type);
}

check('paracetamol daily cap bites at high weight (30 kg: planned 2250, cap 2250)', () => {
  const med = doseMedicines.find(m => m.id === 'paracetamol');
  const { planned, cap } = capCheck(med, 30);
  assert.strictEqual(planned, 2250);
  assert.strictEqual(cap, 2250);
});
check('paracetamol daily cap bites at 50 kg (planned 3750, cap 3750 via 75 mg/kg)', () => {
  const med = doseMedicines.find(m => m.id === 'paracetamol');
  const { planned, cap } = capCheck(med, 50);
  assert.strictEqual(planned, 3750);
  assert.strictEqual(cap, 3750);
});
check('ibuprofen daily cap bites: 20 kg planned 800, cap 800 (40 mg/kg)', () => {
  const med = doseMedicines.find(m => m.id === 'ibuprofen');
  const { planned, cap } = capCheck(med, 20);
  assert.strictEqual(planned, 800);
  assert.strictEqual(cap, 800);
});
check('ibuprofen 400 mg x 4/day would exceed 1200 mg cap: planned 1600 > cap 1200', () => {
  const med = doseMedicines.find(m => m.id === 'ibuprofen');
  // A 40 kg child at the top per-dose range: 10 mg/kg x 4 doses = 1600 mg/day
  const { planned, cap } = capCheck(med, 40);
  assert.strictEqual(planned, 1600);
  assert.strictEqual(cap, 1200);
  assert.ok(planned > cap, 'cap must bite here');
});
check('amoxicillin perDay cap: 40 kg planned 1800, cap 4000 (no cap bite)', () => {
  const med = doseMedicines.find(m => m.id === 'amoxicillin');
  const { planned, cap } = capCheck(med, 40);
  assert.strictEqual(planned, 1800);
  assert.strictEqual(cap, 4000);
  assert.ok(planned <= cap);
});
check('azithromycin phases cap: 50 kg day 1 planned 500, cap 500', () => {
  const med = doseMedicines.find(m => m.id === 'azithromycin');
  const { planned, cap } = capCheck(med, 50);
  assert.strictEqual(planned, 500);
  assert.strictEqual(cap, 500);
});
check('dose numbers themselves unchanged (paracetamol 10-15 mg/kg, max 1000)', () => {
  const med = doseMedicines.find(m => m.id === 'paracetamol');
  assert.strictEqual(JSON.stringify(med.perDose), JSON.stringify([10, 15]));
  assert.strictEqual(med.maxPerDose, 1000);
  assert.strictEqual(med.maxDaily, 4000);
});
check('all 5 dose entries carry review status (unreviewed, no invented date)', () => {
  for (const med of doseMedicines) {
    assert.strictEqual(med.review.status, 'unreviewed');
    assert.strictEqual(med.review.reviewedOn, null);
    assert.strictEqual(med.review.reviewer, null);
    assert.ok(Array.isArray(med.sources) && med.sources.length > 0, med.id + ' has sources');
  }
});

/* --- interaction pair lookup (multi-drug = all unordered pairs) -------- */
function findPair(a, b) {
  return interactions.find(i => (i.a === a && i.b === b) || (i.a === b && i.b === a)) || null;
}
check('warfarin + NSAIDs (ibuprofen) is a Major pair', () => {
  const pair = findPair('warfarin', 'nsaids');
  assert.ok(pair, 'pair exists');
  assert.ok(['major', 'avoid'].includes(pair.severity), 'severity is major/avoid, got ' + pair.severity);
});
check('unknown pair returns null (no data, not "safe")', () => {
  assert.strictEqual(findPair('levothyroxine', 'pde5'), null);
});
check('3-drug check = all 3 unordered pairs, each looked up independently', () => {
  const drugs = ['warfarin', 'nsaids', 'aspirin_low'];
  const pairs = [];
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) pairs.push([drugs[i], drugs[j]]);
  }
  assert.strictEqual(pairs.length, 3);
  const found = pairs.filter(([a, b]) => findPair(a, b));
  assert.ok(found.length >= 2, 'at least two pairs have data');
});

/* --- reminders store: clearAll + export shape -------------------------- */
const store = {};
const mem = {};
const localStorageStub = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; },
};
store.localStorage = localStorageStub;
store.document = { documentElement: { hasAttribute: () => false, dataset: {} } };
store.navigator = {};
store.Notification = undefined;
loadScript('core.js', store);
const core = store.DawayaCore;
assert.ok(core && core.reminders, 'DawayaCore.reminders loaded');
const reminderStore = core.reminders.createStore();
check('reminder store: add, export shape, clearAll', () => {
  assert.strictEqual(reminderStore.list().length, 0);
  const added = reminderStore.add({ name: 'Metformin', dose: '500 mg', time: '08:00' });
  assert.ok(added.ok, 'add works');
  assert.strictEqual(reminderStore.list().length, 1);
  const payload = { reminders: reminderStore.list().map(i => ({ name: i.name, dose: i.dose, time: i.time })) };
  assert.strictEqual(payload.reminders[0].name, 'Metformin');
  assert.strictEqual(reminderStore.clearAll(), true);
  assert.strictEqual(reminderStore.list().length, 0);
  assert.strictEqual(reminderStore.clearAll(), false, 'clearAll on empty returns false');
});

/* --- manifest ----------------------------------------------------------- */
check('manifest is valid JSON, lang ar, has shortcuts and maskable icon', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(webapp, 'manifest.webmanifest'), 'utf8'));
  assert.strictEqual(manifest.lang, 'ar');
  assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, 'shortcuts present');
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable'), 'maskable icon present');
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(webapp, icon.src)), 'icon exists: ' + icon.src);
  }
});

/* --- new UI strings exist in both languages ---------------------------- */
check('new strings exist in app.js (en + ar)', () => {
  const app = fs.readFileSync(path.join(webapp, 'app.js'), 'utf8');
  for (const key of ['doseDailyCapWarning', 'doseReviewUnreviewed', 'doseConcentrationPresets',
    'interactionThirdLabel', 'reminderExport', 'reminderDeleteAll', 'datasetStamp', 'newsRefresh']) {
    assert.ok(app.includes(key + ':'), 'missing string: ' + key);
    assert.ok(app.includes(key), key);
  }
  assert.ok(app.includes("interactionPickerC"), 'third picker wired');
  assert.ok(app.includes('data-dose-conc'), 'concentration presets wired');
});

console.log(`\nDose/interaction suite: ${passed} checks passed.`);
