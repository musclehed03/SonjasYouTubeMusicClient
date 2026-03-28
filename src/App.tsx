/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Toaster, toast } from 'sonner';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Search, List, Settings, Grid, Layout, Volume2, Activity,
  Maximize2, MoreVertical, Plus, FolderPlus, SortAsc,
  Heart, Share2, Download, Cast, RotateCcw, RotateCw,
  ChevronDown, Volume1, VolumeX, MoreHorizontal, Calendar, Music, ListMusic
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Song, Playlist, ThemeConfig, AppSettings } from './types';
import { cn } from './utils';
import { Visualizer } from './components/Visualizer';
import { Youtube, LogOut, User, Music2, Disc3, Ban, Headphones, Sliders, Zap, Shield, ShieldOff, SortDesc } from 'lucide-react';
import { auth, db, UserPreferences, DEFAULT_PREFERENCES, saveUserPreferences } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';

const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    releaseDate: '2019-11-29',
    thumbnail: 'https://picsum.photos/seed/weeknd/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    duration: 200,
    genre: 'Synth-pop',
    lyrics: `[00:00] I've been on my own for long enough
[00:05] Maybe you can show me how to love, maybe
[00:10] I'm going through withdrawals
[00:15] You don't even have to do too much
[00:20] You can turn me on with just a touch, baby
[00:25] I look around and Sin City's cold and empty
[00:30] No one's around to judge me
[00:35] I can't see clearly when you're gone
[00:40] I said, ooh, I'm blinded by the lights
[00:45] No, I can't sleep until I feel your touch
[00:50] I said, ooh, I'm drowning in the night
[00:55] Oh, when I'm like this, you're the one I trust`
  },
  {
    id: '2',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    releaseDate: '2020-03-27',
    thumbnail: 'https://picsum.photos/seed/dua/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=TUVcZfQe-Kw',
    duration: 203,
    genre: 'Dance-pop',
    lyrics: `[00:00] If you wanna run away with me, I know a galaxy
[00:05] And I can take you for a ride
[00:10] I had a premonition that we fell into a rhythm
[00:15] Where the music don't stop for life
[00:20] Glitter in the sky, glitter in my eyes
[00:25] Shining just the way I like
[00:30] If you're feeling like you need a little bit of company
[00:35] You met me at the perfect time
[00:40] You want me, I want you, baby
[00:45] My sugarboo, I'm levitating
[00:50] The Milky Way, we're renegading
[00:55] Yeah-yeah-yeah-yeah-yeah`
  },
  {
    id: '3',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    releaseDate: '2020-08-09',
    thumbnail: 'https://picsum.photos/seed/tears/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=XXYlFuWEuKI',
    duration: 215,
    genre: 'Synth-pop',
    lyrics: `[00:00] I saw you dancing in a crowded room
[00:05] You look so happy when I'm not with you
[00:10] But then you saw me, caught you by surprise
[00:15] A single teardrop falling from your eye
[00:20] I don't know why I run away
[00:25] I'll make you cry when I run away
[00:30] Take me back 'cause I wanna stay
[00:35] Save your tears for another day`
  },
  {
    id: '4',
    title: 'Peaches',
    artist: 'Justin Bieber',
    album: 'Justice',
    releaseDate: '2021-03-19',
    thumbnail: 'https://picsum.photos/seed/peaches/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=tQ0yjYUFKAE',
    duration: 198,
    genre: 'Pop',
    lyrics: `[00:00] I got my peaches out in Georgia (oh, yeah, shit)
[00:05] I get my weed from California (that's that shit)
[00:10] I took my chick up to the North, yeah (badass bitch)
[00:15] I get my light right from the source, yeah (yeah, that's it)
[00:20] And I say, oh! (oh)
[00:25] The way I breathe you in (in)
[00:30] It's the texture of your skin
[00:35] I wanna wrap my arms around you, baby`
  },
  {
    id: '5',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    releaseDate: '2021-07-09',
    thumbnail: 'https://picsum.photos/seed/stay/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=kTJczUoc26U',
    duration: 141,
    lyrics: `[00:00] I do the same thing I told you that I never would
[00:05] I told you I'd change, even when I knew I never could
[00:10] I know that I can't find nobody else as good as you
[00:15] I need you to stay, need you to stay, hey
[00:20] I get drunk, wake up, I'm wasted still
[00:25] I realize the time that I wasted here
[00:30] I feel like you can't feel the way I feel
[00:35] Oh, I'll be fucked up if you can't be right here`
  },
  {
    id: '6',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    releaseDate: '2020-06-29',
    thumbnail: 'https://picsum.photos/seed/heat/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=mRD0-GxqHVo',
    duration: 238,
    lyrics: `[00:00] Road shimmer wiggling the vision
[00:05] Heat, heat waves, I'm swimming in a mirror
[00:10] Road shimmer wiggling the vision
[00:15] Heat, heat waves, I'm swimming in a mirror
[00:20] Sometimes, all I think about is you
[00:25] Late nights in the middle of June
[00:30] Heat waves been faking me out
[00:35] Can't make you happier now`
  },
  {
    id: '7',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    album: '=',
    releaseDate: '2021-06-25',
    thumbnail: 'https://picsum.photos/seed/habits/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=orJSJGHjBLI',
    duration: 231,
    lyrics: `[00:00] My bad habits lead to late nights ending alone
[00:05] Conversations with a stranger I barely know
[00:10] Swearing this will be the last, but it probably won't
[00:15] I got nothing left to lose, or use, or do
[00:20] My bad habits lead to wide eyes stare into space
[00:25] And I know I'll lose control of the things that I say
[00:30] I was looking for a way out, now I can't escape
[00:35] Nothing happens after two, it's true, it's true`
  },
  {
    id: '8',
    title: 'Industry Baby',
    artist: 'Lil Nas X & Jack Harlow',
    album: 'MONTERO',
    releaseDate: '2021-07-23',
    thumbnail: 'https://picsum.photos/seed/industry/400/400',
    videoUrl: 'https://www.youtube.com/watch?v=UTHLKHL_whs',
    duration: 212,
    lyrics: `[00:00] Baby back, ayy, couple racks, ayy
[00:05] Couple Grammys on him, couple plaques, ayy
[00:10] That's a fact, ayy, throw it back, ayy
[00:15] Throw it back, ayy
[00:20] And this one is for the champions
[00:25] I ain't lost since I began, ayy
[00:30] Funny how you said it was the end, ayy
[00:35] Then I went and did it again, ayy`
  }
];

const MOCK_PLAYLISTS: Playlist[] = [
  { id: 'p1', name: 'My Favorites', songs: MOCK_SONGS },
  { id: 'p2', name: 'Workout Mix', songs: [MOCK_SONGS[1], MOCK_SONGS[3]] },
  { id: 'p3', name: 'Chill Vibes', songs: [MOCK_SONGS[0], MOCK_SONGS[2]], folder: 'Relax' }
];

