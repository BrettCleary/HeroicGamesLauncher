import { downloadAntiCheatData } from './anticheat/utils'
import {
  InstallParams,
  GamepadInputEventKey,
  GamepadInputEventWheel,
  GamepadInputEventMouse,
  Runner,
  AppSettings,
  GameSettings,
  GOGCloudSavesLocation
} from './types'
import * as path from 'path'
import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  dialog,
  ipcMain,
  powerSaveBlocker,
  protocol,
  screen
} from 'electron'
import './updater'
import { autoUpdater } from 'electron-updater'
import { cpus, platform } from 'os'
import {
  access,
  appendFileSync,
  constants,
  existsSync,
  mkdirSync,
  rmSync,
  unlinkSync,
  watch,
  realpathSync,
  writeFileSync
} from 'graceful-fs'

import Backend from 'i18next-fs-backend'
import i18next from 'i18next'
import { join, normalize } from 'path'
import checkDiskSpace from 'check-disk-space'
import { DXVK, Winetricks } from './tools'
import { Game } from './games'
import { GameConfig } from './game_config'
import { GlobalConfig } from './config'
import { LegendaryLibrary } from './legendary/library'
import { LegendaryUser } from './legendary/user'
import { GOGUser } from './gog/user'
import { GOGLibrary } from './gog/library'
import setup from './gog/setup'
import {
  clearCache,
  execAsync,
  isEpicServiceOffline,
  getLegendaryVersion,
  getGogdlVersion,
  getSystemInfo,
  handleExit,
  openUrlOrFile,
  resetHeroic,
  showAboutWindow,
  showItemInFolder,
  getLegendaryBin,
  getGOGdlBin,
  showErrorBoxModal,
  getFileSize,
  detectVCRedist,
  getFirstExistingParentPath,
  getLatestReleases,
  notify
} from './utils'
import {
  configStore,
  currentLogFile,
  discordLink,
  heroicGamesConfigPath,
  heroicGithubURL,
  userHome,
  icon,
  iconDark,
  iconLight,
  installed,
  kofiPage,
  epicLoginUrl,
  patreonPage,
  sidInfoUrl,
  supportURL,
  tsStore,
  weblateUrl,
  wikiLink,
  fontsStore,
  heroicConfigPath,
  isMac,
  isSteamDeckGameMode,
  isCLIFullscreen,
  isCLINoGui,
  isFlatpak
} from './constants'
import { handleProtocol } from './protocol'
import {
  logDebug,
  logError,
  logInfo,
  LogPrefix,
  logWarning
} from './logger/logger'
import { gameInfoStore } from './legendary/electronStores'
import { getFonts } from 'font-list'
import { verifyWinePrefix } from './launcher'
import shlex from 'shlex'
import {
  initOnlineMonitor,
  isOnline,
  runOnceWhenOnline
} from './online_monitor'

const { showMessageBox, showOpenDialog } = dialog
const isWindows = platform() === 'win32'

let mainWindow: BrowserWindow = null

async function createWindow(): Promise<BrowserWindow> {
  configStore.set('userHome', userHome)

  let windowProps: Electron.Rectangle = {
    height: 690,
    width: 1200,
    x: 0,
    y: 0
  }

  if (configStore.has('window-props')) {
    const tmpWindowProps = configStore.get(
      'window-props',
      {}
    ) as Electron.Rectangle
    if (
      tmpWindowProps &&
      tmpWindowProps.width &&
      tmpWindowProps.height &&
      tmpWindowProps.y !== undefined &&
      tmpWindowProps.x !== undefined
    ) {
      windowProps = tmpWindowProps
    }
  } else {
    // make sure initial screen size is not bigger than the available screen space
    const screenInfo = screen.getPrimaryDisplay()

    if (screenInfo.workAreaSize.height > windowProps.height) {
      windowProps.height = screenInfo.workAreaSize.height * 0.8
    }

    if (screenInfo.workAreaSize.width > windowProps.width) {
      windowProps.width = screenInfo.workAreaSize.width * 0.8
    }
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...windowProps,
    minHeight: 345,
    minWidth: 600,
    show: false,
    webPreferences: {
      webviewTag: true,
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  if ((isSteamDeckGameMode || isCLIFullscreen) && !isCLINoGui) {
    logInfo(
      [
        isSteamDeckGameMode
          ? 'Heroic started via Steam-Deck gamemode.'
          : 'Heroic started with --fullscreen',
        'Switching to fullscreen'
      ],
      LogPrefix.Backend
    )
    mainWindow.setFullScreen(true)
  }

  setTimeout(() => {
    if (process.platform === 'linux') {
      DXVK.getLatest()
      Winetricks.download()
    }
  }, 2500)

  GlobalConfig.get()
  LegendaryLibrary.get()
  GOGLibrary.get()

  mainWindow.setIcon(icon)
  app.setAppUserModelId('Heroic')
  app.commandLine.appendSwitch('enable-spatial-navigation')

  mainWindow.on('close', async (e) => {
    e.preventDefault()

    if (!isCLIFullscreen && !isSteamDeckGameMode) {
      // store windows properties
      configStore.set('window-props', mainWindow.getBounds())
    }

    const { exitToTray } = GlobalConfig.get().config

    if (exitToTray) {
      logInfo('Exitting to tray instead of quitting', LogPrefix.Backend)
      return mainWindow.hide()
    }

    handleExit(mainWindow)
  })

  if (isWindows) {
    detectVCRedist(mainWindow)
  }

  if (!app.isPackaged) {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    //@ts-ignore
    import('electron-devtools-installer').then((devtools) => {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = devtools

      installExtension(REACT_DEVELOPER_TOOLS).catch((err: string) => {
        logWarning(['An error occurred: ', err], LogPrefix.Backend)
      })
    })
    mainWindow.loadURL('http://localhost:3000')
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  } else {
    Menu.setApplicationMenu(null)
    mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`)
    if (!isMac) {
      autoUpdater.checkForUpdates()
    }
    return mainWindow
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let appIcon: Tray = null
const gotTheLock = app.requestSingleInstanceLock()
let openUrlArgument = ''

const contextMenu = () => {
  const recentGames: Array<RecentGame> =
    (configStore.get('games.recent', []) as Array<RecentGame>) || []
  const recentsMenu = recentGames.map((game) => {
    return {
      click: function () {
        handleProtocol(mainWindow, [`heroic://launch/${game.appName}`])
      },
      label: game.title
    }
  })

  return Menu.buildFromTemplate([
    ...recentsMenu,
    { type: 'separator' },
    {
      click: function () {
        mainWindow.show()
      },
      label: i18next.t('tray.show')
    },
    {
      click: function () {
        showAboutWindow()
      },
      label: i18next.t('tray.about', 'About')
    },
    {
      accelerator: process.platform === 'darwin' ? 'Cmd+R' : 'Ctrl+R',
      click: function () {
        mainWindow.reload()
      },
      label: i18next.t('tray.reload', 'Reload')
    },
    {
      label: 'Debug',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
      click: () => {
        mainWindow.webContents.openDevTools()
      }
    },
    {
      click: function () {
        handleExit(mainWindow)
      },
      label: i18next.t('tray.quit', 'Quit'),
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q'
    }
  ])
}

