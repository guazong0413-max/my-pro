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
    const {off, land, x: next, lift = 4.8} = step;
    if (t < off - .10) break;
    const toe = radians(11), heel = radians(-7);
    if (t < off) return rolledFoot(rig.id, x, toe * ease(off - .10, off, t), "toe");
    if (t < land) {
      const a = rolledFoot(rig.id, x, toe, "toe"), b = rolledFoot(rig.id, next, heel, "heel");
      const u = clamp((t - off) / (land - off));
      const px = lerp(a.point[0], b.point[0], ease(0, 1, u));
      const angle = lerp(toe, heel, ease(.04, .91, u));
      const soleY = Math.max(...["heel", "toe"].map(name => rotate([sole[rig.id][name][0], sole[rig.id].flat], angle)[1]));
      const clearance = lift * Math.sin(Math.PI * u) ** 1.45;
      return {point: [px, floor - soleY - clearance], angle, marker: null, contact: "swing"};
    }
    if (t < land + .115) return rolledFoot(rig.id, next, heel * (1 - ease(land, land + .115, t)), "heel");
    x = next;
  }
  return restFoot(rig, side, floor, x);
}

const yuWalk = {
  id: "yu", feet: {left: 97, right: 109}, preload: 108, settle: 5.94,
  steps: [
    {side: "left", off: .50, land: 1.02, x: 128, lift: 4.2},
    {side: "right", off: 1.16, land: 1.60, x: 155},
    {side: "left", off: 1.74, land: 2.18, x: 184},
    {side: "right", off: 2.32, land: 2.76, x: 212},
    {side: "left", off: 2.90, land: 3.34, x: 240},
    {side: "right", off: 3.48, land: 3.92, x: 268},
    {side: "left", off: 4.06, land: 4.50, x: 296},
    {side: "right", off: 4.65, land: 5.08, x: 326},
    {side: "left", off: 5.24, land: 5.62, x: 312, lift: 3.25}
  ],
  activity: [.27, .88, 5.04, 5.88],
  cues: [[0, "neutral"], [4.50, "alert"], [5.99, "doubt"]], blinks: [.29, 2.91, 6.05]
};

const uncleWalk = {
  id: "uncle", feet: {left: 155, right: 169}, preload: 166, settle: 2.42,
  steps: [
    {side: "left", off: .36, land: .91, x: 184, lift: 3.8},
    {side: "right", off: 1.07, land: 1.62, x: 211, lift: 4.3},
    {side: "left", off: 1.79, land: 2.23, x: 199, lift: 3.1}
  ],
  activity: [.15, .75, 1.74, 2.45],
  cues: [[0, "neutral"], [1.21, "alert"], [3.90, "worry"], [6.13, "doubt"]], blinks: [1.15, 4.52, 6.49]
};

function pelvisKeys(plan) {
  const feet = {...plan.feet};
  const center = () => (feet.left + feet.right) * .5;
  const keys = [[0, center()], [plan.steps[0].off, plan.preload]];
  for (const step of plan.steps) {
    feet[step.side] = step.x;
    keys.push([step.land, center()]);
  }
  keys.at(-1)[1] -= 1.8;
  keys.push([plan.settle, center() + 1.1]);
  return keys;
}

const gaitKeys = {yu: pelvisKeys(yuWalk), uncle: pelvisKeys(uncleWalk)};
const ear = {reach: 2.51, contact: 3.48, release: 5.45, rest: 6.59};

function touchHeadset(rig, amount) {
  const {start, middle, end, parts} = rig.arms.right;
  const palm = headPoint(rig, [-3.05, 19.50]);
  const contact = sub(palm, start);
  const [elx, ely, wx, wy] = track([
    [0, ...sub(middle, start), ...sub(end, start)],
    [.22, 4.8, 25.0, 19.5, 40.5],
    [.57, 14.0, 20.1, 20.3, 3.8],
    [.80, 12.5, 12.4, 4.2, -6.1],
    [1, ...add(contact, [13.4, 21.15]), ...contact]
  ], amount);
  // The lifted upper arm turns inward in depth, so it is shorter in the side view.
  rig.arms.right = {start, middle: add(start, [elx, ely]), end: add(start, [wx, wy]), parts, error: 0};
  return palm;
}

