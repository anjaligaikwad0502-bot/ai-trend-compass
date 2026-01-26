const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Video {
  id: string;
  title: string;
  content_type: 'video';
  summary: string;
  key_insights: string[];
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: string;
  engagement_score: number;
  source: string;
  author: string;
  published_at: string;
  url: string;
  thumbnail?: string;
  video_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('query') || 'artificial intelligence tutorial';
    
    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=15&order=relevance&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube API error:', errorText);
      
      // Check if it's a quota error - return curated fallback videos
      if (searchResponse.status === 403 && errorText.includes('quotaExceeded')) {
        console.log('YouTube API quota exceeded, returning curated fallback videos');
        const fallbackVideos = getCuratedFallbackVideos();
        return new Response(
          JSON.stringify({ success: true, data: fallbackVideos, quotaExceeded: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch videos' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    
    // Get video statistics for engagement scores
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');
    
    let videoStats: Record<string, any> = {};
    if (videoIds) {
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
      const statsResponse = await fetch(statsUrl);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        videoStats = statsData.items?.reduce((acc: any, item: any) => {
          acc[item.id] = {
            viewCount: parseInt(item.statistics?.viewCount || '0'),
            likeCount: parseInt(item.statistics?.likeCount || '0'),
            duration: item.contentDetails?.duration
          };
          return acc;
        }, {});
      }
    }

    const videos: Video[] = searchData.items?.map((item: any) => {
      const videoId = item.id.videoId;
      const stats = videoStats[videoId] || {};
      const snippet = item.snippet;
      
      return {
        id: `yt-${videoId}`,
        title: snippet.title,
        content_type: 'video' as const,
        summary: snippet.description?.slice(0, 300) || 'No description available',
        key_insights: [
          `${formatNumber(stats.viewCount || 0)} views`,
          `${formatNumber(stats.likeCount || 0)} likes`,
          `By ${snippet.channelTitle}`
        ],
        tags: extractTags(snippet.title, snippet.description),
        difficulty_level: getDifficultyFromContent(snippet.title, snippet.description),
        estimated_read_time: parseDuration(stats.duration),
        engagement_score: calculateEngagement(stats),
        source: 'YouTube',
        author: snippet.channelTitle,
        published_at: snippet.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        video_id: videoId
      };
    }) || [];

    return new Response(
      JSON.stringify({ success: true, data: videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching videos:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch videos' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function parseDuration(duration: string | undefined): string {
  if (!duration) return '10 min';
  
  // Parse ISO 8601 duration (PT1H2M3S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '10 min';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);
  return `${totalMinutes} min`;
}

function extractTags(title: string, description: string): string[] {
  const keywords = ['AI', 'Machine Learning', 'Deep Learning', 'Tutorial', 'Python', 'TensorFlow', 'PyTorch', 'GPT', 'LLM', 'Neural Network'];
  const content = `${title} ${description}`.toLowerCase();
  
  return keywords.filter(k => content.includes(k.toLowerCase())).slice(0, 5);
}

function getDifficultyFromContent(title: string, description: string): 'beginner' | 'intermediate' | 'advanced' {
  const content = `${title} ${description}`.toLowerCase();
  
  if (content.includes('beginner') || content.includes('introduction') || content.includes('basics') || content.includes('getting started')) {
    return 'beginner';
  }
  if (content.includes('advanced') || content.includes('deep dive') || content.includes('research') || content.includes('architecture')) {
    return 'advanced';
  }
  return 'intermediate';
}

function calculateEngagement(stats: any): number {
  const views = stats.viewCount || 0;
  const likes = stats.likeCount || 0;
  
  // Calculate engagement based on views and like ratio
  const viewScore = Math.min(50, Math.log10(views + 1) * 10);
  const likeRatio = views > 0 ? (likes / views) * 100 : 0;
  const likeScore = Math.min(50, likeRatio * 10);
  
  return Math.floor(viewScore + likeScore);
}

function getCuratedFallbackVideos(): Video[] {
  const curatedVideos = [
    {
      id: 'yt-fallback-1',
      title: 'Introduction to Machine Learning - Full Course',
      content_type: 'video' as const,
      summary: 'A comprehensive introduction to machine learning concepts, algorithms, and practical applications. Perfect for beginners looking to understand AI fundamentals.',
      key_insights: ['Beginner friendly', 'Comprehensive coverage', 'Hands-on examples'],
      tags: ['Machine Learning', 'AI', 'Tutorial', 'Beginner'],
      difficulty_level: 'beginner' as const,
      estimated_read_time: '45 min',
      engagement_score: 92,
      source: 'YouTube',
      author: 'Tech Education',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/results?search_query=machine+learning+tutorial',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=480&h=270&fit=crop',
      video_id: 'fallback-1'
    },
    {
      id: 'yt-fallback-2',
      title: 'Deep Learning with Neural Networks Explained',
      content_type: 'video' as const,
      summary: 'Explore the fundamentals of deep learning and neural networks. Learn how AI models learn from data and make predictions.',
      key_insights: ['Neural network basics', 'Backpropagation explained', 'Real-world applications'],
      tags: ['Deep Learning', 'Neural Networks', 'AI'],
      difficulty_level: 'intermediate' as const,
      estimated_read_time: '30 min',
      engagement_score: 88,
      source: 'YouTube',
      author: 'AI Academy',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/results?search_query=deep+learning+neural+networks',
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=480&h=270&fit=crop',
      video_id: 'fallback-2'
    },
    {
      id: 'yt-fallback-3',
      title: 'GPT and Large Language Models - How They Work',
      content_type: 'video' as const,
      summary: 'Understand the architecture and training process behind GPT and other large language models powering modern AI applications.',
      key_insights: ['Transformer architecture', 'Training process', 'GPT capabilities'],
      tags: ['GPT', 'LLM', 'Transformers', 'NLP'],
      difficulty_level: 'intermediate' as const,
      estimated_read_time: '25 min',
      engagement_score: 95,
      source: 'YouTube',
      author: 'AI Explained',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/results?search_query=gpt+large+language+models+explained',
      thumbnail: 'https://images.unsplash.com/photo-1684391545194-a4e3f5c37e91?w=480&h=270&fit=crop',
      video_id: 'fallback-3'
    },
    {
      id: 'yt-fallback-4',
      title: 'Python for AI and Machine Learning',
      content_type: 'video' as const,
      summary: 'Master Python programming for AI development. Covers essential libraries like NumPy, Pandas, TensorFlow, and PyTorch.',
      key_insights: ['Python basics', 'ML libraries', 'Practical coding'],
      tags: ['Python', 'TensorFlow', 'PyTorch', 'Tutorial'],
      difficulty_level: 'beginner' as const,
      estimated_read_time: '60 min',
      engagement_score: 85,
      source: 'YouTube',
      author: 'Code Academy',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/results?search_query=python+machine+learning+tutorial',
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=480&h=270&fit=crop',
      video_id: 'fallback-4'
    },
    {
      id: 'yt-fallback-5',
      title: 'Computer Vision and Image Recognition',
      content_type: 'video' as const,
      summary: 'Learn how computers see and understand images. Covers CNNs, object detection, and image classification techniques.',
      key_insights: ['CNN architecture', 'Object detection', 'Image classification'],
      tags: ['Computer Vision', 'Deep Learning', 'CNN'],
      difficulty_level: 'advanced' as const,
      estimated_read_time: '40 min',
      engagement_score: 82,
      source: 'YouTube',
      author: 'Vision AI Lab',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/results?search_query=computer+vision+deep+learning',
      thumbnail: 'https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=480&h=270&fit=crop',
      video_id: 'fallback-5'
    },
    {
      id: 'yt-fallback-6',
      title: 'Reinforcement Learning Fundamentals',
      content_type: 'video' as const,
      summary: 'Discover how AI agents learn through trial and error. Covers Q-learning, policy gradients, and game-playing AI.',
      key_insights: ['RL basics', 'Q-learning', 'Game AI examples'],
      tags: ['Reinforcement Learning', 'AI', 'Gaming'],
      difficulty_level: 'advanced' as const,
      estimated_read_time: '35 min',
      engagement_score: 79,
      source: 'YouTube',
      author: 'RL Research',
      published_at: new Date().toISOString().split('T')[0],
      url: 'https://www.youtube.com/results?search_query=reinforcement+learning+tutorial',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=480&h=270&fit=crop',
      video_id: 'fallback-6'
    }
  ];
  
  return curatedVideos;
}
