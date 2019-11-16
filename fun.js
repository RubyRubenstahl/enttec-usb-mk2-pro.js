const MK2 = require("./enttec-mk2-usb");
const startMs = new Date().getTime();
const chroma = require("chroma-js");
const mk2 = new MK2("COM4");
const newPacket = () => Array(512).fill(0);
const to8bit = val => (val < 0 ? 0 : Math.round(val * 255));
const SimplexNoise = require("simplex-noise");

const simplex = new SimplexNoise();

const fixtures = Array(64)
  .fill(0)
  .map((_, index) => ({
    x: index % 8,
    y: Math.floor(index / 8),
    color: chroma("black")
  }));

const sin = ({
  phase = 0,
  amplitude = 0.5,
  base = 0.5,
  frequency = 1
} = {}) => {
  const newLevel = base + Math.sin(phase * frequency) * amplitude;
  return newLevel;
};

const linearGradient = ({
  gradient,
  fixtures,
  xScale = 1,
  yScale = 1,
  speed = 0
}) => ms =>
  fixtures.map((fixture, index) => {
    let offset = fixture.y / 8 + (ms * speed) / 1000;
    offset = offset - Math.floor(offset);
    //   console.log(offset);

    return {
      ...fixture,
      color: gradient(offset)
    };
  });

const noiseGradient = ({
  xScale = 0.1,
  yScale = 0.1,
  gradient = chroma.scale(["black", "white"]),
  frequency = 1,
  ySpeed = 0,
  xSpeed = 0,
  fixtures
} = {}) => ms =>
  fixtures.map((fixture, index) => {
    const offset = simplex.noise3D(
      (fixture.x + xSpeed * ms) * xScale,
      (fixture.y + ySpeed * ms) * yScale,
      (ms * frequency) / 1000
    );
    // console.log(ms);
    return {
      ...fixture,
      color: gradient(offset)
    };
  });

const solidColor = ({ color, fixtures } = {}) => ms =>
  fixtures.map((fixture, index) => {
    return {
      ...fixture,
      color
    };
  });

const rainbow = linearGradient({
  gradient: chroma.scale(["red", "yellow", "green", "blue", "red"]).mode("lab"),
  fixtures,
  speed: 0.1
});

const patriotic = linearGradient({
  gradient: chroma
    .scale(["red", "white", "blue"])
    .classes(3)
    .mode("lab"),
  fixtures
});

//   const waterLinear = linearGradient({ gradient: waterGradient, fixtures });
const mardiGras2 = noiseGradient({
  gradient: chroma.scale(["cyan", "magenta", "yellow"]).mode("lab"),
  xScale: 0.1,
  yScale: 0.1,
  frequency: 0.5,
  fixtures
});

const fire = noiseGradient({
  gradient: chroma.scale(["red", "orange", "yellow", "white"]).mode("lab"),
  xScale: 0.2,
  yScale: 0.1,
  ySpeed: 0.001,
  frequency: 0.5,
  fixtures
});

const mardiGras = noiseGradient({
  gradient: chroma.scale(["cyan", "magenta", "yellow"]).mode("rgb"),
  xScale: 0.2,
  yScale: 0.2,
  ySpeed: 0.002,
  frequency: 0.1,
  fixtures
});

const water = noiseGradient({
  gradient: chroma
    .scale([
      "#000066",
      chroma("cyan")
        .desaturate(1)
        .darken(4),
      "blue",
      "white"
    ])
    .mode("rgb"),
  xScale: 0.1,
  yScale: 0.2,
  ySpeed: 0.002,
  frequency: 0.4,
  fixtures
});

const dimOut = linearGradient({
  gradient: chroma.scale([chroma.lab(25, 30, 60), chroma.lab(80, 10, 0)]),
  fixtures
});

const solid = solidColor({ color: chroma.lab(25, 30, 50), fixtures });
const black = solidColor({ color: chroma("black"), fixtures });

function render(effect, ms) {
  const playEffect = effect => {
    const dmxData = effect(ms)
      .map(fixture => fixture.color.darken(2).rgb())
      .reduce((packet, rgbArray) => [...packet, ...rgbArray], []);

    //   console.log(dmxData);
    mk2.writeDmxData(dmxData, 1);
  };
  playEffect(effect);
}

const effects = [mardiGras, fire, patriotic, water, rainbow];

setInterval(() => {
  const ms = new Date().getTime() - startMs;
  const index = Math.floor(ms / 10000) % effects.length;
  //   render(rainbow, ms);
  render(effects[index], ms);
}, 15);
