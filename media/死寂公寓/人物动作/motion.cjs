"use strict";

const {clamp, ease, lerp, pulse} = require("../开篇九十秒/drawing.cjs");
const {poseFor} = require("../隔门一瓶水/characters/reference-style/face.cjs");
const {
  radians, add, sub, rotate, mixPoint, sides, sole, createRig, bodyPoint, headPoint,
  restFoot, fitPelvis, placeLimbs
} = require("./rig.cjs");

const FPS = 30;
const floor = 236;

// Smooth through intermediate poses, with stationary tangents at holds and direction changes.
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  if (t >= keys.at(-1)[0]) return keys.at(-1).slice(1);
  const next = keys.findIndex(key => key[0] > t);
  const a = keys[next - 1], b = keys[next];
  const dt = b[0] - a[0], u = (t - a[0]) / dt;
  const slope = (previous, current, following, i) => {
    if (!previous || !following) return 0;
    const incoming = (current[i] - previous[i]) / (current[0] - previous[0]);
    const outgoing = (following[i] - current[i]) / (following[0] - current[0]);
    return incoming * outgoing > 0 ? 2 * incoming * outgoing / (incoming + outgoing) : 0;
  };
  return a.slice(1).map((v, n) => {
    const i = n + 1;
    const m = slope(keys[next - 2], a, b, i) * dt;
    const k = slope(a, b, keys[next + 1], i) * dt;
    return lerp(v, b[i], u * u * (3 - 2 * u)) + u * (1 - u) * ((1 - u) * m - u * k);
  });
}

function faceAt(id, cues, blinks, t) {
  const i = cues.findLastIndex(([at]) => at <= t);
  const [at, name] = cues[i];
  const next = poseFor(id, name);
  const prev = i > 0 ? poseFor(id, cues[i - 1][1]) : next;
  const u = ease(at, at + .26, t);
  for (const key of Object.keys(next)) {
    if (typeof next[key] === "number") next[key] = lerp(prev[key], next[key], u);
    else if (u < .62) next[key] = prev[key];
  }
  next.blink = Math.max(0, ...blinks.map(at => pulse(at, at + .046, at + .078, at + .154, t)));
  return next;
}

function rolledFoot(id, x, angle, contact) {
  const mark = [x + sole[id][contact][0], floor];
  const pivot = [sole[id][contact][0], sole[id].flat];
  return {point: sub(mark, rotate(pivot, angle)), angle, marker: mark, contact};
}

function steppingFoot(rig, side, startX, steps, t) {
  let x = startX;
  for (const step of steps) {
    if (step.side !== side) continue;
    const {off, land, x: next, lift = 10.5} = step;
    if (t < off - .13) break;
    const toe = radians(19), heel = radians(-13);
    if (t < off) return rolledFoot(rig.id, x, toe * ease(off - .13, off, t), "toe");
    if (t < land) {
      const a = rolledFoot(rig.id, x, toe, "toe"), b = rolledFoot(rig.id, next, heel, "heel");
      const u = clamp((t - off) / (land - off));
      const point = mixPoint(a.point, b.point, ease(off, land, t));
      point[1] -= lift * Math.sin(Math.PI * u) ** 1.5;
      return {point, angle: lerp(toe, heel, ease(.07, .86, u)), marker: null, contact: "swing"};
    }
    if (t < land + .14) return rolledFoot(rig.id, next, heel * (1 - ease(land, land + .14, t)), "heel");
    x = next;
  }
  return restFoot(rig, side, floor, x);
}

const yuWalk = {
  id: "yu", feet: {left: 97, right: 109},
  x: [[0, 103], [.39, 105], [1.02, 118], [1.60, 143], [2.18, 172], [2.76, 201],
    [3.34, 231], [3.92, 259], [4.50, 288], [5.08, 310], [5.62, 320], [7.2, 320]],
  steps: [
    {side: "left", off: .49, land: 1.02, x: 128, lift: 8},
    {side: "right", off: 1.15, land: 1.60, x: 155},
    {side: "left", off: 1.73, land: 2.18, x: 184},
    {side: "right", off: 2.31, land: 2.76, x: 212},
    {side: "left", off: 2.89, land: 3.34, x: 240},
    {side: "right", off: 3.47, land: 3.92, x: 268},
    {side: "left", off: 4.05, land: 4.50, x: 296},
    {side: "right", off: 4.63, land: 5.08, x: 326},
    {side: "left", off: 5.20, land: 5.62, x: 312, lift: 6}
  ],
  activity: [.29, 1.15, 4.95, 5.8], cadence: .58,
  cues: [[0, "neutral"], [3.92, "alert"], [5.77, "doubt"]], blinks: [.29, 2.91, 5.87]
};

