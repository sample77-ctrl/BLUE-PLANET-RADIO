import React from 'react';
import { Star } from 'lucide-react';
import { usePrefs } from '../lib/prefs';

/** Earned / total stars as icons (not emoji), with one accessible label. */
export const StarsRow: React.FC<{ n: number; of?: number }> = ({ n, of = 3 }) => {
  const { lang } = usePrefs();
  return (
    <span role="img" aria-label={`${n} / ${of} ${lang === 'bn' ? 'তারা' : 'stars'}`} className="inline-flex gap-1">
      {Array.from({ length: of }, (_, i) => <Star key={i} className={`w-5 h-5 ${i < n ? 'text-[var(--signal)] fill-current' : 'text-[var(--ink-3)]'}`} aria-hidden="true" />)}
    </span>
  );
};
