import React, { useState } from 'react';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

const AddressAutocompleteTest = () => {
  const [address, setAddress] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);

  const handleAddressChange = (value) => {
    setAddress(value);
  };

  const handlePlaceSelect = (placeData) => {
    setSelectedPlace(placeData);
    console.log('Selected place data:', placeData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Google Places Autocomplete Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Address
          </label>
          <GooglePlacesAutocomplete
            value={address}
            onChange={handleAddressChange}
            onPlaceSelect={handlePlaceSelect}
            placeholder="Enter property address"
            className="w-full"
            required={true}
          />
        </div>

        {selectedPlace && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Selected Address Details:</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Formatted Address:</strong> {selectedPlace.formatted_address}</div>
              <div><strong>Street:</strong> {selectedPlace.components?.street_address}</div>
              <div><strong>City:</strong> {selectedPlace.components?.city}</div>
              <div><strong>State:</strong> {selectedPlace.components?.state}</div>
              <div><strong>ZIP:</strong> {selectedPlace.components?.zip_code}</div>
              <div><strong>Country:</strong> {selectedPlace.components?.country}</div>
              {selectedPlace.validation?.warnings && selectedPlace.validation.warnings.length > 0 && (
                <div className="text-yellow-600">
                  <strong>Warnings:</strong> {selectedPlace.validation.warnings.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressAutocompleteTest;

