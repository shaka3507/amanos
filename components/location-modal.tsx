'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X } from 'lucide-react';

interface LocationModalProps {
  onClose: () => void;
  onLocationSet: (location: { lat: number; lng: number } | { zipcode: string }) => void;
}

export default function LocationModal({ onClose, onLocationSet }: LocationModalProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zipcode, setZipcode] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'initial' | 'zipcode'>('initial');

  // Animation delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Request user's location
  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      onLocationSet({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      // Close with animation
      setVisible(false);
      setTimeout(onClose, 300);
    } catch (error) {
      console.error('Geolocation error:', error);
      let message = 'Unable to get your location';
      
      if (error instanceof Error) {
        if (error.message.includes('permission denied')) {
          message = 'Location access was denied. Please enter your zipcode instead.';
        } else if (error.message.includes('timeout')) {
          message = 'Location request timed out. Please try again or enter your zipcode.';
        }
      }
      
      setError(message);
      setStage('zipcode');
    } finally {
      setLoading(false);
    }
  }, [onLocationSet, onClose]);

  // Handle zipcode submission
  const handleZipcodeSubmit = useCallback(() => {
    setError('');
    
    // Basic zipcode validation
    if (!/^\d{5}$/.test(zipcode)) {
      setError('Please enter a valid 5-digit US zipcode');
      return;
    }
    
    onLocationSet({ zipcode });
    
    // Close with animation
    setVisible(false);
    setTimeout(onClose, 300);
  }, [zipcode, onLocationSet, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          visible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 transform ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 sm:translate-y-12'
        }`}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Weather Information</h3>
            <p className="mt-2 text-gray-600">
              {stage === 'initial' 
                ? 'Allow location access to get local weather and community updates' 
                : 'Enter your zipcode to get weather for your area'}
            </p>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {stage === 'initial' ? (
            <div className="space-y-4">
              <Button 
                onClick={requestLocation}
                disabled={loading}
                className="w-full py-6 text-base"
              >
                {loading ? 'Getting location...' : 'Allow location access'}
              </Button>
              
              <div className="text-center">
                <button
                  onClick={() => setStage('zipcode')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Enter zipcode instead
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Zipcode
                </label>
                <Input
                  id="zipcode"
                  type="text"
                  placeholder="Enter 5-digit zipcode"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  maxLength={5}
                  className="w-full"
                />
              </div>
              
              <Button
                onClick={handleZipcodeSubmit}
                className="w-full py-6 text-base"
              >
                Submit
              </Button>
              
              {stage === 'zipcode' && (
                <div className="text-center">
                  <button
                    onClick={() => setStage('initial')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Try location access again
                  </button>
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500 text-center">
            Your location data is only used to provide weather and community information. We don't store your precise location.
          </p>
        </div>
      </div>
    </div>
  );
} 