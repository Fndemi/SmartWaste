import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps';

type LatLng = { lat: number; lng: number };

type MiniMapProps = {
  center?: LatLng;
  household?: LatLng | null;
  driver?: LatLng | null;
  zoom?: number;
  className?: string;
  height?: number;
};

export function MiniMap({ center, household, driver, zoom = 13, className = '', height = 240 }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: google.maps.Map | null = null;
    let markers: google.maps.Marker[] = [];
    let mounted = true;

    const init = async () => {
      try {
        const googleObj = await loadGoogleMaps();
        if (!mounted || !mapRef.current) return;

        const resolvedCenter: LatLng | null = center || household || driver || null;
        if (!resolvedCenter) {
          // Try device geolocation as a fallback
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!mounted || !mapRef.current) return;
                const gCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                map = new googleObj.maps.Map(mapRef.current, { center: gCenter, zoom, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
                addMarkers(googleObj, map);
              },
              () => {
                setError('Location unavailable');
              }
            );
          } else {
            setError('Location not supported');
          }
          return;
        }

        map = new googleObj.maps.Map(mapRef.current, { center: resolvedCenter, zoom, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
        addMarkers(googleObj, map);
      } catch (e: any) {
        setError(e?.message || 'Failed to load map');
      }
    };

    const addMarkers = (googleObj: typeof google, mapInst: google.maps.Map) => {
      markers.forEach(m => m.setMap(null));
      markers = [];
      if (household) {
        markers.push(new googleObj.maps.Marker({ position: household, map: mapInst, label: { text: 'H', color: '#fff' }, icon: { path: googleObj.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#16a34a', fillOpacity: 1, strokeColor: '#0f766e', strokeWeight: 2 } }));
      }
      if (driver) {
        markers.push(new googleObj.maps.Marker({ position: driver, map: mapInst, label: { text: 'D', color: '#fff' }, icon: { path: googleObj.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#0ea5e9', fillOpacity: 1, strokeColor: '#0369a1', strokeWeight: 2 } }));
      }

      if (markers.length > 1) {
        const bounds = new googleObj.maps.LatLngBounds();
        markers.forEach(m => bounds.extend(m.getPosition() as google.maps.LatLng));
        mapInst.fitBounds(bounds);
      }
    };

    init();

    return () => {
      mounted = false;
      markers.forEach(m => m.setMap(null));
      map = null;
    };
  }, [center?.lat, center?.lng, household?.lat, household?.lng, driver?.lat, driver?.lng, zoom]);

  return (
    <div className={className}>
      <div ref={mapRef} style={{ width: '100%', height }} className="rounded-lg border border-ink-200" />
      {error && (
        <div className="mt-2 text-xs text-ink-600">{error}</div>
      )}
    </div>
  );
}


