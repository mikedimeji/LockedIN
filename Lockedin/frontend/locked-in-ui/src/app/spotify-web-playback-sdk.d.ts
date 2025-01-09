declare global {
    interface Window {
      onSpotifyWebPlaybackSDKReady: () => void;
      Spotify: any;
    }
  }
  
  export {}; // This ensures the file is treated as a module.
  
  