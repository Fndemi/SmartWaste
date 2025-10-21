let googleMapsPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }
  if ((window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }
  if (googleMapsPromise) return googleMapsPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error('VITE_GOOGLE_MAPS_KEY is not set. Create frontend/.env.local and add VITE_GOOGLE_MAPS_KEY=YOUR_KEY, then restart dev server.');
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_KEY is not set'));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      (existing as HTMLScriptElement).addEventListener('load', () => resolve((window as any).google));
      (existing as HTMLScriptElement).addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.defer = true;
    // Use recommended async loading params
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}


