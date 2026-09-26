export type MousePart = 'left' | 'right' | 'wheel' | null;

/** 어느 버튼을 누르는지 보여 주는 마우스 그림. 강조한 부분이 깜빡인다. */
export function mouseSvg(highlight: MousePart, size = 120): string {
  const fill = (part: MousePart) => (part === highlight ? 'class="mouse-hi"' : 'fill="#fff"');
  return `
<svg class="mouse-svg" width="${size * 0.67}" height="${size}" viewBox="0 0 120 180" aria-hidden="true">
  <rect x="8" y="8" width="104" height="164" rx="52" fill="#fff" stroke="#4a3b35" stroke-width="5"/>
  <path d="M8 75 L8 60 A52 52 0 0 1 60 8 L60 75 Z" ${fill('left')} stroke="#4a3b35" stroke-width="5" stroke-linejoin="round"/>
  <path d="M60 8 A52 52 0 0 1 112 60 L112 75 L60 75 Z" ${fill('right')} stroke="#4a3b35" stroke-width="5" stroke-linejoin="round"/>
  <rect x="50" y="24" width="20" height="36" rx="10" ${highlight === 'wheel' ? 'class="mouse-hi"' : 'fill="#ddd"'} stroke="#4a3b35" stroke-width="4"/>
</svg>`;
}
