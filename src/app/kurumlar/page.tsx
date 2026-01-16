"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function KurumsalPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full bg-card/80 p-8 md:p-12 border border-primary/30 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl font-bold">Kurumsal Üyelik & Demo Talebi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground mb-6 text-center">
            Ekipler, ajanslar ve markalar için özel çözümler. Kurumsal üyelik, entegrasyon ve demo talepleriniz için bizimle iletişime geçin.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" asChild>
              <a href="mailto:info@tv25.app?subject=Kurumsal%20Demo%20Talebi">
                Demo Talep Et <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Kurumsal üyelik hakkında daha fazla bilgi için <a href="mailto:info@tv25.app" className="underline">info@tv25.app</a> adresine yazabilirsiniz.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
