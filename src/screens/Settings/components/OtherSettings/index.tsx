import './index.css'

import React, { useContext } from 'react'

import { useTranslation } from 'react-i18next'
import ContextProvider from 'src/state/ContextProvider'
import { InfoBox } from 'src/components/UI'
import { EnviromentVariable, WrapperVariable } from 'src/types'
import { ColumnProps, TableInput } from 'src/components/UI/TwoColTableInput'
import PreferedLanguage from './PreferedLanguage'
import LauncherArgs from './LauncherArgs'
import DefaultSteamPath from './DefaultSteamPath'
import MaxRecentGames from './MaxRecentGames'
import DiscordRPC from './DiscordRPC'
import Shortcuts from './Shortcuts'
import OfflineMode from './OfflineMode'
import SteamRuntime from './SteamRuntime'
import Mongohud from './Mongohud'
import AudioFix from './AudioFix'
import PrimerRun from './PrimerRun'
import GameMode from './GameMode'
import ShowFPS from './ShowFPS'
import AlternativeExe from './AlternativeExe'

interface Props {
  enviromentOptions: EnviromentVariable[]
  wrapperOptions: WrapperVariable[]
  setEnviromentOptions: (value: EnviromentVariable[]) => void
  setWrapperOptions: (value: WrapperVariable[]) => void
}

export default function OtherSettings({
  enviromentOptions,
  setEnviromentOptions,
  wrapperOptions,
  setWrapperOptions
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

  const wrapperInfo = (
    <InfoBox text="infobox.help">
      {t(
        'options.wrapper.arguments_example',
        'Arguments example: --arg; --extra-file="file-path/ with/spaces"'
      )}
    </InfoBox>
  )

  return (
    <>
      <h3 className="settingSubheader">{t('settings.navbar.other')}</h3>

      <AlternativeExe />

      <ShowFPS />

      <GameMode />

      <PrimerRun />

      <AudioFix />

      <Mongohud />

      <SteamRuntime />

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