const processZoomForScreen = (zoomFactor: number) => {
  const screenSize = screen.getPrimaryDisplay().workAreaSize.width
  if (screenSize < 1200) {
    const extraDPIZoomIn = screenSize / 1200
    return zoomFactor * extraDPIZoomIn
  } else {
    return zoomFactor
  }
}

ipcMain.on('setZoomFactor', async (event, zoomFactor) => {
  const window = BrowserWindow.getAllWindows()[0]
  window.webContents.setZoomFactor(processZoomForScreen(parseFloat(zoomFactor)))
})

if (!gotTheLock) {
  logInfo('Heroic is already running, quitting this instance')
  app.quit()
} else {
  app.on('second-instance', (event, argv) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      mainWindow.show()
    }

    handleProtocol(mainWindow, argv)
  })
  app.whenReady().then(async () => {
    initOnlineMonitor()

    const systemInfo = await getSystemInfo()

    logInfo(
      ['Legendary location:', join(...Object.values(getLegendaryBin()))],
      LogPrefix.Legendary
    )
    logInfo(
      ['GOGDL location:', join(...Object.values(getGOGdlBin()))],
      LogPrefix.Gog
    )
    logInfo(`\n\n${systemInfo}\n`, LogPrefix.Backend)
    // We can't use .config since apparently its not loaded fast enough.
    const { language, darkTrayIcon } = await GlobalConfig.get().getSettings()

    runOnceWhenOnline(async () => {
      const isLoggedIn = LegendaryUser.isLoggedIn()

      if (!isLoggedIn) {
        logInfo('User Not Found, removing it from Store', LogPrefix.Backend)
        configStore.delete('userinfo')
      }

      // Update user details
      if (GOGUser.isLoggedIn()) {
        GOGUser.getUserDetails()
      }
    })

    await i18next.use(Backend).init({
      backend: {
        addPath: path.join(__dirname, 'locales', '{{lng}}', '{{ns}}'),
        allowMultiLoading: false,
        loadPath: path.join(__dirname, 'locales', '{{lng}}', '{{ns}}.json')
      },
      debug: false,
      fallbackLng: 'en',
      lng: language,
      supportedLngs: [
        'bg',
        'ca',
        'cs',
        'de',
        'el',
        'en',
        'es',
        'et',
        'fa',
        'fi',
        'fr',
        'gl',
        'hr',
        'hu',
        'ja',
        'ko',
        'id',
        'it',
        'ml',
        'nl',
        'pl',
        'pt',
        'pt_BR',
        'ru',
        'sv',
        'ta',
        'tr',
        'uk',
        'vi',
        'zh_Hans',
        'zh_Hant'
      ]
    })

    await createWindow()

    protocol.registerStringProtocol('heroic', (request, callback) => {
      handleProtocol(mainWindow, [request.url])
      callback('Operation initiated.')
    })
    if (!app.isDefaultProtocolClient('heroic')) {
      if (app.setAsDefaultProtocolClient('heroic')) {
        logInfo('Registered protocol with OS.', LogPrefix.Backend)
      } else {
        logWarning('Failed to register protocol with OS.', LogPrefix.Backend)
      }
    } else {
      logWarning('Protocol already registered.', LogPrefix.Backend)
    }

    const { startInTray } = await GlobalConfig.get().getSettings()
    const headless = isCLINoGui || startInTray
    if (!headless) {
      mainWindow.show()
    }

    // set initial zoom level after a moment, if set in sync the value stays as 1
    setTimeout(() => {
      const zoomFactor =
        parseFloat(configStore.get('zoomPercent', '100') as string) / 100

      mainWindow.webContents.setZoomFactor(processZoomForScreen(zoomFactor))
    }, 200)

    const trayIcon = darkTrayIcon ? iconDark : iconLight
    appIcon = new Tray(trayIcon)

    appIcon.on('double-click', () => {
      mainWindow.show()
    })

    appIcon.setContextMenu(contextMenu())
    appIcon.setToolTip('Heroic')
    ipcMain.on('changeLanguage', async (event, language: string) => {
      logInfo(['Changing Language to:', language], LogPrefix.Backend)
      await i18next.changeLanguage(language)
      gameInfoStore.clear()
      appIcon.setContextMenu(contextMenu())
    })

    ipcMain.addListener('changeTrayColor', () => {
      logInfo('Changing Tray icon Color...', LogPrefix.Backend)
      setTimeout(async () => {
        const { darkTrayIcon } = await GlobalConfig.get().getSettings()
        const trayIcon = darkTrayIcon ? iconDark : iconLight
        appIcon.setImage(trayIcon)
        appIcon.setContextMenu(contextMenu())
      }, 500)
    })

    downloadAntiCheatData()

    return
  })
}

