"use strict";

const {path, rect, round, line, ell, poly, grad, place} = require("../开篇九十秒/drawing.cjs");
const {bottle: drawWaterBottle} = require("../开篇九十秒/places.cjs");
const {SKIN} = require("../隔门一瓶水/characters/faces.cjs");
const {drawActor} = require("./rig.cjs");

function desk(ctx, x, y) {
  const w = 128;
  poly(ctx, [[x + 5, y + 3], [x + 11, y + 3], [x + 10, 236], [x + 6, 236]], "#554c45");
  poly(ctx, [[x + 98, y + 2], [x + 104, y + 2], [x + 107, 231], [x + 101, 231]], "#65564a");
  poly(ctx, [[x + 4, y - 8], [x + w - 10, y - 8], [x + w, y], [x, y]],
    grad(ctx, x, y, x + w, y, [[0, "#a1866a"], [.59, "#82664f"], [1, "#6c5749"]]));
  rect(ctx, x, y, w, 5, "#6a5548");
  rect(ctx, x + 1, y + .45, w - 2, .7, "#c09d7d");
  line(ctx, [[x + 2, y + 4.6], [x + w - 3, y + 4.6]], "#493e37", .55);
  path(ctx, `M${x + 42} ${y - 2.8} q15 -1 35 -.6 m9 -.9 q7 .18 14 .25`, null, "#927660", .36);
}

function chair(ctx) {
  ell(ctx, 213, 236, 24, 2.4, "rgba(22,28,30,.22)");
  poly(ctx, [[187, 173], [191.5, 172.3], [197.4, 235], [193, 235.4]], "#5c4c40");
  poly(ctx, [[218, 201], [223, 201], [229, 235.7], [224.8, 235.7]], "#5c4c40");
  round(ctx, 186, 170, 17.5, 7, 1.7, "#84705a", "#54463d", .55);
  round(ctx, 190.8, 199, 36.2, 5.4, 1.5, "#8c755c", "#5b4e41", .65);
  poly(ctx, [[195, 226], [245, 226], [249, 229], [197, 229]], "#7b6655");
  rect(ctx, 197, 229, 52, 2.8, "#615246");
  rect(ctx, 197, 228.7, 51, .5, "#a78d72");
}

function gripBottle(ctx, rig, bottle, front) {
  const wrist = rig.arms.right.end;
  const skin = SKIN[rig.id];
  const reach = 5.5 + 3.5 * bottle.close;
  place(ctx, ...wrist, 1, () => {
    if (!front) {
      path(ctx, `M-1.9 -2.6 Q.4 -3.6 3.1 -2.85 L${reach - 1} -1.9 Q${reach + 1.4} -.6 ${reach + 1.05} 2.2 Q${reach + .45} 4.25 ${reach - .75} 4.2 L2.8 3.45 Q.3 3.38 -1.8 2.45Z`,
        skin.shade, skin.mouth, .25);
      return;
    }
    path(ctx, `M-1.75 -2.3 Q.3 -2.85 2.15 -2.4 L4.1 -4.5 Q5.65 -5.16 6.24 -4.22 Q6.7 -3.42 5.83 -2.58 L4.55 -.97 Q5.7 -1.17 6.85 -1.14 L${reach} -.75 Q${reach + 1.25} -.15 ${reach + .7} 1.04 Q${reach + .42} 1.54 ${reach - .24} 1.67 Q${reach + .45} 2.89 ${reach - .59} 3.56 L4.10 3.65 Q2 3.3 -.9 2.53Z`,
      skin.main, skin.shade, .32);
    path(ctx, `M4.51 -.91 Q5.67 -.7 6.05 -.2 M${reach - .35} 1.7 Q6.7 1.49 5.58 1.66 M.02 -1.47 Q1.41 -1.7 2.39 -1.24`,
      null, skin.mouth, .24);
  }, false, bottle.angle - .23 * (1 - bottle.close));
}

function water(ctx, state) {
  const {rig, bottle} = state;
  const grip = bottle.close > .25;
  drawActor(ctx, rig, {omitHands: grip ? ["right"] : [], overLegs: () => desk(ctx, 232, 161)});
  if (grip) gripBottle(ctx, rig, bottle, false);
  const [x, y] = bottle.point;
  if (y > 152) ell(ctx, x + 1.6, 160, 9, .92, "rgba(36,33,29,.22)");
  place(ctx, x, y, 1, () => drawWaterBottle(ctx, 0, 0, .80), false, bottle.angle);
  if (grip) gripBottle(ctx, rig, bottle, true);
}

