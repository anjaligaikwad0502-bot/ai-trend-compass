import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard } from './ContentCard';
import { mockContent, ContentItem } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface ContentFeedProps {
  activeFilter: string;
  searchQuery: string;
}

export function ContentFeed({ activeFilter, searchQuery }: ContentFeedProps) {
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const filteredContent = useMemo(() => {
    let items = mockContent;

    // Filter by content type
    if (activeFilter !== 'all' && activeFilter !== 'saved' && activeFilter !== 'trending' && activeFilter !== 'analytics') {
      items = items.filter(item => item.content_type === activeFilter);
    }

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
  }, [activeFilter, searchQuery, savedItems]);

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
    return null; // Will be handled by parent
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