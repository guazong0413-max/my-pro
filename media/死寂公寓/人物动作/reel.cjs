"use strict";

const path = require("node:path");
const {spawn} = require("node:child_process");
const {once} = require("node:events");
const {Readable} = require("node:stream");
const {pipeline} = require("node:stream/promises");
const {createCanvas, rect, ell, grad, text, ease, pulse, rand} = require("../开篇九十秒/drawing.cjs");
const {FPS, floor, frames, shots, mealEvents} = require("./motion.cjs");
const {fonts, accent} = require("./design.cjs");
const {backdrop} = require("./sets.cjs");
const {foreground} = require("./props.cjs");
const {wav} = require("./foley.cjs");

function camera(id, t) {
  if (id === "walk") return [211, 133, 2.23];
  if (id === "bottle") {
    if (t >= 1.39 && t < 8.45) return [239 + 6.9 * ease(4.7, 7.17, t), 122, 4.22];
    return [239, 134, 2.28];
  }
  if (id === "meal") {
    if (t >= 2.19 && t < mealEvents.cut) return [255, 166, 10.65];
    if (t >= mealEvents.cut && t < 8.71) return [229, 155.5, 4.91];
    return [227, 168, 2.81];
  }
  if (t >= 2.52) return [211, 102, 4.83];
  return [217, 134, 2.30];
}

function shadows(ctx, {rig}, id) {
  if (id === "meal") return;
  ell(ctx, rig.x + 3, floor + 1.8, 29, 3.1, "rgba(16,24,28,.12)");
  for (const foot of Object.values(rig.feet)) {
    if (foot.marker) ell(ctx, foot.marker[0] + 2, floor + .22, 7.8, .92, "rgba(17,24,29,.21)");
  }
}

function texture(ctx) {
  const tile = createCanvas(112, 100);
  const tc = tile.getContext("2d");
  for (let i = 0; i < 1020; i++) {
    const a = rand(i + 259) * .092 + .016;
    tc.fillStyle = i % 2 ? `rgba(248,226,197,${a})` : `rgba(27,37,46,${a})`;
    const size = rand(i + 34) + .30;
    tc.fillRect(rand(i + 385) * 112, rand(i + 203) * 100, size, size);
  }
  return ctx.createPattern(tile, "repeat");
}

function createRenderer(canvas) {
  fonts();
  const ctx = canvas.getContext("2d");
  const scale = canvas.width / 960;
  const grain = texture(ctx);
  return index => {
    const shot = shots.find(({to}) => index < to) ?? shots.at(-1);
    const t = (index - shot.from) / FPS;
    const state = shot.sample(t);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    rect(ctx, 0, 0, 960, 540, "#39464a");
    ctx.save();
    const [cx, cy, zoom] = camera(shot.id, t);
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
    backdrop(ctx, shot.id, t);
    shadows(ctx, state, shot.id);
    foreground(ctx, shot.id, state, t);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = .33;
    rect(ctx, 0, 0, 960, 540, grain);
    ctx.restore();
    const shade = ctx.createRadialGradient(474, 272, 137, 474, 272, 553);
    shade.addColorStop(0, "rgba(15,23,27,0)");
    shade.addColorStop(1, "rgba(15,23,27,.31)");
    rect(ctx, 0, 0, 960, 540, shade);

    const label = pulse(.05, .34, 1.72, 2.19, t);
    if (label > 0) {
      ctx.save();
      ctx.globalAlpha = label;
      rect(ctx, 0, 0, 325, 113, grad(ctx, 0, 12, 324, 120, [[0, "rgba(21,31,37,.70)"], [1, "rgba(21,31,37,0)"]]));
      rect(ctx, 32, 27, 37, 1.6, accent[shot.id]);
      text(ctx, shot.id === "walk" ? "死寂公寓  /  人物动作" : shot.name, 32, 48, 13.5, "#d2d8d4");
      text(ctx, shot.title, 31, 78, 24, "#f0ece0", "left", true);
      ctx.restore();
    }
    const tGlobal = index / FPS;
    const fade = Math.max(1 - ease(0, .29, tGlobal), ease(frames / FPS - .47, frames / FPS, tGlobal));
    if (fade > 0) rect(ctx, 0, 0, 960, 540, `rgba(19,26,31,${fade})`);
  };
}

async function render(file) {
  const width = 1920, height = 1080;
  const canvas = createCanvas(width, height);
  const draw = createRenderer(canvas);
  const command = process.env.FFMPEG ?? "ffmpeg";
  const encoder = spawn(command, [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
    "-f", "rawvideo", "-pixel_format", "rgba", "-video_size", `${width}x${height}`,
    "-framerate", String(FPS), "-i", "pipe:0", "-f", "wav", "-i", "pipe:3",
    "-map", "0:v:0", "-map", "1:a:0", "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-threads", "6", "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", file
  ], {stdio: ["pipe", "ignore", "inherit", "pipe"]});
  const done = once(encoder, "exit");
  async function* images() {
    for (let index = 0; index < frames; index++) {
      draw(index);
      yield canvas.data();
      if (shots.some(({to}) => index + 1 === to)) console.log(`${((index + 1) / FPS).toFixed(2)} 秒`);
    }
  }
  try {
    const [[code]] = await Promise.all([
      done, pipeline(Readable.from(images()), encoder.stdin), pipeline(Readable.from([wav()]), encoder.stdio[3])
    ]);
    if (code !== 0) throw new Error(`FFmpeg exited with ${code}`);
  } catch (error) {
    if (encoder.exitCode === null) encoder.kill();
    throw error;
  }
  console.log(file);
}

if (require.main === module) {
  const dest = process.argv[2] ?? path.join(__dirname, "死寂公寓-人物动作样片.mp4");
  render(dest).catch(error => { console.error(error); process.exitCode = 1; });
}

module.exports = {createRenderer};
