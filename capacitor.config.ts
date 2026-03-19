import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.picoclaw.app',
  appName: 'PicoClaw',
  webDir: 'dist',
  server: {
    // Load from the Go backend HTTP server instead of local files
    url: 'http://localhost:18800',
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
