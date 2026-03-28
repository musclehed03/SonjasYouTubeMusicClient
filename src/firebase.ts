import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export interface CustomEqProfile {
  id: string;
  name: string;
  values: number[];
}

export interface UserPreferences {
  theme: {
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
  };
  audio: {
    eqPreset: string;
    customEq: number[];
    customEqProfiles: CustomEqProfile[];
    spatialAudio: boolean;
    dolbyAtmos: boolean;
    gaplessPlayback: boolean;
    blockExplicit: boolean;
    autoplay: boolean;
    seekTime: number;
    playbackMode: 'song' | 'video';
    doubleTapToSeek: boolean;
    volumeNormalization: boolean;
    losslessAudio: boolean;
  };
  appSettings: {
    losslessAudio: boolean;
    crossfadeDuration: number;
    volumeNormalization: boolean;
    artistBlocking: boolean;
    autoplay: boolean;
    seekTime: number;
  };
  blockedSongs: string[];
  likedSongs: string[];
  playlists: any[]; // Using any[] here to avoid circular dependency if Playlist is complex, but we'll use Playlist[] in App.tsx
  accessibility: {
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    screenReader: boolean;
    hearingCalibration: number;
    highContrast: boolean;
  };
  language: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: {
    primaryColor: '#ff007f',
    secondaryColor: '#ff80bf',
    tertiaryColor: '#ff00ff',
    accentColor: '#1a1a1a',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 14,
    visualizerOpacity: 0.5,
    visualizerType: 'bars',
    visualizerColor: '#ff00ff',
    dynamicTheme: true,
    // Lyrics Customization
    lyricsOpacity: 0.8,
    lyricsFontSize: 24,
    lyricsFontFamily: 'Inter',
    lyricsColor: '#ffffff',
    lyricsAlignment: 'center',
    // Now Playing Visualizer
    visualizerNowPlaying: true,
    visualizerNowPlayingOpacity: 0.3
  },
  audio: {
    eqPreset: 'Flat',
    customEq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    customEqProfiles: [],
    spatialAudio: false,
    dolbyAtmos: false,
    gaplessPlayback: true,
    blockExplicit: false,
    autoplay: true,
    seekTime: 10,
    playbackMode: 'video',
    doubleTapToSeek: true,
    volumeNormalization: true,
    losslessAudio: true
  },
  appSettings: {
    losslessAudio: true,
    crossfadeDuration: 12,
    volumeNormalization: true,
    artistBlocking: false,
    autoplay: true,
    seekTime: 10
  },
  blockedSongs: [],
  likedSongs: [],
  playlists: [],
  accessibility: {
    colorBlindMode: 'none',
    screenReader: false,
    hearingCalibration: 1,
    highContrast: false
  },
  language: 'English'
};

export const saveUserPreferences = async (userId: string, prefs: UserPreferences) => {
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), prefs);
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
  } catch (error) {
    console.error('Error getting user preferences:', error);
  }
  return null;
};
