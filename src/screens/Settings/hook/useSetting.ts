import React, { useContext, useEffect, useState } from 'react'
import SettingsContext from '../SettingsContext'

const useSetting = <T>(
  key: string,
  fallback: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const { getSetting, setSetting } = useContext(SettingsContext)

  let initialValue = getSetting(key) as T
  if (initialValue === undefined) {
    initialValue = fallback
  }
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    setSetting(key, value)
  }, [value])

  return [value, setValue]
}

export default useSetting
