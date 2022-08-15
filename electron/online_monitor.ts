import { ConnectivityStatus } from './types'
import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron'
import { logInfo, LogPrefix } from './logger/logger'
import axios from 'axios'

let status: ConnectivityStatus
let abortController: AbortController
let retryTimer: NodeJS.Timeout
let retryIn = 0

// handle setting the status, dispatch events for backend and frontend, and trigger pings
const setStatus = (newStatus: ConnectivityStatus) => {
  logInfo(`Connectivity: ${newStatus}`, LogPrefix.Connection)

  status = newStatus

  // events
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow) {
    mainWindow.webContents.send('connectivity-changed', { status, retryIn })
  }
  ipcMain.emit(status)

  // start pinging if needed or cancel pings
  switch (status) {
    case 'check-online':
      pingSites()
      break
    default:
      if (abortController) {
        abortController.abort()
      }
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
  }
}

const retry = (seconds: number) => {
  retryIn = seconds
  logInfo(`Retrying in: ${retryIn} seconds`, LogPrefix.Connection)
  // dispatch event with retry countdown
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow) {
    mainWindow.webContents.send('connectivity-changed', {
      status: 'check-online',
      retryIn: seconds
    })
  }

  if (seconds) {
    // if still counting down, repeat
    retryTimer = setTimeout(() => retry(seconds - 1), 1000)
  } else {
    // else, retry pings
    pingSites()
  }
}

const ping = async (url: string, signal: AbortSignal) => {
  return axios.head(url, {
    timeout: 2000,
    signal,
    headers: { 'Cache-Control': 'no-cache' }
  })
}

const pingSites = () => {
  logInfo(`Pinging external endpoints`, LogPrefix.Connection)
  abortController = new AbortController()

  const ping1 = ping('https://github.com', abortController.signal)
  const ping2 = ping('https://store.epicgames.com', abortController.signal)
  const ping3 = ping('https://gog.com', abortController.signal)

  Promise.any([ping1, ping2, ping3])
    .then(() => {
      setStatus('online')
      abortController.abort() // abort the rest
    })
    .catch((error) => {
      logInfo('All ping requests failed:', LogPrefix.Connection)
      logInfo(error, LogPrefix.Connection)
      retry(5)
    })
}

export const initOnlineMonitor = () => {
  // listen to events from the frontend
  ipcMain.addListener(
    'connectivity-changed',
    (_event: IpcMainEvent, newStatus: ConnectivityStatus) => {
      setStatus(newStatus)
    }
  )

  // set initial status and ping external sites
  setStatus('check-online')

  // listen to the frontend asking for current status
  ipcMain.handle('get-connectivity-status', () => {
    return { status, retryIn }
  })
}

export const makeNetworkRequest = (callback: () => unknown) => {
  if (isOnline()) {
    callback()
  }
}

export const runOnceWhenOnline = (callback: () => unknown) => {
  if (isOnline()) {
    callback()
  } else {
    ipcMain.once('online', () => callback())
  }
}

export const isOnline = () => status === 'online'
