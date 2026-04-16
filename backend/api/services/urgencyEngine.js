import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Classifies the urgency of a need based on text using Google Gemini AI.
 * @param {Object} needData - The data of the need to classify containing type, location, description, reported_at, and severity_reported
 * @returns {Promise<{urgency: string, confidence: number, reason: string}>} - The urgency level, confidence score, and reasoning
 */
export const classifyUrgency = async (needData) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set in environment.');
        }

        const prompt = `You are an AI trained to classify disaster-related requests into urgency levels for emergency response.
You must return only a raw JSON object with no markdown formatting.
Classify the following request into one of three urgency levels: HIGH, MEDIUM, LOW.
    HIGH   → natural disasters, medical emergencies, search & rescue
    MEDIUM → food shortage, shelter need, infrastructure damage
    LOW    → community events, non-critical volunteer requests

Request data:
Type: ${needData.type || 'Unknown'}
Description: ${needData.description || 'No description'}
Severity reported by user: ${needData.severity_reported || 'Unknown'}

Output format:
{
  "urgency": "HIGH",
  "confidence": 0.95,
  "reason": "Brief explanation"
}`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        let resultText = response.data.candidates[0].content.parts[0].text;
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(resultText);

        return parsed;
    } catch (error) {
        console.error('Error calling Gemini API:', error?.response?.data || error.message);
        throw new Error('Failed to classify urgency level');
    }
};

/**
 * Service function to process the classify request and store the urgency_level in Firestore.
 */
export const processAndStoreUrgency = async (needData) => {
    // 1. Get classification from Gemini
    const aiResult = await classifyUrgency(needData);

    // 2. Store the urgency level back into the existing Firestore needs_requests collection
    const db = getFirestore();
    
    // We add the new request with the `urgency_level` field, or if we expect an ID, we update it.
    // Assuming adding a new document for this need. If it already had an ID, we would update it instead.
    const collectionRef = db.collection('needs_requests');
    
    let docRef;
    if (needData.id) {
        docRef = collectionRef.doc(needData.id);
        await docRef.set({ urgency_level: aiResult.urgency }, { merge: true });
    } else {
        const dataToInsert = {
            ...needData,
            urgency_level: aiResult.urgency,
            created_at: new Date().toISOString()
        };
        docRef = await collectionRef.add(dataToInsert);
    }

    return aiResult;
};
