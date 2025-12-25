import { db } from './firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

// Helper function to track analytics events
export const trackAnalytics = async (type: 'pageView' | 'delegateLogin' | 'nearbyClick' | 'sponsorClick', itemName?: string) => {
    try {
        const analyticsRef = doc(db, 'analytics', 'stats');

        switch (type) {
            case 'pageView':
                await setDoc(analyticsRef, { pageViews: increment(1) }, { merge: true });
                break;
            case 'delegateLogin':
                await setDoc(analyticsRef, { delegateLogins: increment(1) }, { merge: true });
                break;
            case 'nearbyClick':
                if (itemName) {
                    await setDoc(analyticsRef, { [`nearbyClicks.${itemName}`]: increment(1) }, { merge: true });
                }
                break;
            case 'sponsorClick':
                if (itemName) {
                    await setDoc(analyticsRef, { [`sponsorClicks.${itemName}`]: increment(1) }, { merge: true });
                }
                break;
        }
    } catch (error) {
        console.error('Analytics tracking error:', error);
    }
};
