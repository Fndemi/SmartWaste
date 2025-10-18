import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

interface LocationContextType {
  currentLocation: Location | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  error: string | null;
  permissionStatus: PermissionState | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const watchIdRef = React.useRef<number | null>(null);

  const checkPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionStatus(permission.state);
        return permission.state;
      } catch (err) {
        console.warn('Permission API not supported');
        return 'granted'; // Assume granted if API not available
      }
    }
    return 'granted';
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const permission = await checkPermission();
    if (permission === 'denied') {
      setError('Location permission denied. Please enable location access in your browser settings.');
      return;
    }

    setIsTracking(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        setCurrentLocation(location);
      },
      (err) => {
        console.error('Error getting initial location:', err);
        setError('Unable to get your location');
        setIsTracking(false);
      },
      options
    );

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        setCurrentLocation(location);
        setError(null);
      },
      (err) => {
        console.error('Error watching location:', err);
        setError('Location tracking failed');
        setIsTracking(false);
      },
      options
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  useEffect(() => {
    checkPermission();

    return () => {
      stopTracking();
    };
  }, []);

  const value: LocationContextType = {
    currentLocation,
    isTracking,
    startTracking,
    stopTracking,
    error,
    permissionStatus,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
