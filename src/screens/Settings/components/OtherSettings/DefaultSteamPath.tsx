import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInputWithIconField } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import SettingsContext from '../../SettingsContext'
import { ipcRenderer } from 'src/helpers'
import { Path } from 'src/types'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const DefaultSteamPath = () => {
  const { t } = useTranslation()
  const { isDefault } = useContext(SettingsContext)
  const [defaultSteamPath, setDefaultSteamPath] = useSetting<string>(
    'languageCode',
    ''
  )

  if (!isDefault) {
    return <></>
  }

  return (
    <TextInputWithIconField
      label={t('setting.default-steam-path', 'Default Steam path')}
      htmlId="default_steam_path"
      value={defaultSteamPath?.replaceAll("'", '')}
      placeholder={defaultSteamPath}
      onChange={(event) => setDefaultSteamPath(event.target.value)}
      icon={
        <FontAwesomeIcon icon={faFolderOpen} data-testid="setsteampathbutton" />
      }
      onIconClick={async () =>
        ipcRenderer
          .invoke('openDialog', {
            buttonLabel: t('box.choose'),
            properties: ['openDirectory'],
            title: t('box.default-steam-path', 'Steam path.'),
            defaultPath: defaultSteamPath
          })
          .then(({ path }: Path) =>
            setDefaultSteamPath(path ? `${path}` : defaultSteamPath)
          )
      }
    />
  )
}

export default DefaultSteamPath
