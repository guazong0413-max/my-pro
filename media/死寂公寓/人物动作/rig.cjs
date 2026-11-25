"use strict";

const {path, round, ell} = require("../开篇九十秒/drawing.cjs");
const {models} = require("../隔门一瓶水/characters/models.cjs");
const {faceParts, poseFor, restOffset} = require("../隔门一瓶水/characters/reference-style/face.cjs");

const sides = ["left", "right"];
const radians = degrees => degrees * Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mixPoint = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const direction = ([x, y]) => Math.atan2(y, x);
function rotate([x, y], angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return [x * cos - y * sin, x * sin + y * cos];
}

const cast = Object.fromEntries(models.map(model => [model.id, model]));
const sole = {
  yu: {flat: 6.65, heel: [-4.5, 6.3], toe: [12.9, 6.15]},
  mei: {flat: 6.15, heel: [-4.5, 5.88], toe: [12.25, 5.78]},
  xu: {flat: 6.63, heel: [-4.3, 6.27], toe: [10.38, 6.28]},
  uncle: {flat: 7.47, heel: [-5.7, 7.24], toe: [14.15, 7.44]}
};

const index = Object.fromEntries(models.map(model => [model.id, Object.fromEntries(
  Object.entries(model.views).map(([view, value]) => [view, new Map(value.layers.map(part => [part.id, part]))])
)]));

function createRig(id, x, ground, {drop = 2.5, lean = 0, tilt = 0, face, view = "side"} = {}) {
  const model = cast[id], parts = index[id][view];
  const hips = mixPoint(parts.get("left-leg-thigh").pivot, parts.get("right-leg-thigh").pivot, .5);
  const expression = face ?? poseFor(id, "neutral");
  return {id, model, parts, view, x, ground, drop, hips, lean: radians(lean), tilt: radians(tilt + expression.tilt), expression};
}

function bodyPoint(rig, point) {
  const origin = [rig.x, rig.ground - rig.model.height + rig.drop];
  return add(add(origin, rig.hips), rotate(sub(point, rig.hips), rig.lean));
}

function headPoint(rig, point) {
  const pivot = rig.parts.get("head").pivot;
  const offset = [0, restOffset(rig.id, rig.view)];
  return bodyPoint(rig, add(add(pivot, offset), rotate(sub(point, pivot), rig.tilt)));
}

const limbNames = {arm: ["upper", "fore", "hand"], leg: ["thigh", "shin", "shoe"]};
function limbParts(rig, side, kind) {
  return limbNames[kind].map(name => rig.parts.get(`${side}-${kind}-${name}`));
}

function solve(start, target, upper, lower, bend) {
  const delta = sub(target, start);
  const wanted = Math.hypot(...delta);
  const axis = wanted > 0 ? delta.map(value => value / wanted) : [0, 1];
  const reach = Math.min(upper + lower - .001, Math.max(Math.abs(upper - lower) + .001, wanted));
  const projected = (upper * upper + reach * reach - lower * lower) / (2 * reach);
  const elbow = bend * Math.sqrt(Math.max(0, upper * upper - projected * projected));
  return {
    start,
    middle: add(start, [axis[0] * projected - axis[1] * elbow, axis[1] * projected + axis[0] * elbow]),
    end: add(start, axis.map(value => value * reach)),
    error: Math.abs(reach - wanted)
  };
}

function restFoot(rig, side, ground = rig.ground, x = rig.x + rig.parts.get(`${side}-leg-shoe`).pivot[0]) {
  return {point: [x, ground - sole[rig.id].flat], angle: 0, marker: [x + 2, ground], contact: "flat"};
}

function fitPelvis(rig, feet) {
  const minimumDrop = Math.max(...sides.map(side => {
    const [hip, knee, ankle] = limbParts(rig, side, "leg").map(part => part.pivot);
    const origin = bodyPoint(rig, hip);
    const [dx, dy] = sub(feet[side].point, origin);
    const limit = distance(hip, knee) + distance(knee, ankle) - .15;
    return dy - Math.sqrt(Math.max(0, limit * limit - dx * dx));
  }));
  rig.drop += Math.max(0, minimumDrop);
}

