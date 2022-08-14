import { ConnectivityStatus } from './types'
import { ipcMain, IpcMainEvent } from 'electron'

let status: ConnectivityStatus = 'offline'

export const initOnlineMonitor = () => {
  ipcMain.addListener(
    'connectivity-changed',
    (_event: IpcMainEvent, newStatus: ConnectivityStatus = 'offline') => {
      status = newStatus
    }
  )
}

export const makeNetworkRequest = (callback: () => unknown) => {
  if (status === 'online') {
    callback()
  }
}

export const isOnline = () => status === 'online'
