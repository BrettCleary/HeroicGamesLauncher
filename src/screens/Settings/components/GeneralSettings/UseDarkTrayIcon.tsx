import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import { ipcRenderer } from 'src/helpers'
import useSetting from '../../hook/useSetting'

const UseDarkTryIcon = () => {
  const { t } = useTranslation()
  const [darkTrayIcon, setDarkTrayIcon] = useSetting<boolean>(
    'darkTrayIcon',
    false
  )

  const toggleDarkTrayIcon = () => {
    setDarkTrayIcon(!darkTrayIcon)
    ipcRenderer.send('changeTrayColor')
  }

  return (
    <ToggleSwitch
      htmlId="changeTrayColor"
      value={darkTrayIcon}
      handleChange={toggleDarkTrayIcon}
      title={t('setting.darktray', 'Use Dark Tray Icon (needs restart)')}
    />
  )
}

export default UseDarkTryIcon
