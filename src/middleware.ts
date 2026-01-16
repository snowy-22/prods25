import { NextRequest, NextResponse } from 'next/server';

// Tüm domainlerde (tv25.app, tv22.app, tv22.app, tv26.app, localhost, vs.) ana sayfa ve alt sayfalar boş/temiz açılır.
// Gerekirse burada özel yönlendirme veya header işlemleri yapılabilir.

export function middleware(req: NextRequest) {
  // İstenirse domain bazlı özel logic eklenebilir
  // Şimdilik sadece devam et
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/guest',
    // Diğer landing ve auth sayfaları
  ],
};
