"use strict";

const {path, round, ell, line} = require("../开篇九十秒/drawing.cjs");
const {SKIN} = require("../隔门一瓶水/characters/faces.cjs");
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

const clothes = {
  yu: {arm: [5.9, 4.55, 2.85], leg: [6.4, 4.22, 3.16], hand: [3.2, 2.85],
    sleeve: "#526071", farSleeve: "#44505f", pants: "#3e4b5c", farPants: "#313c4a"},
  mei: {arm: [5.65, 4.25, 2.66], leg: [5.85, 3.84, 2.99], hand: [3.1, 2.65],
    sleeve: "#9c794d", farSleeve: "#806242", pants: "#424757", farPants: "#323945"},
  xu: {arm: [4.0, 3.03, 1.91], leg: [4.25, 3.06, 2.11], hand: [2.55, 2.36],
    sleeve: "#527d99", shoulder: "#476e8c", farSleeve: "#3c5f76", pants: "#456984", farPants: "#33526a"},
  uncle: {arm: [7.3, 5.6, 3.45], leg: [6.95, 4.75, 3.45], hand: [3.65, 3.2],
    sleeve: "#556346", shoulder: "#657155", farSleeve: "#535d46", pants: "#505951", farPants: "#414846"}
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

function fitPelvis(rig, feet, {raise = false, cushioning = 0} = {}) {
  const minimumDrop = Math.max(...sides.map(side => {
    const [hip, knee, ankle] = limbParts(rig, side, "leg").map(part => part.pivot);
    const origin = bodyPoint(rig, hip);
    const [dx, dy] = sub(feet[side].point, origin);
    const limit = distance(hip, knee) + distance(knee, ankle) - .15;
    return dy - Math.sqrt(Math.max(0, limit * limit - dx * dx));
  }));
  rig.drop += (raise ? minimumDrop : Math.max(0, minimumDrop)) + cushioning;
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
    const result = solve(bodyPoint(rig, shoulder), target, distance(shoulder, elbow), distance(elbow, wrist), 1);
    rig.arms[side] = {...result, parts: arm};
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

function normal(a, b){
  const [x,y]=sub(b,a);
  const d=Math.hypot(x,y);
  return [-y/d,x/d];
}

function continuousLimb(ctx, {start, middle, end}, [top, joint, cuff], fill, rounded = false) {
  const n0=normal(start,middle), n1=normal(middle,end);
  const blended=add(n0,n1), length=Math.hypot(...blended);
  const unit=length>1e-6?blended.map(x=>x/length):n0;
  const a=mixPoint(start,middle,.72), b=mixPoint(middle,end,.24);
  const side=(v,n,w)=>[v[0]+n[0]*w,v[1]+n[1]*w];
  ctx.beginPath();
  ctx.moveTo(...side(start,n0,top));
  ctx.lineTo(...side(a,n0,joint));
  ctx.quadraticCurveTo(...side(middle,unit,joint),...side(b,n1,joint));
  ctx.lineTo(...side(end,n1,cuff));
  ctx.lineTo(...side(end,n1,-cuff));
  ctx.lineTo(...side(b,n1,-joint));
  ctx.quadraticCurveTo(...side(middle,unit,-joint),...side(a,n0,-joint));
  const rootLeft=side(start,n0,-top), rootRight=side(start,n0,top);
  ctx.lineTo(...rootLeft);
  if (rounded) {
    const back=[-n0[1],n0[0]];
    ctx.bezierCurveTo(...side(rootLeft,back,top*.96),...side(rootRight,back,top*.96),...rootRight);
  }
  ctx.closePath();
  ctx.fillStyle=fill;
  ctx.fill();
}

function drawLeg(ctx, rig, side) {
  const c=clothes[rig.id], leg=rig.legs[side];
  continuousLimb(ctx,leg,c.leg,side==="right"?c.pants:c.farPants);
  if(rig.id==="xu"&&side==="right"){
    line(ctx,[mixPoint(leg.start,leg.middle,.18),leg.middle,mixPoint(leg.middle,leg.end,.87)],"#bdc9ca",.75);
  }
  drawPart(ctx,leg.parts[2],leg.end,leg.angle);
}

function drawSleeve(ctx, rig, side) {
  const c=clothes[rig.id], arm=rig.arms[side];
  const near=side==="right";
  const widths=near?c.arm:c.arm.map(w=>w*.91);
  let fill=near?c.sleeve:c.farSleeve;
  if (near && c.shoulder) {
    const [x,y]=arm.start, radius=widths[0];
    fill=ctx.createRadialGradient(x,y,radius*1.12,x,y,radius*2.72);
    fill.addColorStop(0,c.shoulder);
    fill.addColorStop(1,c.sleeve);
  }
  continuousLimb(ctx,arm,widths,fill,near && Boolean(c.shoulder));
  if(rig.id==="xu"&&near){
    ctx.beginPath();
    ctx.moveTo(...mixPoint(arm.start,arm.middle,.22));
    ctx.lineTo(...mixPoint(arm.start,arm.middle,.78));
    ctx.quadraticCurveTo(...arm.middle,...mixPoint(arm.middle,arm.end,.24));
    ctx.lineTo(...mixPoint(arm.middle,arm.end,.78));
    ctx.strokeStyle="#d1d7cf";
    ctx.lineWidth=.78;
    ctx.stroke();
  }
}

function drawHand(ctx, rig, side) {
  const skin=SKIN[rig.id], {end}=rig.arms[side];
  ell(ctx,...end,...clothes[rig.id].hand,side==="right"?skin.main:skin.shade);
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

function drawFarArm(ctx, rig) {
  drawSleeve(ctx, rig, "left");
  drawHand(ctx, rig, "left");
}

function drawTorso(ctx, rig) {
  const items=rig.parts.get("torso").items;
  ctx.save();
  ctx.translate(...bodyPoint(rig,[0,0]));
  ctx.rotate(rig.lean);
  if (rig.id==="uncle") {
    const [neck, neckShade, coat, sideShade, , ...details]=items;
    shapes(ctx,[neck, neckShade, coat, sideShade, ...details]);
    path(ctx,"M-7.67 33.25 Q-.96 35.84 6.59 34.78",null,"#7b876e",1.16,true);
  } else {
    shapes(ctx,items);
  }
  ctx.restore();
}

function drawActor(ctx, rig, {overLegs, beforeNearHand, headset = false} = {}) {
  for (const side of sides) drawLeg(ctx, rig, side);
  overLegs?.();
  drawFarArm(ctx, rig);
  drawTorso(ctx, rig);
  drawHead(ctx, rig, headset);
  drawSleeve(ctx, rig, "right");
  beforeNearHand?.();
  drawHand(ctx, rig, "right");
}

module.exports = {radians, add, sub, mixPoint, rotate, distance, sides, sole, restFoot,
  createRig, bodyPoint, headPoint, fitPelvis, placeLimbs, drawActor, drawHead, drawSleeve, drawHand};
