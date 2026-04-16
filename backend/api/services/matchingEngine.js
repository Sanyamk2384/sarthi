import { getFirestore } from 'firebase-admin/firestore';

/**
 * Helper function to calculate distance using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Service to match a need with top 3 available volunteers based on score.
 * @param {string} need_id - The ID of the need document
 * @returns {Promise<{matches: Array}>} - Match results
 */
export const matchVolunteersForNeed = async (need_id) => {
    const db = getFirestore();

    // 1. Fetch the need document
    const needSnapshot = await db.collection('needs_requests').doc(need_id).get();
    if (!needSnapshot.exists) {
        throw new Error('Need not found');
    }
    const need = needSnapshot.data();
    
    // Ensure need has required fields
    const needLat = need.location?.lat || 0;
    const needLng = need.location?.lng || 0;
    const requiredSkills = need.required_skills || [];
    const urgency = need.urgency_level || 'LOW';

    // 2. Fetch available volunteers
    const volunteersSnapshot = await db.collection('volunteers').where('availability', '==', true).get();
    
    const matches = [];

    // 3. Process each volunteer and compute score
    volunteersSnapshot.forEach((doc) => {
        const volunteer = doc.data();
        const vId = doc.id;
        
        // Skill Match Score Calculation
        const volunteerSkills = volunteer.skills || [];
        let matchedSkills = [];
        if (requiredSkills.length > 0) {
            matchedSkills = volunteerSkills.filter(skill => requiredSkills.includes(skill));
        } else {
            // If no skills are required, everyone matches on skill
            matchedSkills = volunteerSkills; 
        }

        const skillMatchScore = requiredSkills.length > 0 
            ? (matchedSkills.length / requiredSkills.length) * 100 
            : 100; // Default to 100 if no required skills

        // Proximity Score Calculation
        const vLat = volunteer.location?.lat || 0;
        const vLng = volunteer.location?.lng || 0;
        const distanceKm = calculateDistanceKm(needLat, needLng, vLat, vLng);
        
        let proximityScore = 100 - (distanceKm * 2);
        // Clamp to [0, 100]
        proximityScore = Math.max(0, Math.min(100, proximityScore));

        // Urgency Bonus
        let urgencyBonus = 0;
        if (urgency === 'HIGH') urgencyBonus = 30;
        else if (urgency === 'MEDIUM') urgencyBonus = 15;
        else if (urgency === 'LOW') urgencyBonus = 0;

        // Total Score
        const totalScore = (skillMatchScore * 0.5) + (proximityScore * 0.3) + (urgencyBonus * 0.2);

        matches.push({
            volunteer_id: volunteer.volunteer_id || vId,
            name: volunteer.name || 'Unknown',
            score: totalScore,
            distance_km: distanceKm,
            matched_skills: matchedSkills
        });
    });

    // 4. Sort by score descending and return top 3
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3);

    return { matches: topMatches };
};
