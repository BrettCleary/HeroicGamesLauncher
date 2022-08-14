import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import useSetting from '../../hook/useSetting'

const ShowUnrealMarket = () => {
  const { t } = useTranslation()
  const [showUnrealMarket, setShowUnrealMarket] = useSetting<boolean>(
    'showUnrealMarket',
    false
  )

  return (
    <ToggleSwitch
      htmlId="showUnrealMarket"
      value={showUnrealMarket}
      handleChange={() => setShowUnrealMarket(!showUnrealMarket)}
      title={t(
        'setting.showUnrealMarket',
        'Show Unreal Marketplace (needs restart)'
      )}
    />
  )
}

export default ShowUnrealMarket
