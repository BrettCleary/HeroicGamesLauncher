import './index.css'

import React, { useContext, useEffect, useState } from 'react'

import { Path, WineInstallation } from 'src/types'
import { useTranslation } from 'react-i18next'
import {
  InfoBox,
  SvgButton,
  SelectField,
  TextInputField
} from 'src/components/UI'

import AddBoxIcon from '@mui/icons-material/AddBox'
import ContextProvider from 'src/state/ContextProvider'

import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import { Tooltip } from '@mui/material'

import { ipcRenderer } from 'src/helpers'
import WinePrefix from './WinePrefix'
import PreferSystemLibs from './PreferSystemLibs'
import EnableFSR from './EnableFSR'
import ResizableBar from './ResizableBar'
import EnableEsync from './EnableEsync'
import EnableFsync from './EnableFsync'

interface Props {
  altWine: WineInstallation[]
  customWinePaths: string[]
  isDefault: boolean
  setAltWine: (altWine: WineInstallation[]) => void
  setCustomWinePaths: (value: string[]) => void
  setWineCrossoverBottle: (value: string) => void
  setWineVersion: (wine: WineInstallation) => void
  wineCrossoverBottle: string
  wineVersion: WineInstallation
}

export default function WineSettings({
  setWineVersion,
  setAltWine,
  wineVersion,
  altWine,
  customWinePaths,
  setCustomWinePaths,
  wineCrossoverBottle,
  setWineCrossoverBottle,
  isDefault
}: Props) {
  const [selectedPath, setSelectedPath] = useState('')
  const { platform } = useContext(ContextProvider)
  const isLinux = platform === 'linux'

  useEffect(() => {
    const getAltWine = async () => {
      const wineList: WineInstallation[] = await ipcRenderer.invoke(
        'getAlternativeWine'
      )
      setAltWine(wineList)
      // Avoids not updating wine config when having one wine install only
      if (wineList && wineList.length === 1) {
        setWineVersion(wineList[0])
      }
    }
    getAltWine()
    setSelectedPath(customWinePaths.length ? customWinePaths[0] : '')
  }, [customWinePaths])

  const { t } = useTranslation()

  function selectCustomPath() {
    ipcRenderer
      .invoke('openDialog', {
        buttonLabel: t('box.choose'),
        properties: ['openFile'],
        title: t('box.customWine', 'Select the Wine or Proton Binary')
      })
      .then(({ path }: Path) => {
        if (!customWinePaths.includes(path)) {
          setCustomWinePaths(
            path ? [...customWinePaths, path] : customWinePaths
          )
        }
      })
  }

  function removeCustomPath() {
    const newPaths = customWinePaths.filter((path) => path !== selectedPath)
    setCustomWinePaths(newPaths)
    return setSelectedPath(customWinePaths.length ? customWinePaths[0] : '')
  }

  return (
    <>
      <h3 className="settingSubheader">{isLinux ? 'Wine' : 'Crossover'}</h3>

      <WinePrefix />

      {isDefault && isLinux && (
        <SelectField
          label={t('setting.customWineProton', 'Custom Wine/Proton Paths')}
          htmlId="selectWinePath"
          disabled={!customWinePaths.length}
          extraClass="rightButtons"
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          afterSelect={
            <div className="iconsWrapper rightButtons addRemoveSvgButtons">
              <SvgButton onClick={() => removeCustomPath()}>
                <Tooltip
                  title={t('tooltip.removepath', 'Remove Path') as string}
                  placement="bottom"
                  arrow
                >
                  <RemoveCircleIcon
                    data-testid="removeWinePath"
                    style={{
                      color: selectedPath
                        ? 'var(--danger)'
                        : 'var(--text-tertiary)',
                      cursor: selectedPath ? 'pointer' : ''
                    }}
                    fontSize="large"
                  />
                </Tooltip>
              </SvgButton>{' '}
              <SvgButton
                onClick={() => selectCustomPath()}
                className={`is-primary`}
              >
                <Tooltip
                  title={t('tooltip.addpath', 'Add New Path') as string}
                  placement="bottom"
                  arrow
                >
                  <AddBoxIcon
                    data-testid="addWinePath"
                    style={{ color: 'var(--success)', cursor: 'pointer' }}
                    fontSize="large"
                  />
                </Tooltip>
              </SvgButton>
            </div>
          }
        >
          {customWinePaths.map((path: string) => (
            <option key={path}>{path}</option>
          ))}
        </SelectField>
      )}

      <SelectField
        label={
          isLinux
            ? t('setting.wineversion')
            : t('setting.crossover-version', 'Crossover Version')
        }
        htmlId="setWineVersion"
        onChange={(event) =>
          setWineVersion(
            altWine.filter(({ name }) => name === event.target.value)[0]
          )
        }
        value={wineVersion.name}
        afterSelect={
          <>
            {isLinux && (
              <InfoBox text={t('infobox.wine-path', 'Wine Path')}>
                {wineVersion.bin}
              </InfoBox>
            )}
            {isLinux && (
              <InfoBox text="infobox.help">
                <span>{t('help.wine.part1')}</span>
                <ul>
                  <i>
                    <li>~/.config/heroic/tools/wine</li>
                    <li>~/.config/heroic/tools/proton</li>
                    <li>~/.steam/root/compatibilitytools.d</li>
                    <li>~/.steam/steamapps/common</li>
                    <li>~/.local/share/lutris/runners/wine</li>
                    <li>~/.var/app/com.valvesoftware.Steam (Steam Flatpak)</li>
                    <li>/usr/share/steam</li>
                    <li>Everywhere on the system (CrossOver Mac)</li>
                  </i>
                </ul>
                <span>{t('help.wine.part2')}</span>
              </InfoBox>
            )}
          </>
        }
      >
        {altWine.map(({ name }) => (
          <option key={name}>{name}</option>
        ))}
      </SelectField>

      {wineVersion.type === 'crossover' && (
        <TextInputField
          label={t('setting.winecrossoverbottle', 'CrossOver Bottle')}
          htmlId="crossoverBottle"
          value={wineCrossoverBottle}
          onChange={(event) => setWineCrossoverBottle(event.target.value)}
        />
      )}

      <PreferSystemLibs />

      <EnableFSR />

      <ResizableBar />

      <EnableEsync />

      <EnableFsync />
    </>
  )
}