function drawBowl(ctx, {point: [x, y]}, less) {
  place(ctx, x, y, 1, () => {
    ell(ctx, 0, -.1, 13.9, 1.55, "rgba(32,29,26,.25)");
    path(ctx, "M-11.9 -6.3 Q-11.5 -2 -7.1 -.63 Q-.8 1.39 6.9 -.65 Q10.3 -1.9 12 -6.3Z", "#84908c", "#495e5f", .52);
    path(ctx, "M-10.6 -4.65 Q-5.2 -2.65 5.93 -3.39 Q8.3 -3.69 10.49 -5.1 M-5.16 -.94 Q-.91 -.2 4.17 -.92", null, "#afb2a6", .42);
    ell(ctx, 0, -6.34, 12.05, 3.47, "#c3c1af", "#5f7474", .51);
    ell(ctx, 0, -6.47, 10.20, 2.36, "#797d71");
    ell(ctx, less ? .6 : 0, -6.1, less ? 8.4 : 9.6, less ? 1.62 : 2.04, "#c9b28c");
    path(ctx, "M-6.6 -6.37 q2.2 -.83 4.14 -.36 m3.6 .03 q2.4 -.67 4.8 -.05 m-6.45 1.42 l1.8 -.14 m3.1 -.36 l1.44 .27",
      null, "#e3cfaa", .42);
  });
}

function drawSpoon(ctx, {point, angle, food}) {
  place(ctx, ...point, 1, () => {
    path(ctx, "M-6.8 -.43 Q-.3 -.8 4.19 -1.04 Q5.52 -1.05 5.42 -.14 Q5.25 .74 4.15 .76 L-6.9 .43Z", "#8e9b9d", "#536264", .32);
    path(ctx, "M-5.51 -.36 Q-.44 -.63 4.39 -.77", null, "#d3d8d1", .31);
    ell(ctx, -7.4, 0, 2.9, 1.34, "#718083", "#4f6264", .34);
    path(ctx, "M-10.08 -.14 Q-8.3 -1.36 -5.77 -.23 Q-7.4 .64 -9.4 .30", "#c0c9c5");
    if (food) path(ctx, "M-9.62 -.49 Q-8.82 -1.16 -8.28 -1.13 Q-8.01 -2.23 -7.1 -2.06 Q-6.19 -2.28 -5.86 -.64 Q-6.53 .48 -7.87 .52 Q-9.34 .41 -9.62 -.49Z", "#d9bc8e", "#ae916f", .28);
  }, false, angle);
}

function mealGrip(ctx, rig, side, angle) {
  const skin = SKIN[rig.id];
  const {end} = rig.arms[side];
  place(ctx, ...end, 1, () => {
    if (side === "left") {
      path(ctx, "M-2.05 -1.32 Q.67 -2.65 2.81 -2.96 Q5.44 -3.73 5.65 -2.73 Q5.77 -2.07 4.44 -1.7 Q6.35 -1.82 6.47 -.85 Q6.42 -.04 5.02 .12 L2.25 .78 Q.73 2.4 -1.91 2.01Z", skin.main, skin.shade, .34);
      path(ctx, "M2.97 -1.28 l1.48 -.36", null, skin.mouth, .23);
      return;
    }
    path(ctx, "M-2.16 .87 Q-2.6 -.47 -2.3 -2.5 Q-2.58 -4.29 -1.74 -4.59 Q-.71 -4.98 -.25 -3.55 Q1.33 -4.5 2.08 -4.08 Q2.74 -3.76 2.53 -3.21 Q3.68 -3.49 3.85 -2.66 Q3.81 -1.39 3.07 -.52 Q2.05 1.62 .44 2.17Z", skin.main, skin.shade, .32);
    path(ctx, "M-.25 -3.4 Q.03 -2.16 1.37 -2.14 M2.53 -3.17 l-.45 .81", null, skin.mouth, .25);
  }, false, angle);
}

function meal(ctx, state) {
  const {rig, bowl, spoon, holdingBowl, holdingSpoon, t} = state;
  chair(ctx);
  const omitHands = [];
  if (holdingBowl > .79) omitHands.push("left");
  if (holdingSpoon > .83) omitHands.push("right");
  drawActor(ctx, rig, {omitHands, overLegs: () => desk(ctx, 224, 175)});
  drawBowl(ctx, bowl, t >= 4.22);
  if (omitHands.includes("left")) mealGrip(ctx, rig, "left", 0);
  drawSpoon(ctx, spoon);
  if (omitHands.includes("right")) mealGrip(ctx, rig, "right", spoon.angle);
}

function foreground(ctx, shot, state, t) {
  if (shot === "bottle") water(ctx, state);
  else if (shot === "meal") meal(ctx, {...state, t});
  else drawActor(ctx, state.rig, {headset: state.headset, handOverHead: state.handOverHead});
}

module.exports = {foreground};
