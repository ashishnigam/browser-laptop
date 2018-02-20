/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const Immutable = require('immutable')
const niceware = require('niceware')

// Components
const ModalOverlay = require('../common/modalOverlay')
const BrowserButton = require('../common/browserButton')
const {SettingsList, SettingItem, SettingCheckbox} = require('../common/settings')
const SortableTable = require('../common/sortableTable')
const {Grid, Column} = require('brave-ui')

const {
  SectionTitleLabelWrapper,
  AboutPageSectionTitle,
  DefaultSectionTitle,
  SectionLabelTitle
} = require('../common/sectionTitle')

const aboutActions = require('../../../../js/about/aboutActions')
const tabActions = require('../../../common/actions/tabActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')

const cx = require('../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const commonStyles = require('../styles/commonStyles')
const globalStyles = require('../styles/global')
const syncDevicesImage = require('../../../extensions/brave/img/sync/circle_of_sync_landing_graphic.svg')
const syncPhoneTabletImage = require('../../../extensions/brave/img/sync/device_type_phone-tablet.svg')
const syncComputerImage = require('../../../extensions/brave/img/sync/device_type_computer.svg')
const syncPlusImage = require('../../../extensions/brave/img/sync/add_device_titleicon.svg')


class SyncTab extends ImmutableComponent {
  constructor () {
    super()
    this.toggleSync = this.toggleSync.bind(this)
    this.onSetup = this.setupSyncProfile.bind(this, false)
    this.onReset = this.reset.bind(this)
    this.onRestore = this.restoreSyncProfile.bind(this)
    this.enableRestore = this.enableRestore.bind(this)

    const passphraseInputState = {}
    Array.from({length: 16}, (_, i) => {
      Object.assign(passphraseInputState, {[`passphraseInput${i}`]: ''})
    })
    this.state = passphraseInputState
  }

  get setupError () {
    return this.props.syncData.get('setupError')
  }

  get hasAnySetupModalVisible () {
    return (
      this.props.syncStartOverlayVisible ||
      this.props.syncScanCodeOverlayVisible ||
      this.props.syncChainCodeOverlayVisible ||
      this.props.syncDevicesListOverlayVisible
    )
  }

  get isSetup () {
    return (
      !this.setupError &&
      this.props.syncData.get('seed') instanceof Immutable.List &&
      this.props.syncData.get('seed').size === 32 &&
      !this.hasAnySetupModalVisible
    )
  }

  get enabled () {
    return getSetting(settings.SYNC_ENABLED, this.props.settings)
  }

  get errorContent () {
    return <section className={css(styles.settingsListContainerMargin__bottom)}>
      <div className={css(styles.errorContent__setupError)} data-test-id='syncSetupError'>{this.setupError}</div>
      <BrowserButton primaryColor
        l10nId='syncRetryButton'
        testId='syncRetryButton'
        onClick={this.retry.bind(this)}
      />
    </section>
  }

  get clearDataContent () {
    return <section className={css(styles.settingsListContainerMargin__bottom)}>
      <DefaultSectionTitle data-l10n-id='syncClearData' />
      {
        this.enabled
          ? <BrowserButton primaryColor
            l10nId='syncResetButton'
            testId='clearDataButton'
            onClick={this.props.showOverlay.bind(this, 'syncReset')}
          />
          : <div>
            <BrowserButton primaryColor
              disabled
              l10nId='syncResetButton'
              testId='clearDataButton'
            />
            <div data-l10n-id='syncResetDataDisabled' className='settingsListTitle' />
          </div>
      }
    </section>
  }

  get setupContent () {
    if (this.setupError) {
      return null
    }

    return (
      <div className={css(styles.syncContainer)}>
        <Grid>
          <Column size={6}>
            <img className={css(styles.sync__image)} src={syncDevicesImage} />
          </Column>
          <Column size={6}>
            <SectionTitleLabelWrapper>
              <AboutPageSectionTitle data-l10n-id='syncTitle' />
              <SectionLabelTitle>beta</SectionLabelTitle>
            </SectionTitleLabelWrapper>
            <Column>
              <p className={css(styles.syncContainer__text_big)}>Brave Sync allows you to sync bookmarks, tabs, history and other data privately between your Brave Browsers on your varios devices.</p>
              <p className={css(styles.syncContainer__text_small)}>When you start a new sync chain, a new sync code is created. You will use this same code across your devices to link them together.</p>
            </Column>
            <Column>
              <section className={css(styles.setupContent)}>
                <BrowserButton groupedItem primaryColor
                  l10nId='syncStart'
                  testId='syncStartButton'
                  onClick={this.setupSync.bind(this)}
                />
                <BrowserButton groupedItem secondaryColor
                  l10nId='syncAdd'
                  testId='syncAddButton'
                  onClick={this.props.showOverlay.bind(this, 'syncAdd')}
                />
              </section>
            </Column>
          </Column>
        </Grid>
      </div>
    )
  }

  setupSync () {
    this.setupSyncProfile(true)
    this.props.showOverlay('syncStart')
  }

  get postSetupContent () {
    return (
      <div>
        <SectionTitleLabelWrapper>
          <AboutPageSectionTitle data-l10n-id='syncTitle' />
          <SectionLabelTitle>beta</SectionLabelTitle>
        </SectionTitleLabelWrapper>

        <div className={css(styles.settingsListContainerMargin__bottom)}>
          <span className='settingsListTitle' data-l10n-id='syncTitleMessage' />
          <a href='https://github.com/brave/sync/wiki/Design' rel='noopener' target='_blank'>
            <span className={cx({
              fa: true,
              'fa-question-circle': true
            })} />
          </a>
          <div
            data-l10n-id='syncBetaMessage'
            className={cx({
              settingsListTitle: true,
              [css(styles.subText)]: true
            })}
          />
        </div>
        <SettingsList>
          <div className={css(styles.device__box)}>
            <SettingCheckbox
              className={css(styles.device__item)}
              dataL10nId='syncEnable'
              prefKey={settings.SYNC_ENABLED}
              settings={this.props.settings}
              onChangeSetting={this.toggleSync}
            />
            <div className={css(styles.device__item)}>
              <span className={css(styles.device__syncDeviceLabel)} data-l10n-id='syncDeviceName' />
              <div className={css(styles.device__deviceName)}>
                {getSetting(settings.SYNC_DEVICE_NAME, this.props.settings)}
              </div>
            </div>
          </div>
          {this.enabled ? this.devicesContent : null}
          <BrowserButton primaryColor
            l10nId='syncNewDevicezzz'
            testId='syncNewDeviceButton'
            onClick={this.props.showOverlay.bind(this, 'syncStart')}
          />
        </SettingsList>
      </div>
    )
  }

  get devicesTableRows () {
    const devices = this.props.syncData.get('devices')
    if (!devices) { return [] }
    return devices.map((device, id) => [
      {
        html: id,
        value: parseInt(id)
      },
      {
        html: device.get('name'),
        value: device.get('name')
      },
      {
        html: new Date(device.get('lastRecordTimestamp')).toLocaleString(),
        value: device.get('lastRecordTimestamp')
      }
    ])
  }

  get devicesContent () {
    return <section className={css(styles.settingsListContainerMargin__top)}>
      <DefaultSectionTitle data-l10n-id='syncDevices' data-test-id='syncDevices' />
      <SortableTable
        headings={['id', 'syncDeviceName', 'syncDeviceLastActive']}
        defaultHeading='syncDeviceLastActive'
        defaultHeadingSortOrder='desc'
        rows={this.devicesTableRows}
        tableClassNames={css(styles.devices__devicesList)}
      />
    </section>
  }

  get qrcodeContent () {
    if (!this.isSetup) {
      return null
    }
    return this.props.syncQRVisible
      ? <section>
        <ul className={css(styles.syncOverlayBody__listWrapper)}>
          <li className={css(
            styles.syncOverlayBody__listItem,
            commonStyles.noMarginLeft
          )}>
            <BrowserButton secondaryColor
              l10nId='syncHideQR'
              testId='syncHideQRButton'
              onClick={this.props.hideQR}
            />
          </li>
        </ul>
        <img className={css(styles.syncOverlayBody__syncQRImg)}
          src={this.props.syncData.get('seedQr')}
          data-l10n-id='syncQRImg'
          data-test-id='syncQRImg'
        />
      </section>
    : <ul className={css(styles.syncOverlayBody__listWrapper)}>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginLeft
      )}>
        <BrowserButton secondaryColor
          l10nId='syncShowQR'
          testId='syncShowQRButton'
          onClick={this.props.showQR}
        />
      </li>
    </ul>
  }

  get passphraseContent () {
    const seed = Buffer.from(this.props.syncData.get('seed').toJS())
    const passphrase = niceware.bytesToPassphrase(seed)
    const words = [
      passphrase.slice(0, 4).join(' '),
      passphrase.slice(4, 8).join(' '),
      passphrase.slice(8, 12).join(' '),
      passphrase.slice(12, 16).join(' ')
    ]
    return (
      <ul className={css(styles.syncOverlayBody__listWrapper)}>
        <li className={css(
          styles.syncOverlayBody__listItem,
          commonStyles.noMarginBottom,
          commonStyles.noMarginLeft
        )}>
          <pre data-test-id='syncPassphrase'
            className={css(
              styles.passphrase,
              styles.listItem__passphrase,
              commonStyles.noMarginBottom
            )}>{words.join('\n')}</pre>
        </li>
      </ul>
    )
  }

  get newOverlayContent () {
    return <ol>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginTop
      )} data-l10n-id='syncNewDevice1' />
      <li className={css(styles.syncOverlayBody__listItem)}>
        <div data-l10n-id='syncNewDevice2' />
        {this.qrcodeContent}
      </li>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginBottom
      )}>
        <div data-l10n-id='syncNewDevice3' />
        {this.passphraseContent}
      </li>
    </ol>
  }

  get newOverlayFooter () {
    return <BrowserButton secondaryColor
      l10nId='done'
      testId='doneButton'
      onClick={this.props.hideOverlay.bind(this, 'syncNewDevice')}
    />
  }

  get defaultDeviceName () {
    const osName = {
      darwin: 'Mac',
      freebsd: 'FreeBSD',
      linux: 'Linux',
      win32: 'Windows'
    }
    return process.platform
      ? [(osName[process.platform] || process.platform), 'Laptop'].join(' ')
      : getSetting(settings.SYNC_DEVICE_NAME, this.props.settings)
  }

  deviceNameInputContent (hasAutoFocus = false) {
    return <SettingItem>
      <div className={css(styles.syncOverlayBody__label)} data-l10n-id='syncDeviceNameInput' />
      <input className={css(
        commonStyles.formControl,
        commonStyles.textbox,
        commonStyles.textbox__outlineable,
        commonStyles.textbox__isSettings
      )}
        autoFocus={hasAutoFocus}
        spellCheck='false'
        ref={(node) => { this.deviceNameInput = node }}
        placeholder={this.defaultDeviceName} />
    </SettingItem>
  }

  /**
   * Sync Start Overlay
   */

  get startOverlayContent () {
    return <section className={css(styles.syncOverlayBody__formBottomMargin)}>
      <Grid>
        <Column size={6}>
          <img className={css(styles.sync__image)} src={syncPhoneTabletImage} />
          <BrowserButton primaryColor
            l10nId='Phone or Tablet'
            testId='syncCreateButton'
            onClick={this.onClickSyncScanCodeButton.bind(this)}
          />
        </Column>
        <Column size={6}>
          <img className={css(styles.sync__image)} src={syncComputerImage} />
          <BrowserButton primaryColor
            l10nId='Computer'
            testId='syncCreateButton'
            onClick={this.onClickSyncChainCodeButton.bind(this)}
          />
        </Column>
      </Grid>
    </section>
  }

  get startOverlayFooter () {
    return <BrowserButton primaryColor
      l10nId='syncCreate'
      testId='syncCreateButton'
      onClick={this.onSetup}
    />
  }

  get addOverlayContent () {
    return <section>
      <div className={css(styles.syncOverlayBody__label)} data-l10n-id='syncEnterPassphrase' />
      <div className={css(styles.syncOverlayBody__form)}>
        {
          Array.from({length: 16}, (_, id) => {
            return (
              <input
                id={id}
                autoFocus={id === 0}
                type='text'
                spellCheck='false'
                value={this.state[`passphraseInput${id}`]}
                onChange={this.enableRestore}
              />
            )
          })
        }
      </div>
    </section>
  }

  get addOverlayFooter () {
    return (
      <div>
        <BrowserButton groupedItem secondaryColor
          l10nId='cancel'
          testId='cancelButton'
          onClick={this.chainCodeOverlayPreviousAction.bind(this)}
        />
        <BrowserButton groupedItem primaryColor
          l10nId='Confirm Sync Code'
          testId='syncResetButton'
          onClick={this.chainCodeOverlayNextAction.bind(this)}
        />
      </div>
    )
  }

  onClickSyncChainCodeButton () {
    // close current modal
    this.props.hideOverlay('syncStart')
    // open chain code modal
    this.props.showOverlay('syncChainCode')
  }

  onClickSyncScanCodeButton () {
    // close current modal
    this.props.hideOverlay('syncStart')
    // open scan code modal
    this.props.showOverlay('syncScanCode')
  }

  /**
   * Sync Chain Code Overlay
   */
  get chainCodeOverlayContent () {
    return (
      <div>
        <p>On your computer, go to:</p>
        <p>Settings > Sync and click "Enter a sync chain code".</p>
        <p>Then enter this code:</p>
        {this.passphraseContent}
      </div>
    )
  }

  get chainCodeOverlayFooter () {
    return (
      <div>
        <BrowserButton groupedItem secondaryColor
          l10nId='previous'
          testId='cancelButton'
          onClick={this.chainCodeOverlayPreviousAction.bind(this)}
        />
        <BrowserButton groupedItem primaryColor
          l10nId='next'
          testId='syncResetButton'
          onClick={this.chainCodeOverlayNextAction.bind(this)}
        />
      </div>
    )
  }

  chainCodeOverlayPreviousAction () {
    // hide current modal
    this.props.hideOverlay('syncChainCode')
    // open previous modal
    this.props.showOverlay('syncStart')
  }

  chainCodeOverlayNextAction () {
    // close current modal
    this.props.hideOverlay('syncChainCode')
    this.props.hideOverlay('syncAdd')
    // verify if you can restore sync
    this.restoreSyncProfile()
  }

  /**
   * Sync Scan Code (QR code) Overlay
   */
  get scanCodeOverlayContent () {
    return (
      <div>
        <p>On your phone or tablet, go to: Brave Settings > Sync > Scan Sync Code</p>
        <Grid>
          <Column size={6}>
            <img className={css(styles.syncOverlayBody__syncQRImg)}
              src={this.props.syncData.get('seedQr')}
              data-l10n-id='syncQRImg'
              data-test-id='syncQRImg'
            />
          </Column>
          <Column size={6}>
            <p>Then scan this code with your device camera.</p>
          </Column>
        </Grid>
      </div>
    )
  }

  get scanCodeOverlayFooter () {
    return (
      <div>
        <button
          onClick={this.scanCodeOverlayNoCameraAvailable.bind(this)}>
          I don't have a camera
        </button>
        <BrowserButton groupedItem secondaryColor
          l10nId='previous'
          testId='cancelButton'
          onClick={this.scanCodeOverlayPreviousAction.bind(this)}
        />
        <BrowserButton groupedItem primaryColor
          l10nId='next'
          testId='syncResetButton'
          onClick={this.scanCodeOverlayNextAction.bind(this)}
        />
      </div>
    )
  }

  onHideAnySetupOverlay () {
    // hide every setup modal
    this.props.hideOverlay('syncScanCode')
    this.props.hideOverlay('syncChainCode')
    this.props.hideOverlay('syncDevicesList')
    this.props.hideOverlay('syncAdd')
    // cancel sync without warning as user didn't complete setup
    this.onReset(false)
  }

  scanCodeOverlayNoCameraAvailable () {
    // hide current modal
    this.props.hideOverlay('syncScanCode')
    // open chain code modal
    this.props.showOverlay('syncChainCode')
  }

  scanCodeOverlayPreviousAction () {
    // hide current modal
    this.props.hideOverlay('syncScanCode')
    // open previous modal
    this.props.showOverlay('syncStart')
  }

  scanCodeOverlayNextAction () {
    // close current modal
    this.props.hideOverlay('syncScanCode')
    // open next modal
    this.props.showOverlay('syncDevicesList')
  }

  /**
   * Sync Devices List Overlay
   */

  get devicesListOverlayContent () {
    const devices = this.props.syncData.get('devices')
    // if (devices.isEmpty()) {
    //   // Update modal after 5s to check if new device is already fetch
    //   setTimeout(() => this.forceUpdate(), 5000)
    // }
    return (
      <div>
        <p>devices in your sync chain:</p>
        <button onClick={this.devicesListOverlayAddAction.bind(this)}>add</button>
        <select multiple>
          {
            1+1==3//devices.isEmpty()
            ? <option disabled>Loading devices. Please wait...</option>
            : devices.map((device, id) => <option value={id}>{device.get('name')}</option>)
          }
        </select>
      </div>
    )
  }

  get devicesListOverlayFooter () {
    return (
      <div>
        {
          this.props.syncData.get('devices').size < 2
          ? <span>you can only finish syncing if 2 or more devices are connected</span>
          : null
        }
        <BrowserButton groupedItem secondaryColor
          l10nId='previous'
          testId='cancelButton'
          onClick={this.devicesListOverlayPreviousAction.bind(this)}
        />
        <BrowserButton groupedItem primaryColor
          disabled={this.props.syncData.get('devices').size < 2}
          l10nId='done'
          testId='syncResetButton'
          onClick={this.devicesListOverlayNextAction.bind(this)}
        />
      </div>
    )
  }

  devicesListOverlayAddAction () {
    // hide current modal
    this.props.hideOverlay('syncDevicesList')
    // open starting modal
    this.props.showOverlay('syncStart')
  }

  devicesListOverlayPreviousAction () {
    // hide current modal
    this.props.hideOverlay('syncDevicesList')
    // open previous modal
    this.props.showOverlay('syncScanCode')
  }

  devicesListOverlayNextAction () {
    // close current modal
    this.props.hideOverlay('syncDevicesList')
  }

  get resetOverlayContent () {
    return <ul>
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginTop
      )} data-l10n-id='syncResetMessageWhat' />
      <li className={css(styles.syncOverlayBody__listItem)} data-l10n-id='syncResetMessageWhatNot' />
      <li className={css(
        styles.syncOverlayBody__listItem,
        commonStyles.noMarginBottom
      )} data-l10n-id='syncResetMessageOtherDevices' />
    </ul>
  }

  get resetOverlayFooter () {
    return <section>
      <BrowserButton groupedItem secondaryColor
        l10nId='cancel'
        testId='cancelButton'
        onClick={this.props.hideOverlay.bind(this, 'syncReset')}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='syncReset'
        testId='syncResetButton'
        onClick={this.onReset}
      />
    </section>
  }

  enableRestore (e) {
    // If user copies the entire passphrase, split
    // each word in a different field
    const inputHasWhitespace = /\s/g.test(e.target.value)
    if (inputHasWhitespace) {
      const splittedWords = e.target.value.split(/[ ,]+/)
      splittedWords.map((word, i) => this.setState({[`passphraseInput${i}`]: word}))
    } else {
      this.setState({[`passphraseInput${e.target.id}`]: e.target.value})
    }

    if (this.props.syncRestoreEnabled === false && e.target.value) {
      this.props.enableSyncRestore(true)
    } else if (this.props.syncRestoreEnabled && !e.target.value) {
      this.props.enableSyncRestore(false)
    }
  }

  reset (needsConfirmDialog = true) {
    const locale = require('../../../../js/l10n')
    const msg = locale.translation('areYouSure')
    if (needsConfirmDialog && window.confirm(msg)) {
      aboutActions.resetSync()
      this.props.hideOverlay('syncReset')
      return
    }
    aboutActions.resetSync()
    tabActions.reload()
  }

  retry () {
    aboutActions.reloadSyncExtension()
    tabActions.reload()
  }

  setupSyncProfile (shouldSetup, isRestoring) {
    // SUSPICIOUS L688 may causing one of known bugs
    this.props.onChangeSetting(settings.SYNC_DEVICE_NAME, this.defaultDeviceName)
    this.toggleSync(settings.SYNC_ENABLED, shouldSetup, isRestoring)
    // this.props.hideOverlay('syncStart')
  }

  toggleSync (key, value, isRestoring = false) {
    this.props.onChangeSetting(key, value)
    if (!isRestoring) {
      aboutActions.reloadSyncExtension()
    }
  }

  restoreSyncProfile () {
    const text = Object.values(this.state).map(data => data.toLowerCase().trim())

    if (text.length > 0) {
      let inputCode = ''
      try {
        inputCode = window.niceware.passphraseToBytes(text)
      } catch (e) {
        console.error('Could not convert niceware passphrase', e)
      }
      if (inputCode && inputCode.length === 32) {
        // QR code and device ID are set after sync restarts
        aboutActions.saveSyncInitData(Array.from(inputCode))
        this.setupSyncProfile(true)
        return
      }
    }
    window.alert('Invalid code.\nplease try again.')
  }

  render () {
    // if (this.props.syncData.get('devices')) {
    //   console.log('is setup??', JSON.stringify(this.props.syncData.get('devices').size))
    // }
    // console.log(JSON.stringify(Object.values(this.state)))
    // console.info('props avail', JSON.stringify(this.props))
    return <section data-test-id='syncContainer'>
      {
      /*!this.isSetup &&*/ this.props.syncStartOverlayVisible
        ? <ModalOverlay
          title='Lets sync a new device with name'
          content={this.startOverlayContent}
          onHide={this.props.hideOverlay.bind(this, 'syncStart')} />
        : null
      }
      {
      /*!this.isSetup &&*/ this.props.syncAddOverlayVisible
        ? <ModalOverlay
          title={'syncAdd'}
          content={this.addOverlayContent}
          footer={this.addOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncAdd')} />
        : null
      }
      {
      /*!this.isSetup &&*/ this.props.syncScanCodeOverlayVisible
        ? <ModalOverlay
          title='sync scan code stuff'
          content={this.scanCodeOverlayContent}
          footer={this.scanCodeOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
      /*!this.isSetup &&*/ this.props.syncChainCodeOverlayVisible
        ? <ModalOverlay
          title='Enter the sync chain code below'
          content={this.chainCodeOverlayContent}
          footer={this.chainCodeOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
      /*!this.isSetup &&*/ this.props.syncDevicesListOverlayVisible
        ? <ModalOverlay
          title={
            this.props.syncData.get('devices').isEmpty()
              ? 'Updating devices list'
              : 'devices list for the win!'
          }
          content={this.devicesListOverlayContent}
          footer={this.devicesListOverlayFooter}
          onHide={this.onHideAnySetupOverlay.bind(this)} />
        : null
      }
      {
      /*this.isSetup &&*/ this.props.syncResetOverlayVisible
        ? <ModalOverlay
          title={'syncReset'}
          content={this.resetOverlayContent}
          footer={this.resetOverlayFooter}
          onHide={this.props.hideOverlay.bind(this, 'syncReset')} />
        : null
      }
      <section className={css(styles.settingsListContainerMargin__bottom)}>
          {
            // investigate cases of this
            this.setupError
            ? this.errorContent
            : this.isSetup
              ? this.postSetupContent
              : this.setupContent
          }
      </section>
      {
        this.isSetup && this.enabled
          ? <section data-test-id='syncDataSection' className={css(styles.settingsListContainerMargin__bottom)}>
            <DefaultSectionTitle data-l10n-id='syncData' />
            <SettingsList dataL10nId='syncDataMessage'>
              <SettingCheckbox
                dataL10nId='syncBookmarks'
                prefKey={settings.SYNC_TYPE_BOOKMARK}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting}
              />
              <SettingCheckbox
                dataL10nId='syncSiteSettings'
                prefKey={settings.SYNC_TYPE_SITE_SETTING}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting}
              />
              <SettingCheckbox
                dataL10nId='syncHistory'
                prefKey={settings.SYNC_TYPE_HISTORY}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting}
              />
            </SettingsList>
          </section>
          : null
      }
      {
        this.isSetup
          ? this.clearDataContent
          : null
      }
    </section>
  }
}

