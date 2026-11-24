import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  carryStamp,
  isUntouched,
  readBase,
  recordBase,
  renderFingerprint,
  stampRender,
  writeTracked,
} from '../src/lib/tracked-render.js';
import { judgePromoted } from '../src/commands/generated.js';

const ORIGIN = 'promote Job --module admin/jobs';
const v1 = 'package a;\n\nclass JobService {\n    void create() {}\n\n    void delete() {}\n}\n';
// A template change far from the edit below.
const v2 =
  'package a;\n\nclass JobService {\n    void create() {}\n\n    void delete() {}\n\n    void search() {}\n}\n';
// A template change on the line the edit below changes.
const v2Collide = 'package a;\n\nclass JobService {\n    void create(String id) {}\n\n    void delete() {}\n}\n';
const edit = held => held.replace('    void create() {}', '    void create() { check(); }');

let root;
let dest;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tracked-render-'));
  dest = path.join(root, 'modules/admin/jobs/src/main/java/a/JobService.java');
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const promote = render => writeTracked(root, dest, stampRender(render, ORIGIN));
const held = () => fs.readFileSync(dest, 'utf8');

describe('stampRender', () => {
  it('stamps a fingerprint that the untouched render matches and an edit breaks', () => {
    const stamped = stampRender(v1, ORIGIN);
    assert.match(stamped.split('\n')[1], /^\/\/ @simplix-render [0-9a-f]{12} promote Job --module admin\/jobs$/);
    assert.strictEqual(isUntouched(stamped), true);
    assert.strictEqual(isUntouched(edit(stamped)), false);
    assert.strictEqual(isUntouched(v1), false);
  });

  it('is stable across a re-stamp', () => {
    const stamped = stampRender(v1, ORIGIN);
    assert.strictEqual(stampRender(stamped, ORIGIN), stamped);
    assert.strictEqual(renderFingerprint(stamped), renderFingerprint(stampRender(v1, 'other origin')));
  });
});

describe('writeTracked', () => {
  it('lays an absent file down and stores its base', () => {
    assert.strictEqual(promote(v1).outcome, 'written');
    assert.strictEqual(held(), stampRender(v1, ORIGIN));
    assert.strictEqual(readBase(root, dest), held());
  });

  it('rewrites an untouched file with the new render', () => {
    promote(v1);
    assert.strictEqual(promote(v2).outcome, 'written');
    assert.strictEqual(held(), stampRender(v2, ORIGIN));
  });

  it('merges a template change into an edited file and keeps the edit', () => {
    promote(v1);
    fs.writeFileSync(dest, edit(held()));
    assert.strictEqual(promote(v2).outcome, 'merged');
    assert.ok(held().includes('void create() { check(); }'));
    assert.ok(held().includes('void search() {}'));
    assert.strictEqual(readBase(root, dest), stampRender(v2, ORIGIN));
  });

  it('reports current when the edits already carry the template change', () => {
    promote(v1);
    fs.writeFileSync(dest, edit(held()));
    const before = held();
    assert.strictEqual(promote(v1).outcome, 'current');
    assert.strictEqual(held(), before);
  });

  it('never overwrites on a conflict and writes the merge with markers as a report', () => {
    promote(v1);
    fs.writeFileSync(dest, edit(held()));
    const before = held();
    const outcome = promote(v2Collide);
    assert.strictEqual(outcome.outcome, 'conflict');
    assert.strictEqual(held(), before);
    assert.strictEqual(readBase(root, dest), stampRender(v1, ORIGIN));
    assert.match(fs.readFileSync(outcome.report, 'utf8'), /^<<<<<<< edited$/m);
    assert.strictEqual(outcome.report.startsWith(path.join(root, 'generated', 'conflicts')), true);
  });

  it('leaves a file deleted after it was laid down deleted', () => {
    promote(v1);
    fs.rmSync(dest);
    assert.strictEqual(promote(v2).outcome, 'removed');
    assert.strictEqual(fs.existsSync(dest), false);
  });

  it('keeps an edited file that has no stored base', () => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, edit(v1));
    assert.strictEqual(promote(v2).outcome, 'no-base');
    assert.strictEqual(held(), edit(v1));
  });

  it('merges cleanly after adopting a file promoted without a base', () => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, edit(v1));
    const render = stampRender(v1, ORIGIN);
    fs.writeFileSync(dest, carryStamp(held(), render));
    recordBase(root, dest, render);
    assert.strictEqual(promote(v2).outcome, 'merged');
    assert.ok(held().includes('void create() { check(); }'));
    assert.ok(held().includes('void search() {}'));
  });
});

describe('judgePromoted', () => {
  const judge = render => judgePromoted(root, dest, render === undefined ? undefined : stampRender(render, ORIGIN));

  it('names every state', () => {
    assert.strictEqual(judge(v1), 'absent');
    promote(v1);
    assert.strictEqual(judge(v1), 'untouched');
    assert.strictEqual(judge(undefined), 'untouched');
    assert.strictEqual(judge(v2), 'stale');
    fs.writeFileSync(dest, edit(held()));
    assert.strictEqual(judge(v2), 'edited');
    assert.strictEqual(judge(v2Collide), 'conflict');
    fs.rmSync(path.join(root, '.simplix'), { recursive: true });
    assert.strictEqual(judge(v2), 'no-base');
    recordBase(root, dest, stampRender(v1, ORIGIN));
    fs.rmSync(dest);
    assert.strictEqual(judge(v2), 'removed');
  });
});