ipcMain.on('Notify', (event, args) => {
  notify({ body: args[1], title: args[0] })
})

ipcMain.on('frontendReady', () => {
  handleProtocol(mainWindow, [openUrlArgument, ...process.argv])
})

// Maybe this can help with white screens
process.on('uncaughtException', async (err) => {
  logError(`${err.name}: ${err.message}`, LogPrefix.Backend)
  await showErrorBoxModal(
    mainWindow,
    i18next.t(
      'box.error.uncaught-exception.title',
      'Uncaught Exception occured!'
    ),
    i18next.t('box.error.uncaught-exception.message', {
      defaultValue:
        'A uncaught exception occured:{{newLine}}{{error}}{{newLine}}{{newLine}}Heroic will be closed! Report the exception on our Github repository.',
      newLine: '\n',
      error: err
    })
  )
  app.exit(1)
})

let powerId: number | null

ipcMain.on('lock', () => {
  if (!existsSync(join(heroicGamesConfigPath, 'lock'))) {
    writeFileSync(join(heroicGamesConfigPath, 'lock'), '')
    if (!powerId) {
      logInfo('Preventing machine to sleep', LogPrefix.Backend)
      powerId = powerSaveBlocker.start('prevent-app-suspension')
      return powerId
    }
  }
})

ipcMain.on('unlock', () => {
  if (existsSync(join(heroicGamesConfigPath, 'lock'))) {
    unlinkSync(join(heroicGamesConfigPath, 'lock'))
    if (powerId) {
      logInfo('Stopping Power Saver Blocker', LogPrefix.Backend)
      return powerSaveBlocker.stop(powerId)
    }
  }
})

ipcMain.handle('kill', async (event, appName, runner) => {
  return Game.get(appName, runner).stop()
})

ipcMain.handle('checkDiskSpace', async (event, folder: string) => {
  const parent = getFirstExistingParentPath(folder)
  return new Promise((res) => {
    access(parent, constants.W_OK, async (writeError) => {
      const { free, size: diskSize } = await checkDiskSpace(folder).catch(
        (checkSpaceError) => {
          logError(
            [
              'Failed to check disk space for',
              `"${folder}":`,
              checkSpaceError.stack ?? `${checkSpaceError}`
            ],
            LogPrefix.Backend
          )
          return { free: 0, size: 0 }
        }
      )
      if (writeError) {
        logWarning(
          [
            'Cannot write to',
            `"${folder}":`,
            writeError.stack ?? `${writeError}`
          ],
          LogPrefix.Backend
        )
      }

      const ret = {
        free,
        diskSize,
        message: `${getFileSize(free)} / ${getFileSize(diskSize)}`,
        validPath: !writeError
      }
      logDebug(`${JSON.stringify(ret)}`, LogPrefix.Backend)
      res(ret)
    })
  })
})

ipcMain.on('quit', async () => handleExit(mainWindow))

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) {
    handleProtocol(mainWindow, [url])
  } else {
    openUrlArgument = url
  }
})

ipcMain.on('openExternalUrl', async (event, url) => openUrlOrFile(url))
ipcMain.on('openFolder', async (event, folder) => openUrlOrFile(folder))
ipcMain.on('openSupportPage', async () => openUrlOrFile(supportURL))
ipcMain.on('openReleases', async () => openUrlOrFile(heroicGithubURL))
ipcMain.on('openWeblate', async () => openUrlOrFile(weblateUrl))
ipcMain.on('showAboutWindow', () => showAboutWindow())
ipcMain.on('openLoginPage', async () => openUrlOrFile(epicLoginUrl))
ipcMain.on('openDiscordLink', async () => openUrlOrFile(discordLink))
ipcMain.on('openPatreonPage', async () => openUrlOrFile(patreonPage))
ipcMain.on('openKofiPage', async () => openUrlOrFile(kofiPage))
ipcMain.on('openWebviewPage', async (event, url) => openUrlOrFile(url))
ipcMain.on('openWikiLink', async () => openUrlOrFile(wikiLink))
ipcMain.on('openSidInfoPage', async () => openUrlOrFile(sidInfoUrl))
ipcMain.on('showConfigFileInFolder', async (event, appName) => {
  if (appName === 'default') {
    return openUrlOrFile(heroicConfigPath)
  }
  return openUrlOrFile(path.join(heroicGamesConfigPath, `${appName}.json`))
})

