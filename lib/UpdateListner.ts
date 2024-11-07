'use strict';

import Homey from 'homey/lib/Homey';
import ThinkwaterApi from './api/ThinkwaterApi';
import UserDeviceResponseInterface from './types/api/UserDeviceResponseInterface';
import ThinkwaterDriver from './homey/ThinkwaterDriver';

let updateListener: UpdateListener|null = null;

export default class UpdateListener {

    refreshInterval: number = 3600000
    thinkwaterApi: ThinkwaterApi
    homey: Homey
    timeoutId: any

    constructor(homey: Homey) {
        this.thinkwaterApi = ThinkwaterApi.create(homey);
        this.homey = homey;
        this.timeoutId = null;

        var startListnerTimeoutId: any = null;
        const timeoutCallback = () => {
            startListnerTimeoutId = null;
            this.startListener();
        }

        const onSettingsChange = (field: any) => {
            if ('username' === field || 'password' === field) {
                // restart listener with a timeout to make sure the username and password is changed
                if (startListnerTimeoutId !== null) {
                    this.homey.clearTimeout(startListnerTimeoutId);
                } 
                startListnerTimeoutId = this.homey.setTimeout(timeoutCallback, 1000);
            }
        }

        this.homey.settings.on('set', onSettingsChange);
    }

    static create(homey: Homey) {
        if (null === updateListener) {
            updateListener = new UpdateListener(homey);
        }

        return updateListener;
    }

    startListener() {
        // stop the listener interval
        if (this.timeoutId) {
            this.homey.clearInterval(this.timeoutId);
        }

        // use polling to update the data
        const timeoutCallback = () => {
            this.updateDevices();
        }
        this.timeoutId = this.homey.setInterval(timeoutCallback, this.refreshInterval);

        // update devices when start listener
        this.updateDevices();
    }

    updateDevices() {
        this.thinkwaterApi.getUserDevices().then(userDevices => {
            userDevices.forEach((userDevice: UserDeviceResponseInterface) => {
                this.updateDriver(userDevice);
            });
        }).catch((err) => {
            const drivers = this.homey.drivers.getDrivers();
            for(const id in drivers) {
                const driver = <ThinkwaterDriver>drivers[id];

                driver.setUnavailable(err);
            }
        });
    }

    updateDriver(userDevice: UserDeviceResponseInterface) {
        const drivers = this.homey.drivers.getDrivers();
        for(const id in drivers) {
            const driver = <ThinkwaterDriver>drivers[id];
            
            driver.setAvailable();
            driver.updateByUserDevice(userDevice);
        }
    }
}