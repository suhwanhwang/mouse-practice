import { describe, expect, it } from 'vitest';
import { byLevel, lerp, roundsFor, starsFor } from '../src/core/difficulty';
import { DoubleClickDetector } from '../src/core/input';
import { scatter } from '../src/core/random';
import { parseRoute } from '../src/core/router';
import { speakable } from '../src/core/speech';

describe('DoubleClickDetector', () => {
  it('detects two quick clicks in the same spot', () => {
    const d = new DoubleClickDetector(700);
    expect(d.feed(0, 100, 100)).toBe('single');
    expect(d.feed(600, 105, 98)).toBe('double');
  });

  it('treats slow second click as a new first click', () => {
    const d = new DoubleClickDetector(500);
    expect(d.feed(0, 0, 0)).toBe('single');
    expect(d.feed(600, 0, 0)).toBe('single');
    expect(d.feed(900, 0, 0)).toBe('double');
  });

  it('ignores clicks that moved too far', () => {
    const d = new DoubleClickDetector(700, 30);
    d.feed(0, 0, 0);
    expect(d.feed(100, 50, 0)).toBe('single');
  });

  it('does not chain a third click into another double', () => {
    const d = new DoubleClickDetector(700);
    d.feed(0, 0, 0);
    expect(d.feed(100, 0, 0)).toBe('double');
    expect(d.feed(200, 0, 0)).toBe('single');
  });
});

describe('difficulty', () => {
  it('picks values by level and clamps', () => {
    expect(byLevel(0, [1, 2, 3])).toBe(1);
    expect(byLevel(2, [1, 2, 3])).toBe(3);
    expect(byLevel(5, [1, 2, 3])).toBe(3);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 2)).toBe(10);
  });

  it('always gives at least one star', () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(2)).toBe(3);
    expect(starsFor(3)).toBe(2);
    expect(starsFor(6)).toBe(2);
    expect(starsFor(100)).toBe(1);
  });
});

describe('scatter', () => {
  it('keeps points inside the box without overlap', () => {
    const box = { left: 0, top: 0, right: 1000, bottom: 600 };
    const pts = scatter(6, 100, box, 10);
    expect(pts).toHaveLength(6);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(50);
      expect(p.x).toBeLessThanOrEqual(950);
      expect(p.y).toBeGreaterThanOrEqual(50);
      expect(p.y).toBeLessThanOrEqual(550);
    }
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThanOrEqual(100);
  });
});

describe('parseRoute', () => {
  it('parses known routes', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/map')).toEqual({ name: 'map' });
    expect(parseRoute('#/play/3/1')).toEqual({ name: 'play', stage: 3, level: 1 });
    expect(parseRoute('#/play/x')).toEqual({ name: 'map' });
    expect(parseRoute('#/parent')).toEqual({ name: 'parent' });
  });
});

describe('speakable', () => {
  it('drops emoji and quotes', () => {
    expect(speakable("'열기'를 눌러요! 🎁✨")).toBe('열기를 눌러요!');
  });
});

describe('roundsFor', () => {
  it('adds extra practice rounds unless the parent chose short', () => {
    expect(roundsFor(3)).toBe(3);
    expect(roundsFor(3, 2)).toBe(5);
    expect(roundsFor(1, 2)).toBe(1);
    expect(roundsFor(5, 0, 2)).toBe(2);
  });
});