function walker(plan, t, listen = false) {
  const active = pulse(...plan.activity, t);
  const stopLook = ease(listen ? 1.21 : 5.72, listen ? 1.85 : 6.22, t);
  const touch = listen ? clamp((t - ear.reach) / (ear.contact - ear.reach)) * clamp((ear.rest - t) / (ear.rest - ear.release)) : 0;
  const face = faceAt(plan.id, plan.cues, plan.blinks, t);
  face.lift -= .23 * stopLook;
  const rig = createRig(plan.id, track(gaitKeys[plan.id], t)[0], floor, {
    drop: .25, lean: 1.72 * active - .38 * stopLook,
    tilt: -2.0 * stopLook - 1.45 * ease(0, 1, touch), face
  });
  const feet = Object.fromEntries(sides.map(side => [side, steppingFoot(rig, side, plan.feet[side], plan.steps, t)]));
  const last = plan.steps.findLast(step => step.land <= t);
  const cushioning = .32 + (last ? .57 * pulse(last.land, last.land + .08, last.land + .12, last.land + .24, t) : 0);
  fitPelvis(rig, feet, {raise: true, cushioning});
  const swing = clamp((feet.right.point[0] - feet.left.point[0]) / 29, -1, 1) * active;
  const hands = Object.fromEntries(sides.map(side => {
    const rest = rig.parts.get(side+"-arm-hand").pivot;
    const offset = (side === "right" ? -1 : 1) * swing * (listen ? 4.2 : 6.4);
    return [side, {point: bodyPoint(rig, [rest[0] + offset, rest[1] - Math.abs(offset) * .24 - .64])}];
  }));
  placeLimbs(rig, feet, hands);
  const earPoint = touch > 0 ? touchHeadset(rig, touch) : null;
  return {rig, headset: listen, touch, earPoint};
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
  return {rig: placeLimbs(rig, feet, {right: {point: mixPoint(wrist, attachment, reach)}}), bottle: {point: [bx, by], angle, close}, reach};
}

const bowl = {point: [247.15, 173.55], scale: .79};
const mealDesk = [221.4, 179.85, 14];
const spoonHome = [233.65, 172.7, -151];
const spoonSet = [239.15, 176.85, 43];
const spoonTip = [-8.48, 0];
const spoonGrip = [3.55, 0];
const mealEvents = {pick: 1.77, scoop: 2.65, lift: 2.91, cut: 2.97, bite: 4.10, clear: 4.46, set: 7.84, release: 8.09};
const mealCues = [[0, "neutral"], [.80, "doubt"], [2.62, "neutral"], [6.36, "relief"]];

