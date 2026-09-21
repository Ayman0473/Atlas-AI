export function generateMapShareUrl(params: {
  lat: number;
  lng: number;
  zoom: number;
  name?: string;
  layer?: string;
}): string {
  const url = new URL(window.location.href);
  url.searchParams.set('lat', params.lat.toFixed(5));
  url.searchParams.set('lng', params.lng.toFixed(5));
  url.searchParams.set('z', params.zoom.toString());
  if (params.name) {
    url.searchParams.set('name', params.name);
  }
  if (params.layer) {
    url.searchParams.set('layer', params.layer);
  }
  return url.toString();
}

export function parseMapShareUrl(): {
  lat: number;
  lng: number;
  zoom: number;
  name?: string;
  layer?: string;
} | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const latStr = params.get('lat');
    const lngStr = params.get('lng');
    const zoomStr = params.get('z') || params.get('zoom');
    const name = params.get('name') || undefined;
    const layer = params.get('layer') || undefined;

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        let zoom = zoomStr ? parseInt(zoomStr, 10) : 13;
        if (isNaN(zoom) || zoom < 2 || zoom > 20) zoom = 13;
        return { lat, lng, zoom, name, layer };
      }
    }
  } catch (err) {
    console.warn('Failed to parse share URL params:', err);
  }
  return null;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('navigator.clipboard failed, attempting fallback:', e);
  }

  // Fallback for iframes or environments where navigator.clipboard might be restricted
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}
