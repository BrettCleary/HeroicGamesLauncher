import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import { ipcRenderer } from 'src/helpers'
import useSetting from '../../hook/useSetting'

const CheckUpdatesOnStartup = () => {
  const { t } = useTranslation()
  const [checkForUpdatesOnStartup, setCheckForUpdatesOnStartup] =
    useSetting<boolean>('checkForUpdatesOnStartup', true)

  const [show, setShow] = useState(checkForUpdatesOnStartup)

  useEffect(() => {
    ipcRenderer.invoke('showUpdateSetting').then((s) => setShow(s))
  }, [])

  if (!show) {
    return <></>
  }

  return (
    <ToggleSwitch
      htmlId="checkForUpdatesOnStartup"
      value={checkForUpdatesOnStartup}
      handleChange={() =>
        setCheckForUpdatesOnStartup(!checkForUpdatesOnStartup)
      }
      title={t(
        'setting.checkForUpdatesOnStartup',
        'Check for Heroic Updates on Startup'
      )}
    />
  )
}

export default CheckUpdatesOnStartup
