import { NextRequest, NextResponse } from 'next/server';

// Payments are disabled: Stripe integration fully removed
function paymentsDisabled() {
  return NextResponse.json(
    { error: 'Payments are disabled', configured: false },
    { status: 503 }
  );
}

export const POST = async (_req: NextRequest) => {
  return paymentsDisabled();
};

export const GET = async (_req: NextRequest) => {
  return paymentsDisabled();
};
