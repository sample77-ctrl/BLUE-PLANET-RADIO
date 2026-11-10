import React from 'react';
import { SonicRangersGame, type ScreenMode } from './SonicRangersGame';

interface Props {
  onExplore: () => void;
  onSoundOn?: () => void;
  audioReady?: boolean;
  initialScreen?: ScreenMode;
}

export const SonicQuest: React.FC<Props> = (props) => {
  return <SonicRangersGame {...props} />;
};
