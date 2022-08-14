import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'src/components/UI'
import useSetting from '../../hook/useSetting'
import { toggleControllerIsDisabled } from 'src/helpers/gamepad'

const DisableController = () => {
  const { t } = useTranslation()
  const [disableController, setDisableController] = useSetting<boolean>(
    'disableController',
    false
  )

  useEffect(() => {
    toggleControllerIsDisabled(disableController)
  }, [disableController])

  return (
    <ToggleSwitch
      htmlId="disableController"
      value={disableController}
      handleChange={() => setDisableController(!disableController)}
      title={t(
        'setting.disable_controller',
        'Disable Heroic navigation using controller'
      )}
    />
  )
}

export default DisableController