const styles = StyleSheet.create({
  syncContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '-webkit-fill-available',
    maxWidth: '800px'
  },

  syncContainer__text_big: {
    fontSize: '20px',
    margin: '20px 0'
  },

  syncContainer__text_small: {
    fontSize: '15px'
  },

  sync__image: {
    display: 'block',
    margin: 'auto',
    maxWidth: '100%'
  },

  settingsListContainerMargin__top: {
    marginTop: globalStyles.spacing.settingsListContainerMargin
  },

  settingsListContainerMargin__bottom: {
    marginBottom: globalStyles.spacing.settingsListContainerMargin
  },

  passphrase: {
    // See: https://github.com/Khan/aphrodite#object-key-ordering
    fontSize: '18px',
    fontFamily: 'monospace'
  },

  subText: {
    color: globalStyles.color.gray,
    fontSize: '.9rem',
    marginTop: '.5rem'
  },

  setupContent: {
    marginTop: globalStyles.spacing.dialogInsideMargin
  },

  errorContent__setupError: {
    color: globalStyles.color.braveDarkOrange,
    fontWeight: 'bold',
    margin: `calc(${globalStyles.spacing.panelPadding} / 2) 0 ${globalStyles.spacing.dialogInsideMargin}`
  },

  device__box: {
    display: 'flex',
    alignItems: 'center',
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    color: globalStyles.color.mediumGray,
    margin: `${globalStyles.spacing.panelMargin} 0`,
    padding: globalStyles.spacing.panelPadding,
    boxSizing: 'border-box',
    width: '600px'
  },

  device__item: {
    flex: 1
  },

  device__syncDeviceLabel: {
    fontSize: '.9rem'
  },

  device__deviceName: {
    marginTop: `calc(${globalStyles.spacing.panelPadding} / 2)`
  },

  devices__devicesList: {
    marginBottom: globalStyles.spacing.dialogInsideMargin,
    width: '600px'
  },

  textArea__passphrase: {
    width: '80%',
    height: '100px'
  },

  listItem__passphrase: {
    margin: `${globalStyles.spacing.dialogInsideMargin} 0`,

    // See ledgerBackup.js
    cursor: 'text',
    userSelect: 'text', // #11641
    color: globalStyles.color.braveDarkOrange
  },

  syncOverlayBody__listWrapper: {
    listStyle: 'none'
  },

  syncOverlayBody__listItem: {
    margin: globalStyles.spacing.dialogInsideMargin
  },

  syncOverlayBody__syncQRImg: {
    position: 'relative',
    right: globalStyles.spacing.dialogInsideMargin
  },

  syncOverlayBody__label: {
    // TODO: refactor preferences.less
    // See: .settingsList .settingItem > *:not(.switchControl)
    marginBottom: `${globalStyles.spacing.modalPanelHeaderMarginBottom} !important`
  },

  syncOverlayBody__form: {
    marginBottom: globalStyles.spacing.settingsListContainerMargin
  },

  syncOverlayBody__formBottomMargin: {
    marginBottom: globalStyles.spacing.dialogInsideMargin
  }
})

module.exports = SyncTab
