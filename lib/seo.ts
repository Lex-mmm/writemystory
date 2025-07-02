import type { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
}

export function generateSEOMetadata({
  title = 'WriteMyStory.ai - AI-Powered Biography & Life Story Writing',
  description = 'Create beautiful biographies and life stories with AI assistance. WriteMyStory.ai helps you capture memories, answer meaningful questions, and turn your life experiences into compelling narratives.',
  keywords = [
    'biography writing',
    'life story',
    'memoir writing',
    'AI writing assistant',
    'family history',
    'personal narrative',
    'autobiography',
    'storytelling',
    'memory preservation',
    'legacy writing'
  ],
  canonicalUrl = 'https://writemystory.ai',
  ogImage = '/images/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
}: SEOProps): Metadata {
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'WriteMyStory.ai Team' }],
    creator: 'WriteMyStory.ai',
    publisher: 'WriteMyStory.ai',
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'WriteMyStory.ai',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'nl_NL',
      type: ogType,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImage],
      creator: '@writemystoryai',
    },
    verification: {
      google: 'your-google-verification-code', // Replace with actual verification code
    },
    other: {
      'format-detection': 'telephone=no',
    },
  };
}

export const defaultSEO = generateSEOMetadata({});

// Page-specific SEO configurations
export const pageSEO = {
  home: generateSEOMetadata({
    title: 'WriteMyStory.ai - Turn Your Life Into a Beautiful Story',
    description: 'Create stunning biographies and memoirs with AI assistance. Capture family memories, preserve legacies, and turn life experiences into compelling stories. Start writing your story today.',
    keywords: [
      'biography writing AI',
      'memoir writing service',
      'family story writing',
      'life story app',
      'autobiography generator',
      'memory preservation',
      'family history writing',
      'personal storytelling',
      'legacy writing tool',
      'AI biography assistant'
    ],
  }),
  
  howItWorks: generateSEOMetadata({
    title: 'How It Works - WriteMyStory.ai Biography Writing Process',
    description: 'Learn how WriteMyStory.ai helps you create beautiful biographies. Our simple 4-step process uses AI to turn your memories and answers into compelling life stories.',
    canonicalUrl: 'https://writemystory.ai/how-it-works',
  }),
  
  pricing: generateSEOMetadata({
    title: 'Pricing - Affordable Biography Writing Plans | WriteMyStory.ai',
    description: 'Choose the perfect plan for your biography writing needs. Free trial available. Professional memoir writing with AI assistance starting from just €9.99/month.',
    canonicalUrl: 'https://writemystory.ai/pricing',
    keywords: [
      'biography writing cost',
      'memoir writing price',
      'affordable biography service',
      'life story writing plans',
      'AI writing pricing'
    ],
  }),
  
  about: generateSEOMetadata({
    title: 'About Us - The Story Behind WriteMyStory.ai',
    description: 'Meet the team behind WriteMyStory.ai. Learn why we created this AI-powered platform to help families preserve their most precious memories and life stories.',
    canonicalUrl: 'https://writemystory.ai/about',
  }),
  
  faq: generateSEOMetadata({
    title: 'FAQ - Common Questions About Biography Writing | WriteMyStory.ai',
    description: 'Find answers to frequently asked questions about our AI-powered biography writing service. Learn about privacy, pricing, and how to create beautiful life stories.',
    canonicalUrl: 'https://writemystory.ai/faq',
  }),
};

// Type definitions for structured data
interface FAQ {
  question: string;
  answer: string;
}

interface HowToStep {
  title: string;
  description: string;
}

interface StructuredDataOptions {
  faqs?: FAQ[];
  steps?: HowToStep[];
  [key: string]: unknown;
}

// JSON-LD structured data
export function generateStructuredData(type: 'website' | 'organization' | 'faq' | 'howto', data: StructuredDataOptions = {}) {
  const baseStructuredData = {
    '@context': 'https://schema.org',
  };

  switch (type) {
    case 'website':
      return {
        ...baseStructuredData,
        '@type': 'WebSite',
        name: 'WriteMyStory.ai',
        description: 'AI-powered biography and life story writing platform',
        url: 'https://writemystory.ai',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://writemystory.ai/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      };

    case 'organization':
      return {
        ...baseStructuredData,
        '@type': 'Organization',
        name: 'WriteMyStory.ai',
        description: 'AI-powered biography and memoir writing service',
        url: 'https://writemystory.ai',
        logo: 'https://writemystory.ai/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          email: 'support@writemystory.ai',
        },
        sameAs: [
          'https://twitter.com/writemystoryai',
          'https://linkedin.com/company/writemystoryai',
        ],
      };

    case 'faq':
      return {
        ...baseStructuredData,
        '@type': 'FAQPage',
        mainEntity: data.faqs?.map((faq: FAQ) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };

    case 'howto':
      return {
        ...baseStructuredData,
        '@type': 'HowTo',
        name: 'How to Write Your Biography with AI',
        description: 'Step-by-step guide to creating your life story using WriteMyStory.ai',
        step: data.steps?.map((step: HowToStep, index: number) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.description,
        })),
      };

    default:
      return baseStructuredData;
  }
}
