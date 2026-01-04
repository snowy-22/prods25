import { NextRequest, NextResponse } from 'next/server';
import { askAi } from '@/ai/flows/assistant-flow';
import { AssistantInputSchema } from '@/ai/flows/assistant-schema';
import { withMiddleware, withRateLimit, withSecurityHeaders, withValidation } from '@/lib/security/middleware';

const handler = async (req: NextRequest) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const parsed = AssistantInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const result = await askAi(parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Assistant API error:', error);
    return NextResponse.json({ error: 'Assistant service failed' }, { status: 500 });
  }
};

export const POST = withMiddleware(handler, [
  (h) => withValidation(h, AssistantInputSchema),
  withRateLimit,
  withSecurityHeaders,
]);
