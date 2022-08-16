import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { ipcRenderer } from 'src/helpers'
import { WineInstallation } from 'src/types'
import { configStore } from 'src/helpers/electronStores'

const AutoVKD3D = () => {
  const { t } = useTranslation()
  const [autoInstallVkd3d, setAutoInstallVkd3d] = useSetting<boolean>(
    'autoInstallVkd3d',
    false
  )
  const home = configStore.get('userHome', '')
  const [winePrefix] = useSetting<string>('winePrefix', `${home}/.wine`)
  const [wineVersion] = useSetting<WineInstallation>(
    'wineVersion',
    {} as WineInstallation
  )

  const isProton = wineVersion.type === 'proton'

  if (isProton) {
    return <></>
  }

  const handleAutoInstallVkd3d = () => {
    const action = autoInstallVkd3d ? 'restore' : 'backup'
    ipcRenderer.send('toggleVKD3D', [
      { winePrefix, winePath: wineVersion.bin },
      action
    ])
    return setAutoInstallVkd3d(!autoInstallVkd3d)
  }

  return (
    <div className="toggleRow">
      <ToggleSwitch
        htmlId="autovkd3d"
        value={autoInstallVkd3d}
        handleChange={handleAutoInstallVkd3d}
        title={t('setting.autovkd3d', 'Auto Install/Update VKD3D on Prefix')}
      />

      <FontAwesomeIcon
        className="helpIcon"
        icon={faCircleInfo}
        title={t(
          'help.vkd3d',
          'VKD3D is a Vulkan-based translational layer for DirectX 12 games. Enabling may improve compatibility significantly. Has no effect on older DirectX games.'
        )}
      />
    </div>
  )
}

export default AutoVKD3D
