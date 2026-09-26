export type Route =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'play'; stage: number; level: number }
  | { name: 'stickers' }
  | { name: 'draw' }
  | { name: 'parent' };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'map':
      return { name: 'map' };
    case 'play': {
      const stage = Number(parts[1]);
      const level = Number(parts[2] ?? 0);
      if (Number.isInteger(stage) && Number.isInteger(level)) return { name: 'play', stage, level };
      return { name: 'map' };
    }
    case 'stickers':
      return { name: 'stickers' };
    case 'draw':
      return { name: 'draw' };
    case 'parent':
      return { name: 'parent' };
    default:
      return { name: 'home' };
  }
}

export function go(path: string): void {
  const next = `#/${path}`;
  if (location.hash === next) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = next;
}