ipcMain.on('removeFolder', async (e, [path, folderName]) => {
  if (path === 'default') {
    const { defaultInstallPath } = await GlobalConfig.get().getSettings()
    const path = defaultInstallPath.replaceAll("'", '')
    const folderToDelete = `${path}/${folderName}`
    return setTimeout(() => {
      rmSync(folderToDelete, { recursive: true })
    }, 5000)
  }

  const folderToDelete = `${path}/${folderName}`.replaceAll("'", '')
  return setTimeout(() => {
    rmSync(folderToDelete, { recursive: true })
  }, 2000)
})

// Calls WineCFG or Winetricks. If is WineCFG, use the same binary as wine to launch it to dont update the prefix
interface Tools {
  exe: string
  tool: string
  appName: string
  runner: Runner
}

ipcMain.handle(
  'callTool',
  async (event, { tool, exe, appName, runner }: Tools) => {
    const game = Game.get(appName, runner)
    const { wineVersion, winePrefix } = await game.getSettings()
    await verifyWinePrefix(game)

    switch (tool) {
      case 'winetricks':
        Winetricks.run(wineVersion, winePrefix)
        break
      case 'winecfg':
        game.runWineCommand('winecfg')
        break
      case 'runExe':
        game.runWineCommand(exe)
        break
    }
  }
)

/// IPC handlers begin here.

ipcMain.handle('checkGameUpdates', async (event, library?: Runner) => {
  switch (library) {
    case 'legendary':
      return LegendaryLibrary.get().listUpdateableGames()
    case 'gog':
      return GOGLibrary.get().listUpdateableGames()
    default:
      return [
        ...(await LegendaryLibrary.get().listUpdateableGames()),
        ...(await GOGLibrary.get().listUpdateableGames())
      ]
  }
})

ipcMain.handle('getEpicGamesStatus', async () => isEpicServiceOffline())

// Not ready to be used safely yet.
ipcMain.handle('updateAll', async () => LegendaryLibrary.get().updateAllGames())

ipcMain.handle('getMaxCpus', () => cpus().length)

ipcMain.handle('getHeroicVersion', () => app.getVersion())
ipcMain.handle('getLegendaryVersion', async () => getLegendaryVersion())
ipcMain.handle('getGogdlVersion', async () => getGogdlVersion())
ipcMain.handle('isFullscreen', () => isSteamDeckGameMode || isCLIFullscreen)
ipcMain.handle('isFlatpak', () => isFlatpak)

ipcMain.handle('getPlatform', () => process.platform)

ipcMain.handle('showUpdateSetting', () => !isFlatpak)

ipcMain.handle('getLatestReleases', async () => {
  const { checkForUpdatesOnStartup } = GlobalConfig.get().config
  if (checkForUpdatesOnStartup) {
    return getLatestReleases()
  }
})

ipcMain.on('clearCache', () => {
  clearCache()
  dialog.showMessageBox(mainWindow, {
    title: i18next.t('box.cache-cleared.title', 'Cache Cleared'),
    message: i18next.t(
      'box.cache-cleared.message',
      'Heroic Cache Was Cleared!'
    ),
    buttons: [i18next.t('box.ok', 'Ok')]
  })
})

ipcMain.on('resetHeroic', async () => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    title: i18next.t('box.reset-heroic.question.title', 'Reset Heroic'),
    message: i18next.t(
      'box.reset-heroic.question.message',
      "Are you sure you want to reset Heroic? This will remove all Settings and Caching but won't remove your Installed games or your Epic credentials. Portable versions (AppImage, WinPortable, ...) of heroic needs to be restarted manually afterwards."
    ),
    buttons: [i18next.t('box.no'), i18next.t('box.yes')]
  })

  if (response === 1) {
    resetHeroic()
  }
})

ipcMain.on('createNewWindow', async (e, url) =>
  new BrowserWindow({ height: 700, width: 1200 }).loadURL(url)
)

ipcMain.handle('getGameInfo', async (event, appName, runner) => {
  try {
    const game = Game.get(appName, runner)
    const info = game.getGameInfo()
    if (!info) {
      return null
    }
    info.extra = await game.getExtraInfo()
    // eslint-disable-next-line @typescript-eslint/return-await
    return info
  } catch (error) {
    logError(`${error}`, LogPrefix.Backend)
  }
})

ipcMain.handle('getGameSettings', async (event, game, runner) => {
  try {
    const settings = await Game.get(game, runner).getSettings()
    return settings
  } catch (error) {
    logError(`${error}`, LogPrefix.Backend)
  }
})

ipcMain.handle('getGOGLinuxInstallersLangs', async (event, appName) => {
  return GOGLibrary.getLinuxInstallersLanguages(appName)
})

ipcMain.handle('getGOGGameClientId', (event, appName) => {
  return GOGLibrary.get().readInfoFile(appName)?.clientId
})

ipcMain.handle(
  'getInstallInfo',
  async (event, game, runner: Runner, installPlatform: string) => {
    if (!isOnline()) {
      return { game: {}, metadata: {} }
    }

    try {
      const info = await Game.get(game, runner).getInstallInfo(installPlatform)
      return info
    } catch (error) {
      logError(`${error}`, LogPrefix.Backend)
      return null
    }
  }
)

ipcMain.handle('getUserInfo', async () => LegendaryUser.getUserInfo())

// Checks if the user have logged in with Legendary already
ipcMain.handle('isLoggedIn', async () => LegendaryUser.isLoggedIn())

ipcMain.handle('login', async (event, sid) => LegendaryUser.login(sid))
ipcMain.handle('authGOG', async (event, code) => GOGUser.login(code))
ipcMain.handle('logoutLegendary', async () => LegendaryUser.logout())
ipcMain.handle('logoutGOG', async () => GOGUser.logout())

