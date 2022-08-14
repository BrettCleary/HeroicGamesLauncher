import React, { useEffect, useState } from 'react'
import { getStatus } from 'src/helpers/onlineMonitor'
import { ConnectivityStatus } from 'src/types'
import './index.css'

const OfflineMessage = () => {
  const [status, setStatus] = useState<ConnectivityStatus>(getStatus())
  const [retryIn, setRetry] = useState<number>(0)

  // listen to custom connectivity-changed event to update state
  useEffect(() => {
    const onStatusChange = (
      ev: CustomEvent<{ status: ConnectivityStatus; retryIn?: number }>
    ) => {
      setStatus(ev.detail.status)
      setRetry(ev.detail.retryIn || 0)
    }

    window.addEventListener('connectivity-changed', onStatusChange)

    return () => {
      window.removeEventListener('connectivity-changed', onStatusChange)
    }
  }, [])

  // render nothing if online
  if (status === 'online') {
    return null
  }

  let content = 'Offline'

  if (status === 'check-online') {
    if (retryIn) {
      content += `Retrying in ... ${retryIn} seconds`
    } else {
      content = 'Retrying'
    }
  }

  return <div className="offline-message">{content}</div>
}

export default OfflineMessage
