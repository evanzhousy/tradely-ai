import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT, MONO} from './theme';
import {DarkScene, ProductTexture, SceneTitle, fadeWindow} from './shared';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const pill: React.CSSProperties = {
  borderRadius: 999,
  padding: '12px 18px',
  background: C.raised,
  boxShadow: `inset 0 0 0 1px ${C.border}`,
  fontFamily: MONO,
  color: C.ink,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '0.02em',
};

export const GapScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const macroStart = duration * 0.14;
  const push = interpolate(frame, [macroStart, duration * 0.32], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const lock = interpolate(frame, [duration * 0.27, duration * 0.34], [0, 1], clamp);
  const lift = interpolate(frame, [duration * 0.36, duration * 0.44, duration * 0.78, duration * 0.84], [0, 1, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const chips = [
    {label: '2026-08-21', sub: 'EXPIRY'},
    {label: '$45', sub: 'STRIKE'},
    {label: 'PUT', sub: 'SIDE'},
  ];
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <ProductTexture
        src="textures/contract-rank.png"
        scale={1 + push * 0.09}
        y={push * -58}
        brightness={1 - lock * 0.26}
      />
      <SceneTitle
        kicker="The problem"
        title="One symbol. Many contracts."
        note="A symbol points to attention. A contract defines the object you can actually inspect."
      />
      <div
        style={{
          position: 'absolute',
          left: 88,
          right: 88,
          top: 710,
          height: 104,
          borderRadius: 16,
          border: `3px solid ${C.cyan}`,
          boxShadow: `0 0 ${42 * lift}px rgba(34,211,238,${0.28 * lift})`,
          opacity: lock,
          transform: `translateY(${-22 * lift}px) scale(${1 + lift * 0.012})`,
          zIndex: 18,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 520,
          right: 520,
          top: 508,
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
          zIndex: 24,
        }}
      >
        {chips.map((chip, index) => {
          const cue = duration * (0.42 + index * 0.075);
          const enter = interpolate(frame, [cue, cue + duration * 0.07], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.back(1.25)),
          });
          return (
            <div
              key={chip.sub}
              style={{
                width: 220,
                padding: '20px 22px',
                borderRadius: 18,
                background: C.raised,
                boxShadow: `0 20px 60px rgba(0,0,0,0.46), inset 0 0 0 1px ${C.border}`,
                transform: `translateY(${(1 - enter) * 34}px) scale(${0.94 + enter * 0.06})`,
                opacity: enter,
                textAlign: 'center',
              }}
            >
              <div style={{fontFamily: MONO, fontSize: 16, color: C.cyan, letterSpacing: '0.12em'}}>{chip.sub}</div>
              <div style={{fontFamily: FONT, fontSize: 31, color: C.ink, fontWeight: 760, marginTop: 8}}>{chip.label}</div>
            </div>
          );
        })}
      </div>
    </DarkScene>
  );
};

