import React from 'react';
import {Composition, Folder} from 'remotion';
import {AcademyFilm, TOTAL_FRAMES} from './film/AcademyFilm';

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="TradingFlow-Academy">
      <Composition
        id="TradingFlowAcademyE04"
        component={AcademyFilm}
        defaultProps={{withBgm: true}}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TradingFlowAcademyE04NoBgm"
        component={AcademyFilm}
        defaultProps={{withBgm: false}}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TradingFlowAcademyE04PictureOnly"
        component={AcademyFilm}
        defaultProps={{
          withBgm: false,
          withNarration: false,
          withCaptions: false,
        }}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </Folder>
  );
};
