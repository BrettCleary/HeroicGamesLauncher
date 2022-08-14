import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextInputWithIconField } from 'src/components/UI'
import { ipcRenderer } from 'src/helpers'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Path } from 'src/types'
import useSetting from '../../hook/useSetting'

const SETTING_KEY = 'defaultInstallPath'

const DefaultInstallPath = () => {
  const { t } = useTranslation()
  const [defaultInstallPath, setDefaultInstallPath] = useSetting<string>(
    SETTING_KEY,
    ''
  )

  const onFolderIconClick = async () => {
    ipcRenderer
      .invoke('openDialog', {
        buttonLabel: t('box.choose'),
        properties: ['openDirectory'],
        title: t('box.default-install-path'),
        defaultPath: defaultInstallPath
      })
      .then(({ path }: Path) =>
        setDefaultInstallPath(path ? `${path}` : defaultInstallPath)
      )
  }

  return (
    <TextInputWithIconField
      label={t('setting.default-install-path')}
      htmlId="default_install_path"
      value={defaultInstallPath?.replaceAll("'", '')}
      placeholder={defaultInstallPath}
      onChange={(event) => setDefaultInstallPath(event.target.value)}
      icon={
        <FontAwesomeIcon
          icon={faFolderOpen}
          data-testid="setinstallpathbutton"
        />
      }
      onIconClick={onFolderIconClick}
    />
  )
}

export default DefaultInstallPath
