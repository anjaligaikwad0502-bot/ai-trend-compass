import { motion } from 'framer-motion';
import { 
  FileText, 
  Video, 
  GraduationCap, 
  Github, 
  Clock,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { mockAnalytics } from '@/lib/mockData';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const stats = [
  { 
    label: 'Articles Read', 
    value: mockAnalytics.articlesRead, 
    icon: FileText, 
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  { 
    label: 'Videos Watched', 
    value: mockAnalytics.videosWatched, 
    icon: Video, 
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  { 
    label: 'Papers Saved', 
    value: mockAnalytics.papersSaved, 
    icon: GraduationCap, 
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  { 
    label: 'Repos Saved', 
    value: mockAnalytics.reposSaved, 
    icon: Github, 
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
];

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Your Analytics</h2>
          <p className="text-sm text-muted-foreground">Track your learning journey</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Reading Time & Weekly Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Total Reading Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reading Time</p>
                <p className="text-2xl font-bold">{mockAnalytics.totalReadingTime}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep it up! You're learning faster than 85% of users.
            </p>
          </Card>
        </motion.div>

        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weekly Activity</p>
                <p className="text-lg font-semibold">41 items this week</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-20">
              {mockAnalytics.weeklyActivity.map((day, i) => (
                <div key={day.day} className="flex flex-col items-center gap-1 flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.count / 12) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                    className="w-full bg-primary/20 rounded-t-md relative overflow-hidden min-h-[4px]"
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-t from-primary to-primary/50"
                      style={{ height: '100%' }}
                    />
                  </motion.div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">Top Interests</h3>
          <div className="space-y-3">
            {mockAnalytics.topTags.map((tag, index) => (
              <div key={tag.tag} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20">{tag.tag}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(tag.count / 24) * 100}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8 text-right">{tag.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}