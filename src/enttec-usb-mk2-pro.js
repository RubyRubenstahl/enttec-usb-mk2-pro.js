const Serialport = require("serialport");
const messageLabels = require("./message-lables");
const API_KEY = 0xe403a4c9;

class EnttecUsbMk2Pro {
  constructor(serialportName) {
    this.serialport = new Serialport(serialportName);
    this.lastReceivedData = null;
    this.init();
    this.mode = "send";
  }

  init() {
    const apiKeyBuf = Buffer.alloc(4);
    apiKeyBuf.writeUInt32LE(API_KEY, 0);

    const portAssignBuf = Buffer.alloc(2);
    portAssignBuf.writeUInt8(1, 0); // Port 1 enabled for DMX and RDM
    this.startSerialPortListener();
    portAssignBuf.writeUInt8(1, 1); // Port 2 enabled for DMX and RDM

    return this.sendPacket(messageLabels.SET_API_KEY, apiKeyBuf).then(() => {
      this.sendPacket(messageLabels.SET_PORT_ASSIGNMENT, portAssignBuf);
    });
  }

  startSerialPortListener() {
    console.log("starting listener");
    this.serialport.on("data", data => {
      // console.log("data");
      // console.log("DMXData:", data);
      const messageType = data[1];

      switch (messageType) {
        case messageLabels.GET_WIDGET_PARAMS_REPLY:
          console.log("params received");
          break;
        case messageLabels.RECEIVE_DMX_PORT1:
          const dmxData = [...data].slice(6);
          this.lastReceivedData = dmxData;
          break;
      }
    });

    this.serialport.on("error", function(err) {
      console.error(err);
    });
  }

  write(buffer) {
    this.serialport.write(buffer, err => {
      if (err) {
        return reject(err);
      }

      this.serialport.drain();
    });
  }

  /**
   * Sends a single packet to the usbpro.
   * @param {Number} label The message label.
   * @param {Buffer} data The message payload.
   * @returns {Promise} A promise indicating when the data has been sent.
   * @private
   */
  async sendPacket(label, data) {
    const buffer = Buffer.alloc(data.length + 5);

    buffer.writeUInt8(0x7e, 0); // usbpro packet start marker
    buffer.writeUInt8(label, 1);
    buffer.writeUInt16LE(data.length, 2);

    data.copy(buffer, 4);

    buffer.writeUInt8(0xe7, buffer.length - 1); // usbpro packet end marker

    return this.write(buffer);
  }

  writeDmxData(dmxData, universe) {
    // for whatever-reason, dmx-transmission has to start with a zero-byte.
    const dmxBuffer = Buffer.from(dmxData).map(level =>
      level < 0 ? 0 : level > 255 ? 255 : level
    );
    const frameBuffer = Buffer.alloc(513);
    frameBuffer.writeUInt8(0, 0);
    dmxBuffer.copy(frameBuffer, 1);
    const label =
      universe === 1
        ? messageLabels.SEND_DMX_PORT1
        : messageLabels.SEND_DMX_PORT2;

    this.sendPacket(label, frameBuffer);
  }

  getDeviceInfo() {
    this.serialport.drain();
    this.sendPacket(messageLabels.GET_WIDGET_PARAMS, Buffer.from([0], 2));
  }

  startDmxRead() {
    this.mode = "receive";
    this.serialport.drain();
    this.sendPacket(messageLabels.RECEIVE_DMX_PORT1, Buffer.from([0], 2));
    this.sendPacket(messageLabels.RECEIVE_DMX_ON_CHANGE, Buffer.from([0], 2));
  }

  getDmxVals(universe = 1) {
    return this.lastReceivedData;
  }
}

module.exports = EnttecUsbMk2Pro;