ipcMain.handle('getAlternativeWine', async () =>
  GlobalConfig.get().getAlternativeWine()
)

ipcMain.handle('readConfig', async (event, config_class) => {
  switch (config_class) {
    case 'library':
      return LegendaryLibrary.get().getGames('info')
    case 'user':
      return (await LegendaryUser.getUserInfo()).displayName
    default:
      logError(
        `Which idiot requested '${config_class}' using readConfig?`,
        LogPrefix.Backend
      )
      return {}
  }
})

ipcMain.handle('requestSettings', async (event, appName) => {
  // To the changes how we handle env and wrappers
  // otherOptions is deprectaed and needs to be mapped
  // to new approach.
  // Can be removed if otherOptions is removed aswell
  const mapOtherSettings = (config: AppSettings | GameSettings) => {
    if (config.otherOptions) {
      if (config.enviromentOptions.length <= 0) {
        config.otherOptions
          .split(' ')
          .filter((val) => val.indexOf('=') !== -1)
          .forEach((envKeyAndVar) => {
            const keyAndValueSplit = envKeyAndVar.split('=')
            const key = keyAndValueSplit.shift()
            const value = keyAndValueSplit.join('=')
            config.enviromentOptions.push({ key, value })
          })
      }

      if (config.wrapperOptions.length <= 0) {
        const args = [] as string[]
        config.otherOptions
          .split(' ')
          .filter((val) => val.indexOf('=') === -1)
          .forEach((val, index) => {
            if (index === 0) {
              config.wrapperOptions.push({ exe: val, args: '' })
            } else {
              args.push(val)
            }
          })

        if (config.wrapperOptions.at(0)) {
          config.wrapperOptions.at(0).args = shlex.join(args)
        }
      }

      delete config.otherOptions
    }
    return config
  }

  if (appName === 'default') {
    return mapOtherSettings(GlobalConfig.get().config)
  }
  // We can't use .config since apparently its not loaded fast enough.
  const config = await GameConfig.get(appName).getSettings()
  return mapOtherSettings(config)
})

ipcMain.on('toggleDXVK', (event, [{ winePrefix, winePath }, action]) => {
  DXVK.installRemove(winePrefix, winePath, 'dxvk', action)
})

ipcMain.on('toggleVKD3D', (event, [{ winePrefix, winePath }, action]) => {
  DXVK.installRemove(winePrefix, winePath, 'vkd3d', action)
})

ipcMain.handle('writeConfig', (event, [appName, config]) => {
  logInfo(
    `Writing config for ${appName === 'default' ? 'Heroic' : appName}`,
    LogPrefix.Backend
  )
  // use 2 spaces for pretty print
  logInfo(JSON.stringify(config, null, 2), LogPrefix.Backend)
  if (appName === 'default') {
    GlobalConfig.get().config = config
    GlobalConfig.get().flush()
  } else {
    GameConfig.get(appName).config = config
    GameConfig.get(appName).flush()
  }
})

// Watch the installed games file and trigger a refresh on the installed games if something changes
if (existsSync(installed)) {
  watch(installed, () => {
    logInfo('Installed game list updated', LogPrefix.Legendary)
    LegendaryLibrary.get().refreshInstalled()
  })
}

ipcMain.handle('refreshLibrary', async (e, fullRefresh, library?: Runner) => {
  switch (library) {
    case 'legendary':
      await LegendaryLibrary.get().getGames('info', fullRefresh)
      break
    case 'gog':
      await GOGLibrary.get().sync()
      break
    default:
      await Promise.allSettled([
        LegendaryLibrary.get().getGames('info', fullRefresh),
        GOGLibrary.get().sync()
      ])
      break
  }
})

ipcMain.on('logError', (e, err) => logError(`${err}`, LogPrefix.Frontend))
ipcMain.on('logInfo', (e, info) => logInfo(`${info}`, LogPrefix.Frontend))

type RecentGame = {
  appName: string
  title: string
}

type LaunchParams = {
  appName: string
  launchArguments: string
  runner: Runner
}

let powerDisplayId: number | null

