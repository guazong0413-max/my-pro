"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {createCanvas, GlobalFonts, rect, round, line, ell, text, grad} = require("../开篇九十秒/drawing.cjs");
const {headPoint, drawHead} = require("./rig.cjs");
const {floor, shots} = require("./motion.cjs");
const {foreground} = require("./props.cjs");

const accent = {walk: "#a7c0de", bottle: "#dfba80", meal: "#97c8c5", listen: "#b2c294"};
const W = 1760, H = 1000;
const paper = "#e9e7de", muted = "#a8b5ba", stroke = "#384851";

function fonts() {
  const fonts = [
    [process.env.FILM_CJK_FONT, "FilmBold"],
    ["/System/Library/Fonts/STHeiti Light.ttc", "FilmSans"],
    ["/System/Library/Fonts/STHeiti Medium.ttc", "FilmBold"]
  ];
  for (const [file, name] of fonts) {
    if (file && fs.existsSync(file)) GlobalFonts.registerFromPath(file, name);
  }
}

function posePanel(ctx, shot, x, [t, label, note]) {
  const y = 160, width = 318, height = 553, ground = 620;
  const state = shot.sample(t);
  const {rig} = state;
  round(ctx, x, y, width, height, 12, "#212e38", stroke, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 49, width - 2, 431);
  ctx.clip();
  const colors = [[0, "#313f48"], [.78, "#2a3840"], [1, "#24313a"]];
  rect(ctx, x, y + 49, width, 431, grad(ctx, x, y + 49, x + width, ground, colors));
  const activities = shot.id === "bottle" || shot.id === "meal";
  const scale = shot.id === "meal" ? 3.66 : 2.13;
  const center = rig.x + (activities ? 20.5 : 3);
  const worldX = x + width / 2 - scale * center, worldY = ground - scale * floor;
  line(ctx, [[x + 18, ground], [x + width - 18, ground]], "#617179", 1.2);
  const ref = worldX + rig.x * scale;
  ctx.setLineDash([5, 7]);
  line(ctx, [[ref, y + 67], [ref, ground]], "rgba(154,173,179,.25)", 1);
  ctx.setLineDash([]);
  ctx.translate(worldX, worldY);
  ctx.scale(scale, scale);
  foreground(ctx, shot.id, state, t);
  ctx.restore();
  if (!activities) {
    for (const {marker} of Object.values(rig.feet)) {
      if (!marker) continue;
      const [fx, fy] = marker;
      ell(ctx, worldX + fx * scale, worldY + fy * scale + 1.5, 3.0, 2.4, accent[shot.id]);
    }
  }
  text(ctx, `${t.toFixed(2)} 秒`, x + 19, y + 31, 18, accent[shot.id]);
  text(ctx, label, x + 19, y + 516, 26, paper, "left", true);
  text(ctx, note, x + 19, y + 543, 17, muted);
}

function expressionStrip(ctx, shot) {
  const x = 55, y = 746;
  line(ctx, [[x, y], [W - 55, y]], stroke, 1);
  text(ctx, "表情", x, y + 56, 27, paper, "left", true);
  text(ctx, "取自对应动作帧", x, y + 87, 18, muted);

  const start = 344, gap = 18, width = 435, boxY = y + 24;
  for (const [i, [t, label]] of shot.faces.entries()) {
    const fx = start + (width + gap) * i;
    round(ctx, fx, boxY, width, 166, 10, "#202e38", stroke, 1);
    const {rig, headset} = shot.sample(t);
    const hint = headPoint(rig, [1, rig.id === "mei" ? 15 : 12]);
    ctx.save();
    ctx.translate(fx + 93, boxY + 83);
    ctx.scale(3.98, 3.98);
    ctx.translate(-hint[0], -hint[1]);
    drawHead(ctx, rig, headset);
    ctx.restore();
    line(ctx, [[fx + 175, boxY + 29], [fx + 175, boxY + 137]], stroke, 1);
    text(ctx, label, fx + 202, boxY + 79, 26, paper, "left", true);
    text(ctx, `${t.toFixed(2)} 秒`, fx + 203, boxY + 111, 18, accent[shot.id]);
  }
}

function sheet(shot) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  rect(ctx, 0, 0, W, H, grad(ctx, 0, 0, W, H, [[0, "#1c2934"], [1, "#15222c"]]));
  rect(ctx, 55, 36, 50, 3.5, accent[shot.id]);
  text(ctx, "死寂公寓", 55, 75, 23, muted);
  text(ctx, shot.title, 53, 134, 52, paper, "left", true);
  text(ctx, shot.name, W - 55, 72, 33, paper, "right", true);
  text(ctx, "侧面关键姿势", W - 55, 110, 21, accent[shot.id], "right");
  shot.keyframes.forEach((key, i) => posePanel(ctx, shot, 55 + 333 * i, key));
  expressionStrip(ctx, shot);
  return canvas;
}

function writeSheets(root) {
  fonts();
  fs.mkdirSync(root, {recursive: true});
  for (const shot of shots) {
    const file = path.join(root, shot.file);
    fs.writeFileSync(file, sheet(shot).toBuffer("image/png"));
    console.log(file);
  }
}

if (require.main === module) writeSheets(process.argv[2] ?? path.join(__dirname, "设计图"));
module.exports = {fonts, accent};
