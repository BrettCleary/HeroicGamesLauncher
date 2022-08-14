import React, { useContext, useState } from 'react'

import { useTranslation } from 'react-i18next'
import {
  InfoBox,
  TextInputWithIconField,
  ToggleSwitch
} from 'src/components/UI'
import ContextProvider from 'src/state/ContextProvider'
import { ipcRenderer } from 'src/helpers'
import { Path } from 'src/types'
import useSetting from '../../hook/useSetting'

import Backspace from '@mui/icons-material/Backspace'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'

const EgsSettings = () => {
  const { t } = useTranslation()
  const [isSyncing, setIsSyncing] = useState(false)
  const { platform, refreshLibrary } = useContext(ContextProvider)
  const [egsLinkedPath, setEgsLinkedPath] = useSetting<string>(
    'egsLinkedPath',
    ''
  )
  const [egsPath, setEgsPath] = useSetting<string>('egsPath', egsLinkedPath)
  const isLinked = Boolean(egsLinkedPath.length)
  const isWindows = platform === 'win32'

  async function handleSync() {
    setIsSyncing(true)
    if (isLinked) {
      return ipcRenderer.invoke('egsSync', 'unlink').then(async () => {
        await ipcRenderer.invoke('openMessageBox', {
          message: t('message.unsync'),
          title: 'EGS Sync'
        })
        setEgsLinkedPath('')
        setEgsPath('')
        setIsSyncing(false)
        refreshLibrary({ fullRefresh: true, runInBackground: false })
      })
    }

    return ipcRenderer.invoke('egsSync', egsPath).then(async (res: string) => {
      if (res === 'Error') {
        setIsSyncing(false)
        ipcRenderer.invoke('showErrorBox', [
          t('box.error.title', 'Error'),
          t('box.sync.error')
        ])
        setEgsLinkedPath('')
        setEgsPath('')
        return
      }
      await ipcRenderer.invoke('openMessageBox', {
        message: t('message.sync'),
        title: 'EGS Sync'
      })

      setIsSyncing(false)
      setEgsLinkedPath(isWindows ? 'windows' : egsPath)
      refreshLibrary({ fullRefresh: true, runInBackground: false })
    })
  }

  function handleEgsFolder() {
    if (isLinked) {
      return ''
    }
    return ipcRenderer
      .invoke('openDialog', {
        buttonLabel: t('box.choose'),
        properties: ['openDirectory'],
        title: t('box.choose-egs-prefix')
      })
      .then(({ path }: Path) => setEgsPath(path ? path : ''))
  }

  return (
    <>
      {!isWindows && (
        <TextInputWithIconField
          label={t('setting.egs-sync')}
          extraClass="withRightButton"
          htmlId="set_epic_sync_path"
          placeholder={t('placeholder.egs-prefix')}
          value={egsPath || egsLinkedPath}
          disabled={isLinked}
          onChange={(event) => setEgsPath(event.target.value)}
          icon={
            !egsPath.length ? (
              <FontAwesomeIcon
                icon={faFolderOpen}
                data-testid="setEpicSyncPathButton"
                style={{
                  color: isLinked ? 'transparent' : 'currentColor'
                }}
              />
            ) : (
              <Backspace
                data-testid="setEpicSyncPathBackspace"
                style={
                  isLinked
                    ? { color: 'transparent', pointerEvents: 'none' }
                    : { color: '#B0ABB6' }
                }
              />
            )
          }
          onIconClick={
            !egsPath.length
              ? () => handleEgsFolder()
              : () => (isLinked ? '' : setEgsPath(''))
          }
          afterInput={
            <>
              <span className="rightButton">
                <button
                  data-testid="syncButton"
                  onClick={async () => handleSync()}
                  disabled={isSyncing || !egsPath.length}
                  className={`button is-small ${
                    isLinked
                      ? 'is-danger'
                      : isSyncing
                      ? 'is-primary'
                      : 'settings'
                  }`}
                >
                  {`${
                    isLinked
                      ? t('button.unsync')
                      : isSyncing
                      ? t('button.syncing')
                      : t('button.sync')
                  }`}
                </button>
              </span>
              <div>
                {!isWindows && (
                  <InfoBox text="infobox.help">{t('help.general')}</InfoBox>
                )}
              </div>
            </>
          }
        />
      )}
      {isWindows && (
        <ToggleSwitch
          htmlId="syncToggle"
          value={isLinked}
          handleChange={handleSync}
          title={t('setting.egs-sync')}
        />
      )}
    </>
  )
}

export default EgsSettings