const uncleWalk = {
  id: "uncle", feet: {left: 155, right: 169},
  x: [[0, 162], [.22, 162], [.91, 176], [1.62, 195], [2.23, 205], [7.7, 205]],
  steps: [
    {side: "left", off: .29, land: .91, x: 185, lift: 8},
    {side: "right", off: 1.02, land: 1.62, x: 212, lift: 8.8},
    {side: "left", off: 1.75, land: 2.23, x: 200, lift: 5.9}
  ],
  activity: [.18, .91, 1.67, 2.35], cadence: .71,
  cues: [[0, "neutral"], [1.21, "alert"], [3.90, "worry"], [6.13, "doubt"]], blinks: [1.15, 4.52, 6.49]
};

function walker(plan, t, listen = false) {
  const active = pulse(...plan.activity, t);
  const cadence = Math.cos((t - plan.steps[0].land) * 2 * Math.PI / plan.cadence);
  const stopLook = ease(listen ? 1.65 : 4.91, listen ? 2.12 : 5.57, t);
  const touch = listen ? pulse(2.33, 3.17, 5.69, 6.59, t) : 0;
  const face = faceAt(plan.id, plan.cues, plan.blinks, t);
  face.lift -= .28 * stopLook;
  const rig = createRig(plan.id, track(plan.x, t)[0], floor, {
    drop: .48 + active * (3.05 + 1.12 * cadence),
    lean: active * (2.5 + .6 * cadence) - 1.25 * stopLook,
    tilt: -.43 * cadence * active - 3.5 * stopLook - 2.2 * touch, face
  });
  const feet = Object.fromEntries(sides.map(side => [side, steppingFoot(rig, side, plan.feet[side], plan.steps, t)]));
  fitPelvis(rig, feet);
  const swing = clamp((feet.right.point[0] - feet.left.point[0]) / 39, -1, 1) * active;
  const hands = Object.fromEntries(sides.map(side => {
    const rest = rig.parts.get(`${side}-arm-hand`).pivot;
    const amount = (side === "right" ? -1 : 1) * swing;
    return [side, {point: bodyPoint(rig, [rest[0] + 9.4 * amount, rest[1] - 2.4 * Math.abs(amount)])}];
  }));
  if (listen) {
    const contact = headPoint(rig, [-6.85, 15.6]);
    hands.right.point = mixPoint(hands.right.point, add(contact, [2.3, 8.1]), touch);
    hands.right.bend = -1;
    if (touch > .001) hands.right.angle = radians(165 * touch);
  }
  return {rig: placeLimbs(rig, feet, hands), headset: listen, handOverHead: touch > .35};
}

const bottleGrip = [-8.4, -13.4];
const bottleHome = [242, 161];
const bottleSet = [262, 161];
const bottleCues = [[0, "neutral"], [.62, "doubt"], [2.21, "worry"], [7.29, "relief"]];

