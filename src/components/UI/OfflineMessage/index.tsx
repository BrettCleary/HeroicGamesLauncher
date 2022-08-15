import React, { useContext } from 'react'
import ContextProvider from 'src/state/ContextProvider'
import './index.css'

const OfflineMessage = () => {
  const { connectivity } = useContext(ContextProvider)

  // render nothing if online
  if (connectivity.status === 'online') {
    return <></>
  }

  let content = 'Offline'

  if (connectivity.status === 'check-online') {
    if (connectivity.retryIn) {
      content += `Retrying in ... ${connectivity.retryIn} seconds`
    } else {
      content = 'Retrying'
    }
  }

  return <div className="offline-message">{content}</div>
}

export default OfflineMessage
