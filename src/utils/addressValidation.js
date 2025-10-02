// Address validation utilities for Google Places integration

export const validateAddressComponents = (components) => {
  const errors = [];
  
  // Check for required components
  if (!components.street_address || components.street_address.trim() === '') {
    errors.push('Street address is required');
  }
  
  if (!components.city || components.city.trim() === '') {
    errors.push('City is required');
  }
  
  if (!components.state || components.state.trim() === '') {
    errors.push('State is required');
  }
  
  if (!components.zip_code || components.zip_code.trim() === '') {
    errors.push('ZIP code is required');
  }
  
  // Validate ZIP code format (US)
  if (components.zip_code && !/^\d{5}(-\d{4})?$/.test(components.zip_code)) {
    errors.push('ZIP code must be in format 12345 or 12345-6789');
  }
  
  // Validate state format (should be 2-letter abbreviation)
  if (components.state && components.state.length !== 2) {
    errors.push('State must be a 2-letter abbreviation');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatAddressForBackend = (components) => {
  if (!components) return null;
  
  const {
    street_address,
    city,
    state,
    zip_code,
    country = 'United States'
  } = components;
  
  return {
    full_address: `${street_address}, ${city}, ${state} ${zip_code}`,
    street_address,
    city,
    state,
    zip_code,
    country,
    formatted_for_display: `${street_address}, ${city}, ${state} ${zip_code}`,
    formatted_for_api: `${street_address}, ${city}, ${state} ${zip_code}, ${country}`
  };
};

export const extractCityFromAddress = (address) => {
  if (!address) return null;
  
  // Try to extract city from formatted address
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  
  return null;
};

export const isUSAddress = (components) => {
  return components && components.country === 'United States';
};

export const validateAddressForCompliance = (components) => {
  const validation = validateAddressComponents(components);
  
  if (!validation.isValid) {
    return validation;
  }
  
  // Additional compliance-specific validation
  const warnings = [];
  
  // Check if address is in supported cities (NYC or Philadelphia)
  const city = components.city?.toLowerCase();
  const state = components.state?.toLowerCase();
  
  if (state === 'ny' && !city?.includes('new york')) {
    warnings.push('Address appears to be outside New York City');
  }
  
  if (state === 'pa' && !city?.includes('philadelphia')) {
    warnings.push('Address appears to be outside Philadelphia');
  }
  
  if (state !== 'ny' && state !== 'pa') {
    warnings.push('Address is outside supported cities (NYC/Philadelphia)');
  }
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings
  };
};

