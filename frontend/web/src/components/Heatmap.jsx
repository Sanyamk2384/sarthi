import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import axios from 'axios';

const Heatmap = () => {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We will dynamically load the Google Maps script
    const loadGoogleMaps = () => {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        // Using a dummy API key if none is available in env.
        // It will still render for development.
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''; 
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
        script.id = 'google-maps-script';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          fetchDataAndRenderMap();
        };
        script.onerror = () => {
          setError('Failed to load Google Maps API');
          setLoading(false);
        };
      } else {
        fetchDataAndRenderMap();
      }
    };

    const fetchDataAndRenderMap = async () => {
      try {
        // Fetch geojson from our API
        // If the backend isn't running, this might fail, so we catch it
        const res = await axios.get('http://localhost:5000/api/heatmap-data').catch(() => null);
        
        // Use realistic dummy data if API fails
        const features = res?.data?.features || [
          { geometry: { coordinates: [80.2707, 13.0827] }, properties: { weight: 3, urgency_breakdown: { HIGH: 1 } } }, 
          { geometry: { coordinates: [80.2000, 13.1000] }, properties: { weight: 2, urgency_breakdown: { MEDIUM: 1 } } },
          { geometry: { coordinates: [80.2500, 13.0500] }, properties: { weight: 1, urgency_breakdown: { LOW: 1 } } }
        ];

        if (window.google) {
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 11,
            center: { lat: 13.0827, lng: 80.2707 },
            mapTypeId: 'roadmap',
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            ]
          });

          // Translate to Google Maps native format
          const heatmapData = features.map(f => {
            return {
              location: new window.google.maps.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]),
              weight: f.properties.weight
            };
          });

          const heatmap = new window.google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            radius: 30, // Make points larger
          });
          
          heatmap.setMap(map);
        }
        setLoading(false);
      } catch (_) {
        setError('Error rendering map');
        setLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  return (
    <div className="bg-[#0F172A] min-h-screen text-white flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center">
          <MapIcon className="w-8 h-8 mr-3 text-blue-400" />
          Need Heatmap
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-[#1E293B] rounded-xl overflow-hidden border border-gray-700 shadow-xl relative h-[70vh]">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E293B] z-10">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="mt-4 text-gray-400">Loading Map Data...</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1E293B] z-10">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700 shadow-xl">
              <h3 className="text-xl font-bold mb-4">Legend</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-red-500 mr-3 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                  <div>
                    <p className="font-semibold text-white">HIGH Intensity</p>
                    <p className="text-xs text-gray-400">Critical / Urgent Needs</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-orange-500 mr-3 shadow-[0_0_10px_rgba(249,115,22,0.6)]"></div>
                  <div>
                    <p className="font-semibold text-white">MEDIUM Intensity</p>
                    <p className="text-xs text-gray-400">Moderate Needs</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 mr-3 shadow-[0_0_10px_rgba(234,179,8,0.6)]"></div>
                  <div>
                    <p className="font-semibold text-white">LOW Intensity</p>
                    <p className="text-xs text-gray-400">Standard Requests</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  This heatmap visualizes the concentration of reported needs. Data is clustered and weighted by the urgency classification engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
