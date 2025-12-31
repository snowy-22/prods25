/**
 * Philips Hue API Endpoint
 * GET /api/hue/lights - Tüm ışıkları getir
 * POST /api/hue/lights/{id}/toggle - Işığı aç/kapat
 * POST /api/hue/lights/{id}/brightness - Parlaklığı değiştir
 * POST /api/hue/lights/{id}/color - Rengi değiştir
 */

import { NextRequest, NextResponse } from 'next/server';
import PhilipsHueClient from '@/lib/hue/client';

// Singleton instance
let hueClient: PhilipsHueClient | null = null;

function getHueClient(): PhilipsHueClient | null {
  if (!hueClient) {
    const bridgeIP = process.env.NEXT_PUBLIC_HUE_BRIDGE_IP;
    const apiKey = process.env.HUE_API_KEY;

    if (!bridgeIP || !apiKey) {
      console.error('Hue Bridge IP veya API Key tanımlanmamış');
      return null;
    }

    hueClient = new PhilipsHueClient({
      bridgeIP,
      apiKey,
    });
  }
  return hueClient;
}

export async function GET(req: NextRequest) {
  try {
    const hue = getHueClient();
    if (!hue) {
      return NextResponse.json(
        { error: 'Hue Bridge yapılandırılmamış' },
        { status: 500 }
      );
    }

    const isConnected = await hue.checkConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Hue Bridge\'e bağlanılamıyor' },
        { status: 503 }
      );
    }

    const lights = await hue.getLights();
    const groups = await hue.getGroups();
    const scenes = await hue.getScenes();

    return NextResponse.json({
      connected: true,
      lights: Array.from(lights.values()),
      groups: Array.from(groups.values()),
      scenes: Array.from(scenes.values()),
    });
  } catch (error) {
    console.error('Hue API hatası:', error);
    return NextResponse.json(
      { error: 'İç sunucu hatası' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const hue = getHueClient();
    if (!hue) {
      return NextResponse.json(
        { error: 'Hue Bridge yapılandırılmamış' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { lightId, action } = body;

    let result = false;

    switch (action) {
      case 'toggle':
        result = await hue.setLightState(lightId, { on: body.on });
        break;
      case 'brightness':
        result = await hue.setBrightness(lightId, body.brightness);
        break;
      case 'color':
        result = await hue.setColor(lightId, body.hue, body.saturation);
        break;
      default:
        return NextResponse.json(
          { error: 'Bilinmeyen action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Hue API hatası:', error);
    return NextResponse.json(
      { error: 'İç sunucu hatası' },
      { status: 500 }
    );
  }
}
