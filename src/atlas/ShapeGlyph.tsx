import React from 'react';
import type { PhenomenonType } from '../types/dataset';
import { MARKER_SHAPE, markerPath } from './markerShape';

/** A small swatch of the layer's marker for legends. Decorative. */
export const ShapeGlyph: React.FC<{ phenomenon: PhenomenonType; color: string; size?: number }> = ({ phenomenon, color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" className="inline-block align-middle shrink-0"><path d={markerPath(MARKER_SHAPE[phenomenon], 7, 7.2, 4.2)} fill={color} /></svg>
);
