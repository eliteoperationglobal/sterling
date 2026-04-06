import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

interface AddressComponents {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export const useGooglePlacesAutocomplete = (
  onAddressSelect: (address: AddressComponents) => void
) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if script already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup is handled by keeping the script loaded for the session
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Initialize autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        }
      );

      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (!place.address_components) return;

        const addressComponents: AddressComponents = {
          streetAddress: '',
          city: '',
          state: '',
          zip: '',
          country: '',
        };

        // Street number
        const streetNumber = place.address_components.find((c: any) =>
          c.types.includes('street_number')
        )?.long_name || '';

        // Street name
        const route = place.address_components.find((c: any) =>
          c.types.includes('route')
        )?.long_name || '';

        addressComponents.streetAddress = `${streetNumber} ${route}`.trim();

        // City
        const city = place.address_components.find((c: any) =>
          c.types.includes('locality')
        );
        addressComponents.city = city?.long_name || '';

        // State
        const state = place.address_components.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        );
        addressComponents.state = state?.long_name || '';

        // ZIP
        const zip = place.address_components.find((c: any) =>
          c.types.includes('postal_code')
        );
        addressComponents.zip = zip?.long_name || '';

        // Country
        const country = place.address_components.find((c: any) =>
          c.types.includes('country')
        );
        addressComponents.country = country?.long_name || '';

        onAddressSelect(addressComponents);
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [isLoaded, onAddressSelect]);

  return { inputRef, isLoaded };
};