ipcMain.handle(
  'launch',
  async (event, { appName, launchArguments, runner }: LaunchParams) => {
    const window = BrowserWindow.getAllWindows()[0]
    const recentGames =
      (configStore.get('games.recent') as Array<RecentGame>) || []
    const game = Game.get(appName, runner)
    const { title } = game.getGameInfo()
    const { minimizeOnLaunch, maxRecentGames: MAX_RECENT_GAMES = 5 } =
      await GlobalConfig.get().getSettings()

    const startPlayingDate = new Date()

    if (!tsStore.has(game.appName)) {
      tsStore.set(`${game.appName}.firstPlayed`, startPlayingDate)
    }

    logInfo(`Launching ${title} (${game.appName})`, LogPrefix.Backend)

    if (recentGames.length) {
      let updatedRecentGames = recentGames.filter(
        (a) => a.appName && a.appName !== game.appName
      )
      if (updatedRecentGames.length > MAX_RECENT_GAMES) {
        const newArr = []
        for (let i = 0; i <= MAX_RECENT_GAMES; i++) {
          newArr.push(updatedRecentGames[i])
        }
        updatedRecentGames = newArr
      }
      if (updatedRecentGames.length === MAX_RECENT_GAMES) {
        updatedRecentGames.pop()
      }
      updatedRecentGames.unshift({ appName: game.appName, title })
      configStore.set('games.recent', updatedRecentGames)
    } else {
      configStore.set('games.recent', [{ appName: game.appName, title }])
    }

    window.webContents.send('setGameStatus', {
      appName,
      runner,
      status: 'playing'
    })

    if (minimizeOnLaunch) {
      mainWindow.hide()
    }

    // Prevent display from sleep
    if (!powerDisplayId) {
      logInfo('Preventing display from sleep', LogPrefix.Backend)
      powerDisplayId = powerSaveBlocker.start('prevent-display-sleep')
    }

    const systemInfo = await getSystemInfo()
    const gameSettingsString = JSON.stringify(
      await game.getSettings(),
      null,
      '\t'
    )
    writeFileSync(
      game.logFileLocation,
      'System Info:\n' +
        `${systemInfo}\n` +
        '\n' +
        `Game Settings: ${gameSettingsString}\n` +
        '\n' +
        `Game launched at: ${startPlayingDate}\n` +
        '\n'
    )
    return game
      .launch(launchArguments)
      .catch((exception: Error) => {
        logError(exception.stack, LogPrefix.Backend)
        appendFileSync(
          game.logFileLocation,
          `An exception occurred when launching the game:\n${exception.stack}`
        )
      })
      .finally(() => {
        // Stop display sleep blocker
        if (powerDisplayId !== null) {
          logInfo('Stopping Display Power Saver Blocker', LogPrefix.Backend)
          powerSaveBlocker.stop(powerDisplayId)
        }

        // Update playtime and last played date
        const finishedPlayingDate = new Date()
        tsStore.set(`${game.appName}.lastPlayed`, finishedPlayingDate)
        // Playtime of this session in minutes
        const sessionPlaytime =
          (finishedPlayingDate.getTime() - startPlayingDate.getTime()) /
          1000 /
          60
        let totalPlaytime = sessionPlaytime
        if (tsStore.has(`${game.appName}.totalPlayed`)) {
          totalPlaytime += tsStore.get(`${game.appName}.totalPlayed`) as number
        }
        tsStore.set(`${game.appName}.totalPlayed`, Math.floor(totalPlaytime))

        window.webContents.send('setGameStatus', {
          appName,
          runner,
          status: 'done'
        })

        // Exit if we've been launched without UI
        if (isCLINoGui) {
          app.exit()
        } else {
          mainWindow.show()
        }
      })
  }
)

ipcMain.handle('openDialog', async (e, args) => {
  const { filePaths, canceled } = await showOpenDialog(mainWindow, {
    ...args
  })
  if (filePaths[0]) {
    return { path: filePaths[0] }
  }
  return { canceled }
})

ipcMain.on('showItemInFolder', async (e, item) => {
  showItemInFolder(item)
})

const openMessageBox = async (args: Electron.MessageBoxOptions) => {
  const { response, checkboxChecked } = await showMessageBox(mainWindow, {
    ...args
  })
  return { response, checkboxChecked }
}

ipcMain.handle(
  'openMessageBox',
  async (_, args: Electron.MessageBoxOptions) => {
    return openMessageBox(args)
  }
)

ipcMain.handle(
  'showErrorBox',
  async (e, args: [title: string, message: string]) => {
    const [title, content] = args
    return showErrorBoxModal(mainWindow, title, content)
  }
)

ipcMain.handle('install', async (event, params) => {
  const {
    appName,
    path,
    installDlcs,
    sdlList,
    runner,
    installLanguage,
    platformToInstall
  } = params as InstallParams
  const game = Game.get(appName, runner)
  const { title } = game.getGameInfo()

  if (!isOnline()) {
    logWarning(
      `App offline, skipping install for game '${title}'.`,
      LogPrefix.Backend
    )
    return { status: 'error' }
  }

  const epicOffline = await isEpicServiceOffline()
  if (epicOffline && runner === 'legendary') {
    showErrorBoxModal(
      mainWindow,
      i18next.t('box.warning.title', 'Warning'),
      i18next.t(
        'box.warning.epic.install',
        'Epic Servers are having major outage right now, the game cannot be installed!'
      )
    )
    return { status: 'error' }
  }

  mainWindow.webContents.send('setGameStatus', {
    appName,
    runner,
    status: 'installing',
    folder: path
  })

  notify({
    title,
    body: i18next.t('notify.install.startInstall', 'Installation Started')
  })
  return game
    .install({
      path: path.replaceAll("'", ''),
      installDlcs,
      sdlList,
      platformToInstall,
      installLanguage
    })
    .then(async (res) => {
      notify({
        title,
        body:
          res.status === 'done'
            ? i18next.t('notify.install.finished')
            : i18next.t('notify.install.canceled')
      })
      logInfo('finished installing', LogPrefix.Backend)
      mainWindow.webContents.send('setGameStatus', {
        appName,
        runner,
        status: 'done'
      })
      return res
    })
    .catch((res) => {
      notify({ title, body: i18next.t('notify.install.canceled') })
      mainWindow.webContents.send('setGameStatus', {
        appName,
        runner,
        status: 'done'
      })
      return res
    })
})

ipcMain.handle('uninstall', async (event, args) => {
  const [appName, shouldRemovePrefix, runner] = args
  const game = Game.get(appName, runner)

  const { title } = game.getGameInfo()
  const { winePrefix } = await game.getSettings()

  return game
    .uninstall()
    .then(() => {
      if (shouldRemovePrefix) {
        logInfo(`Removing prefix ${winePrefix}`, LogPrefix.Backend)
        if (existsSync(winePrefix)) {
          // remove prefix if exists
          rmSync(winePrefix, { recursive: true })
        }
      }
      notify({ title, body: i18next.t('notify.uninstalled') })
      logInfo('finished uninstalling', LogPrefix.Backend)
    })
    .catch((error) => logError(`${error}`, LogPrefix.Backend))
})

