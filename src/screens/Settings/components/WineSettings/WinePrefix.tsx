import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import useSetting from '../../hook/useSetting'
import ContextProvider from 'src/state/ContextProvider'
import SettingsContext from '../../SettingsContext'
import { TextInputWithIconField } from 'src/components/UI'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { ipcRenderer } from 'src/helpers'
import { Path } from 'src/types'
import { configStore } from 'src/helpers/electronStores'

const WinePrefix = () => {
  const { t } = useTranslation()
  const { platform } = useContext(ContextProvider)
  const { isDefault } = useContext(SettingsContext)

  const isLinux = platform === 'linux'
  const [defaultWinePrefix, setDefaultWinePrefix] = useSetting<string>(
    'defaultWinePrefix',
    ''
  )

  const home = configStore.get('userHome', '')
  const [winePrefix, setWinePrefix] = useSetting<string>(
    'winePrefix',
    `${home}/.wine`
  )

  if (!isLinux || !isDefault) {
    return <></>
  }

  return (
    <>
      {isLinux && isDefault && (
        <TextInputWithIconField
          htmlId="selectDefaultWinePrefix"
          label={t(
            'setting.defaultWinePrefix',
            'Set Folder for new Wine Prefixes'
          )}
          value={defaultWinePrefix}
          onChange={(event) => setDefaultWinePrefix(event.target.value)}
          icon={
            <FontAwesomeIcon
              icon={faFolderOpen}
              data-testid="addWinePrefix"
              title={t(
                'toolbox.settings.wineprefix',
                'Select a Folder for new Wine Prefixes'
              )}
            />
          }
          onIconClick={async () =>
            ipcRenderer
              .invoke('openDialog', {
                buttonLabel: t('box.choose'),
                properties: ['openDirectory'],
                title: t('box.wineprefix'),
                defaultPath: defaultWinePrefix
              })
              .then(({ path }: Path) =>
                setDefaultWinePrefix(path ? `${path}` : defaultWinePrefix)
              )
          }
        />
      )}

      {isLinux && (
        <TextInputWithIconField
          htmlId="selectWinePrefix"
          label={t('setting.wineprefix')}
          value={winePrefix}
          onChange={(event) => setWinePrefix(event.target.value)}
          icon={
            <FontAwesomeIcon
              icon={faFolderOpen}
              data-testid="addWinePrefix"
              title={t(
                'toolbox.settings.default-wineprefix',
                'Select the default prefix folder for new configs'
              )}
            />
          }
          onIconClick={async () =>
            ipcRenderer
              .invoke('openDialog', {
                buttonLabel: t('box.choose'),
                properties: ['openDirectory'],
                title: t('box.wineprefix'),
                defaultPath: defaultWinePrefix
              })
              .then(({ path }: Path) =>
                setWinePrefix(path ? `${path}` : winePrefix)
              )
          }
        />
      )}
    </>
  )
}

export default WinePrefix
