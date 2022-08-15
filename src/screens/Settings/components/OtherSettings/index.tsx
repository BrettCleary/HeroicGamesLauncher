import './index.css'

import React, { useCallback, useContext } from 'react'

import { useTranslation } from 'react-i18next'
import ContextProvider from 'src/state/ContextProvider'
import {
  InfoBox,
  ToggleSwitch,
  TextInputWithIconField
} from 'src/components/UI'
import CreateNewFolder from '@mui/icons-material/CreateNewFolder'
import { EnviromentVariable, Path, Runner, WrapperVariable } from 'src/types'
import Backspace from '@mui/icons-material/Backspace'
import { getGameInfo } from 'src/helpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { ipcRenderer } from 'src/helpers'
import { ColumnProps, TableInput } from 'src/components/UI/TwoColTableInput'
import PreferedLanguage from './PreferedLanguage'
import LauncherArgs from './LauncherArgs'
import DefaultSteamPath from './DefaultSteamPath'
import MaxRecentGames from './MaxRecentGames'
import DiscordRPC from './DiscordRPC'
import Shortcuts from './Shortcuts'
import OfflineMode from './OfflineMode'

interface Props {
  audioFix: boolean
  isDefault: boolean
  isMacNative: boolean
  isLinuxNative: boolean
  enviromentOptions: EnviromentVariable[]
  wrapperOptions: WrapperVariable[]
  primeRun: boolean
  setEnviromentOptions: (value: EnviromentVariable[]) => void
  setWrapperOptions: (value: WrapperVariable[]) => void
  setTargetExe: (value: string) => void
  showFps: boolean
  showMangohud: boolean
  toggleAudioFix: () => void
  toggleFps: () => void
  toggleMangoHud: () => void
  togglePrimeRun: () => void
  toggleUseGameMode: () => void
  toggleEacRuntime: () => void
  targetExe: string
  useGameMode: boolean
  eacRuntime: boolean
  appName: string
  runner: Runner
}

