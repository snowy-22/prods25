"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  ReservationSlot, 
  Reservation, 
  CustomerInfo,
  ReservationWidgetConfig,
  generateDaySlots,
  ECommerceBlockchain 
} from '@/lib/ecommerce-system';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ContentItem } from '@/lib/initial-content';

interface ReservationWidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

const DEFAULT_CONFIG: ReservationWidgetConfig = {
  id: 'default-reservation',
  title: 'Rezervasyon Sistemi',
  serviceType: 'general',
  workingHours: { start: '09:00', end: '18:00' },
  slotDuration: 60,
  maxCapacityPerSlot: 5,
  pricingTiers: [
    { name: 'Standard', price: 100, currency: 'TRY' }
  ],
  settings: {
    requireConfirmation: true,
    allowCancellation: true,
    cancellationDeadlineHours: 24,
    requirePaymentUpfront: false
  }
};

export default function ReservationWidget({ item, onUpdate }: ReservationWidgetProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ReservationSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<ReservationSlot[]>([]);
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [participants, setParticipants] = useState(1);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  const config = (item.metadata?.reservationConfig as ReservationWidgetConfig) || DEFAULT_CONFIG;
  const blockchain = new ECommerceBlockchain();

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const slots = generateDaySlots(dateStr, config, existingReservations);
      setAvailableSlots(slots);
    }
  }, [selectedDate, existingReservations]);

  const handleSlotSelect = (slot: ReservationSlot) => {
    if (slot.isAvailable) {
      setSelectedSlot(slot);
      setShowBookingForm(true);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !customerInfo.name || !customerInfo.email) {
      alert('Lütfen tüm gerekli bilgileri doldurun');
      return;
    }

    const totalPrice = selectedSlot.price * participants;
    
    const reservation = blockchain.createReservation(
      'user-id', // Should come from auth context
      selectedSlot.id,
      customerInfo,
      participants,
      totalPrice,
      selectedSlot.currency
    );

    // Auto-confirm if configured
    const finalReservation = config.settings.requireConfirmation
      ? reservation
      : blockchain.confirmReservation(reservation, 'auto-confirm');

    setConfirmedReservation(finalReservation);
    setExistingReservations([...existingReservations, finalReservation]);
    setShowBookingForm(false);

    // Award achievement if first reservation
    if (existingReservations.length === 0) {
      // TODO: Award 'ach-first-reservation' achievement
    }
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 {config.title}
        </CardTitle>
        <CardDescription>{config.description || 'Rezervasyon oluşturun ve yönetin'}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {confirmedReservation ? (
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-500">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-300">
                Rezervasyon Onaylandı!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {format(new Date(selectedSlot!.date), 'dd MMMM yyyy', { locale: tr })}
                {' '}saat {selectedSlot!.startTime}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rezervasyon ID:</span>
                <span className="font-mono font-bold">{confirmedReservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Katılımcı:</span>
                <span className="font-semibold">{confirmedReservation.participants} kişi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam:</span>
                <span className="font-bold text-lg">
                  {confirmedReservation.totalPrice} {confirmedReservation.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain Hash:</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {confirmedReservation.blockchainHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doğrulama:</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                  ✓ {confirmedReservation.verificationChain.length} doğrulama
                </Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setConfirmedReservation(null)}
            >
              Yeni Rezervasyon
            </Button>
          </div>
        ) : showBookingForm && selectedSlot ? (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowBookingForm(false)}
            >
              ← Geri
            </Button>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Seçili Slot</h4>
              <p className="text-sm">
                📅 {format(new Date(selectedSlot.date), 'dd MMMM yyyy', { locale: tr })}
              </p>
              <p className="text-sm">
                🕐 {selectedSlot.startTime} - {selectedSlot.endTime}
              </p>
              <p className="text-sm">
                💰 {selectedSlot.price} {selectedSlot.currency} / kişi
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">İsim Soyisim *</label>
                <Input 
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Adınız Soyadınız"
                />
              </div>

              <div>
                <label className="text-sm font-medium">E-posta *</label>
                <Input 
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input 
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="+90 XXX XXX XX XX"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Katılımcı Sayısı</label>
                <Input 
                  type="number"
                  min={1}
                  max={selectedSlot.capacity - selectedSlot.booked}
                  value={participants}
                  onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maks: {selectedSlot.capacity - selectedSlot.booked} kişi
                </p>
              </div>

              <div className="p-3 bg-primary/10 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Toplam:</span>
                  <span className="text-xl font-bold">
                    {selectedSlot.price * participants} {selectedSlot.currency}
                  </span>
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={handleBooking}
                disabled={!customerInfo.name || !customerInfo.email}
              >
                🔒 Rezervasyonu Onayla ve Hash'le
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="border rounded-lg p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                disabled={(date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return config.blockDates?.includes(dateStr) || false;
                }}
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">
                  Müsait Slotlar - {format(selectedDate, 'dd MMMM yyyy', { locale: tr })}
                </h4>
                
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Bu tarih için müsait slot bulunamadı
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 rounded border-2 text-left transition-all ${
                          slot.isAvailable
                            ? 'border-primary hover:bg-primary/10 cursor-pointer'
                            : 'border-muted bg-muted/20 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="font-semibold text-sm">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {slot.isAvailable ? (
                            <span className="text-green-600">
                              ✓ {slot.capacity - slot.booked} yer
                            </span>
                          ) : (
                            <span className="text-red-600">Dolu</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold mt-1">
                          {slot.price} {slot.currency}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="flex gap-2 text-xs text-muted-foreground border-t pt-3">
          <Badge variant="secondary">
            📊 {existingReservations.length} toplam rezervasyon
          </Badge>
          <Badge variant="secondary">
            🔗 Blockchain doğrulamalı
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
