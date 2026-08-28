import React from 'react';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
} from 'remotion';
import {SCENES, TOTAL_FRAMES, sceneStart} from './data';
import {
  DrawerScene,
  ExpiryScene,
  GapScene,
  PracticeScene,
  RepetitionScene,
  StrikeScene,
  VolOiScene,
  WorkflowScene,
} from './scenes';
import {CaptionRail, ChapterChrome} from './shared';
import {C, FONT} from './theme';

export {TOTAL_FRAMES};

export type AcademyFilmProps = {
  withBgm: boolean;
  withNarration?: boolean;
  withCaptions?: boolean;
};

type SceneComponent = React.FC<{duration: number}>;

const SCENE_COMPONENTS: SceneComponent[] = [
  GapScene,
  ExpiryScene,
  StrikeScene,
  RepetitionScene,
  VolOiScene,
  DrawerScene,
  WorkflowScene,
  PracticeScene,
];

type SfxCue = {
  from: number;
  duration: number;
  src: string;
  volume: number;
};

const seconds = (value: number) => Math.round(value * 30);

const SFX: SfxCue[] = [
  // Scene 01: camera pushes into the ranked contract row.
  {
    from: sceneStart(0) + seconds(8),
    duration: seconds(1.6),
    src: 'audio/sfx/whoosh-big.mp3',
    volume: 0.25,
  },
  // Scene 01: the exact row lifts, then the contract coordinates lock.
  {
    from: sceneStart(0) + seconds(19.8),
    duration: seconds(1.8),
    src: 'audio/sfx/sparkle.mp3',
    volume: 0.18,
  },
  {
    from: sceneStart(0) + seconds(23.2),
    duration: seconds(1.2),
    src: 'audio/sfx/transition-snap.mp3',
    volume: 0.24,
  },
  // Scene 02: human-paced filter typing, then the expiry set collapses.
  {
    from: sceneStart(1) + seconds(8.1),
    duration: seconds(3),
    src: 'audio/sfx/keyboard.mp3',
    volume: 0.14,
  },
  {
    from: sceneStart(1) + seconds(28),
    duration: seconds(1.3),
    src: 'audio/sfx/transition-soft.mp3',
    volume: 0.18,
  },
  // Scene 03: chain rows begin to embed, then the underlying marker lands.
  {
    from: sceneStart(2) + seconds(9.2),
    duration: seconds(1.3),
    src: 'audio/sfx/transition-soft.mp3',
    volume: 0.18,
  },
  {
    from: sceneStart(2) + seconds(28.4),
    duration: seconds(1),
    src: 'audio/sfx/lock-quick.mp3',
    volume: 0.24,
  },
  // Scene 04: the first repeated print enters the evidence stack.
  {
    from: sceneStart(3) + seconds(8.3),
    duration: seconds(1.3),
    src: 'audio/sfx/transition-soft.mp3',
    volume: 0.16,
  },
  // Scene 05: the turnover tape begins and settles at the observed ratio.
  {
    from: sceneStart(4) + seconds(8),
    duration: seconds(1.6),
    src: 'audio/sfx/whoosh-big.mp3',
    volume: 0.2,
  },
  {
    from: sceneStart(4) + seconds(38.5),
    duration: seconds(1),
    src: 'audio/sfx/lock-quick.mp3',
    volume: 0.22,
  },
  // Scene 06: drawer inspection moves in, then switches to tradeability.
  {
    from: sceneStart(5) + seconds(7),
    duration: seconds(1.5),
    src: 'audio/sfx/whoosh-big.mp3',
    volume: 0.2,
  },
  {
    from: sceneStart(5) + seconds(34),
    duration: seconds(1.2),
    src: 'audio/sfx/transition-snap.mp3',
    volume: 0.2,
  },
  // Scene 07: the evidence line carries the exact contract into Option Trades.
  {
    from: sceneStart(6) + seconds(31.5),
    duration: seconds(1.6),
    src: 'audio/sfx/whoosh-big.mp3',
    volume: 0.2,
  },
  // Scene 08: rise into the unified brand lockup and release the next-episode card.
  {
    from: sceneStart(7) + seconds(23.5),
    duration: seconds(3.5),
    src: 'audio/sfx/riser-cine.mp3',
    volume: 0.22,
  },
  {
    from: sceneStart(7) + seconds(26),
    duration: seconds(1.2),
    src: 'audio/sfx/click-camera.mp3',
    volume: 0.22,
  },
  {
    from: sceneStart(7) + seconds(27.2),
    duration: seconds(1.8),
    src: 'audio/sfx/sparkle.mp3',
    volume: 0.17,
  },
];

const musicVolume = (frame: number) =>
  interpolate(frame, [0, 45, TOTAL_FRAMES - 90, TOTAL_FRAMES], [0, 0.085, 0.085, 0], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Soundtrack: React.FC<AcademyFilmProps> = ({
  withBgm,
  withNarration = false,
}) => {
  return (
    <>
      {withBgm ? (
        <Audio
          src={staticFile('audio/bgm-tech-house.mp3')}
          volume={musicVolume}
          loop
        />
      ) : null}

      {withNarration
        ? SCENES.map((scene, index) => (
            <Sequence
              key={scene.voiceFile}
              from={sceneStart(index)}
              durationInFrames={scene.duration}
              premountFor={30}
            >
              <Audio src={staticFile(scene.voiceFile)} volume={1} />
            </Sequence>
          ))
        : null}

      {SFX.map((cue) => (
        <Sequence
          key={`${cue.from}-${cue.src}`}
          from={cue.from}
          durationInFrames={cue.duration}
          premountFor={15}
        >
          <Audio src={staticFile(cue.src)} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
};

export const AcademyFilm: React.FC<AcademyFilmProps> = ({
  withBgm,
  withNarration = false,
  withCaptions = true,
}) => {
  return (
    <AbsoluteFill style={{background: C.void, fontFamily: FONT}}>
      {SCENES.map((scene, index) => {
        const Scene = SCENE_COMPONENTS[index];
        return (
          <Sequence
            key={scene.id}
            from={sceneStart(index)}
            durationInFrames={scene.duration}
            premountFor={30}
          >
            <Scene duration={scene.duration} />
            <ChapterChrome
              chapter={scene.chapter}
              index={index}
              total={SCENES.length}
            />
            {withCaptions ? (
              <CaptionRail captions={scene.captions} duration={scene.duration} />
            ) : null}
          </Sequence>
        );
      })}
      <Soundtrack withBgm={withBgm} withNarration={withNarration} />
    </AbsoluteFill>
  );
};
