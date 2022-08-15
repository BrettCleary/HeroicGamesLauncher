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

const AltLegendaryBin = () => {
  const { t } = useTranslation()
  const [legendaryVersion, setLegendaryVersion] = useState('')
  const [altLegendaryBin, setAltLegendaryBin] = useSetting<string>(
    'altLegendaryBin',
    ''
  )

  useEffect(() => {
    const getMoreInfo = async () => {
      const settings = configStore.get('settings') as {
        altLeg: string
        altGogdl: string
      }
      configStore.set('settings', {
        ...settings,
        altLeg: altLegendaryBin
      })

      const legendaryVer = await ipcRenderer.invoke('getLegendaryVersion')
      if (legendaryVer === 'invalid') {
        setLegendaryVersion('Invalid')
        setTimeout(() => {
          setAltLegendaryBin('')
          return setLegendaryVersion('')
        }, 3000)
      }
      return setLegendaryVersion(legendaryVer)
    }
    getMoreInfo()
  }, [altLegendaryBin])

  async function handleLegendaryBinary() {
    return ipcRenderer
      .invoke('openDialog', {
        buttonLabel: t('box.choose'),
        properties: ['openFile'],
        title: t(
          'box.choose-legendary-binary',
          'Select Legendary Binary (needs restart)'
        )
      })
      .then(({ path }: Path) => setAltLegendaryBin(path ? path : ''))
  }

  return (
    <TextInputWithIconField
      htmlId="setting-alt-legendary"
      label={t(
        'setting.alt-legendary-bin',
        'Choose an Alternative Legendary Binary  (needs restart)to use'
      )}
      placeholder={t(
        'placeholder.alt-legendary-bin',
        'Using built-in Legendary binary...'
      )}
      value={altLegendaryBin.replaceAll("'", '')}
      onChange={(event) => setAltLegendaryBin(event.target.value)}
      icon={
        !altLegendaryBin.length ? (
          <FontAwesomeIcon
            icon={faFolderOpen}
            data-testid="setLegendaryBinaryButton"
            style={{
              color: altLegendaryBin.length ? 'transparent' : 'currentColor'
            }}
          />
        ) : (
          <Backspace
            data-testid="setLegendaryBinaryBackspace"
            style={{ color: 'currentColor' }}
          />
        )
      }
      onIconClick={
        !altLegendaryBin.length
          ? async () => handleLegendaryBinary()
          : () => setAltLegendaryBin('')
      }
      afterInput={
        <span className="smallMessage">
          {t('other.legendary-version', 'Legendary Version: ')}
          {legendaryVersion}
        </span>
      }
    />
  )
}

export default AltLegendaryBin
