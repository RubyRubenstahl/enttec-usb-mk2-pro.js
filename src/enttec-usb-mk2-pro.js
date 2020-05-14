const util = require('util');
const EventEmitter = require("events").EventEmitter;
const Serialport = require("serialport");
const messageLabels = require("./message-labels");
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

  /**
   * Listen incoming data from the serial port
   */
  startSerialPortListener() {
    console.log("starting listener");
    this.serialport.on("data", (rawData) => {
      const messageType = rawData[1];
      switch (messageType) {
        case messageLabels.GET_WIDGET_PARAMS_REPLY:
          this.handleIncomingParamsReply(rawData);
          break;
        case messageLabels.RECEIVE_DMX_PORT1:
          this.handleIncomingDmxPacket(rawData);
          break;
      }
    });

    this.serialport.on("error", function(err) {
      console.error(err);
    });
  }

  handleIncomingParamsReply(rawData) {
    console.log("params received");
  }

  /**
   * Store the last received dmx data values and
   * emit the packet as a `dmxdata event.
   * @param {buffer} rawData 
   * @private
   */
  handleIncomingDmxPacket(rawData) {
    const dmxData = [...rawData].slice(6);
    this.lastReceivedData = dmxData;
    this.emit('dmxdata', dmxData)
  }

  /**
   * Writes a buffer to the serial port,
   * draining after
   * @param {buffer} buffer
   * @private
   */
  write(buffer) {
    this.serialport.write(buffer, (err) => {
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

    buffer.writeUInt8(messageLabels.DMX_START_CODE, 0); // usbpro packet start marker
    buffer.writeUInt8(label, 1);
    buffer.writeUInt16LE(data.length, 2);

    data.copy(buffer, 4);

    buffer.writeUInt8(0xe7, buffer.length - 1); // usbpro packet end marker

    return this.write(buffer);
  }

  /**
   * Send DMX data to a port on the MK2
   * @param {[Number]} dmxData - Array of numbers of length 0-512 containing the DMX data
   * @param {*} port - Zero based porn number to send the data to
   */
  writeDmxData(dmxData, port) {
    // for whatever-reason, dmx-transmission has to start with a zero-byte.
    const dmxBuffer = Buffer.from(dmxData).map((level) =>
      level < 0 ? 0 : level > 255 ? 255 : level
    );
    const frameBuffer = Buffer.alloc(513);
    frameBuffer.writeUInt8(0, 0);
    dmxBuffer.copy(frameBuffer, 1);
    const label = [messageLabels.SEND_DMX_PORT1, messageLabels.SEND_DMX_PORT2][
      port
    ];
    this.sendPacket(label, frameBuffer);
  }

  /**
   * Request the current config & status information
   */
  getDeviceInfo() {
    this.serialport.drain();
    this.sendPacket(messageLabels.GET_WIDGET_PARAMS, Buffer.from([0], 2));
  }

  /**
   * Set the DMX device to input mode
   */
  startDmxRead() {
    this.mode = "receive";
    this.serialport.drain();
    this.sendPacket(messageLabels.RECEIVE_DMX_PORT1, Buffer.from([0], 2));
    this.sendPacket(messageLabels.RECEIVE_DMX_ON_CHANGE, Buffer.from([0], 2));
  }

  /**
   * Get the current DMX levels from a port on the MK2
   * @returns {[Number]} - Array of integers representing the current DMX level data
   */
  getDmxVals() {
    return this.lastReceivedData;
  }
}

util.inherits(EnttecUsbMk2Pro, EventEmitter);

module.exports = EnttecUsbMk2Pro;