export const ExpiryScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const typeStart = duration * 0.14;
  const query = '22 DTE';
  const typingSpan = duration * 0.08;
  const chars = Math.min(
    query.length,
    Math.max(0, Math.floor(((frame - typeStart) / typingSpan) * query.length)),
  );
  const filter = interpolate(frame, [duration * 0.48, duration * 0.62], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const dates = [
    {date: 'JUL 30', dte: '0D'},
    {date: 'AUG 21', dte: '22D'},
    {date: 'SEP 18', dte: '50D'},
    {date: 'DEC 18', dte: '141D'},
  ];
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <ProductTexture src="textures/contract-rank.png" brightness={0.45} scale={1.05} y={-92} />
      <SceneTitle kicker="Evidence 01" title="Expiry defines the clock." note="Narrow the time horizon before comparing contract size." />
      <div
        style={{
          position: 'absolute',
          left: 156,
          right: 156,
          top: 402,
          height: 390,
          borderRadius: 28,
          background: 'rgba(11,15,24,0.96)',
          boxShadow: `0 0 0 1px ${C.border}, 0 34px 90px rgba(0,0,0,0.5)`,
          padding: 36,
          zIndex: 22,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{fontFamily: MONO, color: C.muted, fontSize: 17, letterSpacing: '0.12em'}}>EXPIRY FILTER</div>
          <div style={{...pill, width: 220, height: 54, padding: '13px 18px'}}>
            {query.slice(0, chars)}
            <span style={{display: 'inline-block', width: 2, height: 24, marginLeft: 5, background: C.cyan}} />
          </div>
        </div>
        <div style={{display: 'flex', gap: 22, marginTop: 48}}>
          {dates.map((item, index) => {
            const target = index === 1;
            const disappear = target ? 0 : filter;
            const slide = target ? interpolate(filter, [0, 1], [0, -232], clamp) : 0;
            return (
              <div
                key={item.date}
                style={{
                  flex: 1,
                  height: 190,
                  borderRadius: 22,
                  background: target ? 'rgba(37,99,235,0.22)' : C.raised,
                  boxShadow: target ? `inset 0 0 0 2px ${C.cobalt}, 0 0 36px rgba(37,99,235,0.18)` : `inset 0 0 0 1px ${C.border}`,
                  opacity: 1 - disappear,
                  transform: `translateX(${slide}px) translateY(${disappear * 24}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div style={{fontFamily: MONO, color: target ? C.cyan : C.muted, fontSize: 18}}>{item.date}</div>
                <div style={{fontFamily: FONT, color: C.ink, fontSize: 58, fontWeight: 780, marginTop: 12}}>{item.dte}</div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 36,
            bottom: 24,
            color: C.amber,
            fontFamily: FONT,
            fontSize: 20,
          }}
        >
          Full-session aggregate · not one moment
        </div>
      </div>
    </DarkScene>
  );
};

const ChainRow: React.FC<{
  index: number;
  frame: number;
  cue: number;
  strike: string;
  money: string;
  delta: string;
  color: string;
}> = ({index, frame, cue, strike, money, delta, color}) => {
  const enter = interpolate(frame, [cue, cue + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.15)),
  });
  const air = 1 - enter;
  return (
    <div
      style={{
        height: 106,
        borderRadius: 18,
        padding: '0 28px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1fr',
        alignItems: 'center',
        background: C.raised,
        boxShadow: `0 ${30 * air}px ${60 * air}px rgba(0,0,0,${0.34 * air}), inset 0 0 0 1px ${C.border}`,
        transform: `perspective(900px) translateY(${-130 * air}px) rotateX(${15 * air}deg) scale(${1.04 - enter * 0.04})`,
        opacity: enter,
        marginTop: index === 0 ? 0 : 14,
      }}
    >
      <div style={{fontFamily: MONO, color: C.ink, fontWeight: 760, fontSize: 35}}>{strike}</div>
      <div style={{justifySelf: 'start', ...pill, padding: '9px 15px', color}}>{money}</div>
      <div style={{justifySelf: 'end', fontFamily: MONO, color: C.muted, fontSize: 27}}>{delta} Δ</div>
    </div>
  );
};

export const StrikeScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const cue = duration * 0.16;
  const strikes = [
    {strike: '$40', money: 'ITM', delta: '0.68', color: C.green},
    {strike: '$45', money: 'ATM', delta: '0.51', color: C.cyan},
    {strike: '$50', money: 'OTM', delta: '0.31', color: C.amber},
  ];
  const lineGrow = interpolate(frame, [duration * 0.49, duration * 0.65], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <SceneTitle kicker="Evidence 02" title="Choose a location on the chain." note="Moneyness is a latest-snapshot label. Session totals still describe the full selected session." />
      <div style={{position: 'absolute', left: 92, top: 398, width: 760}}>
        {strikes.map((item, index) => (
          <ChainRow
            key={item.strike}
            index={index}
            frame={frame}
            cue={cue + index * duration * 0.1}
            {...item}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 92,
          top: 380,
          width: 860,
          height: 424,
          borderRadius: 28,
          background: C.surface,
          boxShadow: `inset 0 0 0 1px ${C.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: 56, top: 42, fontFamily: MONO, fontSize: 17, letterSpacing: '0.12em', color: C.muted}}>
          LATEST UNDERLYING · $45.20
        </div>
        <svg viewBox="0 0 860 424" style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="blueLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#67E8F9" />
            </linearGradient>
          </defs>
          <line x1="72" y1="260" x2={72 + 716 * lineGrow} y2="260" stroke="url(#blueLine)" strokeWidth="8" strokeLinecap="round" />
          <line x1="445" y1="116" x2="445" y2="338" stroke={C.cyan} strokeWidth="3" strokeDasharray="8 8" opacity={lineGrow} />
          {[190, 445, 700].map((x, index) => (
            <g key={x} opacity={lineGrow}>
              <circle cx={x} cy="260" r={index === 1 ? 18 : 13} fill={index === 1 ? C.cyan : C.cobalt} />
              <text x={x} y="320" textAnchor="middle" fill={C.ink} fontFamily={MONO} fontSize="27">{strikes[index].strike}</text>
            </g>
          ))}
        </svg>
        <div style={{position: 'absolute', right: 34, bottom: 28, color: C.muted, fontFamily: FONT, fontSize: 21}}>
          Distance + delta + liquidity
        </div>
      </div>
    </DarkScene>
  );
};

const PrintCard: React.FC<{
  frame: number;
  cue: number;
  y: number;
  time: string;
  size: string;
  side: string;
  color: string;
}> = ({frame, cue, y, time, size, side, color}) => {
  const enter = interpolate(frame, [cue, cue + 18], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.2)),
  });
  const press = interpolate(frame, [cue + 14, cue + 18, cue + 24], [0, 7, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y + press,
        height: 86,
        borderRadius: 16,
        background: C.raised,
        boxShadow: `0 ${24 * (1 - enter)}px ${54 * (1 - enter)}px rgba(0,0,0,0.4), inset 0 0 0 1px ${C.border}`,
        transform: `translateY(${(1 - enter) * 520}px) rotate(${(1 - enter) * (y % 2 ? 2 : -2)}deg)`,
        opacity: enter,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{fontFamily: MONO, color: C.muted, fontSize: 20}}>{time}</div>
      <div style={{fontFamily: MONO, color: C.ink, fontSize: 27, fontWeight: 760, justifySelf: 'center'}}>{size}</div>
      <div style={{fontFamily: MONO, color, fontSize: 20, fontWeight: 760, justifySelf: 'end'}}>{side}</div>
    </div>
  );
};

export const RepetitionScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const start = duration * 0.15;
  const prints = [
    ['09:42:16', '220', 'ASK', C.green],
    ['09:47:08', '180', 'MID', C.muted],
    ['10:03:41', '260', 'ASK', C.green],
    ['10:17:26', '140', 'BID', C.red],
    ['10:31:52', '210', 'ASK', C.green],
  ] as const;
  const interval = duration * 0.1;
  const landed = prints.filter((_, index) => frame >= start + index * interval + 18).length;
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <ProductTexture src="textures/option-trades.png" brightness={0.28} scale={1.08} />
      <SceneTitle kicker="Evidence 03" title="One print is one observation." note="Repeated appearances change the pattern, but not the certainty." />
      <div
        style={{
          position: 'absolute',
          left: 148,
          top: 400,
          width: 640,
          height: 390,
          borderRadius: 28,
          background: 'rgba(11,15,24,0.96)',
          padding: 26,
          boxShadow: `inset 0 0 0 1px ${C.border}`,
          overflow: 'hidden',
          zIndex: 20,
        }}
      >
        {prints.map((print, index) => (
          <PrintCard
            key={print[0]}
            frame={frame}
            cue={start + index * interval}
            y={index * 58}
            time={print[0]}
            size={print[1]}
            side={print[2]}
            color={print[3]}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 152,
          top: 418,
          width: 740,
          height: 352,
          borderRadius: 28,
          background: C.surface,
          padding: 42,
          boxShadow: `inset 0 0 0 1px ${C.border}`,
          zIndex: 20,
        }}
      >
        <div style={{fontFamily: MONO, color: C.muted, fontSize: 18, letterSpacing: '0.12em'}}>EXACT CONTRACT</div>
        <div style={{fontFamily: MONO, color: C.ink, fontSize: 38, fontWeight: 760, marginTop: 14}}>TREE260821P00045000</div>
        <div style={{display: 'flex', gap: 20, marginTop: 50}}>
          <div style={{...pill, flex: 1, padding: 22}}>
            <div style={{fontSize: 17, color: C.muted}}>TRADE COUNT</div>
            <div style={{fontFamily: FONT, fontSize: 70, color: C.cyan, marginTop: 8}}>{landed}</div>
          </div>
          <div style={{...pill, flex: 1, padding: 22}}>
            <div style={{fontSize: 17, color: C.muted}}>CLAIM</div>
            <div style={{fontFamily: FONT, fontSize: 27, color: C.amber, marginTop: 18, lineHeight: 1.2}}>Reappeared<br />≠ same buyer</div>
          </div>
        </div>
      </div>
    </DarkScene>
  );
};

const turnoverValue = (frame: number, start: number, span: number) => {
  const local = frame - start;
  if (local < span * 0.12) return 0.4;
  if (local < span * 0.28) {
    return interpolate(local, [span * 0.12, span * 0.28], [0.4, 1], clamp);
  }
  if (local < span * 0.48) return interpolate(local, [span * 0.28, span * 0.48], [1, 3], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  if (local < span * 0.74) return interpolate(local, [span * 0.48, span * 0.74], [3, 12.8], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  if (local < span * 0.88) return interpolate(local, [span * 0.74, span * 0.88], [12.8, 11.6], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return interpolate(local, [span * 0.88, span], [11.6, 12], clamp);
};

export const VolOiScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const start = duration * 0.14;
  const value = turnoverValue(frame, start, duration * 0.58);
  const ticks = [0.4, 1, 3, 6, 12, 24, 48, 96];
  const pointerY = 585;
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <SceneTitle kicker="Evidence 04" title="Turnover, not intent." note="Vol/OI compares today’s volume with the reported contracts outstanding." />
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 408,
          width: 850,
          height: 374,
          borderRadius: 28,
          background: C.surface,
          padding: 44,
          boxShadow: `inset 0 0 0 1px ${C.border}`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 18, color: C.cyan, letterSpacing: '0.13em'}}>VOLUME-TO-OPEN-INTEREST</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 48}}>
          <div style={{...pill, fontSize: 31, padding: '22px 28px'}}>Daily volume</div>
          <div style={{fontFamily: FONT, fontSize: 58, color: C.ink}}>÷</div>
          <div style={{...pill, fontSize: 31, padding: '22px 28px'}}>Open interest</div>
        </div>
        <div style={{marginTop: 52, fontFamily: FONT, fontSize: 27, color: C.amber}}>Not proof that positions were opened.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 100,
          top: 386,
          width: 760,
          height: 420,
          borderRadius: 28,
          background: C.surface,
          boxShadow: `inset 0 0 0 1px ${C.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', left: 52, top: 36, fontFamily: MONO, color: C.muted, fontSize: 17, letterSpacing: '0.12em'}}>TURNOVER TAPE</div>
        <div style={{position: 'absolute', left: 52, right: 52, top: 90, bottom: 42, overflow: 'hidden'}}>
          {ticks.map((tick) => {
            const y = pointerY - 386 + (Math.log2(value + 0.4) - Math.log2(tick + 0.4)) * 82;
            return (
              <div key={tick} style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 18}}>
                <div style={{width: 70, textAlign: 'right', fontFamily: MONO, color: C.muted, fontSize: 26}}>{tick}×</div>
                <div style={{height: 3, flex: 1, background: 'linear-gradient(90deg,#1D4ED8,#67E8F9)', opacity: tick <= 12 ? 0.9 : 0.34}} />
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', left: 42, right: 42, top: 200, height: 4, background: C.cyan, boxShadow: '0 0 24px rgba(34,211,238,0.55)'}} />
        <div style={{position: 'absolute', right: 52, top: 232, fontFamily: FONT, fontSize: 76, fontWeight: 800, color: C.cyan, fontVariantNumeric: 'tabular-nums'}}>
          {value.toFixed(value < 10 ? 1 : 0)}×
        </div>
        <div style={{position: 'absolute', right: 52, bottom: 40, fontFamily: FONT, fontSize: 21, color: C.muted}}>Daily volume ÷ OI</div>
      </div>
    </DarkScene>
  );
};

export const DrawerScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const flowOpacity = interpolate(frame, [0, duration * 0.56, duration * 0.7], [1, 1, 0], clamp);
  const tradeOpacity = interpolate(frame, [duration * 0.58, duration * 0.72], [0, 1], clamp);
  const fly = interpolate(frame, [duration * 0.12, duration * 0.3], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const labels = [
    {name: 'FLOW', x: 286, delay: 0.22},
    {name: 'POSITIONING', x: 825, delay: 0.3},
    {name: 'TRADEABILITY', x: 1398, delay: 0.38},
  ];
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 96,
          bottom: 202,
          borderRadius: 30,
          overflow: 'hidden',
          background: C.surface,
          boxShadow: `0 0 0 1px ${C.border}, 0 38px 100px rgba(0,0,0,0.48)`,
          perspective: 1300,
        }}
      >
        <Img
          src={staticFile('textures/drawer-flow.png')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: flowOpacity,
            transform: `translate(${(1 - fly) * -72}px, ${(1 - fly) * 38}px) rotateY(${(1 - fly) * 10}deg) scale(${1.08 - fly * 0.08})`,
            filter: `brightness(${0.72 + fly * 0.28})`,
          }}
        />
        <Img
          src={staticFile('textures/drawer-tradeability.png')}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: tradeOpacity,
          }}
        />
      </div>
      <SceneTitle kicker="Evidence 05" title="Separate the evidence." note="Flow, Positioning, and Tradeability answer different questions and can use different horizons." />
      {labels.map((label) => {
        const enter = interpolate(frame, [label.delay * duration, (label.delay + 0.08) * duration], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={label.name}
            style={{
              position: 'absolute',
              left: label.x,
              top: 378,
              width: 240,
              textAlign: 'center',
              padding: '12px 16px',
              borderRadius: 999,
              background: 'rgba(5,7,13,0.9)',
              boxShadow: `inset 0 0 0 1px ${C.cyan}, 0 ${26 * (1 - enter)}px ${52 * (1 - enter)}px rgba(0,0,0,0.5)`,
              color: C.cyan,
              fontFamily: MONO,
              fontSize: 17,
              fontWeight: 760,
              letterSpacing: '0.1em',
              transform: `translateY(${(1 - enter) * -95}px)`,
              opacity: enter,
              zIndex: 24,
            }}
          >
            {label.name}
          </div>
        );
      })}
      <div style={{position: 'absolute', right: 88, top: 268, ...pill, color: C.amber, zIndex: 26}}>Mixed horizons · keep separate</div>
    </DarkScene>
  );
};

export const WorkflowScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const travelStart = duration * 0.58;
  const cam = interpolate(frame, [travelStart, duration * 0.76], [0, 1920], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const line = interpolate(frame, [duration * 0.52, duration * 0.8], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const checks = [
    'Choose the expiry clock',
    'Compare strike and moneyness',
    'Check repetition',
    'Interpret Vol/OI as turnover',
    'Separate the drawer evidence',
  ];
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <div style={{position: 'absolute', width: 3840, height: 1080, transform: `translateX(${-cam}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
          <ProductTexture src="textures/contract-rank.png" brightness={0.38} />
          <SceneTitle kicker="The method" title="A funnel, not a score." note="Each check removes ambiguity while preserving the reason you kept the candidate." />
          <div style={{position: 'absolute', left: 188, top: 390, width: 760}}>
            {checks.map((check, index) => {
              const enter = interpolate(frame, [duration * (0.12 + index * 0.085), duration * (0.18 + index * 0.085)], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              });
              return (
                <div
                  key={check}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    height: 66,
                    marginTop: index === 0 ? 0 : 12,
                    padding: '0 20px',
                    borderRadius: 15,
                    background: C.raised,
                    boxShadow: `inset 0 0 0 1px ${C.border}`,
                    transform: `translateX(${(1 - enter) * -54}px)`,
                    opacity: enter,
                  }}
                >
                  <div style={{width: 28, height: 28, borderRadius: 14, background: C.cyan, color: C.void, display: 'grid', placeItems: 'center', fontWeight: 900}}>✓</div>
                  <div style={{fontFamily: FONT, color: C.ink, fontSize: 26, fontWeight: 680}}>{check}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{position: 'absolute', left: 1920, top: 0, width: 1920, height: 1080}}>
          <ProductTexture src="textures/option-trades.png" brightness={0.78} />
          <div style={{position: 'absolute', left: 244, top: 228, color: C.cyan, fontFamily: MONO, fontSize: 19, letterSpacing: '0.13em'}}>EXACT-CONTRACT HANDOFF</div>
          <div style={{position: 'absolute', left: 244, top: 266, color: C.ink, fontFamily: FONT, fontSize: 70, fontWeight: 790, letterSpacing: '-0.05em'}}>Verify it print by print.</div>
          <div style={{position: 'absolute', left: 244, top: 368, ...pill, fontSize: 28}}>TREE260821P00045000</div>
        </div>
        <svg width="3840" height="1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
          <path
            d="M 850 740 L 1640 740 L 2180 520 L 3120 520"
            fill="none"
            stroke={C.cyan}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - line}
          />
          <circle cx={850 + 2270 * line} cy={line < 0.35 ? 740 : line < 0.6 ? 740 - ((line - 0.35) / 0.25) * 220 : 520} r="12" fill={C.cyan} />
        </svg>
      </div>
    </DarkScene>
  );
};

