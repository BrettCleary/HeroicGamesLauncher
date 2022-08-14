import './index.css'

import React, { useContext, useEffect, useState } from 'react'

import {
  AppSettings,
  EnviromentVariable,
  GOGCloudSavesLocation,
  Runner,
  SettingsContextType,
  WineInstallation,
  WrapperVariable
} from 'src/types'
import { Clipboard, IpcRenderer } from 'electron'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import { getGameInfo, writeConfig } from 'src/helpers'
import { useToggle } from 'src/hooks'
import { useTranslation } from 'react-i18next'
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft'

import ContextProvider from 'src/state/ContextProvider'
import UpdateComponent from 'src/components/UI/UpdateComponent'

import GeneralSettings from './components/GeneralSettings'
import OtherSettings from './components/OtherSettings'
import { LegendarySyncSaves, GOGSyncSaves } from './components/SyncSaves'
import Tools from './components/Tools'
import WineSettings from './components/WineSettings'
import LogSettings from './components/LogSettings'
import { AdvancedSettings } from './components/AdvancedSettings'
import FooterInfo from './components/FooterInfo'
import { WineExtensions } from './components'
import { configStore } from 'src/helpers/electronStores'
import ContextMenu from '../Library/components/ContextMenu'
import SettingsContext from './SettingsContext'

interface ElectronProps {
  ipcRenderer: IpcRenderer
  clipboard: Clipboard
}

const { ipcRenderer, clipboard } = window.require('electron') as ElectronProps

interface LocationState {
  fromGameCard: boolean
  runner: Runner
  isLinuxNative: boolean
  isMacNative: boolean
}

