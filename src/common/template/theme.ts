import { TailwindConfig } from '@react-email/tailwind';

export const techTailwindConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        // Définition des couleurs personnalisées du thème "Tech"
        'bg-2': '#f4f4f5',         // Fond de page (zinc-100)
        'bg-3': '#ffffff',         // Fond de la carte
        'fg': '#18181b',           // Texte principal (zinc-900)
        'fg-2': '#71717a',         // Texte secondaire (zinc-500)
        'button-border': '#e4e4e7' // Bordure du bouton
      },
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      spacing: {
        '14': '3.5rem',
        '18': '4.5rem',
        '160': '40rem', // w-full max-w-160 -> 640px
      },
    },
  },
};
