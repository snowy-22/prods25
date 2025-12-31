export interface DeviceInfo {
  browser: string;
  version: string;
  os: string;
  cpuCores: number;
  ram: string;
  gpu: string;
  screenResolution: string;
  language: string;
  platform: string;
}

export interface PerformanceMetrics {
  loadingTime: number;
  foldersOpenTime?: number;
  personalFoldersLoadTime?: number;
}

export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      browser: "Server",
      version: "Unknown",
      os: "Unknown",
      cpuCores: 0,
      ram: "Unknown",
      gpu: "Unknown",
      screenResolution: "Unknown",
      language: "Unknown",
      platform: "Unknown",
    };
  }

  const ua = navigator.userAgent;
  let browser = "Unknown";
  let version = "Unknown";

  if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
    version = ua.split("Firefox/")[1];
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
    version = ua.split("Chrome/")[1].split(" ")[0];
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
    version = ua.split("Version/")[1].split(" ")[0];
  } else if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident/") > -1) {
    browser = "IE";
  }

  const getGPUInfo = () => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
    return "Unknown";
  };

  return {
    browser,
    version,
    os: navigator.platform,
    cpuCores: navigator.hardwareConcurrency || 0,
    ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : "Unknown",
    gpu: getGPUInfo(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    platform: navigator.platform,
  };
};

export const capturePerformanceMetrics = (): PerformanceMetrics => {
  if (typeof window === 'undefined') {
    return { loadingTime: 0 };
  }
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  return {
    loadingTime: navigation ? navigation.loadEventEnd - navigation.startTime : 0,
  };
};
