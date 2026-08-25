export const FPS = 30;

export type SceneSpec = {
  id: string;
  chapter: string;
  title: string;
  duration: number;
  captions: string[];
  voiceFile: string;
};

export const SCENES: SceneSpec[] = [
  {
    id: 'gap',
    chapter: '01 · Contract identity',
    title: 'One symbol. Many contracts.',
    duration: 55 * FPS,
    voiceFile: 'audio/voice/vo-01-gap.wav',
    captions: [
      'A ranked symbol tells you where options activity is concentrating.',
      'It does not tell you which contract deserves attention.',
      'One symbol can contain dozens of expiries, hundreds of strikes, and both calls and puts.',
      'Jumping to the largest premium print skips the most important step: defining the contract.',
      'Every contract begins with three coordinates: expiry, strike, and side.',
      'We will narrow those coordinates with evidence, not with a magic score.',
      'The goal is a contract that is specific enough to inspect and honest enough to explain.',
    ],
  },
  {
    id: 'expiry',
    chapter: '02 · Expiry',
    title: 'Expiry defines the clock.',
    duration: 58 * FPS,
    voiceFile: 'audio/voice/vo-02-expiry.wav',
    captions: [
      'Start with expiry, because expiry defines the clock of the position.',
      'A weekly contract and a three-month contract express very different time and volatility exposure.',
      'Narrow the expiry scope before you compare size.',
      'Use an exact date for a known event, or days-to-expiration for a consistent horizon.',
      'The ranked row aggregates the full selected session.',
      'A large session total does not mean the activity arrived at one moment.',
      'A nearer expiry is not automatically stronger conviction.',
      'Expiry is a constraint: it chooses the clock you are willing to analyze.',
    ],
  },
  {
    id: 'strike',
    chapter: '03 · Strike and moneyness',
    title: 'Choose a location on the chain.',
    duration: 58 * FPS,
    voiceFile: 'audio/voice/vo-03-strike.wav',
    captions: [
      'Next, locate the strike relative to the underlying.',
      'TradingFlow labels contracts as in the money, at the money, or out of the money.',
      'That label uses the latest available print or chain snapshot.',
      'It is a current location, not a summary of the entire session.',
      'Compare nearby strikes within the same expiry.',
      'Check distance, delta, and tradeability together.',
      'A far out-of-the-money contract is not “cheap” just because its option price is small.',
      'You are choosing a location on the chain, not buying a prediction.',
    ],
  },
  {
    id: 'repetition',
    chapter: '04 · Repetition',
    title: 'One print is one observation.',
    duration: 55 * FPS,
    voiceFile: 'audio/voice/vo-04-repetition.wav',
    captions: [
      'A single large print can matter, but it is one observation.',
      'Several prints in the same exact contract create a different evidence pattern.',
      'Contract Rank aggregates those trades into one session row.',
      'Use the trade count, then inspect the underlying prints.',
      'Repetition does not prove that one participant is building a position.',
      'It tells you only that the contract kept reappearing.',
      'Ask and bid shares describe execution-side size share, not literal opening and closing labels.',
      'Repetition should make you more curious, not more certain.',
    ],
  },
  {
    id: 'vol-oi',
    chapter: '05 · Vol/OI',
    title: 'Turnover, not intent.',
    duration: 55 * FPS,
    voiceFile: 'audio/voice/vo-05-vol-oi.wav',
    captions: [
      'Volume-to-open-interest is the fastest metric to misuse.',
      'TradingFlow calculates daily volume divided by open interest when open interest is positive.',
      'A reading of three means today’s volume is three times the reported contracts outstanding.',
      'That is turnover relative to a prior positioning base.',
      'It does not prove that three times the open interest was newly opened.',
      'Contracts can trade repeatedly, positions can close, and open interest updates on another schedule.',
      'When open interest is zero or thin, the ratio is undefined or unstable.',
      'Treat Vol/OI as a turnover shock detector, then verify the prints and liquidity.',
    ],
  },
  {
    id: 'drawer',
    chapter: '06 · Exact-contract inspection',
    title: 'Open the drawer. Separate the evidence.',
    duration: 58 * FPS,
    voiceFile: 'audio/voice/vo-06-drawer.wav',
    captions: [
      'Once the evidence lines up, open the exact-contract drawer.',
      'Flow shows how the selected session traded: premium, size, side mix, and intraday activity.',
      'Positioning adds open interest and changes in open interest.',
      'Those fields can come from a different reporting horizon.',
      'Tradeability asks whether spreads, size, and recent pricing are practical.',
      'Keep intraday flow and prior-session positioning separate.',
      'The drawer is where one ranked row becomes a structured research object.',
      'If the evidence remains coherent, carry the exact option symbol into Option Trades.',
    ],
  },
  {
    id: 'workflow',
    chapter: '07 · Five-check workflow',
    title: 'A funnel, not a score.',
    duration: 53 * FPS,
    voiceFile: 'audio/voice/vo-07-workflow.wav',
    captions: [
      'Here is the workflow.',
      'First, choose the expiry clock.',
      'Second, compare strikes and current moneyness inside that clock.',
      'Third, check whether the exact contract repeated across the session.',
      'Fourth, interpret Vol/OI as turnover relative to open interest.',
      'Fifth, separate Flow, Positioning, and Tradeability in the drawer.',
      'There is no single number that says “trade this.”',
      'Each step removes ambiguity and preserves the reason you kept the candidate.',
    ],
  },
  {
    id: 'practice',
    chapter: '08 · Practice',
    title: 'Produce a research note, not a trade.',
    duration: 53 * FPS,
    voiceFile: 'audio/voice/vo-08-practice.wav',
    captions: [
      'Choose one symbol from your watchlist and narrow it to one expiry.',
      'Compare three neighboring strikes and record the exact contract that repeats most clearly.',
      'Write down its Vol/OI, trade count, moneyness, and one liquidity observation.',
      'Your output is not a trade. It is a contract-level research note.',
      'Next episode: take that option symbol into Option Trades and verify the story print by print.',
      'Check sequence, timing, quote context, and whether the apparent pattern survives inspection.',
      'Move from attention, to evidence, to a decision you can explain.',
    ],
  },
];

export const sceneStart = (index: number) =>
  SCENES.slice(0, index).reduce((sum, scene) => sum + scene.duration, 0);

export const TOTAL_FRAMES = SCENES.reduce((sum, scene) => sum + scene.duration, 0);

