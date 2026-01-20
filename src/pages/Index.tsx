import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileFilters } from '@/components/layout/MobileFilters';
import { HeroSection } from '@/components/home/HeroSection';
import { ContentFeed } from '@/components/content/ContentFeed';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AuthModal } from '@/components/auth/AuthModal';
import { ThemeProvider } from '@/lib/theme';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showHero, setShowHero] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleExplore = () => {
    if (user) {
      // User is authenticated, show feed
      setShowHero(false);
      setTimeout(() => {
        feedRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // User not authenticated, show auth modal
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowHero(false);
    setTimeout(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} user={user} />
      
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

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess}
      />
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