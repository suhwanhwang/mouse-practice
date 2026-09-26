import type { Lifetime } from './lifetime';

export type ClickKind = 'single' | 'double';

/**
 * 브라우저 기본 dblclick 대신 쓰는 넉넉한 더블클릭 판정기.
 * 아이들은 두 번째 클릭이 느리고 손이 조금 움직이므로 간격·거리를 설정으로 조절한다.
 */
export class DoubleClickDetector {
  private last: { t: number; x: number; y: number } | null = null;

  constructor(
    public intervalMs: number,
    private maxDist = 30,
  ) {}

  feed(t: number, x: number, y: number): ClickKind {
    const prev = this.last;
    if (prev && t - prev.t <= this.intervalMs && Math.hypot(x - prev.x, y - prev.y) <= this.maxDist) {
      this.last = null;
      return 'double';
    }
    this.last = { t, x, y };
    return 'single';
  }

  reset(): void {
    this.last = null;
  }
}

export interface DragOptions {
  /** 놓은 곳(client 좌표)에서 성공하면 true. false면 제자리로 돌아간다. */
  onDrop: (x: number, y: number) => boolean;
  /** 끌지 않고 눌렀다 뗐을 때 */
  onTap?: () => void;
  onStart?: () => void;
  enabled?: () => boolean;
  /** 끄는 동안 원본을 흐리게만 남긴다(목록 행 등) */
  keepOriginal?: boolean;
}

const DRAG_THRESHOLD = 6;

/**
 * 누른 채로 움직이면 복제본(고스트)이 포인터를 따라다니고, 놓으면 onDrop으로 판정한다.
 * 실패하면 고스트가 원래 자리로 부드럽게 돌아간다.
 */
export function makeDraggable(node: HTMLElement, lt: Lifetime, opts: DragOptions): void {
  let start: { x: number; y: number; rect: DOMRect; id: number } | null = null;
  let ghost: HTMLElement | null = null;
  let offset = { x: 0, y: 0 };

  node.classList.add('draggable');
  lt.add(() => ghost?.remove());

  const restore = () => {
    node.style.visibility = '';
    node.style.opacity = '';
  };

  lt.on<PointerEvent>(node, 'pointerdown', (e) => {
    if (e.button !== 0 || (opts.enabled && !opts.enabled())) return;
    e.preventDefault();
    e.stopPropagation();
    start = { x: e.clientX, y: e.clientY, rect: node.getBoundingClientRect(), id: e.pointerId };
    node.setPointerCapture(e.pointerId);
  });

  lt.on<PointerEvent>(node, 'pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    if (!ghost) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return;
      const r = start.rect;
      ghost = node.cloneNode(true) as HTMLElement;
      ghost.classList.add('drag-ghost');
      Object.assign(ghost.style, {
        position: 'fixed',
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        margin: '0',
        fontSize: getComputedStyle(node).fontSize,
      });
      offset = { x: start.x - r.left, y: start.y - r.top };
      document.body.append(ghost);
      if (opts.keepOriginal) node.style.opacity = '0.35';
      else node.style.visibility = 'hidden';
      opts.onStart?.();
    }
    ghost.style.left = `${e.clientX - offset.x}px`;
    ghost.style.top = `${e.clientY - offset.y}px`;
  });

  const finish = (e: PointerEvent, cancelled: boolean) => {
    if (!start || e.pointerId !== start.id) return;
    const s = start;
    start = null;
    if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
    const g = ghost;
    ghost = null;
    if (!g) {
      if (!cancelled) opts.onTap?.();
      return;
    }
    const ok = !cancelled && opts.onDrop(e.clientX, e.clientY);
    if (ok) {
      g.remove();
      restore();
      return;
    }
    const anim = g.animate(
      [
        { left: g.style.left, top: g.style.top },
        { left: `${s.rect.left}px`, top: `${s.rect.top}px` },
      ],
      { duration: 350, easing: 'cubic-bezier(.3,1.4,.6,1)' },
    );
    anim.onfinish = () => {
      g.remove();
      restore();
    };
  };

  lt.on<PointerEvent>(node, 'pointerup', (e) => finish(e, false));
  lt.on<PointerEvent>(node, 'pointercancel', (e) => finish(e, true));
}
