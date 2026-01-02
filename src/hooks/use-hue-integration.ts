import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { HueBridge, HueLight } from '@/lib/hue-types';

/**
 * Hook for Philips Hue Integration
 * Handles personal bridge discovery, linking, and light management
 */

export function useHueIntegration() {
  const {
    hueBridges,
    hueLights,
    hueScenes,
    hueSyncs,
    selectedBridgeId,
    hueIsLoading,
    hueError,
    addHueBridge,
    updateHueBridge,
    removeHueBridge,
    setSelectedBridgeId,
    addHueLight,
    updateHueLight,
    removeHueLight,
    setHueLoading,
    setHueError,
  } = useAppStore();

  // Discover bridges on local network
  const discoverBridge = useCallback(
    async (ipAddress: string, port: number = 443) => {
      setHueLoading(true);
      try {
        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            action: 'discover',
            ipAddress,
            port,
          }),
        });

        const data = await response.json();
        setHueLoading(false);

        if (!data.success) {
          setHueError(data.error || 'Failed to discover bridge');
          return null;
        }

        return data.data;
      } catch (error) {
        setHueLoading(false);
        setHueError(`Discovery error: ${String(error)}`);
        return null;
      }
    },
    [setHueLoading, setHueError]
  );

  // Link bridge to account (creates API token)
  const linkBridge = useCallback(
    async (bridgeId: string, ipAddress: string, port: number = 443) => {
      setHueLoading(true);
      try {
        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            action: 'link',
            bridgeId,
            ipAddress,
            port,
          }),
        });

        const data = await response.json();
        setHueLoading(false);

        if (!data.success) {
          setHueError(data.error || 'Failed to link bridge');
          return null;
        }

        // Add bridge to store
        addHueBridge(data.data);
        setSelectedBridgeId(data.data.id);
        setHueError(undefined);

        return data.data;
      } catch (error) {
        setHueLoading(false);
        setHueError(`Linking error: ${String(error)}`);
        return null;
      }
    },
    [addHueBridge, setSelectedBridgeId, setHueLoading, setHueError]
  );

  // Fetch lights from bridge
  const fetchLights = useCallback(
    async (bridgeId: string) => {
      setHueLoading(true);
      try {
        const bridge = hueBridges.find(b => b.id === bridgeId);
        if (!bridge) {
          setHueError('Bridge not found');
          setHueLoading(false);
          return null;
        }

        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            action: 'get-lights',
            bridgeId: bridge.bridge_id,
            username: bridge.username,
            ipAddress: bridge.ip_address,
            port: bridge.port,
          }),
        });

        const data = await response.json();
        setHueLoading(false);

        if (!data.success) {
          setHueError(data.error || 'Failed to fetch lights');
          return null;
        }

        // Update lights in database (done in API)
        setHueError(undefined);
        return data.data;
      } catch (error) {
        setHueLoading(false);
        setHueError(`Fetch error: ${String(error)}`);
        return null;
      }
    },
    [hueBridges, setHueLoading, setHueError]
  );

  // Control light state
  const setLightState = useCallback(
    async (
      bridgeId: string,
      lightId: string,
      state: { on?: boolean; brightness?: number; hue?: number; saturation?: number }
    ) => {
      setHueLoading(true);
      try {
        const bridge = hueBridges.find(b => b.id === bridgeId);
        if (!bridge) {
          setHueError('Bridge not found');
          setHueLoading(false);
          return false;
        }

        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            action: 'set-light-state',
            lightId,
            state,
            username: bridge.username,
            ipAddress: bridge.ip_address,
            port: bridge.port,
          }),
        });

        const data = await response.json();
        setHueLoading(false);

        if (!data.success) {
          setHueError(data.error || 'Failed to set light state');
          return false;
        }

        // Update local state
        updateHueLight(lightId, { state });
        setHueError(undefined);

        return true;
      } catch (error) {
        setHueLoading(false);
        setHueError(`Control error: ${String(error)}`);
        return false;
      }
    },
    [hueBridges, updateHueLight, setHueLoading, setHueError]
  );

  // Delete bridge
  const deleteBridgeFromAccount = useCallback(
    async (bridgeId: string) => {
      setHueLoading(true);
      try {
        const response = await fetch('/api/hue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            action: 'delete-bridge',
            bridgeId,
          }),
        });

        const data = await response.json();
        setHueLoading(false);

        if (!data.success) {
          setHueError(data.error || 'Failed to delete bridge');
          return false;
        }

        removeHueBridge(bridgeId);
        setHueError(undefined);

        return true;
      } catch (error) {
        setHueLoading(false);
        setHueError(`Delete error: ${String(error)}`);
        return false;
      }
    },
    [removeHueBridge, setHueLoading, setHueError]
  );

  return {
    // State
    bridges: hueBridges,
    lights: hueLights,
    scenes: hueScenes,
    syncs: hueSyncs,
    selectedBridgeId,
    isLoading: hueIsLoading,
    error: hueError,

    // Actions
    discoverBridge,
    linkBridge,
    fetchLights,
    setLightState,
    deleteBridge: deleteBridgeFromAccount,
  };
}
