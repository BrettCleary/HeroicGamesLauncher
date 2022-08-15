import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { ToggleSwitch } from 'src/components/UI'
import ContextProvider from 'src/state/ContextProvider'
import { LocationState } from '../..'
import useSetting from '../../hook/useSetting'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { WineInstallation } from 'src/types'

const SteamRuntime = () => {
  const { t } = useTranslation()
  const {
    state: { isLinuxNative }
  } = useLocation() as { state: LocationState }
  const { platform } = useContext(ContextProvider)
  const isLinux = platform === 'linux'
  const isWin = platform === 'win32'
  const [useSteamRuntime, setUseSteamRuntime] = useSetting<boolean>(
    'useSteamRuntime',
    false
  )
  const [wineVersion] = useSetting<WineInstallation>(
    'wineVersion',
    {} as WineInstallation
  )

  const isProton = !isWin && wineVersion?.type === 'proton'

  const showSteamRuntime = isLinuxNative || isProton

  if (!isLinux || !showSteamRuntime) {
    return <></>
  }

  return (
    <div className="toggleRow">
      <ToggleSwitch
        htmlId="steamruntime"
        value={useSteamRuntime}
        handleChange={() => setUseSteamRuntime(!useSteamRuntime)}
        title={t('setting.steamruntime', 'Use Steam Runtime')}
      />

      <FontAwesomeIcon
        className="helpIcon"
        icon={faCircleInfo}
        title={t(
          'help.steamruntime',
          'Custom libraries provided by Steam to help run Linux and Windows (Proton) games. Enabling might improve compatibility.'
        )}
      />
    </div>
  )
}

export default SteamRuntime
