module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/ico'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'soundcloud_ripper',
        setupExe: 'SoundCloudRipperSetup.exe',
        setupIcon: './src/assets/ico.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ]
};
