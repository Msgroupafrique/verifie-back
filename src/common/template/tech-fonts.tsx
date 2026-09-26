import { Font } from '@react-email/components';

export const TechFonts = () => {
  return (
    <>
      {/* Chargement de la police Geist sans-serif */}
      <Font
        fontFamily="Geist"
        fallbackFontFamily="sans-serif"
        webFont={{
          url: 'https://gstatic.com',
          format: 'woff2',
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </>
  );
};
