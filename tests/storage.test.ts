import { describe, expect, it } from 'vitest';
import {
  defaultData,
  getStars,
  isLevelUnlocked,
  isStageComplete,
  isStageUnlocked,
  parse,
  recordStars,
  stageStars,
} from '../src/core/storage';

describe('parse', () => {
  it('returns defaults for missing or broken data', () => {
    expect(parse(null)).toEqual(defaultData());
    expect(parse('{not json')).toEqual(defaultData());
    expect(parse(JSON.stringify({ version: 99, stars: { '0-0': 3 } }))).toEqual(defaultData());
  });

  it('keeps saved stars and fills in new settings', () => {
    const d = parse(JSON.stringify({ version: 1, stars: { '0-0': 2 }, settings: { voice: false } }));
    expect(getStars(d, 0, 0)).toBe(2);
    expect(d.settings.voice).toBe(false);
    expect(d.settings.dblClickMs).toBe(defaultData().settings.dblClickMs);
  });
});

describe('progress', () => {
  it('only records better results', () => {
    const d = defaultData();
    expect(recordStars(d, 0, 0, 2)).toBe(true);
    expect(recordStars(d, 0, 0, 1)).toBe(false);
    expect(getStars(d, 0, 0)).toBe(2);
    expect(recordStars(d, 0, 0, 3)).toBe(true);
    expect(stageStars(d, 0)).toBe(3);
  });

  it('unlocks levels and stages in order', () => {
    const d = defaultData();
    expect(isStageUnlocked(d, 0)).toBe(true);
    expect(isLevelUnlocked(d, 0, 0)).toBe(true);
    expect(isLevelUnlocked(d, 0, 1)).toBe(false);
    expect(isStageUnlocked(d, 1)).toBe(false);

    recordStars(d, 0, 0, 1);
    expect(isLevelUnlocked(d, 0, 1)).toBe(true);
    recordStars(d, 0, 1, 1);
    recordStars(d, 0, 2, 1);
    expect(isStageComplete(d, 0)).toBe(true);
    expect(isStageUnlocked(d, 1)).toBe(true);
    expect(isLevelUnlocked(d, 1, 1)).toBe(false);
  });

  it('unlockAll opens everything', () => {
    const d = defaultData();
    d.settings.unlockAll = true;
    expect(isStageUnlocked(d, 7)).toBe(true);
    expect(isLevelUnlocked(d, 7, 2)).toBe(true);
  });
});
