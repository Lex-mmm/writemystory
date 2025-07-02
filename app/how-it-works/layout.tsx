import { Metadata } from 'next';
import { pageSEO, generateStructuredData } from '../../lib/seo';

export const metadata: Metadata = pageSEO.howItWorks;

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const howToStructuredData = generateStructuredData('howto', {
    steps: [
      {
        title: 'Vertel het gewoon',
        description: 'Stuur een spraakberichtje via WhatsApp, net zoals je dat doet met familie.'
      },
      {
        title: 'Slimme vragen krijgen',
        description: 'Onze AI stelt gerichte vragen op basis van wat je hebt verteld.'
      },
      {
        title: 'Bekijk je voortgang online',
        description: 'Volg je verhaal in je persoonlijke dashboard.'
      },
      {
        title: 'Ontvang je verhaal',
        description: 'Download je complete levensverhaal als PDF of gedrukt boek.'
      }
    ]
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToStructuredData),
        }}
      />
      {children}
    </>
  );
}
