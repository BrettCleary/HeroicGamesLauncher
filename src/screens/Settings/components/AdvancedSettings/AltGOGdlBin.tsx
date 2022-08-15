import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInputWithIconField } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import { ipcRenderer } from 'src/helpers'
import { Path } from 'src/types'
import { configStore } from 'src/helpers/electronStores'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { Backspace } from '@mui/icons-material'

const AltGOGDlBin = () => {
  const { t } = useTranslation()
  const [gogdlVersion, setGogdlVersion] = useState('')
  const [altGogdlBin, setAltGogdlBin] = useSetting<string>('altGogdlBin', '')

  useEffect(() => {
    const getGogdlVersion = async () => {
      const settings = configStore.get('settings') as {
        altLeg: string
        altGogdl: string
      }
      configStore.set('settings', {
        ...settings,
        altGogdl: altGogdlBin
      })
      const gogdlVersion = await ipcRenderer.invoke('getGogdlVersion')
      if (gogdlVersion === 'invalid') {
        setGogdlVersion('Invalid')
        setTimeout(() => {
          setAltGogdlBin('')
          return setGogdlVersion('')
        }, 3000)
      }
      return setGogdlVersion(gogdlVersion)
    }

    getGogdlVersion()
  }, [altGogdlBin])

  async function handleGogdlBinary() {
    return ipcRenderer
      .invoke('openDialog', {
        buttonLabel: t('box.choose'),
        properties: ['openFile'],
        title: t(
          'box.choose-gogdl-binary',
          'Select GOGDL Binary (needs restart)'
        )
      })
      .then(({ path }: Path) => setAltGogdlBin(path ? path : ''))
  }

  return (
    <TextInputWithIconField
      label={t(
        'setting.alt-gogdl-bin',
        'Choose an Alternative GOGDL Binary to use (needs restart)'
      )}
      htmlId="setting-alt-gogdl"
      placeholder={t(
        'placeholder.alt-gogdl-bin',
        'Using built-in GOGDL binary...'
      )}
      value={altGogdlBin.replaceAll("'", '')}
      onChange={(event) => setAltGogdlBin(event.target.value)}
      icon={
        !altGogdlBin.length ? (
          <FontAwesomeIcon
            icon={faFolderOpen}
            data-testid="setGogdlBinaryButton"
            style={{
              color: altGogdlBin.length ? 'transparent' : 'currentColor'
            }}
          />
        ) : (
          <Backspace
            data-testid="setGogdlBinaryBackspace"
            style={{ color: '#currentColor' }}
          />
        )
      }
      onIconClick={
        !altGogdlBin.length
          ? async () => handleGogdlBinary()
          : () => setAltGogdlBin('')
      }
      afterInput={
        <span className="smallMessage">
          {t('other.gogdl-version', 'GOGDL Version: ')}
          {gogdlVersion}
        </span>
      }
    />
  )
}

export default AltGOGDlBin
