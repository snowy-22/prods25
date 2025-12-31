
import { AppLogo } from '@/components/icons/app-logo';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-background">
      <div className="relative">
        <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-primary blur-xl"></div>
        <AppLogo className="w-24 h-24 text-primary" />
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
            CanvasFlow
        </h2>
        <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
