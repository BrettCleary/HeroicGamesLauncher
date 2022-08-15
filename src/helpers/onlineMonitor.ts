import { ConnectivityStatus } from './../types'
import { ipcRenderer } from '.'

let status: ConnectivityStatus = 'online'
let abortController: AbortController
let retryTimer: NodeJS.Timeout

export const getStatus = () => status

const setStatus = (newStatus: ConnectivityStatus) => {
  // store new state and dispatch events to both backend and react app
  status = newStatus
  window.dispatchEvent(
    new CustomEvent('connectivity-changed', { detail: { status } })
  )
  ipcRenderer.send('connectivity-changed', status)
}

const ping = async (url: string, signal: AbortSignal) => {
  return fetch(url, { method: 'HEAD', signal: signal })
}

const retryIn = (seconds: number) => {
  // dispatch event with retry countdown
  window.dispatchEvent(
    new CustomEvent('connectivity-changed', {
      detail: { status: 'check-online', retryIn: seconds }
    })
  )

  if (seconds) {
    // if still counting down, repeat
    retryTimer = setTimeout(() => retryIn(seconds - 1), 1000)
  } else {
    // else, retry pings
    pingSites()
  }
}

const pingSites = () => {
  abortController = new AbortController()

  const ping1 = ping('github.com', abortController.signal)
  const ping2 = ping('store.epicgames.com', abortController.signal)
  const ping3 = ping('gog.com', abortController.signal)

  setTimeout(() => {
    abortController.abort()
  }, 2000)

  Promise.any([ping1, ping2, ping3])
    .then(() => {
      console.log('ping resolved!')
      abortController.abort() // abort the rest
      setStatus('online')
    })
    .catch((error) => {
      console.log(`all failed ${error}, retry in 5 seconds`)
      retryIn(5)
    })
}

export const initOnlineMonitor = () => {
  window.addEventListener('online', () => {
    setStatus('check-online')
    pingSites() // start pinging if we are connected to a network
  })

  window.addEventListener('offline', () => {
    if (abortController) {
      abortController.abort() // abort pings if we go offline
    }
    if (retryTimer) {
      clearTimeout(retryTimer) // clear retry timer if we go offline
    }
    setStatus('offline')
  })

  setStatus(navigator.onLine ? 'online' : 'offline')
}