const BrandLockup: React.FC<{progress: number}> = ({progress}) => (
  <div
    style={{
      width: 720,
      height: 170,
      padding: '22px 36px',
      borderRadius: 30,
      background: C.paper,
      boxShadow: '0 34px 90px rgba(0,0,0,0.5)',
      opacity: progress,
      transform: `scale(${0.86 + progress * 0.14})`,
      display: 'grid',
      placeItems: 'center',
    }}
  >
    <Img src={staticFile('brand/tradingflow-logo.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
);

export const PracticeScene: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const evidenceBadges = ['EXPIRY', 'STRIKE', 'REPEAT', 'VOL/OI', 'DRAWER'];
  const flipStart = duration * 0.48;
  const anticipation = interpolate(frame, [duration * 0.42, duration * 0.44, duration * 0.46, flipStart], [0, -7, 10, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const flatten = interpolate(frame, [flipStart, flipStart + 0.45 * fps], [1, 0.04], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const bloom = spring({
    frame: frame - (flipStart + 0.45 * fps),
    fps,
    config: {damping: 14, stiffness: 120, mass: 0.9},
  });
  const showBrand = frame >= flipStart + 0.45 * fps;
  const next = interpolate(frame, [duration * 0.74, duration * 0.82], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <DarkScene opacity={fadeWindow(frame, duration)}>
      <SceneTitle kicker="Practice" title="Produce a research note, not a trade." note="One expiry · three neighboring strikes · one exact contract · four recorded observations" align="center" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 438, display: 'grid', placeItems: 'center', zIndex: 22}}>
        {!showBrand ? (
          <div
            style={{
              width: 820,
              height: 132,
              borderRadius: 24,
              background: C.raised,
              boxShadow: `0 30px 90px rgba(0,0,0,0.5), inset 0 0 0 1px ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 34px',
              transform: `rotate(${anticipation}deg) scaleX(${flatten})`,
              transformOrigin: 'center 80%',
              filter: flatten < 0.5 ? `blur(${(0.5 - flatten) * 8}px)` : 'none',
            }}
          >
            <div style={{fontFamily: MONO, color: C.ink, fontSize: 39, fontWeight: 760}}>TREE · 2026-08-21 · $45 PUT</div>
            <div style={{fontFamily: MONO, color: C.cyan, fontSize: 24}}>RESEARCH NOTE</div>
          </div>
        ) : (
          <BrandLockup progress={Math.min(1.06, bloom)} />
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 255,
          right: 255,
          top: 648,
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          zIndex: 24,
        }}
      >
        {evidenceBadges.map((badge, index) => {
          const cue = duration * (0.58 + index * 0.022);
          const enter = interpolate(frame, [cue, cue + duration * 0.065], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.back(1.15)),
          });
          const xFrom = [-220, -110, 0, 110, 220][index];
          const yFrom = [70, -60, 90, -50, 70][index];
          return (
            <div
              key={badge}
              style={{
                width: 250,
                height: 58,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                background: C.raised,
                boxShadow: `inset 0 0 0 1px ${C.border}, 0 ${28 * (1 - enter)}px ${56 * (1 - enter)}px rgba(0,0,0,0.42)`,
                color: index === 4 ? C.cyan : C.ink,
                fontFamily: MONO,
                fontWeight: 760,
                fontSize: 18,
                letterSpacing: '0.09em',
                opacity: enter,
                transform: `translate(${(1 - enter) * xFrom}px, ${(1 - enter) * yFrom}px) scale(${0.9 + enter * 0.1})`,
              }}
            >
              {badge}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 360,
          right: 360,
          top: 744,
          textAlign: 'center',
          opacity: next,
          transform: `translateY(${(1 - next) * 24}px)`,
        }}
      >
        <div style={{fontFamily: MONO, color: C.cyan, fontSize: 18, letterSpacing: '0.13em'}}>NEXT EPISODE</div>
        <div style={{fontFamily: FONT, color: C.ink, fontSize: 44, fontWeight: 760, marginTop: 12}}>Verify the setup print by print</div>
        <div style={{fontFamily: FONT, color: C.muted, fontSize: 25, marginTop: 12}}>Sequence · timing · quote context · pattern durability</div>
      </div>
    </DarkScene>
  );
};
