import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import ContextProvider from 'src/state/ContextProvider'

const PrimerRun = () => {
  const { t } = useTranslation()
  const { platform } = useContext(ContextProvider)
  const isLinux = platform === 'linux'
  const [primeRun, setPrimeRun] = useSetting<boolean>('primeRun', false)

  if (!isLinux) {
    return <></>
  }

  return (
    <ToggleSwitch
      htmlId="primerun"
      value={primeRun}
      handleChange={() => setPrimeRun(!primeRun)}
      title={t('setting.primerun', 'Use Dedicated Graphics Card')}
    />
  )
}

export default PrimerRun
