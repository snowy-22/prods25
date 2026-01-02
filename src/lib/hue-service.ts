'use server';

import { createClient } from '@supabase/supabase-js';
import { HueBridge, HueLight, HueLightState, HueApiResponse } from '@/lib/hue-types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Philips Hue API Service
 * Handles personal bridge communication and data persistence
 */

export async function discoverHueBridge(
  ipAddress: string,
  port: number = 443
): Promise<HueApiResponse> {
  try {
    const response = await fetch(`https://${ipAddress}:${port}/api/nupnp`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to discover bridge: ${response.statusText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Bridge discovery error: ${String(error)}` };
  }
}

export async function linkHueBridge(
  userId: string,
  bridgeId: string,
  ipAddress: string,
  port: number = 443,
  appName: string = 'CanvasFlow'
): Promise<HueApiResponse> {
  try {
    const requestBody = JSON.stringify({
      devicetype: appName,
      generateclientkey: true,
    });

    const response = await fetch(
      `https://${ipAddress}:${port}/api`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      }
    );

    if (!response.ok) {
      return { success: false, error: `Failed to link bridge: ${response.statusText}` };
    }

    const [result] = await response.json();

    if (result.error) {
      return { success: false, error: `Hue Bridge error: ${result.error.description}` };
    }

    if (!result.success?.username) {
      return { success: false, error: 'No username returned from bridge' };
    }

    // Save bridge to personal database
    const { data, error } = await supabase
      .from('hue_bridges')
      .insert({
        user_id: userId,
        bridge_id: bridgeId,
        ip_address: ipAddress,
        port,
        username: result.success.username,
        name: `Hue Bridge (${ipAddress})`,
        is_connected: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data, message: 'Bridge linked successfully' };
  } catch (error) {
    return { success: false, error: `Bridge linking error: ${String(error)}` };
  }
}

export async function getHueLights(
  bridgeId: string,
  username: string,
  ipAddress: string,
  port: number = 443
): Promise<HueApiResponse> {
  try {
    const response = await fetch(
      `https://${ipAddress}:${port}/api/${username}/lights`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      return { success: false, error: `Failed to fetch lights: ${response.statusText}` };
    }

    const lights = await response.json();
    return { success: true, data: lights };
  } catch (error) {
    return { success: false, error: `Failed to fetch lights: ${String(error)}` };
  }
}

export async function setLightState(
  lightId: string,
  state: HueLightState,
  username: string,
  ipAddress: string,
  port: number = 443
): Promise<HueApiResponse> {
  try {
    const payload: Record<string, any> = {};

    if (state.on !== undefined) payload.on = state.on;
    if (state.brightness !== undefined) payload.bri = state.brightness;
    if (state.saturation !== undefined) payload.sat = state.saturation;
    if (state.hue !== undefined) payload.hue = state.hue;
    if (state.colorTemp !== undefined) payload.ct = state.colorTemp;
    if (state.transitionTime !== undefined) payload.transitiontime = state.transitionTime;

    const response = await fetch(
      `https://${ipAddress}:${port}/api/${username}/lights/${lightId}/state`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      return { success: false, error: `Failed to set light state: ${response.statusText}` };
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `Failed to set light state: ${String(error)}` };
  }
}

export async function saveBridgeLights(
  userId: string,
  bridgeId: string,
  lights: Record<string, any>
): Promise<HueApiResponse> {
  try {
    const lightsToInsert = Object.entries(lights).map(([lightId, light]) => ({
      user_id: userId,
      bridge_id: bridgeId,
      light_id: lightId,
      name: light.name,
      type: light.type || 'unknown',
      state: {
        on: light.state?.on || false,
        brightness: light.state?.bri || 0,
        saturation: light.state?.sat,
        hue: light.state?.hue,
        colorTemp: light.state?.ct,
      },
      is_available: light.state?.reachable !== false,
    }));

    // Delete existing lights for this bridge
    await supabase
      .from('hue_lights')
      .delete()
      .eq('bridge_id', bridgeId)
      .eq('user_id', userId);

    // Insert new lights
    const { data, error } = await supabase
      .from('hue_lights')
      .insert(lightsToInsert)
      .select();

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data, message: `Saved ${data?.length || 0} lights` };
  } catch (error) {
    return { success: false, error: `Failed to save lights: ${String(error)}` };
  }
}

export async function getUserBridges(userId: string): Promise<HueApiResponse> {
  try {
    const { data, error } = await supabase
      .from('hue_bridges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to fetch bridges: ${String(error)}` };
  }
}

export async function getUserLights(userId: string, bridgeId?: string): Promise<HueApiResponse> {
  try {
    let query = supabase
      .from('hue_lights')
      .select('*')
      .eq('user_id', userId);

    if (bridgeId) {
      query = query.eq('bridge_id', bridgeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: `Failed to fetch lights: ${String(error)}` };
  }
}

export async function deleteBridge(userId: string, bridgeId: string): Promise<HueApiResponse> {
  try {
    const { error } = await supabase
      .from('hue_bridges')
      .delete()
      .eq('id', bridgeId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Bridge deleted successfully' };
  } catch (error) {
    return { success: false, error: `Failed to delete bridge: ${String(error)}` };
  }
}