function eat(t) {
  const {pick, scoop, lift, cut, bite, clear, set, release} = mealEvents;
  const engaged = pulse(.55, 1.97, 8.15, 9.21, t);
  const chewing = pulse(4.64, 4.78, 5.90, 6.14, t);
  const chew = chewing * Math.sin((t - 4.64) * 2 * Math.PI * 1.65);
  const swallow = pulse(6.05, 6.29, 6.45, 6.70, t);
  const face = faceAt("xu", mealCues, [.51, 3.31, 6.61, 9.55], t);
  face.lift += .28 * pulse(.50, 1.63, 3.32, 3.97, t);
  face.gaze += .21 * engaged;
  if (t >= 3.96 && t < 4.26) face.mouth = "round";
  else if (chew > .56) face.mouth = "tiny";
  const rig = createRig("xu", 211, floor, {
    drop: 15.6, lean: 5.4 + 2.05 * engaged - 1.2 * chewing,
    tilt: 1.35 + 3.4 * pulse(.53, 1.94, 3.30, 3.97, t) + .51 * chew - 1.58 * swallow, face
  });
  const feet = {left: restFoot(rig, "left", 229, 222.0), right: restFoot(rig, "right", 229, 233.5)};

  const lip = headPoint(rig, [12.01, 18.30]);
  const faceEdge = headPoint(rig, [12.92, 18.42]);
  const biteAngle = radians(-6);
  const biteTip = add(faceEdge, [.93, .15]);
  const bitePalm = sub(biteTip, rotate(sub(spoonTip, spoonGrip), biteAngle));
  const pickup = [
    [0, ...spoonHome], [pick, ...spoonHome],
    [2.02, 228.26, 169.9, -134],
    [2.23, 230.7, 160.75, -108],
    [2.45, 239.75, 153.4, -102],
    [scoop, 240.30, 157.03, -105],
    [lift, 240.02, 150.2, -87],
    [cut, 240.55, 149.45, -83]
  ];
  const biteAndReturn = [
    [cut, 243.42, 154.25, -1.5],
    [3.42, 243.25, 152.15, -4],
    [bite, ...bitePalm, -6], [4.22, ...bitePalm, -6],
    [clear, 242.25, 153.25, -7],
    [5.14, 240.55, 158.4, -.5], [6.34, 240.55, 158.4, -.5],
    [6.53, 234.05, 159.75, -4], [6.85, 233.79, 167.0, 47], [7.33, 233.42, 175.7, 50],
    [set, ...spoonSet], [10.8, ...spoonSet]
  ];
  const [hx, hy, degrees] = track(t < cut ? pickup : biteAndReturn, t);
  const handle = [hx, hy], angle = radians(degrees);
  const point = sub(handle, rotate(spoonGrip, angle));
  const tip = add(point, rotate(spoonTip, angle));
  const right = track([
    [0, 219.75, 186.65], [.62, 219.75, 186.65], [1.21, 224.4, 174.7],
    [pick, ...handle], [release, ...handle], [8.47, 231.0, 179.55],
    [9.24, 219.75, 186.65], [10.8, 219.75, 186.65]
  ], t);
  const left = bodyPoint(rig, [-3.5, 60.6]);
  const spoon = {point, angle, tip, handle, food: t >= lift && t < 4.19};
  return {rig: placeLimbs(rig, feet, {left: {point: left}, right: {point: right}}), bowl, spoon, lip, faceEdge};
}
const shots = [
  {id: "walk", title: "走路与停步", name: "小宇", file: "01-走路与停步.png", duration: 7.2,
    keyframes: [[.35, "预备", "先把胯移向支撑脚"], [1.60, "脚跟触地", "前脚定点，双脚短暂接地"],
      [1.97, "单脚承重", "胯从支撑脚上方经过"], [2.14, "摆脚落下", "脚尖贴近地面，准备换脚"],
      [6.18, "停稳抬眼", "收好后脚，再看向门口"]],
    faces: [[.17, "平静"], [4.78, "警觉"], [6.39, "疑惑"]], sample: t => walker(yuWalk, t)},
  {id: "bottle", title: "拿起与放下", name: "小美", file: "02-拿起与放下.png", duration: 10.8,
    keyframes: [[.35, "看物", "视线先找桌上的水瓶"], [1.58, "接近瓶身", "手肘向下，圆手贴近瓶侧"],
      [3.90, "握紧提起", "手腕跟住瓶身，抬到胸前"], [7.15, "瓶底落桌", "瓶底碰到桌面，手还在"],
      [8.42, "松手回收", "瓶子停在新位置，手撤回"]],
    faces: [[.25, "平静"], [3.89, "担心"], [8.75, "松口气"]], sample: handleBottle},
  {id: "meal", title: "坐着吃饭", name: "小旭", file: "03-坐着吃饭.png", duration: 10.8,
    keyframes: [[.32, "坐稳", "胯落在椅面，双脚踩横档"], [2.65, "舀饭", "勺头入碗，整个手和袖子在碗外"],
      [4.16, "送到嘴边", "勺尖停在唇前，圆手在把手末端"], [5.12, "撤勺咀嚼", "勺子退开后才开始咀嚼"],
      [8.70, "放勺抬眼", "勺子放在碗旁空出的桌面"]],
    faces: [[1.34, "疑惑"], [4.16, "微张嘴"], [8.76, "松口气"]], sample: eat},
  {id: "listen", title: "停步听声", name: "大叔", file: "04-停步听声.png", duration: 7.7,
    keyframes: [[.63, "缓步", "胯稳在支撑脚上方"], [1.70, "听见动静", "眼睛先朝声音方向抬起"],
      [2.46, "站稳", "双脚承重，停下半拍"], [3.55, "碰耳麦", "肘向前下方，圆手贴耳罩"],
      [6.78, "放手等候", "沿来路回手，视线仍留在原处"]],
    faces: [[.20, "平静"], [2.34, "警觉"], [4.92, "担心"]], sample: t => walker(uncleWalk, t, true)}
];

let frames = 0;
for (const shot of shots) {
  shot.from = frames;
  frames += Math.round(shot.duration * FPS);
  shot.to = frames;
}
const footsteps = {walk: yuWalk.steps, listen: uncleWalk.steps};

module.exports = {FPS, floor, frames, shots, footsteps, bottleGrip, bottleHome, bottleSet, spoonTip, spoonGrip, mealDesk, mealEvents, ear};
