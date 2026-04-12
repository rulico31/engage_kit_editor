export interface FontOption {
  label: string;
  value: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting';
}

export const GOOGLE_FONTS: FontOption[] = [
  { label: 'Noto Sans JP', value: "'Noto Sans JP', sans-serif", category: 'sans-serif' },
  { label: 'Noto Serif JP', value: "'Noto Serif JP', serif", category: 'serif' },
  { label: 'Shippori Mincho', value: "'Shippori Mincho', serif", category: 'serif' },
  { label: 'Montserrat', value: "'Montserrat', sans-serif", category: 'sans-serif' },
  { label: 'Kaisei Tokumin', value: "'Kaisei Tokumin', serif", category: 'serif' },
  { label: 'M PLUS Rounded 1c', value: "'M PLUS Rounded 1c', sans-serif", category: 'sans-serif' },
  { label: 'Inter', value: "'Inter', sans-serif", category: 'sans-serif' },
  { label: 'Roboto', value: "'Roboto', sans-serif", category: 'sans-serif' },
];

export const FONT_FAMILIES = [
  { label: 'Default', value: 'inherit' },
  ...GOOGLE_FONTS
];