export default function App() {
  const [currentSong, setCurrentSong] = useState<Song>(MOCK_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album' | 'date' | 'genre'>('title');
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPlaylistsExpanded, setIsPlaylistsExpanded] = useState(true);
  const [isYtPlaylistsExpanded, setIsYtPlaylistsExpanded] = useState(true);
  const [ytPlaylistSortBy, setYtPlaylistSortBy] = useState<'title' | 'channel'>('title');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isVisualizerMenuOpen, setIsVisualizerMenuOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>(MOCK_PLAYLISTS[0]);
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ytUser, setYtUser] = useState<{ name: string; picture: string; email: string } | null>(null);
  const [ytPlaylists, setYtPlaylists] = useState<any[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('ytm_preferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });
  const [theme, setTheme] = useState<ThemeConfig>(preferences.theme);
  const [queue, setQueue] = useState<Song[]>(MOCK_SONGS);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);

  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  // Reset ready state when song changes to prevent play/pause interruption
  useEffect(() => {
    setIsReady(false);
    setCanPlay(false);
  }, [currentSong]);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => setCanPlay(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--tertiary-color', theme.tertiaryColor);
    document.documentElement.style.setProperty('--accent-color', theme.accentColor);
    document.documentElement.style.setProperty('--text-color', theme.textColor);
    document.documentElement.style.setProperty('--app-font', theme.fontFamily);
    document.documentElement.style.setProperty('--app-font-size', `${theme.fontSize}px`);
  }, [theme]);

  // Firebase Auth and Settings Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Sync preferences from Firestore
        const prefsRef = doc(db, 'users', firebaseUser.uid, 'settings', 'preferences');
        const unsubPrefs = onSnapshot(prefsRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserPreferences;
            setPreferences(data);
            setTheme(data.theme);
          }
        });
        return () => unsubPrefs();
      }
    });
    return () => unsubscribe();
  }, []);

  // Update Firestore and LocalStorage when local preferences change
  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    
    // Update local state immediately for responsiveness
    setPreferences(updated);
    if (newPrefs.theme) {
      setTheme(updated.theme);
    }
    
    // Persist to localStorage
    localStorage.setItem('ytm_preferences', JSON.stringify(updated));

    // Persist to Firestore if logged in
    if (user) {
      try {
        await saveUserPreferences(user.uid, updated);
      } catch (err) {
        console.error("Failed to save preferences to Firestore:", err);
      }
    }
  };

  const handleShare = (song: Song) => {
    const url = `https://music.youtube.com/watch?v=${song.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!', {
      description: `${song.title} by ${song.artist}`,
      icon: <Share2 className="w-4 h-4 text-tertiary" />,
    });
  };

  const handleDownload = (song: Song) => {
    toast.info('Download started...', {
      description: `${song.title} is being prepared for offline playback.`,
      icon: <Download className="w-4 h-4 text-primary" />,
    });
    // Simulate download
    setTimeout(() => {
      toast.success('Download complete!', {
        description: `${song.title} is now available offline.`
      });
    }, 2000);
  };

  const handleCast = () => {
    toast.info('Searching for devices...', {
      description: 'Make sure your Chromecast or smart TV is on the same Wi-Fi network.',
      icon: <Cast className="w-4 h-4 text-tertiary" />,
    });
  };

  const handleHome = () => {
    setIsQueueOpen(false);
    setShowSettings(false);
    setIsNowPlayingOpen(false);
    toast('Welcome Home', {
      description: 'Back to your personalized music hub.',
      icon: <Grid className="w-4 h-4 text-tertiary" />,
    });
  };

  const handleExplore = () => {
    toast('Explore New Music', {
      description: 'Discover trending tracks and new releases.',
      icon: <Search className="w-4 h-4 text-tertiary" />,
    });
  };

  const handleSongs = () => {
    toast('Your Songs', {
      description: 'Viewing all tracks in your library.',
      icon: <Music2 className="w-4 h-4 text-tertiary" />,
    });
  };

  // Fisher-Yates Shuffle
  const shuffleQueue = (songs: Song[]) => {
    const shuffled = [...songs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledQueue(shuffled);
  };

  useEffect(() => {
    if (isShuffle) {
      const shuffled = [...selectedPlaylist.songs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQueue(shuffled);
    } else {
      setQueue(selectedPlaylist.songs);
    }
  }, [isShuffle, selectedPlaylist]);

  // Block Song Feature
  const blockSong = (songId: string) => {
    const updatedBlocked = [...preferences.blockedSongs, songId];
    updatePreferences({ blockedSongs: updatedBlocked });
  };

  const isSongBlocked = (songId: string) => preferences.blockedSongs.includes(songId);

  const filteredPlaylists = useMemo(() => {
    return ytPlaylists.filter(p => 
      p.snippet.title.toLowerCase().includes(playlistSearch.toLowerCase())
    );
  }, [ytPlaylists, playlistSearch]);

  const fetchYtPlaylists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/youtube/playlists');
      const data = await res.json();
      if (res.ok) {
        setYtPlaylists(data);
      } else {
        setError(data.error || 'Failed to fetch playlists');
      }
    } catch (err) {
      console.error('Failed to fetch playlists', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check Auth Status
  const checkAuth = useCallback(async (retries = 5) => {
    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      setYtUser(data.user);
      if (data.isAuthenticated) {
        fetchYtPlaylists();
      }
    } catch (err) {
      if (retries > 0) {
        console.log(`Auth check failed, retrying in 2s... (${retries} retries left)`);
        setTimeout(() => checkAuth(retries - 1), 2000);
      } else {
        console.error('Auth check failed after multiple attempts:', err);
      }
    }
  }, [fetchYtPlaylists]);

  useEffect(() => {
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuth, fetchYtPlaylists]);

  const toggleLikeSong = async (songId: string) => {
    const isLiked = preferences.likedSongs.includes(songId);
    const newLikedSongs = isLiked 
      ? preferences.likedSongs.filter(id => id !== songId)
      : [...preferences.likedSongs, songId];
    
    await updatePreferences({ likedSongs: newLikedSongs });
  };

  const isSongLiked = (songId: string) => preferences.likedSongs.includes(songId);

  const handleStartMix = () => {
    const allSongs = [...MOCK_SONGS];
    // Shuffle all songs
    for (let i = allSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
    }
    
    const mixPlaylist: Playlist = {
      id: 'mix-' + Date.now(),
      name: 'Your Mix',
      songs: allSongs,
      thumbnail: allSongs[0].thumbnail
    };
    
    setSelectedPlaylist(mixPlaylist);
    setQueue(allSongs);
    setCurrentSong(allSongs[0]);
    setIsPlaying(true);
    setIsShuffle(true);
  };

  const handleSelectLikedMusic = () => {
    const likedSongs = selectedPlaylist.songs.filter(s => isSongLiked(s.id));
    setSelectedPlaylist({
      id: 'liked-music',
      name: 'Liked Music',
      description: 'Your favorite tracks',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      songs: likedSongs
    });
  };

  const handleConnect = async () => {
    try {
      const res = await fetch(`/api/auth/url?origin=${encodeURIComponent(window.location.origin)}`);
      const { url } = await res.json();
      window.open(url, 'youtube_auth', 'width=600,height=700');
    } catch (err) {
      console.error('Failed to get auth URL', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setYtUser(null);
    setYtPlaylists([]);
    setSelectedPlaylist(MOCK_PLAYLISTS[0]);
  };

  const handleSelectYtPlaylist = async (playlist: any, startPlaying = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/youtube/playlist-items/${playlist.id}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch songs');
      }

      const songs: Song[] = data.map((item: any) => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || 'Unknown Artist',
        album: playlist.snippet.title,
        releaseDate: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
        duration: 0 // YouTube API doesn't give duration in playlistItems.list easily
      }));

      setSelectedPlaylist({
        id: playlist.id,
        name: playlist.snippet.title,
        songs
      });
      if (songs.length > 0) {
        setCurrentSong(songs[0]);
        if (startPlaying) setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch songs', err);
      setError(err.message || 'Failed to fetch songs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSongs = useMemo(() => {
    let result = [...selectedPlaylist.songs].filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'album') return a.album.localeCompare(b.album);
      if (sortBy === 'genre') return (a.genre || '').localeCompare(b.genre || '');
      if (sortBy === 'date') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      return 0;
    });

    return result;
  }, [selectedPlaylist, searchQuery, sortBy]);

  // Dynamic Theme Effect
  useEffect(() => {
    if (theme.dynamicTheme && currentSong) {
      // Simulate dynamic theme by picking colors based on song title hash
      const hash = currentSong.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = [
        { p: '#ff007f', s: '#ff80bf', t: '#ff00ff' }, // Pink
        { p: '#00ffcc', s: '#80ffe6', t: '#00ffff' }, // Teal
        { p: '#7f00ff', s: '#bf80ff', t: '#ff00ff' }, // Purple
        { p: '#ffcc00', s: '#ffe680', t: '#ffff00' }, // Gold
        { p: '#00ccff', s: '#80e6ff', t: '#00ffff' }, // Blue
        { p: '#ff4444', s: '#ff8888', t: '#ff0000' }, // Red
      ];
      const selected = colors[hash % colors.length];
      setTheme(prev => ({
        ...prev,
        primaryColor: selected.p,
        secondaryColor: selected.s,
        tertiaryColor: selected.t
      }));
    }
  }, [currentSong, theme.dynamicTheme]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgress = (state: any) => {
    setCurrentTime(state.playedSeconds);
    // Fallback to fetch duration if onDuration was skipped or missed
    if (playerRef.current && (!duration || duration === 0)) {
      const d = playerRef.current.getDuration();
      if (d) setDuration(d);
    }
  };

  const handleDuration = (d: number) => {
    setDuration(d);
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (playerRef.current) {
        const player = playerRef.current;
        if (typeof player.seekTo === 'function') {
          player.seekTo(0);
        } else if (typeof player.getInternalPlayer === 'function') {
          const internal = player.getInternalPlayer();
          if (internal && typeof internal.seekTo === 'function') {
            internal.seekTo(0);
          }
        }
      }
      // Small delay to prevent play/pause interruption
      setTimeout(() => setIsPlaying(true), 150);
    } else if (preferences.audio.autoplay) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (amount: number) => {
    const player = playerRef.current;
    if (player) {
      // Try ReactPlayer instance method first
      if (typeof player.seekTo === 'function') {
        const currentTime = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
        player.seekTo(currentTime + amount);
      } 
      // Fallback to internal player if available
      else if (typeof player.getInternalPlayer === 'function') {
        const internal = player.getInternalPlayer();
        if (internal && typeof internal.seekTo === 'function') {
          const currentTime = typeof internal.getCurrentTime === 'function' ? internal.getCurrentTime() : 0;
          internal.seekTo(currentTime + amount);
        }
      }
    }
  };

  const handleNext = () => {
    const activeQueue = queue;
    if (activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex(s => s.id === currentSong.id);
    let nextIndex = (currentIndex + 1) % activeQueue.length;
    
    // Skip blocked songs
    while (isSongBlocked(activeQueue[nextIndex].id) && nextIndex !== currentIndex) {
      nextIndex = (nextIndex + 1) % activeQueue.length;
    }
    
    if (nextIndex === 0 && repeatMode === 'none') {
      setIsPlaying(false);
    } else {
      setCurrentSong(activeQueue[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const activeQueue = queue;
    if (activeQueue.length === 0) return;
    const currentIndex = activeQueue.findIndex(s => s.id === currentSong.id);
    let prevIndex = (currentIndex - 1 + activeQueue.length) % activeQueue.length;
    
    // Skip blocked songs
    while (isSongBlocked(activeQueue[prevIndex].id) && prevIndex !== currentIndex) {
      prevIndex = (prevIndex - 1 + activeQueue.length) % activeQueue.length;
    }
    
    setCurrentSong(activeQueue[prevIndex]);
  };

  const parsedLyrics = useMemo(() => {
    if (!currentSong.lyrics) return [];
    return currentSong.lyrics.split('\n').map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\](.*)/);
      if (match) {
        return {
          time: parseInt(match[1]) * 60 + parseInt(match[2]),
          text: match[3].trim()
        };
      }
      return { time: 0, text: line };
    });
  }, [currentSong.lyrics]);

  const currentLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [parsedLyrics, currentTime]);

  const lyricsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (lyricsRef.current && currentLyricIndex !== -1) {
      const activeElement = lyricsRef.current.children[currentLyricIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricIndex]);

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden relative" style={{ fontSize: `var(--app-font-size)` }}>
      {/* Sidebar Toggle (Always Accessible) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-2 left-2 z-[100] p-1.5 bg-tertiary/20 backdrop-blur-md border border-tertiary/40 rounded-lg text-tertiary hover:text-white transition-all shadow-xl hover:scale-110 active:scale-95"
        >
          <Layout className="w-4 h-4" />
        </button>
      )}

      {/* Sidebar */}
      <Toaster position="top-center" richColors theme={preferences.theme.visualizerType === 'nebula' ? 'dark' : 'light'} />
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -256 }}
            animate={{ x: 0, width: isSidebarCollapsed ? 56 : 220 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className={cn(
              "fixed md:relative z-50 h-full bg-zinc-900/95 md:bg-zinc-900/50 border-r border-tertiary/30 flex flex-col p-1.5 gap-2 backdrop-blur-xl md:backdrop-blur-none transition-all duration-300 overflow-y-auto custom-scrollbar"
            )}
          >
            <div className="flex items-center justify-between px-2 mb-1">
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-black tracking-widest text-tertiary uppercase opacity-90 font-display leading-none">
                  YTMStream <span className="text-white opacity-50">Control</span>
                </span>
              )}
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 hover:bg-tertiary/20 rounded-md text-tertiary hover:text-white transition-all border border-tertiary/30 bg-tertiary/5 shadow-[0_0_10px_rgba(var(--tertiary-color-rgb),0.1)] ml-auto"
              >
                {isSidebarCollapsed ? <Layout className="w-3.5 h-3.5" /> : <SkipBack className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {isAuthenticated ? (
                <div className={cn("flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-tertiary/20", isSidebarCollapsed && "justify-center")}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {ytUser?.picture ? (
                      <img src={ytUser.picture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] font-bold truncate">{ytUser?.name || 'Premium User'}</span>
                      <button onClick={handleLogout} className="text-[9px] text-zinc-500 hover:text-red-400 flex items-center gap-1">
                        <LogOut className="w-2.5 h-2.5" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleConnect}
                  className={cn("flex items-center justify-center gap-2 w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-[11px] font-bold transition-all group", isSidebarCollapsed && "px-0")}
                >
                  <Youtube className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  {!isSidebarCollapsed && "Connect YTM"}
                </button>
              )}
            </div>

        <nav className="flex flex-col gap-0.5">
          {!isSidebarCollapsed && <div className="text-[7px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-0.5 px-2">Library</div>}
          <button 
            onClick={handleHome}
            className={cn("flex items-center gap-2.5 p-1 text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-all text-[10px]", isSidebarCollapsed && "justify-center px-0")}
          >
            <Grid className="w-3.5 h-3.5 text-tertiary" /> {!isSidebarCollapsed && "Home"}
          </button>
          <button 
            onClick={handleExplore}
            className={cn("flex items-center gap-2.5 p-1 text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-all text-[10px]", isSidebarCollapsed && "justify-center px-0")}
          >
            <Search className="w-3.5 h-3.5 text-tertiary" /> {!isSidebarCollapsed && "Explore"}
          </button>
          <button 
            onClick={handleSongs}
            className={cn("flex items-center gap-2.5 p-1 text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-all text-[10px]", isSidebarCollapsed && "justify-center px-0")}
          >
            <Music2 className="w-3.5 h-3.5 text-tertiary" /> {!isSidebarCollapsed && "Songs"}
          </button>
          <button 
            onClick={handleStartMix}
            className={cn("flex items-center gap-2.5 p-1 text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-all text-[10px] group", isSidebarCollapsed && "justify-center px-0")}
          >
            <Zap className={cn("w-3.5 h-3.5", theme.dynamicTheme ? "text-primary" : "text-tertiary")} /> 
            {!isSidebarCollapsed && (
              <span className="flex items-center gap-1.5">
                Start Mix
                <span className="text-[7px] bg-tertiary/20 text-tertiary px-1 rounded uppercase font-black">New</span>
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              setIsQueueOpen(true);
              setShowSettings(false);
              setIsNowPlayingOpen(false);
            }}
            className={cn(
              "flex items-center gap-2.5 p-1 rounded-md transition-all text-[10px] w-full", 
              isQueueOpen ? "bg-tertiary/20 text-tertiary font-bold" : "text-zinc-300 hover:text-white hover:bg-white/5",
              isSidebarCollapsed && "justify-center px-0"
            )}
          >
            <ListMusic className="w-3.5 h-3.5" /> {!isSidebarCollapsed && "Queue"}
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsVisualizerMenuOpen(!isVisualizerMenuOpen)}
              className={cn("flex items-center gap-2.5 p-1 text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-all text-[10px] w-full", isSidebarCollapsed && "justify-center px-0")}
            >
              <Zap className="w-3.5 h-3.5 text-tertiary" /> {!isSidebarCollapsed && "Visualizers"}
            </button>
            <AnimatePresence>
              {isVisualizerMenuOpen && !isSidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full top-0 ml-2 w-32 bg-zinc-900 border border-tertiary/30 rounded-xl p-1 shadow-2xl z-50"
                >
                  {['bars', 'wave', 'circle', 'particles', 'spectrum', 'rings', 'glitch', 'nebula', 'fireworks', 'matrix'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => {
                        updatePreferences({ theme: { ...theme, visualizerType: type as any } });
                        setIsVisualizerMenuOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-lg text-[10px] capitalize transition-colors",
                        theme.visualizerType === type ? "bg-tertiary/20 text-tertiary font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

            {/* Playlists Section */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <button 
                  onClick={() => setIsPlaylistsExpanded(!isPlaylistsExpanded)}
                  className="flex items-center justify-between w-full px-2 py-1 mb-0.5 group hover:bg-white/5 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-tertiary rounded-full" />
                    <h3 className="text-[8px] uppercase tracking-[0.2em] text-zinc-400 font-bold group-hover:text-tertiary transition-colors">Your Library</h3>
                  </div>
                  <div className={cn("transition-transform duration-300", isPlaylistsExpanded ? "rotate-180" : "")}>
                    <SkipForward className="w-2.5 h-2.5 text-tertiary/60 rotate-90" />
                  </div>
                </button>
              )}
              
              <AnimatePresence initial={false}>
                {(isPlaylistsExpanded || isSidebarCollapsed) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-0.5 px-1"
                  >
                    <div className="group relative">
                      <button 
                        onClick={handleSelectLikedMusic}
                        className={cn(
                          "w-full flex items-center gap-2 px-1.5 py-1 rounded-md transition-all group text-left",
                          selectedPlaylist.id === 'liked-music' ? "bg-tertiary/10 text-tertiary" : "hover:bg-white/5 text-zinc-400 hover:text-white",
                          isSidebarCollapsed && "justify-center"
                        )}
                      >
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 border border-white/10">
                          <Heart className="w-3 h-3 fill-white" />
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="flex flex-col items-start overflow-hidden">
                            <span className="text-[10px] font-bold truncate">Liked Music</span>
                            <span className="text-[7px] opacity-60">{preferences.likedSongs.length} songs</span>
                          </div>
                        )}
                      </button>
                      {!isSidebarCollapsed && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const likedSongs = MOCK_SONGS.filter(s => preferences.likedSongs.includes(s.id));
                            if (likedSongs.length > 0) {
                              handleSelectLikedMusic();
                              setCurrentSong(likedSongs[0]);
                              setIsPlaying(true);
                            }
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-tertiary text-black opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                        >
                          <Play className="w-2.5 h-2.5 fill-black" />
                        </button>
                      )}
                    </div>

                    {/* Local Playlists */}
                    {MOCK_PLAYLISTS.map(p => (
                      <div key={p.id} className="group relative">
                        <button 
                          onClick={() => setSelectedPlaylist(p)}
                          className={cn(
                            "w-full flex items-center gap-2 p-1.5 text-[10px] rounded-md transition-all",
                            selectedPlaylist.id === p.id ? "bg-tertiary/10 text-tertiary font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5",
                            isSidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          {p.folder ? <FolderPlus className="w-3.5 h-3.5 text-tertiary" /> : <List className="w-3.5 h-3.5 text-tertiary" />}
                          {!isSidebarCollapsed && <span className="truncate">{p.name}</span>}
                        </button>
                        {!isSidebarCollapsed && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (p.songs.length > 0) {
                                setSelectedPlaylist(p);
                                setCurrentSong(p.songs[0]);
                                setIsPlaying(true);
                              }
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-tertiary text-black opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                          >
                            <Play className="w-2.5 h-2.5 fill-black" />
                          </button>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* YouTube Playlists Section */}
            <div className="space-y-1 mt-2">
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between w-full px-2 py-1 mb-0.5 group">
                  <button 
                    onClick={() => setIsYtPlaylistsExpanded(!isYtPlaylistsExpanded)}
                    className="flex items-center gap-2 hover:text-tertiary transition-colors"
                  >
                    <div className="w-1 h-3 bg-red-500 rounded-full" />
                    <h3 className="text-[8px] uppercase tracking-[0.2em] text-zinc-400 font-bold group-hover:text-tertiary transition-colors">YouTube Playlists</h3>
                    <div className={cn("transition-transform duration-300", isYtPlaylistsExpanded ? "rotate-180" : "")}>
                      <SkipForward className="w-2.5 h-2.5 text-tertiary/60 rotate-90" />
                    </div>
                  </button>
                  
                  {isYtPlaylistsExpanded && (
                    <div className="relative">
                      <button 
                        onMouseEnter={() => setIsSortMenuOpen(true)}
                        onMouseLeave={() => setIsSortMenuOpen(false)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
                      >
                        <SortAsc className="w-3 h-3 text-tertiary group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Sort</span>
                      </button>

                      <AnimatePresence>
                        {isSortMenuOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            onMouseEnter={() => setIsSortMenuOpen(true)}
                            onMouseLeave={() => setIsSortMenuOpen(false)}
                            className="absolute right-0 top-full mt-1 w-24 bg-zinc-900 border border-tertiary/30 rounded-lg p-1 shadow-2xl z-50 backdrop-blur-xl"
                          >
                            <button 
                              onClick={() => {
                                setYtPlaylistSortBy('title');
                                setIsSortMenuOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-md text-[9px] font-bold uppercase transition-colors flex items-center justify-between",
                                ytPlaylistSortBy === 'title' ? "bg-tertiary/20 text-tertiary" : "text-zinc-400 hover:text-white hover:bg-white/5"
                              )}
                            >
                              Title {ytPlaylistSortBy === 'title' && <div className="w-1 h-1 rounded-full bg-tertiary" />}
                            </button>
                            <button 
                              onClick={() => {
                                setYtPlaylistSortBy('channel');
                                setIsSortMenuOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-md text-[9px] font-bold uppercase transition-colors flex items-center justify-between",
                                ytPlaylistSortBy === 'channel' ? "bg-tertiary/20 text-tertiary" : "text-zinc-400 hover:text-white hover:bg-white/5"
                              )}
                            >
                              Channel {ytPlaylistSortBy === 'channel' && <div className="w-1 h-1 rounded-full bg-tertiary" />}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence initial={false}>
                {(isYtPlaylistsExpanded || isSidebarCollapsed) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-0.5 px-1"
                  >
                    {!isSidebarCollapsed && (
                      <div className="relative mb-1.5 px-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-500" />
                        <input 
                          type="text" 
                          placeholder="Search in playlist..." 
                          value={playlistSearch}
                          onChange={(e) => setPlaylistSearch(e.target.value)}
                          className="w-full bg-white/5 border border-tertiary/20 rounded-md py-1 pl-6 pr-2 text-[9px] focus:outline-none focus:border-tertiary/50 transition-all font-medium"
                        />
                      </div>
                    )}

                    {filteredPlaylists
                      .sort((a, b) => {
                        if (ytPlaylistSortBy === 'title') return a.snippet.title.localeCompare(b.snippet.title);
                        return a.snippet.channelTitle.localeCompare(b.snippet.channelTitle);
                      })
                      .map(p => (
                        <button 
                          key={p.id}
                          onClick={() => handleSelectYtPlaylist(p)}
                          className={cn(
                            "flex items-center gap-2 p-1.5 text-[10px] rounded-md transition-all text-left",
                            selectedPlaylist.id === p.id ? "bg-tertiary/10 text-tertiary font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5",
                            isSidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          <img src={p.snippet.thumbnails.default?.url} className="w-5 h-5 rounded-md object-cover flex-shrink-0 border border-white/5" />
                          {!isSidebarCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                              <span className="truncate font-medium">{p.snippet.title}</span>
                              <span className="text-[7px] text-zinc-500 truncate">{p.snippet.channelTitle}</span>
                            </div>
                          )}
                        </button>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

        <div className="mt-auto pt-2 border-t border-tertiary/20">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={cn("flex items-center gap-3 p-2 text-zinc-400 hover:text-white transition-colors text-[11px]", isSidebarCollapsed && "justify-center px-0")}
          >
            <Settings className="w-4 h-4 text-tertiary" /> {!isSidebarCollapsed && "Settings"}
          </button>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
            >
              <div className="bg-red-500/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✕</div>
                  <p className="text-sm font-bold">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-white/60 hover:text-white">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="h-8 flex items-center justify-between px-2 md:px-3 bg-black/50 backdrop-blur-md z-20 border-b border-tertiary/30">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && <div className="w-8" /> /* Spacer for toggle */}
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1 hover:bg-tertiary/20 rounded-full transition-colors border border-tertiary/30 md:hidden"
              >
                <Layout className="w-3.5 h-3.5 text-tertiary" />
              </button>
            )}
            <div className="relative w-28 md:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800/50 border border-tertiary/20 rounded-full py-0.5 pl-7 pr-3 focus:outline-none focus:border-primary/50 transition-colors text-[9px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={handleCast}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-tertiary hover:text-white"
            >
              <Cast className="w-3 h-3" />
            </button>
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary border border-white/10 shadow-lg" />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-2 md:p-3 custom-scrollbar relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {isQueueOpen ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">Now Playing Queue</h1>
                  <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-widest font-bold">Manage your active playback session</p>
                </div>
                <button 
                  onClick={() => setIsQueueOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold transition-all"
                >
                  Back to Library
                </button>
              </div>

              <div className="flex-1">
                <Reorder.Group axis="y" values={queue} onReorder={setQueue} className="space-y-1">
                  {queue.map((song) => (
                    <Reorder.Item 
                      key={song.id} 
                      value={song}
                      className={cn(
                        "group flex items-center gap-3 p-2 rounded-xl transition-all cursor-grab active:cursor-grabbing",
                        currentSong.id === song.id ? "bg-tertiary/10 border border-tertiary/20" : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                          {currentSong.id === song.id && isPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="flex gap-0.5 items-end h-3">
                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-tertiary" />
                                <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-tertiary" />
                                <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-tertiary" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={cn("text-[11px] font-bold truncate", currentSong.id === song.id ? "text-tertiary" : "text-white")}>{song.title}</h3>
                          <p className="text-[10px] text-zinc-500 truncate">{song.artist}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setCurrentSong(song);
                            setIsPlaying(true);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-tertiary/20 hover:text-tertiary transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            setQueue(queue.filter(s => s.id !== song.id));
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      </div>
                      
                      <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors px-2">
                        <List className="w-4 h-4" />
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {queue.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <ListMusic className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Your queue is empty</p>
                    <button 
                      onClick={() => setIsQueueOpen(false)}
                      className="mt-4 text-[10px] text-tertiary hover:underline"
                    >
                      Add some songs from your library
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-28 h-28 md:w-32 md:h-32 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-xl relative group border border-white/10">
              <img src={currentSong.thumbnail} alt={currentSong.album} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full pink-gradient-bg flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-1 text-center md:text-left">
              <h1 className="text-xl md:text-3xl font-black tracking-tighter leading-tight">{selectedPlaylist.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-400 text-[9px] font-medium">
                <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{selectedPlaylist.songs.length} songs</span>
                <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Premium Stream</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <button 
                  onClick={() => {
                    if (selectedPlaylist.songs.length > 0) {
                      setCurrentSong(selectedPlaylist.songs[0]);
                      setIsPlaying(true);
                      setQueue(selectedPlaylist.songs);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg pink-gradient-bg text-[10px] font-bold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  Play All
                </button>
                <button 
                  onClick={() => toggleLikeSong(selectedPlaylist.songs[0]?.id)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all hover:scale-105"
                >
                  <Heart className={cn("w-3.5 h-3.5", selectedPlaylist.songs[0] && isSongLiked(selectedPlaylist.songs[0].id) && "fill-primary text-primary")} />
                </button>
                <button 
                  onClick={() => selectedPlaylist.songs[0] && handleShare(selectedPlaylist.songs[0])}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all hover:scale-105"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Picks Slider */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 font-bold">Quick Picks</h2>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"><SortAsc className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x scroll-smooth">
              {MOCK_SONGS.map((song) => (
                <div 
                  key={song.id} 
                  className="flex-shrink-0 w-28 md:w-32 snap-start group cursor-pointer"
                  onClick={() => {
                    setCurrentSong(song);
                    setIsPlaying(true);
                    setQueue(MOCK_SONGS);
                  }}
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 border border-white/5 shadow-lg">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 fill-white" />
                    </div>
                  </div>
                  <h3 className="text-[11px] font-bold truncate leading-tight">{song.title}</h3>
                  <p className="text-[10px] text-zinc-500 truncate">{song.artist}</p>
                </div>
              ))}
              {/* Add more items to make it scrollable if needed */}
              {ytPlaylists.slice(0, 5).map((p) => (
                <div 
                  key={p.id} 
                  className="flex-shrink-0 w-28 md:w-32 snap-start group cursor-pointer"
                  onClick={() => handleSelectYtPlaylist(p)}
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 border border-white/5 shadow-lg">
                    <img src={p.snippet.thumbnails.high?.url} alt={p.snippet.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectYtPlaylist(p, true);
                        }}
                        className="p-2 rounded-full bg-primary text-black hover:scale-110 transition-all"
                      >
                        <Play className="w-4 h-4 fill-black" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectYtPlaylist(p);
                        }}
                        className="p-2 rounded-full bg-white/20 text-white hover:scale-110 transition-all"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-[11px] font-bold truncate leading-tight">{p.snippet.title}</h3>
                  <p className="text-[10px] text-zinc-500 truncate">Playlist</p>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Played Slider */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 font-bold">Recently Played</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x scroll-smooth">
              {MOCK_PLAYLISTS.map((p) => (
                <div 
                  key={p.id} 
                  className="flex-shrink-0 w-36 md:w-44 snap-start group cursor-pointer"
                  onClick={() => setSelectedPlaylist(p)}
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-2 border border-white/5 shadow-lg">
                    <img src={p.thumbnail || `https://picsum.photos/seed/${p.id}/400/225`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.songs.length > 0) {
                            setCurrentSong(p.songs[0]);
                            setIsPlaying(true);
                          }
                          setSelectedPlaylist(p);
                        }}
                        className="p-3 rounded-full bg-primary text-black hover:scale-110 transition-all shadow-xl"
                      >
                        <Play className="w-5 h-5 fill-black" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlaylist(p);
                        }}
                        className="p-3 rounded-full bg-white/20 text-white hover:scale-110 transition-all"
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold truncate leading-tight">{p.name}</h3>
                  <p className="text-[10px] text-zinc-500 truncate">{p.songs.length} songs</p>
                </div>
              ))}
            </div>
          </section>

          {/* Song List */}
          <div className="flex flex-col gap-0.5 bg-zinc-900/30 rounded-2xl p-1 border border-white/5">
            <div className="grid grid-cols-[30px_1fr_80px] md:grid-cols-[30px_1fr_1fr_1fr_1fr_100px] px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-bold border-b border-white/5 mb-0.5">
              <span>#</span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('title')}>Title</span>
              <span className="hidden md:flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('artist')}>Artist</span>
              <span className="hidden md:flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('album')}>Album</span>
              <span className="hidden md:flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('genre')}>Genre</span>
              <span className="text-right">Time</span>
            </div>
            {filteredSongs.map((song, idx) => (
              <motion.div 
                key={song.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (!isSongBlocked(song.id)) {
                    console.log('Playing song:', song.title, song.videoUrl);
                    setCurrentSong(song);
                    setIsPlaying(true);
                    setQueue(filteredSongs);
                  }
                }}
                className={cn(
                  "grid grid-cols-[30px_1fr_80px] md:grid-cols-[30px_1fr_1fr_1fr_1fr_100px] px-2 py-0.5 rounded-lg items-center group cursor-pointer transition-all",
                  currentSong.id === song.id ? "bg-tertiary/10 border border-tertiary/40 shadow-[0_0_10px_rgba(var(--tertiary-color-rgb),0.15)]" : "hover:bg-white/5 border border-transparent",
                  multiSelect.includes(song.id) && "bg-primary/20",
                  isSongBlocked(song.id) && "opacity-30 grayscale cursor-not-allowed"
                )}
              >
                <div className="text-zinc-500 group-hover:hidden font-mono text-[9px]">{idx + 1}</div>
                <div className="hidden group-hover:block text-primary"><Play className="w-2.5 h-2.5 fill-primary" /></div>
                
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <img src={song.thumbnail} className="w-6 h-6 md:w-7 md:h-7 rounded-md object-cover flex-shrink-0 shadow-lg" />
                  <div className="flex flex-col overflow-hidden">
                    <span className={cn("font-bold truncate text-[10px] md:text-[11px]", currentSong.id === song.id && "text-tertiary")}>{song.title}</span>
                    <span className="text-[7px] md:text-[8px] text-zinc-500 truncate md:hidden font-medium">{song.artist}</span>
                  </div>
                </div>
                <div className="hidden md:block text-zinc-400 text-[10px] truncate font-medium">{song.artist}</div>
                <div className="hidden md:block text-zinc-400 text-[10px] truncate font-medium">{song.album}</div>
                <div className="hidden md:block text-zinc-400 text-[10px] truncate font-medium">{song.genre || 'Pop'}</div>
                <div className="text-zinc-400 text-[9px] md:text-[11px] text-right flex items-center justify-end gap-2 md:gap-3">
                  <span className="font-mono">3:20</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLikeSong(song.id); }}
                      className={cn("p-0.5 transition-colors", isSongLiked(song.id) ? "text-primary" : "text-zinc-400 hover:text-white")}
                    >
                      <Heart className={cn("w-3 h-3", isSongLiked(song.id) && "fill-primary")} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setQueue(prev => [...prev, song]); }}
                      className="p-0.5 hover:text-tertiary transition-colors"
                      title="Add to Queue"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); blockSong(song.id); }}
                      className="p-0.5 hover:text-red-500 transition-colors"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                    <MoreVertical className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          </>
          )}
        </main>

        {/* Video Player Overlay */}
        <div className={cn(
          "absolute transition-all duration-500 z-30 group",
          isMobile ? "right-4 bottom-24 w-32" : "right-6 bottom-24 w-64",
          "aspect-video rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
        )}>
          <div className="absolute inset-0 z-10">
            <ReactPlayer 
              {...({
                ref: playerRef,
                url: currentSong.videoUrl,
                playing: isPlaying,
                volume: volume,
                onEnded: handleEnded,
                onProgress: handleProgress,
                onError: (e: any) => console.error('ReactPlayer Error:', e),
                onReady: () => {
                  setIsReady(true);
                  if (playerRef.current) {
                    const d = playerRef.current.getDuration();
                    if (d) setDuration(d);
                  }
                  console.log('Player Ready');
                },
                onPlay: () => {
                  if (playerRef.current) {
                    const d = playerRef.current.getDuration();
                    if (d) setDuration(d);
                  }
                  console.log('Player Playing');
                },
                config: {
                  youtube: {
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                    rel: 0,
                    fs: 1
                  }
                },
                width: "100%",
                height: "100%",
                style: { position: 'absolute', top: 0, left: 0 }
              } as any)}
            />
          </div>
          <div className="absolute inset-0 z-20 pointer-events-none">
            <Visualizer 
              opacity={theme.visualizerOpacity} 
              type={theme.visualizerType}
              color={theme.visualizerColor || theme.tertiaryColor}
            />
          </div>
          <div className="absolute inset-0 z-30 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
             <Maximize2 className="w-6 h-6 text-white cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Player Controls */}
        <footer className="h-14 bg-zinc-900/80 backdrop-blur-2xl border-t border-tertiary/20 px-3 md:px-4 flex items-center justify-between z-40">
          <div 
            className="flex items-center gap-2.5 w-1/3 md:w-1/4 overflow-hidden cursor-pointer group"
            onClick={() => setIsNowPlayingOpen(true)}
          >
            <div className="relative flex-shrink-0">
              <img src={currentSong.thumbnail} className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover shadow-lg border border-white/5 group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <Maximize2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-black text-[11px] md:text-xs truncate leading-tight group-hover:text-tertiary transition-colors">{currentSong.title}</span>
              <span className="text-[8px] md:text-[10px] text-zinc-400 truncate font-medium">{currentSong.artist}</span>
            </div>
            <Heart className="hidden md:block w-3.5 h-3.5 text-zinc-500 hover:text-primary cursor-pointer transition-all ml-1 hover:scale-110" />
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 max-w-xl px-4">
            <div className="flex items-center gap-3 md:gap-5">
              <button 
                onClick={() => blockSong(currentSong.id)}
                className="hidden md:block p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-red-500 transition-all group relative"
                title="Never play this again"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/5">Never play again</span>
              </button>
              <Shuffle 
                className={cn("hidden md:block w-3.5 h-3.5 cursor-pointer transition-all hover:scale-110", isShuffle ? "text-primary" : "text-zinc-500 hover:text-white")} 
                onClick={() => setIsShuffle(!isShuffle)}
              />
              <SkipBack 
                onClick={handlePrevious}
                className="w-4 h-4 md:w-5 md:h-5 text-zinc-300 hover:text-white cursor-pointer hover:scale-110 transition-transform" 
              />
              <button 
                onClick={() => handleSeek(-preferences.audio.seekTime)}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                title={`Seek back ${preferences.audio.seekTime}s`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[7px] font-bold ml-0.5">{preferences.audio.seekTime}</span>
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 md:w-9 md:h-9 rounded-xl pink-gradient-bg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,127,0.2)]"
              >
                {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" /> : <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-white translate-x-0.5" />}
              </button>
              <button 
                onClick={() => handleSeek(preferences.audio.seekTime)}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                title={`Seek forward ${preferences.audio.seekTime}s`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[7px] font-bold ml-0.5">{preferences.audio.seekTime}</span>
              </button>
              <SkipForward 
                onClick={handleNext}
                className="w-4 h-4 md:w-5 md:h-5 text-zinc-300 hover:text-white cursor-pointer hover:scale-110 transition-transform" 
              />
              <Repeat 
                className={cn("hidden md:block w-3.5 h-3.5 cursor-pointer transition-all hover:scale-110", repeatMode !== 'none' ? "text-primary" : "text-zinc-500 hover:text-white")}
                onClick={() => setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none')}
              />
            </div>
            <div className="w-full flex items-center gap-2 text-[8px] md:text-[9px] text-zinc-500 font-mono font-bold">
              <span>{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-1 bg-zinc-800 rounded-full relative overflow-hidden group cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  if (playerRef.current) {
                    const player = playerRef.current;
                    if (typeof player.seekTo === 'function') {
                      player.seekTo(percent * duration);
                    } else if (typeof player.getInternalPlayer === 'function') {
                      const internal = player.getInternalPlayer();
                      if (internal && typeof internal.seekTo === 'function') {
                        internal.seekTo(percent * duration);
                      }
                    }
                  }
                }}
              >
                <div 
                  className="absolute left-0 top-0 h-full pink-gradient-bg transition-all duration-100" 
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" 
                  style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 w-1/3 md:w-1/4">
            <Volume2 className="hidden md:block w-3.5 h-3.5 text-zinc-400" />
            <div className="hidden md:block w-20 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute left-0 top-0 h-full bg-white rounded-full transition-all" style={{ width: `${volume * 100}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `${volume * 100}%` }} />
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400 hover:text-white cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </footer>

        {/* Now Playing Full Screen Overlay */}
        <AnimatePresence>
          {isNowPlayingOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-black flex flex-col"
            >
              {/* Background Blur */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img 
                  src={currentSong.thumbnail} 
                  className="w-full h-full object-cover opacity-30 blur-3xl scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
              </div>

              {/* Header */}
              <header className="relative z-10 h-16 px-6 flex items-center justify-between">
                <button 
                  onClick={() => setIsNowPlayingOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Now Playing</span>
                  <span className="text-[11px] font-bold text-tertiary">{currentSong.album}</span>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreHorizontal className="w-6 h-6" />
                </button>
              </header>

              {/* Main Content */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-20 overflow-hidden">
                {/* Album Art Section (Centered & Large) */}
                <div className="relative w-full max-w-[300px] md:max-w-[500px] aspect-square group shrink-0 flex items-center justify-center">
                  <motion.img 
                    layoutId="album-art"
                    src={currentSong.thumbnail} 
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10" 
                  />
                  
                  {/* Visualizer Overlay */}
                  {theme.visualizerNowPlaying && (
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-3xl">
                      <Visualizer 
                        opacity={theme.visualizerNowPlayingOpacity}
                        type={theme.visualizerType}
                        color={theme.visualizerColor}
                      />
                    </div>
                  )}

                  {/* Lyrics Overlay */}
                  <div 
                    className="absolute inset-0 z-30 flex flex-col justify-center p-6 md:p-10 pointer-events-none"
                    style={{ opacity: theme.lyricsOpacity }}
                  >
                    <div 
                      ref={lyricsRef}
                      className="h-full overflow-y-auto scrollbar-hide mask-fade-y pointer-events-auto"
                      style={{ 
                        textAlign: theme.lyricsAlignment,
                        fontFamily: theme.lyricsFontFamily,
                        color: theme.lyricsColor
                      }}
                    >
                      {parsedLyrics.length > 0 ? (
                        parsedLyrics.map((lyric, index) => (
                          <p 
                            key={index}
                            className={cn(
                              "font-bold mb-4 transition-all duration-500 cursor-pointer hover:text-white",
                              currentLyricIndex === index ? "scale-110 origin-center opacity-100" : "scale-100 opacity-40"
                            )}
                            style={{ 
                              fontSize: theme.lyricsFontSize,
                              textShadow: '0 4px 12px rgba(0,0,0,0.8)'
                            }}
                            onClick={() => {
                              if (playerRef.current) {
                                const player = playerRef.current;
                                if (typeof player.seekTo === 'function') {
                                  player.seekTo(lyric.time);
                                }
                              }
                            }}
                          >
                            {lyric.text}
                          </p>
                        ))
                      ) : (
                        <p className="text-zinc-500 italic">No lyrics available for this track.</p>
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center z-40">
                    <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                      <Maximize2 className="w-8 h-8" />
                    </button>
                  </div>
                </div>

                {/* Song Info (Below Album Art) */}
                <div className="mt-8 text-center z-50">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-5xl font-black mb-2 tracking-tighter"
                  >
                    {currentSong.title}
                  </motion.h1>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg md:text-xl text-zinc-400 font-medium">{currentSong.artist}</span>
                      <button 
                        onClick={() => toggleLikeSong(currentSong.id)}
                        className={cn("p-1 transition-colors", isSongLiked(currentSong.id) ? "text-primary" : "text-zinc-500 hover:text-white")}
                      >
                        <Heart className={cn("w-4 h-4 md:w-5 md:h-5", isSongLiked(currentSong.id) && "fill-primary")} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[9px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      {currentSong.genre && (
                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                          <Music className="w-2.5 h-2.5 text-tertiary" />
                          <span>{currentSong.genre}</span>
                        </div>
                      )}
                      {currentSong.releaseDate && (
                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                          <Calendar className="w-2.5 h-2.5 text-primary" />
                          <span>{new Date(currentSong.releaseDate).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Controls Footer */}
              <div className="relative z-10 px-6 md:px-20 py-6 md:py-10 bg-gradient-to-t from-black to-transparent">
                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div 
                      className="h-1.5 bg-zinc-800 rounded-full relative overflow-hidden group cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = x / rect.width;
                        if (playerRef.current) {
                          const player = playerRef.current;
                          if (typeof player.seekTo === 'function') {
                            player.seekTo(percent * duration);
                          }
                        }
                      }}
                    >
                      <div 
                        className="absolute left-0 top-0 h-full pink-gradient-bg transition-all duration-100" 
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" 
                        style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs text-zinc-500 font-mono font-bold">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-8">
                      <motion.div
                        whileHover={{ scale: 1.5 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ scale: 0.9 }}
                      >
                        <Shuffle 
                          className={cn("w-5 h-5 md:w-6 md:h-6 cursor-pointer transition-all", isShuffle ? "text-primary" : "text-zinc-500 hover:text-white")} 
                          onClick={() => setIsShuffle(!isShuffle)}
                        />
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.5 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ scale: 0.9 }}
                        onClick={handlePrevious}
                      >
                        <SkipBack className="w-6 h-6 md:w-8 md:h-8 text-zinc-300 hover:text-white cursor-pointer transition-transform" />
                      </motion.div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full pink-gradient-bg flex items-center justify-center shadow-[0_0_40px_rgba(255,0,127,0.4)]"
                    >
                      {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 text-white fill-white" /> : <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white translate-x-1" />}
                    </motion.button>

                    <div className="flex items-center gap-4 md:gap-8">
                      <motion.div
                        whileHover={{ scale: 1.5 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ scale: 0.9 }}
                        onClick={handleNext}
                      >
                        <SkipForward className="w-6 h-6 md:w-8 md:h-8 text-zinc-300 hover:text-white cursor-pointer transition-transform" />
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.5 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ scale: 0.9 }}
                      >
                        <Repeat 
                          className={cn("w-5 h-5 md:w-6 md:h-6 cursor-pointer transition-all", repeatMode !== 'none' ? "text-primary" : "text-zinc-500 hover:text-white")}
                          onClick={() => setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none')}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Volume & Other Controls */}
                  <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 md:gap-4 w-1/2 md:w-1/3">
                      <Volume1 className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01" 
                          value={volume} 
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full" style={{ width: `${volume * 100}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${volume * 100}%` }} />
                      </div>
                      <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                      <motion.div 
                        whileHover={{ scale: 1.5 }} 
                        whileTap={{ scale: 0.9 }} 
                        initial={{ scale: 0.9 }}
                        onClick={() => handleShare(currentSong)}
                      >
                        <Share2 className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.5 }} 
                        whileTap={{ scale: 0.9 }} 
                        initial={{ scale: 0.9 }}
                        onClick={handleCast}
                      >
                        <Cast className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.5 }} 
                        whileTap={{ scale: 0.9 }} 
                        initial={{ scale: 0.9 }}
                        onClick={() => handleDownload(currentSong)}
                      >
                        <Download className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.5 }} 
                        whileTap={{ scale: 0.9 }} 
                        initial={{ scale: 0.9 }}
                        onClick={() => {
                          setIsQueueOpen(true);
                          setIsNowPlayingOpen(false);
                        }}
                      >
                        <ListMusic className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.5 }} whileTap={{ scale: 0.9 }} initial={{ scale: 0.9 }}>
                        <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-zinc-950 border-l border-tertiary/20 z-[100] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black tracking-tighter">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
              {/* Now Playing Customization Category */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
                  <Disc3 className="w-3 h-3" /> Now Playing Customization
                </h3>
                
                <div className="space-y-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-400">Show Visualizer</label>
                    <button 
                      onClick={() => updatePreferences({ theme: { ...theme, visualizerNowPlaying: !theme.visualizerNowPlaying } })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative",
                        theme.visualizerNowPlaying ? "bg-tertiary" : "bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                        theme.visualizerNowPlaying ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>

                  {theme.visualizerNowPlaying && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-400">Visualizer Opacity</label>
                        <span className="text-[10px] font-mono text-tertiary">{Math.round(theme.visualizerNowPlayingOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={theme.visualizerNowPlayingOpacity}
                        onChange={(e) => updatePreferences({ theme: { ...theme, visualizerNowPlayingOpacity: parseFloat(e.target.value) } })}
                        className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-tertiary"
                      />
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-400">Lyrics Opacity</label>
                      <span className="text-[10px] font-mono text-tertiary">{Math.round(theme.lyricsOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={theme.lyricsOpacity}
                      onChange={(e) => updatePreferences({ theme: { ...theme, lyricsOpacity: parseFloat(e.target.value) } })}
                      className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-tertiary"
                    />

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400">Lyrics Font Size</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="12"
                          max="80"
                          step="2"
                          value={theme.lyricsFontSize}
                          onChange={(e) => updatePreferences({ theme: { ...theme, lyricsFontSize: parseInt(e.target.value) } })}
                          className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-tertiary"
                        />
                        <span className="text-[10px] font-mono text-tertiary w-8">{theme.lyricsFontSize}px</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400">Lyrics Font Family</label>
                      <select 
                        value={theme.lyricsFontFamily}
                        onChange={(e) => updatePreferences({ theme: { ...theme, lyricsFontFamily: e.target.value } })}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl p-2.5 focus:outline-none text-xs font-medium"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Playfair Display">Playfair</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Anton">Anton</option>
                        <option value="Syne">Syne</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400">Lyrics Color</label>
                      <div className="flex flex-wrap gap-2">
                        {['#FFFFFF', '#FF007F', '#00FF00', '#00FFFF', '#FFFF00', '#FFA500'].map((c) => (
                          <button
                            key={c}
                            onClick={() => updatePreferences({ theme: { ...theme, lyricsColor: c } })}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                              theme.lyricsColor === c ? "border-white scale-110 shadow-lg" : "border-transparent"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input 
                          type="color"
                          value={theme.lyricsColor}
                          onChange={(e) => updatePreferences({ theme: { ...theme, lyricsColor: e.target.value } })}
                          className="w-6 h-6 rounded-full bg-transparent border-none cursor-pointer p-0 overflow-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400">Lyrics Alignment</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            onClick={() => updatePreferences({ theme: { ...theme, lyricsAlignment: align as any } })}
                            className={cn(
                              "px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border",
                              theme.lyricsAlignment === align 
                                ? "bg-tertiary text-black border-tertiary" 
                                : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
                            )}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Visualizer Customization Category */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Visualizer Customization
                </h3>
                
                <div className="space-y-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400">Visualizer Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['bars', 'wave', 'circle', 'particles', 'spectrum', 'rings', 'glitch', 'nebula', 'fireworks', 'matrix'].map((type) => (
                        <button
                          key={type}
                          onClick={() => updatePreferences({ theme: { ...theme, visualizerType: type as any } })}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border",
                            theme.visualizerType === type 
                              ? "bg-tertiary text-black border-tertiary shadow-[0_0_15px_rgba(var(--tertiary-color-rgb),0.3)]" 
                              : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-400">Opacity</label>
                      <span className="text-[10px] font-mono text-tertiary">{Math.round(theme.visualizerOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={theme.visualizerOpacity}
                      onChange={(e) => updatePreferences({ theme: { ...theme, visualizerOpacity: parseFloat(e.target.value) } })}
                      className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-tertiary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400">Primary Color</label>
                    <div className="flex flex-wrap gap-2">
                      {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFFFFF'].map((c) => (
                        <button
                          key={c}
                          onClick={() => updatePreferences({ theme: { ...theme, visualizerColor: c } })}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                            theme.visualizerColor === c ? "border-white scale-110 shadow-lg" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input 
                        type="color"
                        value={theme.visualizerColor || '#FFFFFF'}
                        onChange={(e) => updatePreferences({ theme: { ...theme, visualizerColor: e.target.value } })}
                        className="w-6 h-6 rounded-full bg-transparent border-none cursor-pointer p-0 overflow-hidden"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Appearance Category */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
                  <Layout className="w-3 h-3" /> Appearance
                </h3>
                
                <div className="space-y-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400">Font Family</label>
                    <select 
                      value={theme.fontFamily}
                      onChange={(e) => updatePreferences({ theme: { ...theme, fontFamily: e.target.value } })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl p-2.5 focus:outline-none text-xs font-medium"
                    >
                      <option value="Inter">Inter (Modern)</option>
                      <option value="Space Grotesk">Space Grotesk (Tech)</option>
                      <option value="Playfair Display">Playfair (Elegant)</option>
                      <option value="JetBrains Mono">JetBrains (Mono)</option>
                      <option value="Outfit">Outfit (Clean)</option>
                      <option value="Montserrat">Montserrat (Bold)</option>
                      <option value="Roboto Mono">Roboto Mono (Utility)</option>
                      <option value="Libre Baskerville">Libre Baskerville (Classic)</option>
                      <option value="Bebas Neue">Bebas Neue (Impact)</option>
                      <option value="Quicksand">Quicksand (Soft)</option>
                      <option value="Crimson Pro">Crimson Pro (Serif)</option>
                      <option value="Syne">Syne (Artistic)</option>
                      <option value="Anton">Anton (Bold)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-400">Font Size</label>
                      <span className="text-[10px] font-mono text-tertiary">{theme.fontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="12" 
                      max="20" 
                      step="1" 
                      value={theme.fontSize}
                      onChange={(e) => updatePreferences({ theme: { ...theme, fontSize: parseInt(e.target.value) } })}
                      className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-tertiary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Dynamic Theme</span>
                      <span className="text-[9px] text-zinc-500">Colors adapt to current song</span>
                    </div>
                    <button 
                      onClick={() => updatePreferences({ theme: { ...theme, dynamicTheme: !theme.dynamicTheme } })}
                      className={cn("w-8 h-4 rounded-full transition-colors relative", theme.dynamicTheme ? "bg-tertiary" : "bg-zinc-700")}
                    >
                      <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", theme.dynamicTheme ? "left-4.5" : "left-0.5")} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400">Primary Color</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['#ff007f', '#00ffcc', '#7f00ff', '#ffcc00'].map(c => (
                          <button 
                            key={c}
                            onClick={() => updatePreferences({ theme: { ...theme, primaryColor: c } })}
                            className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", theme.primaryColor === c ? "border-white" : "border-transparent")}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400">Text Color</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['#ffffff', '#cccccc', '#ff007f', '#00ffcc'].map(c => (
                          <button 
                            key={c}
                            onClick={() => updatePreferences({ theme: { ...theme, textColor: c } })}
                            className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", theme.textColor === c ? "border-white" : "border-transparent")}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Audio Category */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
                  <Headphones className="w-3 h-3" /> Audio & Playback
                </h3>
                
                <div className="space-y-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Autoplay</span>
                        <span className="text-[9px] text-zinc-500">Play similar songs automatically</span>
                      </div>
                      <button 
                        onClick={() => updatePreferences({ audio: { ...preferences.audio, autoplay: !preferences.audio.autoplay } })}
                        className={cn("w-8 h-4 rounded-full transition-colors relative", preferences.audio.autoplay ? "bg-tertiary" : "bg-zinc-700")}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", preferences.audio.autoplay ? "left-4.5" : "left-0.5")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Gapless Playback</span>
                        <span className="text-[9px] text-zinc-500">Seamless transitions between songs</span>
                      </div>
                      <button 
                        onClick={() => updatePreferences({ audio: { ...preferences.audio, gaplessPlayback: !preferences.audio.gaplessPlayback } })}
                        className={cn("w-8 h-4 rounded-full transition-colors relative", preferences.audio.gaplessPlayback ? "bg-tertiary" : "bg-zinc-700")}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", preferences.audio.gaplessPlayback ? "left-4.5" : "left-0.5")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Double-tap to seek</span>
                        <span className="text-[9px] text-zinc-500">Seconds to skip forward/back</span>
                      </div>
                      <select 
                        value={preferences.audio.seekTime}
                        onChange={(e) => updatePreferences({ audio: { ...preferences.audio, seekTime: parseInt(e.target.value) } })}
                        className="bg-zinc-800 border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none"
                      >
                        {[5, 10, 15, 30, 60].map(s => (
                          <option key={s} value={s}>{s}s</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Spatial Audio</span>
                        <span className="text-[9px] text-zinc-500">Immersive 3D soundstage</span>
                      </div>
                      <button 
                        onClick={() => updatePreferences({ audio: { ...preferences.audio, spatialAudio: !preferences.audio.spatialAudio } })}
                        className={cn("w-8 h-4 rounded-full transition-colors relative", preferences.audio.spatialAudio ? "bg-tertiary" : "bg-zinc-700")}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", preferences.audio.spatialAudio ? "left-4.5" : "left-0.5")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">Dolby Atmos</span>
                        <span className="text-[9px] text-zinc-500">Enhanced object-based audio</span>
                      </div>
                      <button 
                        onClick={() => updatePreferences({ audio: { ...preferences.audio, dolbyAtmos: !preferences.audio.dolbyAtmos } })}
                        className={cn("w-8 h-4 rounded-full transition-colors relative", preferences.audio.dolbyAtmos ? "bg-tertiary" : "bg-zinc-700")}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", preferences.audio.dolbyAtmos ? "left-4.5" : "left-0.5")} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-400">EQ Preset</label>
                      <select 
                        value={preferences.audio.eqPreset}
                        onChange={(e) => updatePreferences({ audio: { ...preferences.audio, eqPreset: e.target.value } })}
                        className="bg-zinc-800 border border-white/5 rounded-lg px-2 py-1 text-[10px] focus:outline-none"
                      >
                        {['Flat', 'Bass Boost', 'Electronic', 'Rock', 'Pop', 'Classical', 'Custom'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-between items-end h-24 gap-1 px-1">
                      {preferences.audio.customEq.map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex-1 w-1 bg-zinc-700 rounded-full relative">
                            <div 
                              className="absolute bottom-0 w-full bg-primary rounded-full transition-all" 
                              style={{ height: `${(val + 12) / 24 * 100}%` }} 
                            />
                            <input 
                              type="range" 
                              min="-12" 
                              max="12" 
                              step="1" 
                              value={val}
                              onChange={(e) => {
                                const newEq = [...preferences.audio.customEq];
                                newEq[i] = parseInt(e.target.value);
                                updatePreferences({ audio: { ...preferences.audio, customEq: newEq, eqPreset: 'Custom' } });
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -rotate-90 origin-center"
                              style={{ width: '96px', left: '-47px', top: '47px' }}
                            />
                          </div>
                          <span className="text-[6px] font-mono text-zinc-500">{['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Advanced Category */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Advanced Features
                </h3>
                <div className="space-y-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Lossless Audio</span>
                    <button 
                      onClick={() => updatePreferences({ appSettings: { ...preferences.appSettings, losslessAudio: !preferences.appSettings.losslessAudio } })}
                      className={cn("w-8 h-4 rounded-full transition-colors relative", preferences.appSettings.losslessAudio ? "bg-primary" : "bg-zinc-700")}
                    >
                      <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", preferences.appSettings.losslessAudio ? "left-4.5" : "left-0.5")} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Volume Normalization</span>
                    <button 
                      onClick={() => updatePreferences({ appSettings: { ...preferences.appSettings, volumeNormalization: !preferences.appSettings.volumeNormalization } })}
                      className={cn("w-8 h-4 rounded-full transition-colors relative", preferences.appSettings.volumeNormalization ? "bg-primary" : "bg-zinc-700")}
                    >
                      <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", preferences.appSettings.volumeNormalization ? "left-4.5" : "left-0.5")} />
                    </button>
                  </div>
                </div>
              </section>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 text-center space-y-3">
                <button 
                  onClick={() => {
                    updatePreferences(DEFAULT_PREFERENCES);
                    toast.success('Settings reset to default', {
                      description: 'All preferences have been restored to their original values.'
                    });
                  }}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-bold transition-all border border-white/5"
                >
                  Reset to Default
                </button>
                <div>
                  <p className="text-[10px] text-zinc-400 mb-1">YTMStream Control v2.4.0</p>
                  <p className="text-[9px] text-zinc-500 italic">Optimized for high-density displays</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
