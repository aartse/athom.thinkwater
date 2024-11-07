import Homey, { Device } from 'homey';
import UserDeviceResponseInterface from "../types/api/UserDeviceResponseInterface";
import ThinkwaterDevice from './ThinkwaterDevice';

export default class ThinkwaterDriver extends Homey.Driver {
    updateByUserDevice(userDevice: UserDeviceResponseInterface) {
      this.getDevices().forEach((device: Device) => {
        if (device.getData()['id'] === userDevice.deviceId) {
          device.setAvailable();
          (<ThinkwaterDevice>device).updateByUserDevice(userDevice);
        }        
      })
    }

    setUnavailable(message?: string | null | undefined) {
      this.getDevices().forEach((device: Device) => {
        device.setUnavailable(message);
      })
    }

    setAvailable() {
      this.getDevices().forEach((device: Device) => {
        device.setAvailable();
      })
    }
}