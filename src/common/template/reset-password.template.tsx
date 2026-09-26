import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { TechFonts } from './tech-fonts';
import { techTailwindConfig } from './theme';

const baseUrl = '';

interface PasswordResetEmailProps {
  companyName: string;
  url: string;
}

export const PasswordResetEmail = ({ companyName, url }: PasswordResetEmailProps) => (
  <Tailwind config={techTailwindConfig}>
    <Html>
      <Head>
        <TechFonts />
      </Head>

      <Body className="bg-bg-2 m-0 p-0">
        <Preview>Réinitialisation votre mot de passe</Preview>
        <Container className="mx-auto w-full max-w-160">
          <Section className="bg-bg-3 px-0 pt-14 text-center">
            <Section className="px-6 pb-18">
              <Section className="mb-8">
                {/* <Img
                  src={`${baseUrl}/static/logo.png`}
                  alt="Logo"
                  width={64}
                  className="block mx-auto"
                /> */}
                VERIFIE
              </Section>

              <Section className="mx-auto mb-8 max-w-md">
                <Text className="m-0 font-40 font-geist text-fg">
                  Réinitialiser votre mot de passe
                </Text>
                <Text className="m-0 mt-6 font-14 font-sans text-fg-2">
                Nous avons reçu une demande de réinitialisation du mot de passe de votre email {companyName}.
                <br />
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
                </Text>
              </Section>

              <Button
                href={url}
                className="inline-block border border-button-border bg-white px-5 py-3 font-15 font-sans text-[#1F2222] rounded-[8px]"
              >
                Create New Password
              </Button>
            </Section>
          </Section>    
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

PasswordResetEmail.PreviewProps = {
  companyName: 'Halo',
  url: 'https://example.com/',
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
