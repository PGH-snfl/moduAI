import { useState, useCallback } from 'react';

// Wait, looking at package.json might be needed to confirm router. 
// Standard React SPA often uses react-router-dom. 
// If it's a simple CRA/Vite app without router, I might need to just use local state or install router.
// Checking previous file usage: The user has 'react-router-dom' in a typical stack, but let's verify.
// The summary said "Modal-Based ... instead of navigating to a separate detail page."
// I will implement a simpler version first that depends on local state if router isn't clear, BUT 
// usually deep linking is requested. 
// Let's assume standard local state first to be safe, then upgrade to URL if router is present.
// Actually, looking at the Hero.tsx, it creates links? No, it just has text. 
// I will use a simple state-based approach for now to minimize dependencies, 
// but expose it nicely so it CAN be swapped for URL state easily.

import type { Tool } from './useTools';

export const useToolModal = () => {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const openModal = useCallback((tool: Tool) => {
        setSelectedTool(tool);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        // Small timeout to clear data after animation could be added here
        setTimeout(() => setSelectedTool(null), 300);
    }, []);

    return {
        selectedTool,
        isOpen,
        openModal,
        closeModal
    };
};
