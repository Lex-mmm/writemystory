import { Metadata } from 'next';
import { pageSEO } from '../../lib/seo';

export const metadata: Metadata = pageSEO.pricing;

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
