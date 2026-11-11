import type { Topic } from '../stories/stories';

/** Which data colour tints the interface for what is playing. Values are the names of the `--data` tokens in index.css. */
export type DatasetTheme = 'fire' | 'rain' | 'warm' | 'cold' | 'teal' | 'brass';
export const DATASET_THEMES: DatasetTheme[] = ['fire', 'rain', 'warm', 'cold', 'teal', 'brass'];

export const THEME_OF_TOPIC: Record<Topic, DatasetTheme> = {
  temperature: 'warm', greenhouse: 'brass', ice: 'cold', ocean: 'teal', fire: 'fire', rain: 'rain', agriculture: 'teal',
};
