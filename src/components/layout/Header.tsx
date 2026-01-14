import { motion } from 'framer-motion';
import { Search, Bell, User, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-strong border-b border-border/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center glow">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold">
              <span className="gradient-text">TrendScope</span>
              <span className="text-muted-foreground font-medium"> AI</span>
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search trending content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/30 border-border/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Button>
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}