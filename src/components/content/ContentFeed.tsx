import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from './ContentCard';
import { contentApi, ContentItem } from '@/lib/api/content';
import { Loader2 } from 'lucide-react';

interface ContentFeedProps {
  activeFilter: string;
  searchQuery: string;
}

export function ContentFeed({ activeFilter, searchQuery }: ContentFeedProps) {
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let data: ContentItem[] = [];
        
        if (activeFilter === 'all' || activeFilter === 'trending') {
          data = await contentApi.fetchAllContent();
        } else if (activeFilter === 'article') {
          data = await contentApi.fetchArticles();
        } else if (activeFilter === 'repo') {
          data = await contentApi.fetchRepos();
        } else if (activeFilter === 'paper') {
          data = await contentApi.fetchPapers();
        } else if (activeFilter === 'video') {
          data = await contentApi.fetchVideos();
        } else if (activeFilter === 'saved') {
          // For saved, we need to fetch all and filter
          data = await contentApi.fetchAllContent();
        }
        
        setContent(data);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeFilter !== 'analytics') {
      fetchContent();
    }
  }, [activeFilter]);

  const filteredContent = useMemo(() => {
    let items = content;

    // Filter saved items
    if (activeFilter === 'saved') {
      items = items.filter(item => savedItems.has(item.id));
    }

    // Sort by engagement for trending
    if (activeFilter === 'trending') {
      items = [...items].sort((a, b) => b.engagement_score - a.engagement_score);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return items;
  }, [content, activeFilter, searchQuery, savedItems]);

  const toggleSave = (id: string) => {
    setSavedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (activeFilter === 'analytics') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading fresh content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredContent.length}</span> results
        </p>
      </div>

      {/* Content Grid */}
      <AnimatePresence mode="popLayout">
        {filteredContent.length > 0 ? (
          <motion.div 
            layout
            className="grid gap-4 md:grid-cols-2"
          >
            {filteredContent.map((item, index) => (
              <ContentCard
                key={item.id}
                item={item}
                index={index}
                isSaved={savedItems.has(item.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No content found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {activeFilter === 'saved' 
                ? "You haven't saved any items yet. Start exploring and save content for later!"
                : "Try adjusting your filters or search query to find more content."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
