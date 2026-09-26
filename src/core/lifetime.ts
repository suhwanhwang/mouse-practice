/** 화면/게임 하나가 살아있는 동안의 리스너·타이머를 모아 두었다가 한 번에 정리한다. */
export class Lifetime {
  private cleanups: (() => void)[] = [];
  private alive = true;

  get isAlive(): boolean {
    return this.alive;
  }

  add(fn: () => void): void {
    if (!this.alive) {
      fn();
      return;
    }
    this.cleanups.push(fn);
  }

  on<E extends Event = Event>(
    target: EventTarget,
    type: string,
    fn: (e: E) => void,
    opts?: AddEventListenerOptions | boolean,
  ): void {
    const listener = fn as unknown as EventListener;
    target.addEventListener(type, listener, opts);
    this.add(() => target.removeEventListener(type, listener, opts));
  }

  timeout(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => this.alive && fn(), ms);
    this.add(() => clearTimeout(id));
    return id;
  }

  interval(fn: () => void, ms: number): number {
    const id = window.setInterval(() => this.alive && fn(), ms);
    this.add(() => clearInterval(id));
    return id;
  }

  /** 살아있는 동안에만 끝나는 대기. 정리된 뒤에는 영원히 끝나지 않는다. */
  wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.timeout(resolve, ms));
  }

  /** 매 프레임 호출. dt는 초 단위(최대 0.05). */
  loop(fn: (dt: number, now: number) => void): void {
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      if (!this.alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fn(dt, now);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    this.add(() => cancelAnimationFrame(id));
  }

  destroy(): void {
    if (!this.alive) return;
    this.alive = false;
    for (const fn of this.cleanups.reverse()) {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    }
    this.cleanups = [];
  }
}
