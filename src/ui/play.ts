import { sfx } from '../core/audio';
import { roundsFor, starsFor } from '../core/difficulty';
import { el } from '../core/dom';
import { Lifetime } from '../core/lifetime';
import { go } from '../core/router';
import type { GameContext, GameHandle } from '../core/scene';
import { data, isLevelUnlocked, isStageComplete, recordStars, save } from '../core/storage';
import { GAMES } from '../games';
import { STAGES } from '../data/stages';
import { showResult } from './result';
import { createTopbar } from './topbar';

export function playScreen(app: HTMLElement, lt: Lifetime, stage: number, level: number): void {
  const def = STAGES[stage];
  if (!def || !def.levels[level] || !isLevelUnlocked(data, stage, level)) {
    go('map');
    return;
  }
  const levelDef = def.levels[level];
  const bar = createTopbar({ route: 'map', label: '🗺️' });
  const tag = el('div', 'level-tag', `${def.emoji} ${level + 1}단계`);
  const dots = el('div', 'dots');
  bar.right.append(tag, dots);
  const stageEl = el('main', `stage ${def.bg}`);
  app.append(bar.el, stageEl);

  // 게임 안에서는 브라우저 오른쪽 클릭 메뉴가 뜨지 않게 한다.
  lt.on(stageEl, 'contextmenu', (e) => e.preventDefault());

  const rounds = roundsFor(data.settings.rounds, def.extraRounds, def.maxRounds);
  let round = 0;
  let roundLt = new Lifetime();
  lt.add(() => roundLt.destroy());
  let mistakes = 0;
  let streak = 0;
  let finished = false;
  let roundWon = false;
  let handle: GameHandle = {};

  const renderDots = (done: number, total: number) => {
    dots.replaceChildren();
    if (total > 12) {
      const meter = el('div', 'meter');
      const fill = el('div', 'meter-fill');
      fill.style.width = `${(done / total) * 100}%`;
      meter.append(fill);
      dots.append(meter);
      return;
    }
    for (let i = 0; i < total; i++) dots.append(el('span', i < done ? 'dot on' : 'dot'));
  };

  const finish = () => {
    finished = true;
    // 판이 많을수록 실수도 늘어나므로 한 판 평균으로 별을 준다.
    const stars = starsFor(Math.round(mistakes / rounds));
    const hadSticker = isStageComplete(data, stage);
    recordStars(data, stage, level, stars);
    save();
    const newSticker = !hadSticker && isStageComplete(data, stage);
    lt.timeout(() => showResult(lt, { stage, level, stars, newSticker }), 800);
  };

  const startRound = () => {
    roundLt.destroy();
    roundLt = new Lifetime();
    roundWon = false;
    streak = 0;
    stageEl.replaceChildren();
    const ctx: GameContext = {
      root: stageEl,
      level,
      round,
      lt: roundLt,
      settings: data.settings,
      say: bar.mascot.say,
      miss(quiet = false) {
        if (finished || roundWon) return;
        mistakes++;
        streak++;
        if (!quiet) sfx.boop();
        if (streak >= 3) {
          streak = 0;
          bar.mascot.say(levelDef.hint);
          handle.hint?.();
        }
      },
      progress(done, total) {
        streak = 0;
        renderDots(round * total + done, rounds * total);
      },
      win() {
        if (finished || roundWon) return;
        roundWon = true;
        if (round + 1 >= rounds) {
          finish();
          return;
        }
        lt.timeout(() => {
          round++;
          showRoundBanner(lt, round, rounds);
          bar.mascot.say(`잘했어요! ${ORDINALS[round] ?? `${round + 1}번째`} 판이에요.`);
          startRound();
        }, 1000);
      },
    };
    handle = GAMES[stage](ctx) ?? {};
  };

  bar.mascot.say(levelDef.intro);
  startRound();
}

const ORDINALS = ['첫 번째', '두 번째', '세 번째', '네 번째', '다섯 번째', '여섯 번째', '일곱 번째'];

/** 판이 바뀔 때 화면 가운데에 "2 / 3"을 잠깐 띄운다. */
function showRoundBanner(lt: Lifetime, round: number, rounds: number): void {
  const banner = el('div', 'round-banner', `${round + 1} / ${rounds}`);
  document.body.append(banner);
  sfx.ding();
  lt.timeout(() => banner.remove(), 1300);
  lt.add(() => banner.remove());
}
