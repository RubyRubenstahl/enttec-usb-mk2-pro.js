const MK2 = require("../src/enttec-usb-mk2-pro");
const mk2 = new MK2("COM3");

const dmxData = Array(512).fill(0);
mk2.writeDmxData(dmxData, 1);
