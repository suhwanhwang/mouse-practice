/** 레벨(0, 1, 2)에 맞는 값을 고른다. */
export function byLevel<T>(level: number, values: readonly [T, T, T]): T {
  return values[Math.max(0, Math.min(2, level))];
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * Math.max(0, Math.min(1, t));

/** 실수 횟수로 별 개수를 정한다. 끝까지 하면 최소 1개는 받는다. */
export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 2) return 3;
  if (mistakes <= 6) return 2;
  return 1;
}

/**
 * 한 단계를 몇 판 할지. 부모가 "짧게(1판)"를 고르면 그대로 1판,
 * 아니면 더 연습이 필요한 섬은 판을 더하고, 한 판이 긴 섬은 줄인다.
 */
export function roundsFor(base: number, extra = 0, max = Infinity): number {
  const n = base > 1 ? base + extra : base;
  return Math.max(1, Math.min(max, n));
}
