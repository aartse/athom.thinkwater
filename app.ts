'use strict';

import Homey from 'homey';
import UpdateListener from './lib/UpdateListner';

class MyApp extends Homey.App {
  async onInit() {
    const updateListner = UpdateListener.create(this.homey);
    updateListner.startListener();
  }
}

module.exports = MyApp;
