import React, { useRef, useEffect, useState } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { formatAddressForBackend, validateAddressForCompliance } from '../utils/addressValidation';
import { loadGoogleMapsAPI, isGoogleMapsAPILoaded, validateGoogleMapsConfig } from '../utils/googleMapsLoader';

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  onPlaceSelect, 
  placeholder = "Enter property address",
  className = "",
  disabled = false,
  required = false,
  error = null,
  darkMode = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    // Initialize Google Places Autocomplete when component mounts
    const initAutocomplete = async () => {
      // Validate configuration first
      const configValidation = validateGoogleMapsConfig();
      if (!configValidation.isValid) {
        setApiError(configValidation.message);
        return;
      }

      // Check if already loaded
      if (isGoogleMapsAPILoaded()) {
        initializeAutocomplete();
        return;
      }

      // Load Google Maps API
      try {
        setIsLoading(true);
        await loadGoogleMapsAPI();
        initializeAutocomplete();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
        setApiError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current) return;

      try {
        // Create autocomplete instance
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' }, // Restrict to US addresses
          fields: ['address_components', 'geometry', 'formatted_address', 'name']
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (!place.geometry) {
            setApiError('No details available for the selected address. Please try a different address.');
            return;
          }

          if (!place.address_components || place.address_components.length === 0) {
            setApiError('Incomplete address information. Please select a more specific address.');
            return;
          }

          setIsLoading(true);
          setApiError(null);

          try {
            // Extract address components
            const addressComponents = extractAddressComponents(place);
            
            // Validate address components
            const validation = validateAddressForCompliance(addressComponents);
            
            if (!validation.isValid) {
              setApiError(validation.errors.join(', '));
              return;
            }
            
            // Update the input value with formatted address
            const formattedAddress = place.formatted_address || place.name;
            onChange(formattedAddress);

            // Call the onPlaceSelect callback with detailed address info
            if (onPlaceSelect) {
              const formattedAddressData = formatAddressForBackend(addressComponents);
              onPlaceSelect({
                formatted_address: formattedAddress,
                components: addressComponents,
                formatted_data: formattedAddressData,
                geometry: place.geometry,
                place_id: place.place_id,
                validation: validation
              });
            }
          } catch (error) {
            console.error('Error processing place selection:', error);
            setApiError('Error processing selected address');
          } finally {
            setIsLoading(false);
          }
        });

      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
        setApiError('Failed to initialize address autocomplete');
      }
    };

    // Initialize autocomplete
    initAutocomplete();

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Extract address components from Google Places result
  const extractAddressComponents = (place) => {
    const components = {
      street_number: '',
      route: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      county: '',
      neighborhood: ''
    };

    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          components.street_number = component.long_name;
        }
        if (types.includes('route')) {
          components.route = component.long_name;
        }
        if (types.includes('locality')) {
          components.city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          components.state = component.short_name;
        }
        if (types.includes('postal_code')) {
          components.zip_code = component.long_name;
        }
        if (types.includes('country')) {
          components.country = component.long_name;
        }
        if (types.includes('administrative_area_level_2')) {
          components.county = component.long_name;
        }
        if (types.includes('neighborhood')) {
          components.neighborhood = component.long_name;
        }
      });

      // Combine street number and route for full street address
      components.street_address = `${components.street_number} ${components.route}`.trim();
    }

    return components;
  };

  // Handle manual input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setApiError(null);
  };

  // Fallback for when Google Places API is not available
  const handleFallbackSubmit = () => {
    if (!value || value.trim() === '') {
      setApiError('Please enter a property address');
      return;
    }
    
    // Basic validation for manual entry
    const addressParts = value.split(',');
    if (addressParts.length < 2) {
      setApiError('Please enter a complete address (street, city, state)');
      return;
    }
    
    // Call onPlaceSelect with basic data
    if (onPlaceSelect) {
      onPlaceSelect({
        formatted_address: value,
        components: {
          street_address: addressParts[0].trim(),
          city: addressParts[1].trim(),
          state: addressParts[2]?.trim() || '',
          zip_code: addressParts[3]?.trim() || '',
          country: 'United States'
        },
        formatted_data: {
          full_address: value,
          formatted_for_display: value,
          formatted_for_api: value
        },
        geometry: null,
        place_id: null,
        validation: { isValid: true, errors: [], warnings: ['Address entered manually - not validated by Google Places'] }
      });
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
            darkMode 
              ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-400 hover:bg-slate-700 focus:ring-corporate-500 focus:border-corporate-500' 
              : 'border-gray-300 focus:ring-blue-500'
          } ${
            error || apiError ? 'border-red-500 focus:ring-red-500' : ''
          } ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
        )}
      </div>
      
      {/* Error Display */}
      {(error || apiError) && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error || apiError}</span>
          </div>
          {apiError && apiError.includes('Google Maps API') && (
            <button
              onClick={handleFallbackSubmit}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Use Manual Entry
            </button>
          )}
        </div>
      )}
      
      {/* Help Text */}
      <div className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        {apiError && apiError.includes('Google Maps API') 
          ? 'Google Places API unavailable - you can still enter addresses manually'
          : 'Start typing to see address suggestions'
        }
      </div>
    </div>
  );
};

export default GooglePlacesAutocomplete;
