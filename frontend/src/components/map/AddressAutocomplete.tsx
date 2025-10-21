import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps';

type Props = {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onAddressSelected: (args: { address: string; lat?: number; lng?: number }) => void;
  error?: string;
};

export function AddressAutocomplete({ label = 'Address', placeholder = 'Enter an address', defaultValue, onAddressSelected, error }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let autocomplete: any = null;
    let mounted = true;
    const init = async () => {
      try {
        const googleObj: any = await loadGoogleMaps();
        if (!mounted || !inputRef.current) return;
        autocomplete = new googleObj.maps.places.Autocomplete(inputRef.current as HTMLInputElement, {
          fields: ['formatted_address', 'geometry'],
          types: ['geocode'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete?.getPlace();
          if (!place) return;
          const address = place.formatted_address || (inputRef.current?.value ?? '');
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          onAddressSelected({ address, lat: lat !== undefined ? lat : undefined, lng: lng !== undefined ? lng : undefined });
        });
      } catch {
        // Ignore autocomplete load errors; user can still type the address
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [onAddressSelected]);

  return (
    <div className="w-full max-w-md mx-auto">
      {label && (
        <label className="block text-sm font-medium text-ink-700 mb-1" htmlFor="address-autocomplete">{label}</label>
      )}
      <input
        id="address-autocomplete"
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-ink-300 dark:border-ink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 transition-all duration-200"
        type="text"
        aria-label={label}
      />
      {error && <p className="mt-1 text-sm text-error-600 break-words">{error}</p>}
    </div>
  );
}


