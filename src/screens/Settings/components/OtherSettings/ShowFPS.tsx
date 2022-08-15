import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { ToggleSwitch } from 'src/components/UI'
import ContextProvider from 'src/state/ContextProvider'
import { LocationState } from '../..'
import useSetting from '../../hook/useSetting'

const ShowFPS = () => {
  const { t } = useTranslation()
  const [showFps, setShowFps] = useSetting<boolean>('showFps', false)
  const { platform } = useContext(ContextProvider)
  const isWin = platform === 'win32'
  const {
    state: { isLinuxNative, isMacNative }
  } = useLocation() as { state: LocationState }
  const shouldRenderFpsOption = !isMacNative && !isWin && !isLinuxNative

  if (!shouldRenderFpsOption) {
    return <></>
  }

  return (
    <ToggleSwitch
      htmlId="showFPS"
      value={showFps}
      handleChange={() => setShowFps(!showFps)}
      title={t('setting.showfps')}
    />
  )
}

export default ShowFPS
