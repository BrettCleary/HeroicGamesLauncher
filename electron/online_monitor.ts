import { ConnectivityStatus } from './types'
import { ipcMain, IpcMainEvent } from 'electron'
import { logInfo, LogPrefix } from './logger/logger'

let status: ConnectivityStatus = 'offline'

export const initOnlineMonitor = () => {
  ipcMain.addListener(
    'connectivity-changed',
    (_event: IpcMainEvent, newStatus: ConnectivityStatus = 'offline') => {
      status = newStatus
      logInfo(`Connectivity: ${status}`, LogPrefix.Backend)
      ipcMain.emit(status)
    }
  )
}

export const makeNetworkRequest = (callback: () => unknown) => {
  if (status === 'online') {
    callback()
  }
}

export const isOnline = () => status === 'online'
