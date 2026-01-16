"use client";
import { useState } from "react";
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth-dialog';
import { CheckCircle } from 'lucide-react';

const BENEFITS = [
  "Tüm yayınlarınızı tek ekranda yönetin",
  "Kişiselleştirilebilir grid ve tuval",
  "AI asistan ve otomasyon",
  "Sosyal paylaşım ve işbirliği",
  "Güvenli ve hızlı giriş",
];

export default function AuthPage() {
  const [action, setAction] = useState<'login' | 'signup'>('login');
  // Responsive: show info left (desktop), below (mobile)
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-background">
      {/* Info/Benefits */}
      <div className="md:w-1/2 w-full flex flex-col justify-center bg-card/70 p-8 md:p-12 border-r border-border/30">
        <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6 text-primary">tv25.app ile neler yapabilirsiniz?</h2>
        <ul className="space-y-4 text-base md:text-lg">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-3 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-primary mt-1" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Auth Form */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6 gap-2">
            <Button variant={action === 'login' ? 'default' : 'ghost'} onClick={() => setAction('login')}>Giriş Yap</Button>
            <Button variant={action === 'signup' ? 'default' : 'ghost'} onClick={() => setAction('signup')}>Kayıt Ol</Button>
          </div>
          <AuthDialog action={action} setAction={setAction} authData={null} onAuthSuccess={() => {}} inline />
        </div>
      </div>
    </div>
  );
}
