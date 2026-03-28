export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  releaseDate: string;
  thumbnail: string;
  videoUrl: string;
  duration: number; // in seconds
  genre?: string;
  isLiked?: boolean;
  lyrics?: string;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  folder?: string;
  description?: string;
  thumbnail?: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  visualizerOpacity: number;
  visualizerType: 'bars' | 'wave' | 'circle' | 'particles' | 'spectrum' | 'rings' | 'glitch' | 'nebula' | 'fireworks' | 'matrix';
  visualizerColor: string;
  dynamicTheme: boolean;
  // Lyrics Customization
  lyricsOpacity: number;
  lyricsFontSize: number;
  lyricsFontFamily: string;
  lyricsColor: string;
  lyricsAlignment: 'left' | 'center' | 'right';
  // Now Playing Visualizer
  visualizerNowPlaying: boolean;
  visualizerNowPlayingOpacity: number;
}

export interface AppSettings {
  losslessAudio: boolean;
  crossfadeDuration: number;
  volumeNormalization: boolean;
  artistBlocking: boolean;
  autoplay: boolean;
  seekTime: number;
}
