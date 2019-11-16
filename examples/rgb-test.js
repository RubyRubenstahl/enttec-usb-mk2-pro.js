const MK2 = require("../src/enttec-usb-mk2-pro");
const mk2 = new MK2("COM4");

function update() {
  const ms = new Date().getTime();

  const dmxData = Array(512)
    .fill(128)
    .map((level, index) => {
      return 128 + Math.sin((ms + (index % 3) * 1000) / 1000) * 100;
    });
  mk2.writeDmxData(dmxData, 1);
}

setInterval(update, 10);
