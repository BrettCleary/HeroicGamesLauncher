import React from 'react'

import { SettingsContextType } from 'src/types'

const initialContext: SettingsContextType = {
  getSetting: () => '',
  setSetting: () => null
}

export default React.createContext(initialContext)