ipcMain.handle('repair', async (event, appName, runner) => {
  if (!isOnline()) {
    logWarning(
      `App offline, skipping repair for game '${appName}'.`,
      LogPrefix.Backend
    )
    return
  }
  const game = Game.get(appName, runner)
  const { title } = game.getGameInfo()

  return game
    .repair()
    .then(() => {
      notify({ title, body: i18next.t('notify.finished.reparing') })
      logInfo('finished repairing', LogPrefix.Backend)
    })
    .catch((error) => {
      notify({
        title,
        body: i18next.t('notify.error.reparing', 'Error Repairing')
      })
      logError(`${error}`, LogPrefix.Backend)
    })
})

ipcMain.handle('moveInstall', async (event, [appName, path, runner]) => {
  const game = Game.get(appName, runner)
  const { title } = game.getGameInfo()
  try {
    notify({ title, body: i18next.t('notify.moving', 'Moving Game') })
    const newPath = await game.moveInstall(path)
    notify({ title, body: i18next.t('notify.moved') })
    logInfo(`Finished moving ${appName} to ${newPath}.`, LogPrefix.Backend)
  } catch (error) {
    notify({
      title,
      body: i18next.t('notify.error.move', 'Error Moving the Game')
    })
    logError(`${error}`, LogPrefix.Backend)
  }
})

ipcMain.handle('importGame', async (event, args) => {
  const { appName, path, runner } = args
  const epicOffline = await isEpicServiceOffline()
  if (epicOffline && runner === 'legendary') {
    showErrorBoxModal(
      mainWindow,
      i18next.t('box.warning.title', 'Warning'),
      i18next.t(
        'box.warning.epic.import',
        'Epic Servers are having major outage right now, the game cannot be imported!'
      )
    )
    return { status: 'error' }
  }
  const game = Game.get(appName, runner)
  const { title } = game.getGameInfo()
  mainWindow.webContents.send('setGameStatus', {
    appName,
    runner,
    status: 'installing'
  })
  game
    .import(path)
    .then(() => {
      notify({
        title,
        body: i18next.t('notify.install.imported', 'Game Imported')
      })
      mainWindow.webContents.send('setGameStatus', {
        appName,
        runner,
        status: 'done'
      })
      logInfo(`imported ${title}`, LogPrefix.Backend)
    })
    .catch((err) => {
      notify({ title, body: i18next.t('notify.install.canceled') })
      mainWindow.webContents.send('setGameStatus', {
        appName,
        runner,
        status: 'done'
      })
      logInfo(err, LogPrefix.Backend)
    })
})

ipcMain.handle('updateGame', async (e, appName, runner) => {
  if (!isOnline()) {
    logWarning(
      `App offline, skipping install for game '${appName}'.`,
      LogPrefix.Backend
    )
    return
  }

  const epicOffline = await isEpicServiceOffline()
  if (epicOffline && runner === 'legendary') {
    showErrorBoxModal(
      mainWindow,
      i18next.t('box.warning.title', 'Warning'),
      i18next.t(
        'box.warning.epic.update',
        'Epic Servers are having major outage right now, the game cannot be updated!'
      )
    )
    return { status: 'error' }
  }

  const game = Game.get(appName, runner)
  const { title } = game.getGameInfo()
  notify({ title, body: i18next.t('notify.update.started', 'Update Started') })

  return game
    .update()
    .then(({ status }) => {
      notify({
        title,
        body:
          status === 'done'
            ? i18next.t('notify.update.finished')
            : i18next.t('notify.update.canceled')
      })
      logInfo('finished updating', LogPrefix.Backend)
    })
    .catch((err) => {
      logError(`${err}`, LogPrefix.Backend)
      notify({ title, body: i18next.t('notify.update.canceled') })
      return err
    })
})

ipcMain.handle(
  'changeInstallPath',
  async (event, [appName, newPath, runner]: string[]) => {
    let instance = null
    switch (runner) {
      case 'legendary':
        instance = LegendaryLibrary.get()
        break
      case 'gog':
        instance = GOGLibrary.get()
        break
      default:
        logError(`Unsupported runner ${runner}`, LogPrefix.Backend)
        return
    }
    instance.changeGameInstallPath(appName, newPath)
    logInfo(`Finished moving ${appName} to ${newPath}.`, LogPrefix.Backend)
  }
)

ipcMain.handle('egsSync', async (event, args: string) => {
  if (isWindows) {
    const egl_manifestPath =
      'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'

    if (!existsSync(egl_manifestPath)) {
      mkdirSync(egl_manifestPath, { recursive: true })
    }
  }

  const linkArgs = isWindows
    ? `--enable-sync`
    : `--enable-sync --egl-wine-prefix ${args}`
  const unlinkArgs = `--unlink`
  const isLink = args !== 'unlink'
  const command = isLink ? linkArgs : unlinkArgs
  const { bin, dir } = getLegendaryBin()
  const legendary = path.join(dir, bin)

  try {
    const { stderr, stdout } = await execAsync(
      `${legendary} egl-sync ${command} -y`
    )
    logInfo(`${stdout}`, LogPrefix.Legendary)
    if (stderr.includes('ERROR')) {
      logError(`${stderr}`, LogPrefix.Legendary)
      return 'Error'
    }
    return `${stdout} - ${stderr}`
  } catch (error) {
    logError(`${error}`, LogPrefix.Legendary)
    return 'Error'
  }
})

