import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileFilters } from '@/components/layout/MobileFilters';
import { HeroSection } from '@/components/home/HeroSection';
import { ContentFeed } from '@/components/content/ContentFeed';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ThemeProvider } from '@/lib/theme';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showHero, setShowHero] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleExplore = () => {
    setShowHero(false);
    setTimeout(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      {showHero ? (
        <HeroSection onExplore={handleExplore} />
      ) : (
        <div ref={feedRef} className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
            
            <main className="flex-1 min-w-0">
              <MobileFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
              
              {activeFilter === 'analytics' ? (
                <AnalyticsDashboard />
              ) : (
                <ContentFeed activeFilter={activeFilter} searchQuery={searchQuery} />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

const Index = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default Index;