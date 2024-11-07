import UserDeviceResponseInterface from '../../lib/types/api/UserDeviceResponseInterface';
import ThinkwaterDevice from '../../lib/homey/ThinkwaterDevice';
import SaltDetectorCapabilityValues from '../../lib/types/SaltDetectorCapabilityValues';

class SaltDetectorDevice extends ThinkwaterDevice {
  async onInit() {
    await this.initCapabilities()
  }

  async initCapabilities() {
    if (!this.hasCapability('maximum_level')) {
      await this.addCapability('maximum_level')
    }
    if (!this.hasCapability('fill_percentage')) {
      await this.addCapability('fill_percentage')
    }
    if (!this.hasCapability('current_level')) {
      await this.addCapability('current_level')
    }
    if (!this.hasCapability('level_status')) {
      await this.addCapability('level_status')
    }
    if (!this.hasCapability('is_online')) {
      await this.addCapability('is_online')
    }
  }

  updateByUserDevice(userDevice: UserDeviceResponseInterface): void {
    // save old capability values fo tigger cards
    const oldCapabilityValues = <SaltDetectorCapabilityValues> {
      maximumLevel: this.getCapabilityValue('current_level'),
      fillPercentage: this.getCapabilityValue('fill_percentage'),
      currentLevel: this.getCapabilityValue('current_level'),
      levelStatus: this.getCapabilityValue('level_status'),
      isOnline: this.getCapabilityValue('is_online'),
    }

    // change capability values and when all capabilities are changed, trigger flow cards
    Promise.all([
      this.setCapabilityValue('maximum_level', userDevice.maximumLevel/10),
      this.setCapabilityValue('fill_percentage', Math.round(userDevice.fillPercentage)),
      this.setCapabilityValue('current_level', userDevice.currentValue/10),
      this.setCapabilityValue('level_status', String(userDevice.levelStatus)),
      this.setCapabilityValue('is_online', userDevice.isOnline)
    ]).then(() => {
      this.triggerFlowCards(oldCapabilityValues)
    }).catch((err) => {
      this.homey.log(err)
      throw err
    })
  }

  triggerFlowCards(oldCapabilityValues: SaltDetectorCapabilityValues): void {

    // trigger maximum_level changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.maximumLevel || 0,
      this.getCapabilityValue('maximum_level') || 0,
      'saltdetector-maximum_level_changed'
    );
    
    // trigger fill_percentage changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.fillPercentage || 0,
      this.getCapabilityValue('fill_percentage') || 0,
      'saltdetector-fill_percentage_changed'
    );

    // trigger current_level changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.currentLevel || 0,
      this.getCapabilityValue('current_level') || 0,
      'saltdetector-current_level_changed'
    );

    // trigger level_status changed
    this.triggerChangedValueFlowCards(
      ''+oldCapabilityValues.levelStatus,
      ''+this.getCapabilityValue('level_status'),
      'saltdetector-level_status_changed'
    );

    // trigger current_level changed
    this.triggerChangedValueFlowCards(
      oldCapabilityValues.isOnline && true,
      this.getCapabilityValue('is_online') && true,
      'saltdetector-is_online_changed'
    );
  }

  triggerChangedValueFlowCards(oldValue: any, newValue: any, triggerCard: string) : void {
    if (newValue !== oldValue) {
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(
          this, 
          {
            old_value: oldValue,
            new_value: newValue
          }, 
          {}
        )
        .catch((err) => {
          this.homey.error(err);
        });
    }
  }
}

module.exports = SaltDetectorDevice;
