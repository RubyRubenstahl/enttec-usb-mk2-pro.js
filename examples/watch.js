const MK2 = require("../src/enttec-usb-mk2-pro");
const mk2 = new MK2("COM3");

mk2.on('dmxdata', data => {
    // console.log(data)
    mk2.writeDmxData(data, 1);
})

mk2.startDmxRead();