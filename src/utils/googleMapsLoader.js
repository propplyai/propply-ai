// Google Maps API loader utility
let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
let loadPromise = null;

/**
 * Load Google Maps API dynamically with environment variable
 * @returns {Promise} Promise that resolves when Google Maps API is loaded
 */
export const loadGoogleMapsAPI = () => {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (isGoogleMapsLoading && loadPromise) {
    return loadPromise;
  }

  isGoogleMapsLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps API key is configured
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      const error = new Error('Google Maps API key not configured. Please set REACT_APP_GOOGLE_MAPS_API_KEY environment variable.');
      console.error(error.message);
      isGoogleMapsLoading = false;
      reject(error);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // Handle script load
    script.onload = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      console.log('Google Maps API loaded successfully');
      resolve();
    };

    // Handle script error
    script.onerror = (error) => {
      isGoogleMapsLoading = false;
      const errorMessage = 'Failed to load Google Maps API. Please check your API key and network connection.';
      console.error(errorMessage, error);
      reject(new Error(errorMessage));
    };

    // Add script to document head
    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Check if Google Maps API is loaded
 * @returns {boolean} True if Google Maps API is loaded
 */
export const isGoogleMapsAPILoaded = () => {
  return isGoogleMapsLoaded && window.google && window.google.maps && window.google.maps.places;
};

/**
 * Get Google Maps API key from environment
 * @returns {string|null} API key or null if not configured
 */
export const getGoogleMapsAPIKey = () => {
  return process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
};

/**
 * Validate Google Maps API configuration
 * @returns {object} Validation result with isValid and message
 */
export const validateGoogleMapsConfig = () => {
  const apiKey = getGoogleMapsAPIKey();
  
  if (!apiKey) {
    return {
      isValid: false,
      message: 'REACT_APP_GOOGLE_MAPS_API_KEY environment variable is not set'
    };
  }
  
  if (apiKey === 'YOUR_API_KEY_HERE') {
    return {
      isValid: false,
      message: 'Please replace YOUR_API_KEY_HERE with your actual Google Maps API key'
    };
  }
  
  if (apiKey.length < 20) {
    return {
      isValid: false,
      message: 'Google Maps API key appears to be invalid (too short)'
    };
  }
  
  return {
    isValid: true,
    message: 'Google Maps API key is configured correctly'
  };
};

