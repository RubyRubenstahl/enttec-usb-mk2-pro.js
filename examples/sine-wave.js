const MK2 = require("../src/enttec-usb-mk2-pro");
const mk2 = new MK2("COM3");

function update() {
  const ms = new Date().getTime();
  const level = 128 + Math.sin(ms / 1000) * 100;
  const dmxData = Array(512).fill(level);
  mk2.writeDmxData(dmxData, 1);
}

setInterval(update, 10);
