import { Hero } from '@/components/home/Hero';
import { HotTrendSection } from '@/components/home/HotTrendSection';
import { WeeklyHotSection } from '@/components/home/WeeklyHotSection';
import { TopAITechSection } from '@/components/home/TopAITechSection';

export function HomePage() {
    return (
        <>
            <Hero />

            {/* Hot Trend Section (Ad/Promo Space) */}
            <HotTrendSection />

            {/* Weekly Hot AI Works */}
            <WeeklyHotSection />

            {/* Top 5 AI Technologies */}
            <TopAITechSection />
        </>
    );
}
