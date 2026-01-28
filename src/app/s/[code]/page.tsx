/**
 * Short URL Redirect
 * /s/[code] -> /share/[token]
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShortUrlRedirect({ params, searchParams }: PageProps) {
  const { code } = await params;
  const search = await searchParams;
  
  const supabase = await createClient();
  
  // Find export by short code
  const { data: exportData, error } = await supabase
    .from('exports')
    .select('share_token, is_public')
    .eq('short_code', code)
    .single();

  if (error || !exportData) {
    notFound();
  }

  // Build redirect URL with UTM params
  const baseUrl = `/share/${exportData.share_token}`;
  const utmParams = new URLSearchParams();
  
  if (search.utm_source) utmParams.set('utm_source', String(search.utm_source));
  if (search.utm_medium) utmParams.set('utm_medium', String(search.utm_medium));
  if (search.utm_campaign) utmParams.set('utm_campaign', String(search.utm_campaign));
  if (search.utm_term) utmParams.set('utm_term', String(search.utm_term));
  if (search.utm_content) utmParams.set('utm_content', String(search.utm_content));

  const redirectUrl = utmParams.toString() 
    ? `${baseUrl}?${utmParams.toString()}`
    : baseUrl;

  redirect(redirectUrl);
}
