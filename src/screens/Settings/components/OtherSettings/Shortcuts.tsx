import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import ContextProvider from 'src/state/ContextProvider'
import useSetting from '../../hook/useSetting'
import SettingsContext from '../../SettingsContext'

const Shortcuts = () => {
  const { t } = useTranslation()
  const { isDefault } = useContext(SettingsContext)
  const { platform } = useContext(ContextProvider)
  const isWin = platform === 'win32'
  const isLinux = platform === 'linux'
  const supportsShortcuts = isWin || isLinux

  const [addDesktopShortcuts, setAddDesktopShortcuts] = useSetting<boolean>(
    'addDesktopShortcuts',
    false
  )
  const [addGamesToStartMenu, setAddGamesToStartMenu] = useSetting<boolean>(
    'addGamesToStartMenu',
    false
  )

  if (!isDefault || !supportsShortcuts) {
    return <></>
  }

  return (
    <>
      <ToggleSwitch
        htmlId="shortcutsToDesktop"
        value={addDesktopShortcuts}
        handleChange={() => setAddDesktopShortcuts(!addDesktopShortcuts)}
        title={t(
          'setting.adddesktopshortcuts',
          'Add desktop shortcuts automatically'
        )}
      />
      <ToggleSwitch
        htmlId="shortcutsToMenu"
        value={addGamesToStartMenu}
        handleChange={() => setAddGamesToStartMenu(!addGamesToStartMenu)}
        title={t(
          'setting.addgamestostartmenu',
          'Add games to start menu automatically'
        )}
      />
    </>
  )
}

export default Shortcuts
