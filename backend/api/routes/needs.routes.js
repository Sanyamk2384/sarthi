import express from 'express';
import { processAndStoreUrgency } from '../services/urgencyEngine.js';
import { matchVolunteersForNeed } from '../services/matchingEngine.js';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();

/**
 * Endpoint for Urgency Classification Engine
 * POST /api/classify-urgency
 */
router.post('/classify-urgency', async (req, res) => {
    try {
        const needData = req.body;
        // Basic validation
        if (!needData || !needData.type || !needData.description) {
            return res.status(400).json({ error: 'Missing needData fields like type or description' });
        }

        const result = await processAndStoreUrgency(needData);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in /api/classify-urgency:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

/**
 * Endpoint for Smart Volunteer Matching Engine
 * POST /api/match-volunteers
 */
router.post('/match-volunteers', async (req, res) => {
    try {
        const { need_id } = req.body;
        if (!need_id) {
            return res.status(400).json({ error: 'need_id is required' });
        }

        const result = await matchVolunteersForNeed(need_id);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error in /api/match-volunteers:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

/**
 * Endpoint for Need Heatmap API
 * GET /api/heatmap-data
 */
router.get('/heatmap-data', async (req, res) => {
    try {
        const db = getFirestore();
        const needsSnapshot = await db.collection('needs_requests').get();
        
        const clusters = {};

        needsSnapshot.forEach((doc) => {
            const need = doc.data();
            const lat = need.location?.lat;
            const lng = need.location?.lng;
            const urgency = need.urgency_level || 'LOW';

            if (lat !== undefined && lng !== undefined) {
                // Group by a 0.05 degree grid bucket
                const latBucket = Math.floor(lat / 0.05) * 0.05;
                const lngBucket = Math.floor(lng / 0.05) * 0.05;
                const clusterKey = `${latBucket},${lngBucket}`;

                // Urgency Weight
                let weight = 1;
                if (urgency === 'HIGH') weight = 3;
                else if (urgency === 'MEDIUM') weight = 2;

                if (!clusters[clusterKey]) {
                    clusters[clusterKey] = {
                        lat: latBucket + 0.025, // center of the bucket
                        lng: lngBucket + 0.025, // center of the bucket
                        weight: 0,
                        total_needs: 0,
                        urgency_breakdown: { HIGH: 0, MEDIUM: 0, LOW: 0 }
                    };
                }

                clusters[clusterKey].weight += weight;
                clusters[clusterKey].total_needs += 1;
                
                if (urgency === 'HIGH') clusters[clusterKey].urgency_breakdown.HIGH += 1;
                else if (urgency === 'MEDIUM') clusters[clusterKey].urgency_breakdown.MEDIUM += 1;
                else clusters[clusterKey].urgency_breakdown.LOW += 1;
            }
        });

        // Convert clusters to GeoJSON FeatureCollection
        const features = Object.values(clusters).map((cluster) => {
            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [cluster.lng, cluster.lat] // GeoJSON format is [lng, lat]
                },
                properties: {
                    weight: cluster.weight,
                    total_needs: cluster.total_needs,
                    urgency_breakdown: cluster.urgency_breakdown
                }
            };
        });

        const geoJsonResponse = {
            type: "FeatureCollection",
            features: features
        };

        return res.status(200).json(geoJsonResponse);
    } catch (error) {
        console.error('Error in /api/heatmap-data:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

export default router;
