import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps';

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

interface RealTimeMapProps {
  pickupLocation?: { lat: number; lng: number };
  driverLocation?: Location;
  householdLocation?: Location;
  className?: string;
  height?: number;
  onLocationUpdate?: (location: Location) => void;
  showDriverTracking?: boolean;
}

export function RealTimeMap({
  pickupLocation,
  driverLocation,
  householdLocation,
  className = '',
  height = 300,
  onLocationUpdate,
  showDriverTracking = false,
}: RealTimeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    pickup?: google.maps.Marker;
    driver?: google.maps.Marker;
    household?: google.maps.Marker;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Get user's current location
  useEffect(() => {
    if (!showDriverTracking) return;

    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
          };
          setUserLocation(location);
          onLocationUpdate?.(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    };

    getCurrentLocation();

    // Watch position for real-time updates
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
          };
          setUserLocation(location);
          onLocationUpdate?.(location);
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [showDriverTracking, onLocationUpdate]);

  // Initialize map when container is visible and has size
  useEffect(() => {
    let cleanupResize: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let initialized = false;

    const canInit = () => {
      const el = mapRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const hasSize = rect.width > 0 && rect.height > 0;
      const visible = !!el.offsetParent || rect.height > 0;
      return hasSize && visible && !mapInstanceRef.current && !initialized;
    };

    const doInit = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const google = await loadGoogleMaps();
        if (!mapRef.current) return;

        const center = pickupLocation || { lat: -1.2921, lng: 36.8219 }; // Default to Nairobi

        const map = new google.maps.Map(mapRef.current, {
          zoom: 15,
          center,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        initialized = true;

        // Trigger resize after first paint to avoid blank tiles
        requestAnimationFrame(() => {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(center);
        });

        // Add markers as before
        if (pickupLocation) {
          const pickupMarker = new google.maps.Marker({
            position: pickupLocation,
            map,
            title: 'Pickup Location',
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new google.maps.Size(32, 32) },
          });
          markersRef.current.pickup = pickupMarker;
          const pickupInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; color: #d32f2f;">Pickup Location</h3>
                <p style="margin: 0; font-size: 14px;">Waste collection point</p>
              </div>
            `,
          });
          pickupMarker.addListener('click', () => pickupInfoWindow.open(map, pickupMarker));
        }

        if (driverLocation) {
          const driverMarker = new google.maps.Marker({
            position: driverLocation,
            map,
            title: 'Driver Location',
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', scaledSize: new google.maps.Size(32, 32) },
          });
          markersRef.current.driver = driverMarker;
          const driverInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; color: #1976d2;">Driver Location</h3>
                <p style="margin: 0; font-size: 14px;">Last updated: ${new Date(driverLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            `,
          });
          driverMarker.addListener('click', () => driverInfoWindow.open(map, driverMarker));
        }

        if (householdLocation) {
          const householdMarker = new google.maps.Marker({
            position: householdLocation,
            map,
            title: 'Household Location',
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new google.maps.Size(32, 32) },
          });
          markersRef.current.household = householdMarker;
          const householdInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; color: #388e3c;">Household Location</h3>
                <p style="margin: 0; font-size: 14px;">Request origin</p>
              </div>
            `,
          });
          householdMarker.addListener('click', () => householdInfoWindow.open(map, householdMarker));
        }

        if (userLocation && showDriverTracking) {
          const userMarker = new google.maps.Marker({
            position: userLocation,
            map,
            title: 'Your Location',
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png', scaledSize: new google.maps.Size(32, 32) },
          });
          const userInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; color: #f57c00;">Your Location</h3>
                <p style="margin: 0; font-size: 14px;">Real-time tracking</p>
              </div>
            `,
          });
          userMarker.addListener('click', () => userInfoWindow.open(map, userMarker));
        }

        const bounds = new google.maps.LatLngBounds();
        if (pickupLocation) bounds.extend(pickupLocation);
        if (driverLocation) bounds.extend(driverLocation);
        if (householdLocation) bounds.extend(householdLocation);
        if (userLocation) bounds.extend(userLocation);
        if (!bounds.isEmpty()) map.fitBounds(bounds);

        // Observe size changes and trigger resize
        if (mapRef.current && 'ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              google.maps.event.trigger(mapInstanceRef.current, 'resize');
            }
          });
          resizeObserver.observe(mapRef.current);
        }

        // Window resize as fallback
        const onWinResize = () => {
          if (mapInstanceRef.current) {
            google.maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        };
        window.addEventListener('resize', onWinResize);
        cleanupResize = () => window.removeEventListener('resize', onWinResize);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    // If container has size now, init; else wait for it
    if (canInit()) {
      void doInit();
    } else if (mapRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        if (canInit()) void doInit();
      });
      resizeObserver.observe(mapRef.current);
    } else {
      // Fallback: try once after a tick
      const id = setTimeout(() => { if (canInit()) void doInit(); }, 0);
      cleanupResize = () => clearTimeout(id);
    }

    return () => {
      if (cleanupResize) cleanupResize();
      if (resizeObserver && mapRef.current) resizeObserver.unobserve(mapRef.current);
    };
  }, [pickupLocation, driverLocation, householdLocation, userLocation, showDriverTracking]);

  // Update driver marker position
  useEffect(() => {
    if (driverLocation && markersRef.current.driver && mapInstanceRef.current) {
      markersRef.current.driver.setPosition(driverLocation);
    }
  }, [driverLocation]);

  // Update user location marker
  useEffect(() => {
    if (userLocation && showDriverTracking && mapInstanceRef.current) {
      // Find and update user marker or create new one
      const userMarker = markersRef.current.driver; // Reuse driver marker for user location
      if (userMarker) {
        userMarker.setPosition(userLocation);
      }
    }
  }, [userLocation, showDriverTracking]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={`w-full ${className}`} style={{ height }} />

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-md text-xs">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Pickup</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Driver</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Household</span>
        </div>
        {showDriverTracking && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>You</span>
          </div>
        )}
      </div>
    </div>
  );
}
