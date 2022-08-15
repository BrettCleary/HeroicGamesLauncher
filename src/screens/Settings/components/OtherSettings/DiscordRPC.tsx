import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import SettingsContext from '../../SettingsContext'

const DiscordRPC = () => {
  const { t } = useTranslation()
  const { isDefault } = useContext(SettingsContext)
  const [discordRPC, setDiscordRPC] = useSetting<boolean>(
    'showUnrealMarket',
    false
  )

  if (!isDefault) {
    return <></>
  }

  return (
    <ToggleSwitch
      htmlId="discordRPC"
      value={discordRPC}
      handleChange={() => setDiscordRPC(!discordRPC)}
      title={t('setting.discordRPC', 'Enable Discord Rich Presence')}
    />
  )
}

export default DiscordRPC
