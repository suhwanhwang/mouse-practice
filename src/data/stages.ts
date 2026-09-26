export interface LevelDef {
  intro: string;
  hint: string;
}

export interface StageDef {
  title: string;
  skill: string;
  emoji: string;
  /** 배경 CSS 클래스 */
  bg: string;
  sticker: { emoji: string; name: string };
  /** 더 연습이 필요한 조작이라 기본 판 수에 더하는 판 수 */
  extraRounds?: number;
  /** 한 판이 긴 섬은 판 수를 이만큼으로 줄인다 */
  maxRounds?: number;
  levels: [LevelDef, LevelDef, LevelDef];
}

export const STAGES: StageDef[] = [
  {
    title: '마우스 친구 만나기',
    skill: '움직이기',
    emoji: '🖱️',
    bg: 'bg-sky',
    sticker: { emoji: '🦋', name: '나비' },
    levels: [
      { intro: '마우스 잡는 법을 알아봐요!', hint: '책상 위에서 마우스를 쓱쓱 밀어 보세요.' },
      { intro: '반짝이는 별에 화살표를 올려 보세요!', hint: '화살표를 별 위로 가져가요. 누르지 않아도 돼요.' },
      { intro: '나비를 따라가요! 화살표를 나비 옆에 두세요.', hint: '나비 옆에 화살표를 딱 붙여요.' },
    ],
  },
  {
    title: '비눗방울 공원',
    skill: '가리키기',
    emoji: '🫧',
    bg: 'bg-park',
    sticker: { emoji: '🐧', name: '펭귄' },
    levels: [
      { intro: '비눗방울에 화살표를 올리면 톡 터져요!', hint: '화살표를 비눗방울 가운데로 가져가요.' },
      { intro: '비눗방울이 더 빨라졌어요!', hint: '비눗방울이 올라가는 쪽으로 먼저 가 있어요.' },
      { intro: '작은 비눗방울도 잡아 볼까요?', hint: '천천히, 비눗방울 가운데를 노려요.' },
    ],
  },
  {
    title: '풍선 축제',
    skill: '클릭',
    emoji: '🎈',
    bg: 'bg-party',
    sticker: { emoji: '🦁', name: '사자' },
    extraRounds: 2,
    levels: [
      { intro: '풍선 위에서 왼쪽 버튼을 딸깍! 눌러요.', hint: '화살표를 풍선에 올리고, 왼쪽 버튼을 딸깍!' },
      { intro: '올라가는 풍선을 딸깍! 터뜨려요.', hint: '풍선 위에 화살표가 있을 때 딸깍!' },
      { intro: '두더지가 나오면 딸깍! 잡아요.', hint: '두더지가 쏙 나오면 바로 딸깍!' },
    ],
  },
  {
    title: '병아리 농장',
    skill: '더블클릭',
    emoji: '🥚',
    bg: 'bg-farm',
    sticker: { emoji: '🐥', name: '병아리' },
    extraRounds: 2,
    levels: [
      { intro: '알을 톡톡! 빠르게 두 번 누르면 병아리가 나와요.', hint: '마우스를 움직이지 말고, 톡톡! 빠르게 두 번.' },
      { intro: '알이 더 많아졌어요. 톡톡!', hint: '손가락만 톡톡! 마우스는 가만히.' },
      { intro: '작은 알도 톡톡!', hint: '알 가운데에 화살표를 두고 톡톡!' },
    ],
  },
  {
    title: '선물 가게',
    skill: '오른쪽 클릭',
    emoji: '🎁',
    bg: 'bg-shop',
    sticker: { emoji: '🐻', name: '곰돌이' },
    levels: [
      { intro: '선물 상자에서 오른쪽 버튼을 딸깍! 그다음 열기를 눌러요.', hint: '가운데 손가락으로 오른쪽 버튼을 딸깍!' },
      { intro: '오른쪽 버튼을 누르고, 메뉴에서 열기를 찾아요.', hint: '메뉴가 나오면 열기를 왼쪽 버튼으로 눌러요.' },
      { intro: '선물 위에 적힌 대로 해 보세요!', hint: '선물 위 글자와 같은 메뉴를 골라요.' },
    ],
  },
  {
    title: '동물 마을',
    skill: '끌어서 놓기',
    emoji: '🏠',
    bg: 'bg-meadow',
    sticker: { emoji: '🐶', name: '강아지' },
    extraRounds: 2,
    levels: [
      { intro: '동물을 꾹 누른 채로 끌어서 집에 데려다줘요.', hint: '버튼을 꾹 누르고, 손을 떼지 말고 옮겨요.' },
      { intro: '과일을 같은 바구니에 넣어요.', hint: '과일을 꾹 잡고 바구니까지 옮긴 다음 손을 떼요.' },
      { intro: '퍼즐 조각을 맞는 자리에 옮겨요.', hint: '흐린 그림을 보고 같은 자리를 찾아요.' },
    ],
  },
  {
    title: '바닷속 탐험',
    skill: '스크롤',
    emoji: '🌊',
    bg: 'bg-ocean',
    sticker: { emoji: '🐙', name: '문어' },
    levels: [
      { intro: '마우스 가운데 바퀴를 굴려서 바닷속으로 내려가요!', hint: '둘째 손가락으로 가운데 바퀴를 굴려요.' },
      { intro: '숨어 있는 바다 친구들을 찾아서 눌러요.', hint: '바퀴를 굴려서 위아래를 잘 살펴봐요.' },
      { intro: '보물을 찾아서 배까지 가져가요!', hint: '보물을 누른 다음, 바퀴를 반대로 굴려 위로 올라가요.' },
    ],
  },
  {
    title: '보물 컴퓨터',
    skill: '모두 함께',
    emoji: '💻',
    bg: 'bg-desktop',
    sticker: { emoji: '🦄', name: '유니콘' },
    maxRounds: 2,
    levels: [
      { intro: '보물 폴더를 톡톡 두 번 눌러서 열어요.', hint: '폴더 그림 위에서 톡톡! 빠르게 두 번.' },
      { intro: '쓰레기를 휴지통에 버려요.', hint: '쓰레기를 꾹 잡고 휴지통까지 끌어요.' },
      { intro: '보물 지도를 따라 보물 상자를 열어요!', hint: '오른쪽 위 순서를 하나씩 따라 해요.' },
    ],
  },
];
