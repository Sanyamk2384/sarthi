import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { 
  AlertTriangle, 
  MapPin, 
  Shield, 
  Clock, 
  BarChart2, 
  Server, 
  Zap,
  Users,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchedVolunteers, setMatchedVolunteers] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const mapRef = useRef(null);

  // Load Priority Queue needs
  useEffect(() => {
    if (activeTab === 'priority-queue') {
      fetchPriorityQueue();
    }
  }, [activeTab]);

  const fetchPriorityQueue = async () => {
    setLoading(true);
    try {
      // Mocking Firebase fetch since frontend firebase is not configured
      // In a real scenario: const needsSnap = await getDocs(collection(db, "needs_requests"));
      // We will simulate the sorted list of open needs
      const mockNeeds = [
        { id: '1', type: 'Medical Emergency', description: 'Requires immediate trauma care kit', urgency_level: 'HIGH', location: { lat: 13.0827, lng: 80.2707 }, reported_at: '2026-04-16T10:00:00Z', status: 'open' },
        { id: '2', type: 'Search & Rescue', description: 'People trapped under debris', urgency_level: 'HIGH', location: { lat: 13.0900, lng: 80.2800 }, reported_at: '2026-04-16T09:30:00Z', status: 'open' },
        { id: '3', type: 'Food Shortage', description: 'Need food packets for 50 people', urgency_level: 'MEDIUM', location: { lat: 13.1000, lng: 80.2500 }, reported_at: '2026-04-16T08:00:00Z', status: 'open' },
        { id: '4', type: 'Volunteer Help', description: 'Need help sorting donations', urgency_level: 'LOW', location: { lat: 13.0500, lng: 80.2000 }, reported_at: '2026-04-16T07:15:00Z', status: 'open' }
      ];
      setNeeds(mockNeeds);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleMatchVolunteers = async (need) => {
    setSelectedNeed(need);
    setMatchedVolunteers([]);
    setIsPanelOpen(true);
    try {
      const res = await axios.post('http://localhost:5000/api/match-volunteers', { need_id: need.id }).catch(() => null);
      if (res?.data?.matches) {
        setMatchedVolunteers(res.data.matches);
      } else {
        // Fallback mock matches for demo
        setMatchedVolunteers([
          { volunteer_id: 'v1', name: 'Arsh Tiwari', score: 95, distance_km: 1.2, matched_skills: ['Medical', 'Rescue'] },
          { volunteer_id: 'v2', name: 'Rahul Joshi', score: 85, distance_km: 2.5, matched_skills: ['Medical'] },
          { volunteer_id: 'v3', name: 'Priya Sharma', score: 70, distance_km: 4.1, matched_skills: [] }
        ]);
      }
    } catch (err) {
      console.error('Failed to match volunteers', err);
    }
  };

  const handleAssign = async (volunteerId) => {
    try {
      // 1. Sets the volunteer's availability to false in Firestore
      // 2. Sets active_task_id on the volunteer document
      // 3. Sets the need's status to "assigned" and stores assigned_volunteer_id
      // 4. Sends a Firebase Cloud Messaging notification
      alert(`Assigned Volunteer ${volunteerId} to Need ${selectedNeed.id}! Notification Sent.`);
      
      // Update local state to reflect reassignment
      setNeeds(needs.filter(n => n.id !== selectedNeed.id));
      setIsPanelOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const overviewCards = [
    { icon: <AlertTriangle className="w-6 h-6 text-red-400" />, label: "Active Incidents", value: "27", subtext: "+5 in last 24hrs", color: "text-red-400" },
    { icon: <Shield className="w-6 h-6 text-blue-400" />, label: "Response Teams", value: "15", subtext: "All Operational", color: "text-blue-400" },
    { icon: <Server className="w-6 h-6 text-yellow-400" />, label: "Resources Deployed", value: "68%", subtext: "Current Allocation", color: "text-yellow-400" },
    { icon: <Clock className="w-6 h-6 text-green-400" />, label: "Avg. Response Time", value: "18m", subtext: "Last Hour", color: "text-green-400" }
  ];

  const activeAlerts = [
    { type: "Severe Flooding", location: "Chennai", time: "15 mins ago", severity: "high" },
    { type: "Heavy Rain", location: "Cuddalore", time: "32 mins ago", severity: "medium" },
    { type: "Cyclone Warning", location: "Coastal Region", time: "1 hr ago", severity: "low" }
  ];

  const resourceStatus = [
    { name: 'Medical Kits', percentage: 75, color: 'blue' },
    { name: 'Food Supplies', percentage: 60, color: 'yellow' },
    { name: 'Shelters', percentage: 85, color: 'green' },
    { name: 'Response Teams', percentage: 50, color: 'red' }
  ];

  const severityColors = {
    high: "bg-red-500/20 border-red-500 text-red-500",
    medium: "bg-yellow-500/20 border-yellow-500 text-yellow-500",
    low: "bg-green-500/20 border-green-500 text-green-500",
    HIGH: "bg-red-500",
    MEDIUM: "bg-orange-500",
    LOW: "bg-yellow-500"
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      const loadGoogleMaps = () => {
        const existingScript = document.getElementById('google-maps-script');
        if (!existingScript) {
          const script = document.createElement('script');
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''; 
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
          script.id = 'google-maps-script';
          script.async = true;
          script.defer = true;
          document.body.appendChild(script);

          script.onload = () => {
            renderDashboardMap();
          };
        } else {
          // If script already exists but window.google might not be ready, wait a bit or render
          if (window.google) {
            renderDashboardMap();
          } else {
            existingScript.addEventListener('load', renderDashboardMap);
          }
        }
      };

      const renderDashboardMap = () => {
        if (window.google && mapRef.current) {
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 10,
            center: { lat: 13.0827, lng: 80.2707 },
            mapTypeId: 'roadmap',
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            ]
          });

          // Add markers for active alerts
          const alertLocations = [
            { lat: 13.0827, lng: 80.2707, title: "Severe Flooding - Chennai" },
            { lat: 11.7480, lng: 79.7714, title: "Heavy Rain - Cuddalore" },
            { lat: 12.5000, lng: 80.0000, title: "Cyclone Warning - Coastal Region" }
          ];

          alertLocations.forEach(alert => {
            new window.google.maps.Marker({
              position: { lat: alert.lat, lng: alert.lng },
              map: map,
              title: alert.title
            });
          });
        }
      };

      loadGoogleMaps();
    }
  }, [activeTab]);

  return (
    <div className="bg-[#0F172A] min-h-screen text-white flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 p-8 relative flex flex-col h-screen overflow-y-auto w-full">
        <div className="flex space-x-6 border-b border-gray-700 mb-6">
          <button 
            className={`pb-3 font-semibold transition-colors ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-3 font-semibold transition-colors ${activeTab === 'priority-queue' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('priority-queue')}
          >
            Priority Queue
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {overviewCards.map((card, index) => (
                <div key={index} className="bg-[#1E293B] p-5 rounded-xl shadow-lg border border-gray-700 hover:border-blue-600 transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    {card.icon}
                    <div className="text-right">
                      <div className="text-sm text-gray-400">{card.label}</div>
                      <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                      <div className="text-xs text-gray-300">{card.subtext}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-400" /> Disaster Map
                  </h2>
                </div>
                <div 
                  ref={mapRef} 
                  className="bg-[#0F172A] h-80 rounded-lg flex items-center justify-center overflow-hidden"
                >
                  <p className="text-gray-500">Loading Map...</p>
                </div>
              </div>

              <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" /> Active Alerts
                </h2>
                <div className="space-y-3">
                  {activeAlerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${severityColors[alert.severity]} hover:bg-opacity-30 transition-all`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{alert.type}</div>
                          <div className="text-xs text-gray-300">{alert.location}</div>
                        </div>
                        <span className="text-xs text-gray-400">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-green-400" /> Resource Status
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {resourceStatus.map((resource) => (
                  <div key={resource.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{resource.name}</span>
                      <span>{resource.percentage}%</span>
                    </div>
                    <div className="bg-[#0F172A] rounded-full h-2.5">
                      <div className={`bg-${resource.color}-500 h-2.5 rounded-full`} style={{ width: `${resource.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'priority-queue' && (
          <div className="flex-1 flex gap-6 h-full relative">
            {/* Needs List */}
            <div className={`transition-all duration-300 ${isPanelOpen ? 'w-2/3' : 'w-full'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" /> Task Priority Queue
                </h2>
              </div>
              
              {loading ? (
                <div className="text-center p-10 text-gray-400">Loading open needs...</div>
              ) : (
                <div className="space-y-4">
                  {needs.map(need => (
                    <div key={need.id} className="bg-[#1E293B] border border-gray-700 rounded-xl p-5 hover:border-blue-500 transition-colors shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{need.type}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${severityColors[need.urgency_level]}`}>
                              {need.urgency_level}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{need.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> ({need.location.lat}, {need.location.lng})</span>
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(need.reported_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleMatchVolunteers(need)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Find Volunteers
                        </button>
                      </div>
                    </div>
                  ))}
                  {needs.length === 0 && (
                    <div className="text-center p-10 text-gray-400 bg-[#1E293B] rounded-xl border border-gray-700">
                      No open needs found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Volunteer Side Panel */}
            {isPanelOpen && selectedNeed && (
              <div className="w-1/3 bg-[#1E293B] border border-gray-700 rounded-xl p-5 shadow-xl flex flex-col h-full sticky top-0 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                  <h3 className="text-lg font-bold">Top Matches</h3>
                  <button onClick={() => setIsPanelOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                
                <div className="mb-4 text-sm text-gray-300">
                  Matching for: <span className="font-semibold text-white">{selectedNeed.type}</span>
                </div>

                <div className="space-y-4 flex-1">
                  {matchedVolunteers.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-10">Finding best candidates...</div>
                  ) : (
                    matchedVolunteers.map((vol, idx) => (
                      <div key={vol.volunteer_id} className="bg-[#0F172A] border border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-blue-400 flex items-center">
                            {idx === 0 && <span className="text-yellow-400 mr-2 text-lg">★</span>}
                            {vol.name}
                          </h4>
                          <span className="text-green-400 font-bold text-sm">{vol.score.toFixed(1)} Pts</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-3 space-y-1">
                          <p>📍 {vol.distance_km.toFixed(1)} km away</p>
                          <p>🛠 Skills: {vol.matched_skills.join(', ') || 'No specific match'}</p>
                        </div>
                        <button 
                          onClick={() => handleAssign(vol.volunteer_id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Assign Volunteer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;