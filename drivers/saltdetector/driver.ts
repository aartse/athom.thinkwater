import ThinkwaterApi from '../../lib/api/ThinkwaterApi';
import ThinkwaterDriver from '../../lib/homey/ThinkwaterDriver';
import TroubleshootingSolveRequestInterface from '../../lib/types/api/TroubleshootingSolveRequestInterface';
import UpdateListener from '../../lib/UpdateListner';

class SaltDetectorDriver extends ThinkwaterDriver {
  thinkwaterApi!: ThinkwaterApi

  async onInit() {
    this.thinkwaterApi = ThinkwaterApi.create(this.homey);

    // init action card
    const resetFailureAlarmActionCard = this.homey.flow.getActionCard('saltdetector__reset_failure_alarm');
    resetFailureAlarmActionCard.registerRunListener((args, state) => {
      const data = <TroubleshootingSolveRequestInterface>{
        deviceId: parseInt(args.device.getData().id),
        troubleType: 'software_probleem',
        note: 'Solved by homey',
      };

      return this.thinkwaterApi.doTroubleshootingSolve(data).then(() => {
        // restart listener with a timeout to make sure the has updated the values
        UpdateListener.create(this.homey).startListener();
      });
    });
  }

  async onPairListDevices() {
    const userDevices = (await this.thinkwaterApi.getUserDevices());

    // convert each node to a homey device
    return userDevices.map(userDevice => {
      return {
        name: userDevice.deviceName || 'device id ' + userDevice.deviceId,
        data: {
          id: userDevice.deviceId
        }
      }
    });
  }

}

module.exports = SaltDetectorDriver;
