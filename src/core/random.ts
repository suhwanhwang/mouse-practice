export const rand = (min: number, max: number): number => min + Math.random() * (max - min);

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * box 안에 지름 size인 원 n개를 서로 겹치지 않게 흩어 놓는다(중심 좌표 반환).
 * 자리가 모자라면 간격을 조금씩 줄여 가며 다시 시도한다.
 */
export function scatter(n: number, size: number, box: Box, gap = 16): { x: number; y: number }[] {
  const r = size / 2;
  let minDist = size + gap;
  for (let round = 0; round < 8; round++) {
    const pts: { x: number; y: number }[] = [];
    for (let attempt = 0; attempt < n * 200 && pts.length < n; attempt++) {
      const p = { x: rand(box.left + r, box.right - r), y: rand(box.top + r, box.bottom - r) };
      if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= minDist)) pts.push(p);
    }
    if (pts.length === n) return pts;
    minDist *= 0.85;
  }
  return Array.from({ length: n }, () => ({ x: rand(box.left + r, box.right - r), y: rand(box.top + r, box.bottom - r) }));
}
