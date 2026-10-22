/** 本地未签名装配；签名、公证和公开更新渠道必须另行授权配置。 */
export const installerConfiguration = ({ output, appDirectory, icons, validation = false }) => ({
  appId: validation ? 'io.weftpilot.desktop.validation' : 'io.weftpilot.desktop',
  productName: validation ? 'WeftPilotValidation' : 'WeftPilot',
  directories: { app: appDirectory, output, buildResources: icons },
  files: ['dist/**/*', 'package.json'],
  electronVersion: '42.0.0',
  asar: false,
  npmRebuild: false,
  forceCodeSigning: false,
  publish: null,
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  win: {
    target: ['nsis'],
    icon: `${icons}/icon.ico`,
    signAndEditExecutable: true,
    signExecutable: false,
    requestedExecutionLevel: 'asInvoker',
  },
  nsis: {
    include: 'build/installer.nsh',
    installerLanguages: ['zh_CN', 'en_US'],
    displayLanguageSelector: true,
    oneClick: false,
    perMachine: false,
    allowElevation: false,
    allowToChangeInstallationDirectory: true,
    runAfterFinish: false,
    createDesktopShortcut: false,
    createStartMenuShortcut: true,
    deleteAppDataOnUninstall: false,
    installerIcon: `${icons}/icon.ico`,
    uninstallerIcon: `${icons}/icon.ico`,
  },
  mac: {
    target: ['dmg', 'zip'],
    icon: `${icons}/icon.png`,
    identity: null,
    notarize: false,
    category: 'public.app-category.developer-tools',
  },
})

export const installerEnvironment = (environment) => ({
  ...Object.fromEntries(
    Object.entries(environment).filter(([key]) =>
      /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|TMPDIR|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMFILES|PROGRAMDATA|HOMEDRIVE|HOMEPATH|LANG|LC_ALL|ELECTRON_CACHE|ELECTRON_BUILDER_CACHE)$/i.test(
        key,
      ),
    ),
  ),
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
})
