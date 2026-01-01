/**
 * Vercel Pro Analytics & Speed Insights
 * Automatically tracks Web Vitals and user interactions
 */

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function VercelAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
