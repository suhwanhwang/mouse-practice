import type { Game } from '../core/scene';
import { meet } from './stage0-meet';
import { bubbles } from './stage1-bubbles';
import { balloons } from './stage2-balloons';
import { eggs } from './stage3-eggs';
import { gifts } from './stage4-gift';
import { drag } from './stage5-drag';
import { ocean } from './stage6-ocean';
import { desktop } from './stage7-desktop';

/** STAGES와 같은 순서 */
export const GAMES: Game[] = [meet, bubbles, balloons, eggs, gifts, drag, ocean, desktop];
