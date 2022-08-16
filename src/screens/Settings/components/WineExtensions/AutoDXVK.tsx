import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { ipcRenderer } from 'src/helpers'
import { WineInstallation } from 'src/types'
import { configStore } from 'src/helpers/electronStores'

const AutoDXVK = () => {
  const { t } = useTranslation()
  const [autoInstallDxvk, setAutoInstallDxak] = useSetting<boolean>(
    'autoInstallDxvk',
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

  const handleAutoInstallDxvk = () => {
    const action = autoInstallDxvk ? 'restore' : 'backup'
    ipcRenderer.send('toggleDXVK', [
      { winePrefix, winePath: wineVersion.bin },
      action
    ])
    return setAutoInstallDxak(!autoInstallDxvk)
  }

  return (
    <div className="toggleRow">
      <ToggleSwitch
        htmlId="autodxvk"
        value={autoInstallDxvk}
        handleChange={handleAutoInstallDxvk}
        title={t('setting.autodxvk', 'Auto Install/Update DXVK on Prefix')}
      />

      <FontAwesomeIcon
        className="helpIcon"
        icon={faCircleInfo}
        title={t(
          'help.dxvk',
          'DXVK is a Vulkan-based translational layer for DirectX 9, 10 and 11 games. Enabling may improve compatibility. Might cause issues especially for older DirectX games.'
        )}
      />
    </div>
  )
}

export default AutoDXVK