ipcMain.handle(
  'syncGOGSaves',
  async (
    event,
    gogSaves: GOGCloudSavesLocation[],
    appName: string,
    arg: string
  ) => Game.get(appName, 'gog').syncSaves(arg, '', gogSaves)
)

ipcMain.handle('syncSaves', async (event, args) => {
  const [arg = '', path, appName, runner] = args
  const epicOffline = await isEpicServiceOffline()
  if (epicOffline) {
    logWarning('Epic is Offline right now, cannot sync saves!')
    return 'Epic is Offline right now, cannot sync saves!'
  }
  if (!isOnline()) {
    logWarning(
      `App offline, skipping syncing saves for game '${appName}'.`,
      LogPrefix.Backend
    )
    return
  }

  const { stderr, stdout } = await Game.get(appName, runner).syncSaves(
    arg,
    path
  )
  logInfo(`${stdout}`, LogPrefix.Backend)
  if (stderr.includes('ERROR')) {
    logError(`${stderr}`, LogPrefix.Backend)
    return `Something went wrong, check ${currentLogFile}!`
  }
  return `\n ${stdout} - ${stderr}`
})

// Simulate keyboard and mouse actions as if the real input device is used
ipcMain.handle('gamepadAction', async (event, args) => {
  const [action, metadata] = args
  const window = BrowserWindow.getAllWindows()[0]
  const inputEvents: (
    | GamepadInputEventKey
    | GamepadInputEventWheel
    | GamepadInputEventMouse
  )[] = []

  /*
   * How to extend:
   *
   * Valid values for type are 'keyDown', 'keyUp' and 'char'
   * Valid values for keyCode are defined here:
   * https://www.electronjs.org/docs/latest/api/accelerator#available-key-codes
   *
   */
  switch (action) {
    case 'rightStickUp':
      inputEvents.push({
        type: 'mouseWheel',
        deltaY: 50,
        x: window.getBounds().width / 2,
        y: window.getBounds().height / 2
      })
      break
    case 'rightStickDown':
      inputEvents.push({
        type: 'mouseWheel',
        deltaY: -50,
        x: window.getBounds().width / 2,
        y: window.getBounds().height / 2
      })
      break
    case 'leftStickUp':
    case 'leftStickDown':
    case 'leftStickLeft':
    case 'leftStickRight':
    case 'padUp':
    case 'padDown':
    case 'padLeft':
    case 'padRight':
      // spatial navigation
      inputEvents.push({
        type: 'keyDown',
        keyCode: action.replace(/pad|leftStick/, '')
      })
      inputEvents.push({
        type: 'keyUp',
        keyCode: action.replace(/pad|leftStick/, '')
      })
      break
    case 'leftClick':
      inputEvents.push({
        type: 'mouseDown',
        button: 'left',
        x: metadata.x,
        y: metadata.y
      })
      inputEvents.push({
        type: 'mouseUp',
        button: 'left',
        x: metadata.x,
        y: metadata.y
      })
      break
    case 'rightClick':
      inputEvents.push({
        type: 'mouseDown',
        button: 'right',
        x: metadata.x,
        y: metadata.y
      })
      inputEvents.push({
        type: 'mouseUp',
        button: 'right',
        x: metadata.x,
        y: metadata.y
      })
      break
    case 'back':
      window.webContents.goBack()
      break
    case 'esc':
      inputEvents.push({
        type: 'keyDown',
        keyCode: 'Esc'
      })
      inputEvents.push({
        type: 'keyUp',
        keyCode: 'Esc'
      })
      break
  }

  if (inputEvents.length) {
    inputEvents.forEach((event) => window.webContents.sendInputEvent(event))
  }
})

ipcMain.handle('getFonts', async (event, reload = false) => {
  let cachedFonts = (fontsStore.get('fonts', []) as string[]) || []
  if (cachedFonts.length === 0 || reload) {
    cachedFonts = await getFonts()
    cachedFonts = cachedFonts.sort((a, b) => a.localeCompare(b))
    fontsStore.set('fonts', cachedFonts)
  }
  return cachedFonts
})

ipcMain.handle(
  'runWineCommandForGame',
  async (event, { appName, command, runner }) => {
    const game = Game.get(appName, runner)
    if (isWindows) {
      return execAsync(command)
    }
    const { updated } = await verifyWinePrefix(game)

    if (runner === 'gog' && updated) {
      await setup(game.appName)
    }

    return game.runWineCommand(command, false, true)
  }
)

ipcMain.handle('getShellPath', async (event, path) => {
  return normalize((await execAsync(`echo "${path}"`)).stdout.trim())
})

ipcMain.handle('getRealPath', (event, path) => {
  let resolvedPath = normalize(path)
  try {
    resolvedPath = realpathSync(path)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err?.path) {
      resolvedPath = err.path // Reslove most accurate path (most likely followed symlinks)
    }
  }

  return resolvedPath
})
/*
  Other Keys that should go into translation files:
  t('box.error.generic.title')
  t('box.error.generic.message')
 */

/*
 * INSERT OTHER IPC HANLDER HERE
 */
import './logger/ipc_handler'
import './wine/manager/ipc_handler'
import './shortcuts/ipc_handler'
import './anticheat/ipc_handler'
import './legendary/eos_overlay/ipc_handler'
import './wine/runtimes/ipc_handler'
