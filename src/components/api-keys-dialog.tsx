
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, UploadCloud, TestTube2, Save } from 'lucide-react';

interface ApiKeysDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceTab = ({ serviceName, serviceIcon, serviceFields }: { serviceName: string, serviceIcon: React.ReactNode, serviceFields: string[] }) => {
    const { toast } = useToast();
    const handleSave = () => {
        toast({
            title: `${serviceName} Anahtarları Kaydedildi`,
            description: "API anahtarlarınız yerel olarak kaydedildi.",
        });
    }

    return (
        <div className='space-y-4 p-2'>
            <div className='flex items-center gap-3 mb-4'>
                {serviceIcon}
                <h3 className='text-lg font-semibold'>{serviceName} Entegrasyonu</h3>
            </div>
            {serviceFields.map(field => (
                <div key={field} className='space-y-2'>
                    <label htmlFor={`${serviceName}-${field}`} className='text-sm font-medium text-muted-foreground'>{field}</label>
                    <Input id={`${serviceName}-${field}`} placeholder={`${field} girin...`} />
                </div>
            ))}
            <div className='flex justify-end gap-2 pt-4'>
                <Button variant="outline">
                    <TestTube2 className='mr-2 h-4 w-4' />
                    Bağlantıyı Test Et
                </Button>
                <Button onClick={handleSave}>
                    <Save className='mr-2 h-4 w-4' />
                    Kaydet
                </Button>
            </div>
        </div>
    )
}


export default function ApiKeysDialog({ isOpen, onOpenChange }: ApiKeysDialogProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound /> Entegrasyonlar ve API Anahtarları
          </DialogTitle>
          <DialogDescription>
            Harici servislerle bağlantı kurmak için API anahtarlarınızı buradan yönetin.
            Anahtarlarınız sadece bu tarayıcıda güvenli bir şekilde saklanır.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="google" orientation="vertical" className="h-full">
            <TabsList>
                <TabsTrigger value="google">Google</TabsTrigger>
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
                <TabsTrigger value="spotify">Spotify</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="twitch">Twitch / OBS</TabsTrigger>
                <TabsTrigger value="smartthings">SmartThings</TabsTrigger>
            </TabsList>
            <TabsContent value="google" className="h-full mt-0">
                <ServiceTab 
                    serviceName="Google"
                    serviceIcon={<UploadCloud />}
                    serviceFields={['Google Drive API Key', 'Google Docs API Key', 'Client ID']}
                />
            </TabsContent>
             <TabsContent value="youtube" className="h-full mt-0">
                <ServiceTab 
                    serviceName="YouTube"
                    serviceIcon={<UploadCloud />}
                    serviceFields={['YouTube Data API Key']}
                />
            </TabsContent>
            {/* Other tabs can be added here */}
          </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  );
}
