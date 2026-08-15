import ReactGA from 'react-ga4';
import { useEffect, useState } from 'react';

// Replace with your actual Measurement ID
// For development, we can use a dummy ID or env var
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

export const useAnalytics = () => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!window.GA_INITIALIZED) {
            ReactGA.initialize(MEASUREMENT_ID);
            window.GA_INITIALIZED = true;
            setIsInitialized(true);
        } else {
            setIsInitialized(true);
        }
    }, []);

    const trackPageView = (path: string) => {
        if (isInitialized) {
            ReactGA.send({ hitType: "pageview", page: path });
        }
    };

    const trackEvent = (category: string, action: string, label?: string) => {
        if (isInitialized) {
            ReactGA.event({
                category,
                action,
                label,
            });
        }
    };

    return { trackPageView, trackEvent, isInitialized };
};

// Global augmentation
declare global {
    interface Window {
        GA_INITIALIZED: boolean;
    }
}