export default function OtherSettings({
  enviromentOptions,
  setEnviromentOptions,
  wrapperOptions,
  setWrapperOptions,
  useGameMode,
  toggleUseGameMode,
  showFps,
  toggleFps,
  audioFix,
  toggleAudioFix,
  showMangohud,
  toggleMangoHud,
  isDefault,
  primeRun,
  togglePrimeRun,
  setTargetExe,
  targetExe,
  isMacNative,
  isLinuxNative,
  appName,
  toggleEacRuntime,
  eacRuntime,
  runner
}: Props) {
  const handleEnviromentVariables = (values: ColumnProps[]) => {
    const envs: EnviromentVariable[] = []
    values.forEach((value) =>
      envs.push({ key: value.key.trim(), value: value.value.trim() })
    )
    setEnviromentOptions([...envs])
  }
  const getEnvironmentVariables = () => {
    const columns: ColumnProps[] = []
    enviromentOptions.forEach((env) =>
      columns.push({ key: env.key, value: env.value })
    )
    return columns
  }
  const handleWrapperVariables = (values: ColumnProps[]) => {
    const wrappers = [] as WrapperVariable[]
    values.forEach((value) =>
      wrappers.push({
        exe: value.key,
        args: value.value.trim()
      })
    )
    setWrapperOptions([...wrappers])
  }
  const getWrapperVariables = () => {
    const columns: ColumnProps[] = []
    wrapperOptions.forEach((wrapper) =>
      columns.push({ key: wrapper.exe, value: wrapper.args })
    )
    return columns
  }

  const { t } = useTranslation()
  const { platform } = useContext(ContextProvider)
  const isWin = platform === 'win32'
  const isLinux = platform === 'linux'
  const shouldRenderFpsOption = !isMacNative && !isWin && !isLinuxNative

  const wrapperInfo = (
    <InfoBox text="infobox.help">
      {t(
        'options.wrapper.arguments_example',
        'Arguments example: --arg; --extra-file="file-path/ with/spaces"'
      )}
    </InfoBox>
  )

  const handleTargetExe = useCallback(async () => {
    if (!targetExe.length) {
      const gameinfo = await getGameInfo(appName, runner)

      ipcRenderer
        .invoke('openDialog', {
          buttonLabel: t('box.select.button', 'Select'),
          properties: ['openFile'],
          title: t('box.select.exe', 'Select EXE'),
          defaultPath: gameinfo.install.install_path
        })
        .then(({ path }: Path) => setTargetExe(path || targetExe))
    }
    setTargetExe('')
  }, [targetExe])

  async function handleGameMode() {
    if (useGameMode && eacRuntime) {
      const isFlatpak = await ipcRenderer.invoke('isFlatpak')
      if (isFlatpak) {
        const { response } = await ipcRenderer.invoke('openMessageBox', {
          message: t(
            'settings.gameMode.eacRuntimeEnabled.message',
            "The EAC runtime is enabled, which won't function correctly without GameMode. Do you want to disable the EAC Runtime and GameMode?"
          ),
          title: t(
            'settings.gameMode.eacRuntimeEnabled.title',
            'EAC runtime enabled'
          ),
          buttons: [t('box.yes'), t('box.no')]
        })
        if (response === 1) {
          return
        }
        toggleEacRuntime()
      }
    }
    toggleUseGameMode()
  }

  return (
    <>
      <h3 className="settingSubheader">{t('settings.navbar.other')}</h3>
      {!isDefault && (
        <TextInputWithIconField
          label={t(
            'setting.change-target-exe',
            'Select an alternative EXE to run'
          )}
          htmlId="setinstallpath"
          value={targetExe.replaceAll("'", '')}
          placeholder={targetExe || t('box.select.exe', 'Select EXE...')}
          onChange={(event) => setTargetExe(event.target.value)}
          icon={
            !targetExe.length ? (
              <CreateNewFolder data-testid="setinstallpathbutton" />
            ) : (
              <Backspace data-testid="setEpicSyncPathBackspace" />
            )
          }
          onIconClick={handleTargetExe}
        />
      )}

      {shouldRenderFpsOption && (
        <ToggleSwitch
          htmlId="showFPS"
          value={showFps}
          handleChange={toggleFps}
          title={t('setting.showfps')}
        />
      )}
      {isLinux && (
        <>
          <div className="toggleRow">
            <ToggleSwitch
              htmlId="gamemode"
              value={useGameMode}
              handleChange={handleGameMode}
              title={t('setting.gamemode')}
            />

            <FontAwesomeIcon
              className="helpIcon"
              icon={faCircleInfo}
              title={t(
                'help.gamemode',
                'Feral GameMode applies automatic and temporary tweaks to the system when running games. Enabling may improve performance.'
              )}
            />
          </div>

          <ToggleSwitch
            htmlId="primerun"
            value={primeRun}
            handleChange={togglePrimeRun}
            title={t('setting.primerun', 'Use Dedicated Graphics Card')}
          />

          <ToggleSwitch
            htmlId="audiofix"
            value={audioFix}
            handleChange={toggleAudioFix}
            title={t('setting.audiofix')}
          />

          <div className="toggleRow">
            <ToggleSwitch
              htmlId="mongohud"
              value={showMangohud}
              handleChange={toggleMangoHud}
              title={t('setting.mangohud')}
            />

            <FontAwesomeIcon
              className="helpIcon"
              icon={faCircleInfo}
              title={t(
                'help.mangohud',
                'MangoHUD is an overlay that displays and monitors FPS, temperatures, CPU/GPU load and other system resources.'
              )}
            />
          </div>
        </>
      )}

      <OfflineMode />

      <Shortcuts />

      <DiscordRPC />

      <MaxRecentGames />

      <DefaultSteamPath />

      {!isWin && (
        <TableInput
          label={t('options.advanced.title')}
          htmlId={'enviromentOptions'}
          header={{
            key: t('options.advanced.key', 'Variable Name'),
            value: t('options.advanced.value', 'Value')
          }}
          rows={getEnvironmentVariables()}
          onChange={handleEnviromentVariables}
          inputPlaceHolder={{
            key: t('options.advanced.placeHolderKey', 'NAME'),
            value: t(
              'options.advanced.placeHolderValue',
              'E.g.: Path/To/ExtraFiles'
            )
          }}
        />
      )}
      {!isWin && (
        <TableInput
          label={t('options.wrapper.title', 'Wrapper command:')}
          htmlId={'wrapperOptions'}
          header={{
            key: t('options.wrapper.exe', 'Wrapper'),
            value: t('options.wrapper.args', 'Arguments')
          }}
          rows={getWrapperVariables()}
          fullFills={{ key: true, value: false }}
          onChange={handleWrapperVariables}
          inputPlaceHolder={{
            key: t('options.wrapper.placeHolderKey', 'New Wrapper'),
            value: t('options.wrapper.placeHolderValue', 'Wrapper Arguments')
          }}
          warning={
            <span className="warning">
              {`${t(
                'options.quote-args-with-spaces',
                'Warning: Make sure to quote args with spaces! E.g.: "path/with spaces/"'
              )}`}
            </span>
          }
          afterInput={wrapperInfo}
        />
      )}

      <LauncherArgs />

      <PreferedLanguage />
    </>
  )
}
