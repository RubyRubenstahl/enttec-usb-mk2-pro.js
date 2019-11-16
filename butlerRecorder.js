const MK2 = require("./enttec-mk2-usb");
const ButlerXT2 = require("ecue-butler-xt2");

const mk2 = new MK2("COM4");
const { format } = require("date-fns");
const butler = new ButlerXT2({});
const fs = require("fs");

mk2.startDmxRead();

async function update() {
  const state = {
    timestamp: new Date().toISOString(),
    butlerSettings: await butler.fetchSettings(),
    state: await butler.fetchCuelistData(),
    levels: mk2.getDmxVals()
  };
  const filename = format(new Date(), "yyyy-LL-dd hhmmss") + ".json";
  console.log(filename);
  fs.writeFileSync(`./data/${filename}`, JSON.stringify(state, null, 4));
}

setInterval(update, 30000);