function handleBottle(t) {
  const [bx, by, degrees] = track([
    [0, ...bottleHome, 0], [2.16, ...bottleHome, 0], [2.87, 239, 146.5, -6], [3.61, 239, 128.2, -11],
    [4.32, 242, 128.0, -17], [4.87, 243, 128.2, -11], [5.26, 246, 132.4, -6],
    [6.16, 253, 147, 3], [7.15, ...bottleSet, 0], [10.8, ...bottleSet, 0]
  ], t);
  const angle = radians(degrees);
  const grip = add([bx, by], rotate(bottleGrip, angle));
  const reach = pulse(.70, 1.82, 7.49, 8.94, t);
  const close = pulse(1.80, 2.10, 7.27, 7.68, t);
  const face = faceAt("mei", bottleCues, [.34, 3.23, 5.05, 8.27], t);
  face.gaze += .27 * reach;
  face.lift += .42 * reach;
  const [lean, tilt] = track([[0, 0, 0], [.62, 1, 2], [1.82, 10.6, 7.1], [2.16, 11, 6.8],
    [3.54, 4.0, 2.6], [4.36, 2.5, 4.1], [5.22, 5.6, 4.5], [7.13, 16.3, 5.6],
    [7.52, 15, 3.8], [9.1, 0, -1.2], [10.8, 0, -1.2]], t);
  const rig = createRig("mei", 209, floor, {lean, tilt, drop: .84 + 1.35 * reach, face});
  const feet = Object.fromEntries(sides.map(side => [side, restFoot(rig, side)]));
  fitPelvis(rig, feet);
  const wrist = bodyPoint(rig, rig.parts.get("right-arm-hand").pivot);
  const withdrawing = ease(7.31, 7.58, t);
  const approach = add(grip, [-6 * (1 - close) * (1 - reach) - 3.7 * withdrawing, -1.4 * (1 - reach)]);
  const attachment = mixPoint(approach, grip, close);
  return {rig: placeLimbs(rig, feet, {right: {point: mixPoint(wrist, attachment, reach),
    angle: radians(-78) * reach + angle * close}}), bottle: {point: [bx, by], angle, close}, reach};
}

const bowl = {point: [231.5, 175], hold: [218.8, 170.3]};
const spoonHome = {point: [241.6, 166.6], angle: radians(-17)};
const spoonTip = [-10.3, 0];
const spoonGrip = [1.7, 3.45];
const biteAnchor = [12.01, 18.30]; // Side mouth edge in the existing 小旭 expression model.
const mealCues = [[0, "neutral"], [.93, "doubt"], [2.65, "neutral"], [6.55, "relief"]];

function eat(t) {
  const holdingBowl = pulse(.38, 1.15, 8.76, 9.56, t);
  const holdingSpoon = pulse(.85, 1.78, 8.18, 9.48, t);
  const chewing = pulse(4.49, 4.65, 6.12, 6.26, t);
  const chew = chewing * Math.sin((t - 4.52) * 2 * Math.PI * 2.02);
  const swallow = pulse(6.18, 6.38, 6.53, 6.78, t);
  const face = faceAt("xu", mealCues, [.51, 3.48, 6.34, 9.7], t);
  face.lift += .37 * pulse(.4, 1.65, 3.73, 4.28, t);
  face.gaze += .24 * holdingBowl;
  if (t >= 3.98 && t < 4.29) face.mouth = "round";
  if (t >= 4.29 && t < 4.48 || chew > .70) face.mouth = "tiny";
  const rig = createRig("xu", 211, floor, {
    drop: 15.6, lean: 5.8 + 2.4 * holdingSpoon - 1.8 * chewing,
    tilt: 1.2 + 5.0 * pulse(.54, 2.02, 3.42, 4.31, t) + .94 * chew - 2.3 * swallow, face
  });
  const feet = {left: restFoot(rig, "left", 229, 222.0), right: restFoot(rig, "right", 229, 233.5)};
  const lip = headPoint(rig, biteAnchor);
  const biteAngle = radians(-4);
  const bite = sub(lip, rotate(spoonTip, biteAngle));
  const scoop = [239.4, 171.1], raised = [241.2, 160.8];
  let spoon = spoonHome.point, angle = spoonHome.angle;
  if (t >= 1.85 && t < 2.9) {
    spoon = mixPoint(spoonHome.point, scoop, ease(1.85, 2.68, t));
    angle = lerp(spoonHome.angle, radians(6), ease(1.95, 2.87, t));
  } else if (t >= 2.9 && t < 4.13) {
    const u = ease(2.90, 4.13, t);
    spoon = mixPoint(scoop, bite, u);
    spoon[1] -= 2.6 * Math.sin(Math.PI * u);
    angle = lerp(radians(6), biteAngle, u);
  } else if (t >= 4.13 && t <= 4.38) {
    spoon = bite; angle = biteAngle;
  } else if (t > 4.38 && t < 5.03) {
    const u = ease(4.38, 5.03, t);
    spoon = mixPoint(bite, raised, u); angle = lerp(biteAngle, radians(-11), u);
  } else if (t >= 5.03) {
    const u = ease(6.37, 7.87, t);
    spoon = mixPoint(raised, spoonHome.point, u); angle = lerp(radians(-11), spoonHome.angle, u);
  }
  const wrists = {};
  for (const [side, target, blend, armAngle] of [
    ["left", bowl.hold, holdingBowl, -.92],
    ["right", add(spoon, rotate(spoonGrip, angle)), holdingSpoon, -1.63 + angle]
  ]) {
    const idle = bodyPoint(rig, rig.parts.get(`${side}-arm-hand`).pivot);
    const lap = [rig.x + (side === "left" ? 7 : 12), idle[1] - 4.5];
    wrists[side] = {point: mixPoint(lap, target, blend), angle: blend * armAngle};
  }
  const spoonShape = {point: spoon, angle, food: t >= 2.72 && t < 4.22};
  return {rig: placeLimbs(rig, feet, wrists), bowl, spoon: spoonShape, holdingBowl, holdingSpoon, lip};
}

