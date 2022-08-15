import React from 'react'

import { SettingsContextType } from 'src/types'

const initialContext: SettingsContextType = {
  getSetting: () => '',
  setSetting: () => null,
  config: null,
  isDefault: true,
  appName: 'default',
  runner: 'legendary'
}

export default React.createContext(initialContext)
