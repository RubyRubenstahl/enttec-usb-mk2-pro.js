const MK2 = require("../");
const mk2 = new MK2("COM1");

const dmxData = Array(512).fill(255);
mk2.writeDmxData(dmxData, 2);
