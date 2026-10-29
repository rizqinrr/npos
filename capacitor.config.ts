import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.npos.app',
  appName: 'nPOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