const shots = [
  {id: "walk", title: "走路与停步", name: "小宇", file: "01-走路与停步.png", duration: 7.2,
    keyframes: [[.24, "预备", "重心先移向支撑脚"], [1.60, "脚跟触地", "前脚落地，后脚仍承重"],
      [1.93, "摆脚通过", "后脚离地，从身体下方通过"], [2.12, "抬脚越过", "前腿伸出，对侧手臂前摆"],
      [6.03, "并步抬眼", "双脚站稳，再看向门口"]],
    faces: [[.17, "平静"], [4.49, "警觉"], [6.39, "疑惑"]], sample: t => walker(yuWalk, t)},
  {id: "bottle", title: "拿起与放下", name: "小美", file: "02-拿起与放下.png", duration: 10.8,
    keyframes: [[.35, "看物", "视线先找桌上的水瓶"], [1.58, "张手接近", "肩带肘向前，手指预备"],
      [3.90, "握紧提起", "手腕跟住瓶身，抬到胸前"], [7.15, "瓶底落桌", "瓶底碰到桌面，手还在"],
      [8.42, "松手回收", "瓶子停在新位置，手撤回"]],
    faces: [[.25, "平静"], [3.89, "担心"], [8.75, "松口气"]], sample: handleBottle},
  {id: "meal", title: "坐着吃饭", name: "小旭", file: "03-坐着吃饭.png", duration: 10.8,
    keyframes: [[.32, "坐稳", "脚踩横档，双手离桌"], [2.55, "扶碗舀饭", "左手扶碗，右手勺尖入碗"],
      [4.17, "送入口中", "勺尖碰唇，嘴随动作张开"], [5.12, "撤勺咀嚼", "口部合拢，右手停一下"],
      [8.64, "放勺抬眼", "勺子先落，手再离开"]],
    faces: [[1.34, "疑惑"], [4.16, "张嘴接勺"], [8.76, "松口气"]], sample: eat},
  {id: "listen", title: "停步听声", name: "大叔", file: "04-停步听声.png", duration: 7.7,
    keyframes: [[.63, "缓步", "步幅收短，肩部摆幅较小"], [1.70, "听见动静", "眼睛先朝声音方向抬起"],
      [2.35, "站稳", "双脚承重，停下半拍"], [3.55, "碰耳麦", "手指碰住耳罩，头略侧低"],
      [6.78, "放手等候", "手退离耳麦，视线仍留在原处"]],
    faces: [[.20, "平静"], [2.34, "警觉"], [4.92, "担心"]], sample: t => walker(uncleWalk, t, true)}
];

let frames = 0;
for (const shot of shots) {
  shot.from = frames;
  frames += Math.round(shot.duration * FPS);
  shot.to = frames;
}
const footsteps = {walk: yuWalk.steps, listen: uncleWalk.steps};

module.exports = {FPS, floor, frames, shots, footsteps, bottleGrip, bottleHome, bottleSet, spoonTip, spoonGrip};