function Settings() {
  const { t, i18n } = useTranslation()
  const {
    state: { fromGameCard, runner, isLinuxNative, isMacNative }
  } = useLocation() as { state: LocationState }
  const { platform } = useContext(ContextProvider)
  const isWin = platform === 'win32'
  const home = configStore.get('userHome')

  const [wineVersion, setWineVersion] = useState({
    bin: '/usr/bin/wine',
    name: 'Wine Default'
  } as WineInstallation)
  const [winePrefix, setWinePrefix] = useState(`${home}/.wine`)
  const [wineCrossoverBottle, setWineCrossoverBottle] = useState('Heroic')
  const [defaultSteamPath, setDefaultSteamPath] = useState('')
  const [defaultWinePrefix, setDefaultWinePrefix] = useState('')
  const [targetExe, setTargetExe] = useState('')
  const [enviromentOptions, setEnviromentOptions] = useState<
    EnviromentVariable[]
  >([])
  const [wrapperOptions, setWrapperOptions] = useState<WrapperVariable[]>([])
  const [launcherArgs, setLauncherArgs] = useState('')
  const [languageCode, setLanguageCode] = useState('')
  const [title, setTitle] = useState('')
  const [maxRecentGames, setMaxRecentGames] = useState(5)
  const [maxSharpness, setFsrSharpness] = useState(5)
  const [altLegendaryBin, setAltLegendaryBin] = useState('')
  const [altGogdlBin, setAltGogdlBin] = useState('')
  const [canRunOffline, setCanRunOffline] = useState(true)
  const [customWinePaths, setCustomWinePaths] = useState([] as Array<string>)
  const [savesPath, setSavesPath] = useState('')
  const [gogSavesLocations, setGogSavesLocations] = useState(
    [] as Array<GOGCloudSavesLocation>
  )
  const [currentConfig, setCurrentConfig] = useState<AppSettings | null>(null)

  const {
    on: addDesktopShortcuts,
    toggle: toggleAddDesktopShortcuts,
    setOn: setAddDesktopShortcuts
  } = useToggle(false)
  const {
    on: addStartMenuShortcuts,
    toggle: toggleAddGamesToStartMenu,
    setOn: setAddGamesToStartMenu
  } = useToggle(false)
  const {
    on: useGameMode,
    toggle: toggleUseGameMode,
    setOn: setUseGameMode
  } = useToggle(false)
  const {
    on: useSteamRuntime,
    toggle: toggleUseSteamRuntime,
    setOn: setUseSteamRuntime
  } = useToggle(false)
  const {
    on: nvidiaPrime,
    toggle: toggleNvidiaPrime,
    setOn: setUseNvidiaPrime
  } = useToggle(false)
  const { on: showFps, toggle: toggleFps, setOn: setShowFps } = useToggle(false)
  const {
    on: offlineMode,
    toggle: toggleOffline,
    setOn: setShowOffline
  } = useToggle(false)
  const {
    on: audioFix,
    toggle: toggleAudioFix,
    setOn: setAudioFix
  } = useToggle(false)
  const {
    on: showMangohud,
    toggle: toggleMangoHud,
    setOn: setShowMangoHud
  } = useToggle(false)
  const {
    on: discordRPC,
    toggle: toggleDiscordRPC,
    setOn: setDiscordRPC
  } = useToggle(false)
  const {
    on: autoInstallDxvk,
    toggle: toggleAutoInstallDxvk,
    setOn: setAutoInstallDxvk
  } = useToggle(false)
  const {
    on: autoInstallVkd3d,
    toggle: toggleAutoInstallVkd3d,
    setOn: setAutoInstallVkd3d
  } = useToggle(false)
  const {
    on: preferSystemLibs,
    toggle: togglePreferSystemLibs,
    setOn: setPreferSystemLibs
  } = useToggle(false)
  const {
    on: enableFSR,
    toggle: toggleFSR,
    setOn: setEnableFSR
  } = useToggle(false)
  const {
    on: enableResizableBar,
    toggle: toggleResizableBar,
    setOn: setResizableBar
  } = useToggle(false)
  const {
    on: enableEsync,
    toggle: toggleEsync,
    setOn: setEnableEsync
  } = useToggle(false)
  const {
    on: enableFsync,
    toggle: toggleFsync,
    setOn: setEnableFsync
  } = useToggle(false)
  const {
    on: eacRuntime,
    toggle: toggleEacRuntime,
    setOn: setEacRuntime
  } = useToggle(false)
  const {
    on: battlEyeRuntime,
    toggle: toggleBattlEyeRuntime,
    setOn: setBattlEyeRuntime
  } = useToggle(false)
  const {
    on: downloadNoHttps,
    toggle: toggleDownloadNoHttps,
    setOn: setDownloadNoHttps
  } = useToggle(false)

  const [autoSyncSaves, setAutoSyncSaves] = useState(false)
  const [altWine, setAltWine] = useState([] as WineInstallation[])

  const [configLoaded, setConfigLoaded] = useState(false)
  const [settingsToSave, setSettingsToSave] = useState<AppSettings>(
    {} as AppSettings
  )

  const { appName = '', type = '' } = useParams()
  const isDefault = appName === 'default'
  const isGeneralSettings = type === 'general'
  const isWineSettings = type === 'wine'
  const isWineExtensions = type === 'wineExt'
  const isSyncSettings = type === 'sync'
  const isOtherSettings = type === 'other'
  const isLogSettings = type === 'log'
  const isAdvancedSetting = type === 'advanced' && isDefault
  const syncCommands = [
    { name: t('setting.manualsync.download'), value: '--skip-upload' },
    { name: t('setting.manualsync.upload'), value: '--skip-download' },
    { name: t('setting.manualsync.forcedownload'), value: '--force-download' },
    { name: t('setting.manualsync.forceupload'), value: '--force-upload' }
  ]

  // Load Heroic's or game's config, only if not loaded already
  useEffect(() => {
    const getSettings = async () => {
      if (!configLoaded) {
        const config: AppSettings = await ipcRenderer.invoke(
          'requestSettings',
          appName
        )
        setCurrentConfig(config)
        setAutoSyncSaves(config.autoSyncSaves)
        setUseGameMode(config.useGameMode)
        setShowFps(config.showFps)
        setShowOffline(config.offlineMode)
        setAudioFix(config.audioFix)
        setShowMangoHud(config.showMangohud)
        setDefaultSteamPath(config.defaultSteamPath)
        setWineVersion(config.wineVersion)
        setWinePrefix(config.winePrefix)
        setWineCrossoverBottle(config.wineCrossoverBottle)
        setEnviromentOptions(config.enviromentOptions)
        setWrapperOptions(config.wrapperOptions)
        setLauncherArgs(config.launcherArgs)
        setUseNvidiaPrime(config.nvidiaPrime)
        setDiscordRPC(config.discordRPC)
        setAutoInstallDxvk(config.autoInstallDxvk)
        setAutoInstallVkd3d(config.autoInstallVkd3d)
        setPreferSystemLibs(config.preferSystemLibs)
        setEnableEsync(config.enableEsync)
        setEnableFsync(config.enableFsync)
        setEnableFSR(config.enableFSR)
        setFsrSharpness(config.maxSharpness || 2)
        setResizableBar(config.enableResizableBar)
        setSavesPath(config.savesPath || '')
        setGogSavesLocations(config.gogSaves || [])
        setMaxRecentGames(config.maxRecentGames ?? 5)
        setCustomWinePaths(config.customWinePaths || [])
        setAddDesktopShortcuts(config.addDesktopShortcuts)
        setAddGamesToStartMenu(config.addStartMenuShortcuts)
        setCustomWinePaths(config.customWinePaths || [])
        setTargetExe(config.targetExe || '')
        setAltLegendaryBin(config.altLegendaryBin || '')
        setAltGogdlBin(config.altGogdlBin || '')
        setDefaultWinePrefix(config.defaultWinePrefix)
        setUseSteamRuntime(config.useSteamRuntime)
        setEacRuntime(config.eacRuntime || false)
        setBattlEyeRuntime(config.battlEyeRuntime || false)
        setDownloadNoHttps(config.downloadNoHttps)

        if (!isDefault) {
          setLanguageCode(config.language)
          const info = await getGameInfo(appName, runner)
          const { title: gameTitle, canRunOffline: can_run_offline } = info
          setCanRunOffline(can_run_offline)
          setTitle(gameTitle)
        } else {
          setTitle(t('globalSettings', 'Global Settings'))
        }

        setSettingsToSaveState()
      }
    }
    getSettings()
  }, [appName, type, isDefault, i18n.language])

  let returnPath = '/'
  if (!fromGameCard) {
    returnPath = `/gamepage/${runner}/${appName}`
    if (returnPath.includes('default')) {
      returnPath = '/'
    }
  }

  // Helper function to update the `settingsToSave` state
  const setSettingsToSaveState = () => {
    const GlobalSettings = {
      altLegendaryBin,
      altGogdlBin,
      addDesktopShortcuts,
      addStartMenuShortcuts,
      audioFix,
      autoInstallDxvk,
      autoInstallVkd3d,
      preferSystemLibs,
      customWinePaths,
      defaultSteamPath,
      defaultWinePrefix,
      discordRPC,
      enableEsync,
      enableFsync,
      maxRecentGames,
      nvidiaPrime,
      enviromentOptions,
      wrapperOptions,
      showFps,
      showMangohud,
      useGameMode,
      wineCrossoverBottle,
      winePrefix,
      wineVersion,
      enableFSR,
      enableResizableBar,
      eacRuntime,
      battlEyeRuntime
    } as AppSettings

    const GameSettings = {
      audioFix,
      autoInstallDxvk,
      autoInstallVkd3d,
      preferSystemLibs,
      autoSyncSaves,
      enableEsync,
      enableFSR,
      enableFsync,
      maxSharpness,
      enableResizableBar,
      language: languageCode,
      launcherArgs,
      nvidiaPrime,
      offlineMode,
      enviromentOptions,
      wrapperOptions,
      savesPath,
      showFps,
      showMangohud,
      targetExe,
      useGameMode,
      wineCrossoverBottle,
      winePrefix,
      wineVersion,
      useSteamRuntime,
      eacRuntime,
      battlEyeRuntime,
      gogSaves: gogSavesLocations
    } as AppSettings

    setSettingsToSave(isDefault ? GlobalSettings : GameSettings)
  }

  // update the settingsToSave state when any of the configurations changes
  // but only after the configuration was loaded
  useEffect(() => {
    if (configLoaded) {
      setSettingsToSaveState()
    }
  }, [
    altLegendaryBin,
    altGogdlBin,
    addDesktopShortcuts,
    addStartMenuShortcuts,
    audioFix,
    autoInstallDxvk,
    autoInstallVkd3d,
    preferSystemLibs,
    autoSyncSaves,
    customWinePaths,
    defaultSteamPath,
    defaultWinePrefix,
    discordRPC,
    downloadNoHttps,
    enableEsync,
    enableFsync,
    maxRecentGames,
    maxSharpness,
    nvidiaPrime,
    enviromentOptions,
    wrapperOptions,
    showFps,
    showMangohud,
    useGameMode,
    wineCrossoverBottle,
    winePrefix,
    wineVersion,
    enableFSR,
    enableResizableBar,
    languageCode,
    launcherArgs,
    offlineMode,
    savesPath,
    targetExe,
    useSteamRuntime,
    eacRuntime,
    battlEyeRuntime,
    gogSavesLocations
  ])

  // when the settingsToSave state changes:
  // - write the config if it completed loading before
  // - set the `configLoaded` state to ensure it can only be written after loaded
  useEffect(() => {
    if (configLoaded) {
      writeConfig([appName, settingsToSave])
    } else {
      // initial state is {}, consider loaded when the object has keys in it
      setConfigLoaded(Object.keys(settingsToSave).length > 0)
    }
  }, [settingsToSave])

  if (!title) {
    return <UpdateComponent />
  }

  const contextValues: SettingsContextType = {
    getSetting: (key: string) => {
      if (currentConfig) {
        return currentConfig[key]
      }
    },
    setSetting: (key: string, value: unknown) => {
      writeConfig([appName, { ...currentConfig, [key]: value }])
    }
  }

  return (
    <ContextMenu
      items={[
        {
          label: t(
            'settings.copyToClipboard',
            'Copy All Settings to Clipboard'
          ),
          onclick: () =>
            clipboard.writeText(
              JSON.stringify({ appName, title, ...settingsToSave })
            ),
          show: !isLogSettings
        },
        {
          label: t('settings.open-config-file', 'Open Config File'),
          onclick: () => ipcRenderer.send('showConfigFileInFolder', appName),
          show: !isLogSettings
        }
      ]}
    >
      <SettingsContext.Provider value={contextValues}>
        <div className="Settings">
          <div role="list" className="settingsWrapper">
            <NavLink to={returnPath} role="link" className="backButton">
              <ArrowCircleLeftIcon />
            </NavLink>
            {title && (
              <h1 className="headerTitle" data-testid="headerTitle">
                {title}
              </h1>
            )}
            {isGeneralSettings && <GeneralSettings />}
            {isWineSettings && (
              <WineSettings
                altWine={altWine}
                setAltWine={setAltWine}
                wineVersion={wineVersion}
                winePrefix={winePrefix}
                setWineVersion={setWineVersion}
                setWinePrefix={setWinePrefix}
                wineCrossoverBottle={wineCrossoverBottle}
                setWineCrossoverBottle={setWineCrossoverBottle}
                customWinePaths={customWinePaths}
                setCustomWinePaths={setCustomWinePaths}
                isDefault={isDefault}
                enableFSR={enableFSR}
                toggleFSR={toggleFSR}
                enableEsync={enableEsync}
                toggleEsync={toggleEsync}
                enableFsync={enableFsync}
                toggleFsync={toggleFsync}
                defaultWinePrefix={defaultWinePrefix}
                setDefaultWinePrefix={setDefaultWinePrefix}
                maxSharpness={maxSharpness}
                setFsrSharpness={setFsrSharpness}
                enableResizableBar={enableResizableBar}
                toggleResizableBar={toggleResizableBar}
                preferSystemLibs={preferSystemLibs}
                togglePreferSystemLibs={togglePreferSystemLibs}
              />
            )}
            {isWineSettings && !isDefault && (
              <Tools appName={appName} runner={runner} />
            )}
            {isWineExtensions && (
              <WineExtensions
                winePrefix={winePrefix}
                wineVersion={wineVersion}
                eacRuntime={eacRuntime}
                toggleEacRuntime={toggleEacRuntime}
                gameMode={useGameMode}
                toggleGameMode={toggleUseGameMode}
                battlEyeRuntime={battlEyeRuntime}
                toggleBattlEyeRuntime={toggleBattlEyeRuntime}
                autoInstallDxvk={autoInstallDxvk}
                toggleAutoInstallDxvk={toggleAutoInstallDxvk}
                autoInstallVkd3d={autoInstallVkd3d}
                toggleAutoInstallVkd3d={toggleAutoInstallVkd3d}
              />
            )}
            {isOtherSettings && (
              <OtherSettings
                runner={runner}
                enviromentOptions={enviromentOptions}
                wrapperOptions={wrapperOptions}
                setEnviromentOptions={setEnviromentOptions}
                setWrapperOptions={setWrapperOptions}
                launcherArgs={launcherArgs}
                setLauncherArgs={setLauncherArgs}
                languageCode={languageCode}
                setLanguageCode={setLanguageCode}
                useGameMode={useGameMode}
                toggleUseGameMode={toggleUseGameMode}
                eacRuntime={eacRuntime}
                toggleEacRuntime={toggleEacRuntime}
                primeRun={nvidiaPrime}
                togglePrimeRun={toggleNvidiaPrime}
                showFps={showFps}
                toggleFps={toggleFps}
                canRunOffline={canRunOffline}
                offlineMode={offlineMode}
                toggleOffline={toggleOffline}
                audioFix={audioFix}
                toggleAudioFix={toggleAudioFix}
                showMangohud={showMangohud}
                toggleMangoHud={toggleMangoHud}
                isDefault={isDefault}
                maxRecentGames={maxRecentGames}
                setMaxRecentGames={setMaxRecentGames}
                addDesktopShortcuts={addDesktopShortcuts}
                addGamesToStartMenu={addStartMenuShortcuts}
                toggleAddDesktopShortcuts={toggleAddDesktopShortcuts}
                toggleAddGamesToStartMenu={toggleAddGamesToStartMenu}
                toggleDiscordRPC={toggleDiscordRPC}
                discordRPC={discordRPC}
                targetExe={targetExe}
                setTargetExe={setTargetExe}
                useSteamRuntime={useSteamRuntime}
                toggleUseSteamRuntime={toggleUseSteamRuntime}
                isMacNative={isMacNative}
                isLinuxNative={isLinuxNative}
                isProton={!isWin && wineVersion?.type === 'proton'}
                appName={appName}
                defaultSteamPath={defaultSteamPath}
                setDefaultSteamPath={setDefaultSteamPath}
              />
            )}
            {isSyncSettings &&
              (runner === 'legendary' ? (
                <LegendarySyncSaves
                  savesPath={savesPath}
                  setSavesPath={setSavesPath}
                  appName={appName}
                  autoSyncSaves={autoSyncSaves}
                  setAutoSyncSaves={setAutoSyncSaves}
                  isProton={!isWin && wineVersion.type === 'proton'}
                  winePrefix={winePrefix}
                  syncCommands={syncCommands}
                />
              ) : (
                <GOGSyncSaves
                  appName={appName}
                  gogSaves={gogSavesLocations}
                  setGogSaves={setGogSavesLocations}
                  autoSyncSaves={autoSyncSaves}
                  setAutoSyncSaves={setAutoSyncSaves}
                  syncCommands={syncCommands}
                />
              ))}
            {isAdvancedSetting && (
              <AdvancedSettings
                altLegendaryBin={altLegendaryBin}
                setAltLegendaryBin={setAltLegendaryBin}
                altGogdlBin={altGogdlBin}
                setAltGogdlBin={setAltGogdlBin}
                downloadNoHttps={downloadNoHttps}
                toggleDownloadNoHttps={toggleDownloadNoHttps}
                settingsToSave={settingsToSave}
              />
            )}
            {isLogSettings && (
              <LogSettings isDefault={isDefault} appName={appName} />
            )}
            <FooterInfo appName={appName} />
          </div>
        </div>
      </SettingsContext.Provider>
    </ContextMenu>
  )
}

export default React.memo(Settings)