function placeLimbs(rig, feet, hands = {}) {
  rig.feet = feet;
  rig.legs = {};
  rig.arms = {};
  for (const side of sides) {
    const leg = limbParts(rig, side, "leg");
    const [hip, knee, ankle] = leg.map(part => part.pivot);
    rig.legs[side] = {...solve(bodyPoint(rig, hip), feet[side].point, distance(hip, knee), distance(knee, ankle), -1),
      parts: leg, angle: feet[side].angle};
    const arm = limbParts(rig, side, "arm");
    const [shoulder, elbow, wrist] = arm.map(part => part.pivot);
    const hand = hands[side];
    const target = hand?.point ?? bodyPoint(rig, wrist);
    const result = solve(bodyPoint(rig, shoulder), target, distance(shoulder, elbow), distance(elbow, wrist), hand?.bend ?? 1);
    const follow = direction(sub(result.end, result.middle)) - direction(sub(wrist, elbow));
    rig.arms[side] = {...result, parts: arm, angle: hand?.angle ?? follow};
  }
  return rig;
}

function shapes(ctx, items, stable = true) {
  for (const item of items) {
    switch (item.tag) {
      case "path": path(ctx, item.d, item.fill, item.stroke, item.width, stable); break;
      case "ellipse": ell(ctx, item.cx, item.cy, item.rx, item.ry, item.fill, item.stroke, item.width); break;
      case "rect": round(ctx, item.x, item.y, item.width, item.height, item.rx ?? 0, item.fill, item.stroke, item.sw); break;
      case "g":
        ctx.save();
        for (const [, op, raw] of item.transform.matchAll(/(translate|scale|rotate)\(([^)]+)\)/g)) {
          const [x, y, z] = raw.trim().split(/[ ,]+/).map(Number);
          if (op === "translate") ctx.translate(x, y ?? 0);
          if (op === "scale") ctx.scale(x, y ?? x);
          if (op === "rotate") {
            ctx.translate(y ?? 0, z ?? 0);
            ctx.rotate(radians(x));
            ctx.translate(-(y ?? 0), -(z ?? 0));
          }
        }
        shapes(ctx, item.items, stable);
        ctx.restore();
        break;
    }
  }
}

function drawPart(ctx, part, position, angle) {
  ctx.save();
  ctx.translate(...position);
  ctx.rotate(angle);
  ctx.translate(-part.pivot[0], -part.pivot[1]);
  shapes(ctx, part.items);
  ctx.restore();
}

function drawLimb(ctx, {parts: [upper, lower, endPart], start, middle, end, angle}, drawEnd) {
  drawPart(ctx, upper, start, direction(sub(middle, start)) - direction(sub(lower.pivot, upper.pivot)));
  drawPart(ctx, lower, middle, direction(sub(end, middle)) - direction(sub(endPart.pivot, lower.pivot)));
  if (drawEnd) drawPart(ctx, endPart, end, angle);
}

function drawHead(ctx, rig, headset = false) {
  const pivot = rig.parts.get("head").pivot;
  const face = faceParts(rig.model, rig.view, rig.expression);
  ctx.save();
  ctx.translate(...headPoint(rig, pivot));
  ctx.rotate(rig.lean + rig.tilt);
  ctx.translate(-pivot[0], -pivot[1]);
  shapes(ctx, face.base);
  for (const group of [face.brows, face.eyes, face.mouth]) shapes(ctx, group, false);
  if (headset) shapes(ctx, rig.parts.get("gear").items);
  ctx.restore();
}

function drawActor(ctx, rig, {omitHands = [], overLegs, headset = false, handOverHead = false} = {}) {
  for (const side of sides) drawLimb(ctx, rig.legs[side], true);
  overLegs?.();
  drawLimb(ctx, rig.arms.left, !omitHands.includes("left"));
  ctx.save();
  ctx.translate(...bodyPoint(rig, [0, 0]));
  ctx.rotate(rig.lean);
  shapes(ctx, rig.parts.get("torso").items);
  ctx.restore();
  drawLimb(ctx, rig.arms.right, !omitHands.includes("right") && !handOverHead);
  drawHead(ctx, rig, headset);
  if (handOverHead) {
    const {parts, end, angle} = rig.arms.right;
    drawPart(ctx, parts[2], end, angle);
  }
}

module.exports = {radians, add, sub, mixPoint, rotate, distance, sides, sole, restFoot,
  createRig, bodyPoint, headPoint, fitPelvis, placeLimbs, drawActor, drawHead};
