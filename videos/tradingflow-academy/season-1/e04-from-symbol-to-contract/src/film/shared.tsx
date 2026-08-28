import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT, MONO} from './theme';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

export const fadeWindow = (frame: number, duration: number) =>
  interpolate(frame, [0, 12, duration - 14, duration], [0, 1, 1, 0], clamp);

export const ChapterChrome: React.FC<{
  chapter: string;
  index: number;
  total: number;
}> = ({chapter, index, total}) => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 28,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: C.muted,
          }}
        >
          {chapter}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 6,
            }}
          >
            {Array.from({length: total}).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === index ? 28 : 8,
                  height: 5,
                  borderRadius: 10,
                  background: i === index ? C.cyan : 'rgba(148,163,184,0.28)',
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: 246,
              height: 50,
              padding: '7px 14px',
              borderRadius: 14,
              background: C.paper,
              boxShadow: '0 12px 36px rgba(0,0,0,0.28)',
            }}
          >
            <Img
              src={staticFile('brand/tradingflow-logo.png')}
              style={{width: '100%', height: '100%', objectFit: 'contain'}}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export const CaptionRail: React.FC<{
  captions: string[];
  duration: number;
}> = ({captions, duration}) => {
  const frame = useCurrentFrame();
  const weights = captions.map((caption) => caption.split(/\s+/).length);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const edges: number[] = [0];
  for (const weight of weights) {
    edges.push(edges[edges.length - 1] + Math.round((weight / total) * duration));
  }
  edges[edges.length - 1] = duration;
  let active = captions.length - 1;
  for (let i = 0; i < captions.length; i++) {
    if (frame >= edges[i] && frame < edges[i + 1]) {
      active = i;
      break;
    }
  }
  const local = frame - edges[active];
  const pageDuration = Math.max(1, edges[active + 1] - edges[active]);
  const opacity = interpolate(local, [0, 5, pageDuration - 5, pageDuration], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 176,
        zIndex: 80,
        background: C.paper,
        color: C.caption,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 84px',
        fontFamily: FONT,
        fontSize: 60,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.022em',
        textAlign: 'center',
      }}
    >
      <div style={{opacity, transform: `translateY(${(1 - opacity) * 7}px)`}}>
        {captions[active]}
      </div>
    </div>
  );
};

export const ProductTexture: React.FC<{
  src: string;
  scale?: number;
  x?: number;
  y?: number;
  opacity?: number;
  brightness?: number;
  radius?: number;
}> = ({src, scale = 1, x = 0, y = 0, opacity = 1, brightness = 1, radius = 28}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        top: 96,
        bottom: 202,
        borderRadius: radius,
        overflow: 'hidden',
        background: C.surface,
        boxShadow: `0 0 0 1px ${C.border}, 0 36px 90px rgba(0,0,0,0.42)`,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          opacity,
          filter: `brightness(${brightness})`,
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
};

export const SceneTitle: React.FC<{
  kicker: string;
  title: string;
  note?: string;
  align?: 'left' | 'center';
}> = ({kicker, title, note, align = 'left'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = interpolate(frame, [0.25 * fps, 0.9 * fps], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'left' ? 92 : 300,
        right: align === 'left' ? 650 : 300,
        top: 132,
        zIndex: 20,
        textAlign: align,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 24}px)`,
      }}
    >
      <div
        style={{
          color: C.cyan,
          fontFamily: MONO,
          fontWeight: 750,
          fontSize: 18,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 16,
          color: C.ink,
          fontFamily: FONT,
          fontWeight: 780,
          fontSize: 72,
          lineHeight: 0.98,
          letterSpacing: '-0.055em',
        }}
      >
        {title}
      </div>
      {note ? (
        <div
          style={{
            marginTop: 22,
            color: C.muted,
            fontFamily: FONT,
            fontSize: 27,
            lineHeight: 1.35,
            maxWidth: align === 'left' ? 850 : undefined,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
};

export const DarkScene: React.FC<{
  children: React.ReactNode;
  opacity?: number;
}> = ({children, opacity = 1}) => (
  <AbsoluteFill
    style={{
      opacity,
      overflow: 'hidden',
      background: `
        radial-gradient(circle at 84% 8%, rgba(37,99,235,0.16), transparent 34%),
        radial-gradient(circle at 12% 86%, rgba(34,211,238,0.08), transparent 28%),
        ${C.void}
      `,
    }}
  >
    {children}
  </AbsoluteFill>
);
