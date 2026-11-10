import React, { useMemo } from 'react';
import type { World } from './worlds';
import { dotLayer, type Dot } from './dotLayer';

/** A CSS Earth: the bundled NASA Blue Marble texture scrolled behind a round, shaded window. No WebGL. Only the active one spins. */
/** `small`: the 1024 px map (a poster that shows while the 3D Earth loads its own texture). Without WebGL this Earth is the real thing and uses the 2048 px map. */
export const EarthSphere: React.FC<{ world: World; spin: boolean; dots?: readonly Dot[]; dotColor?: string; small?: boolean }> = ({ world, spin, dots = [], dotColor = '#ff7a3d', small = false }) => {
  const tex = `url(/textures/earth_atmos_${small ? 1024 : 2048}.jpg)`;
  const layer = useMemo(() => dotLayer(dots, dotColor), [dots, dotColor]);
  const bg = layer ? `url(${layer}), ${tex}` : tex;
  return (
    <div className="earth" data-spin={spin} style={{ '--f': world.face } as React.CSSProperties} aria-hidden="true">
      <div className="earth-map" style={{ backgroundImage: bg, filter: world.tint }} />
      <div className="earth-shade" />
    </div>
  );
};
