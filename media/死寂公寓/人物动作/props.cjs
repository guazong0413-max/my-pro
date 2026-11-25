"use strict";

const {path, rect, round, line, ell, poly, grad, place} = require("../开篇九十秒/drawing.cjs");
const {bottle: drawWaterBottle} = require("../开篇九十秒/places.cjs");
const {drawActor} = require("./rig.cjs");
const {mealDesk, mealEvents} = require("./motion.cjs");

function desk(ctx, x, y, depth = 8) {
  const w = 128;
  poly(ctx, [[x + 5, y + 3], [x + 11, y + 3], [x + 10, 236], [x + 6, 236]], "#554c45");
  poly(ctx, [[x + 98, y + 2], [x + 104, y + 2], [x + 107, 231], [x + 101, 231]], "#65564a");
  poly(ctx, [[x + 4, y - depth], [x + w - 10, y - depth], [x + w, y], [x, y]],
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

function water(ctx, state) {
  const {rig,bottle}=state;
  drawActor(ctx,rig,{
    overLegs:()=>desk(ctx,232,161),
    beforeNearHand:()=>{
      const [x,y]=bottle.point;
      if(y>152)ell(ctx,x+1.6,160,9,.92,"rgba(36,33,29,.22)");
      place(ctx,x,y,1,()=>drawWaterBottle(ctx,0,0,.80),false,bottle.angle);
    }
  });
}

function drawBowl(ctx, {point: [x, y], scale}, less) {
  place(ctx, x, y, scale, () => {
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

function drawBowlFront(ctx, {point: [x,y], scale}) {
  place(ctx,x,y,scale,()=>{
    path(ctx,"M-11.9 -6.3 C-11.9 -4.25 -6.6 -2.9 0 -2.9 C6.6 -2.9 11.9 -4.25 12 -6.3 Q10.3 -1.9 6.9 -.65 Q-.8 1.39 -7.1 -.63 Q-11.5 -2 -11.9 -6.3Z","#84908c");
    path(ctx,"M-11.9 -6.3 C-11.9 -4.25 -6.6 -2.9 0 -2.9 C6.6 -2.9 11.9 -4.25 12 -6.3",null,"#c4c4b1",.53);
    path(ctx,"M-5.16 -.94 Q-.91 -.2 4.17 -.92",null,"#afb2a6",.42);
  });
}

function drawSpoon(ctx, {point, angle, food}) {
  place(ctx,...point,1,()=>{
    path(ctx,"M-5.95 -.4 Q-.12 -.61 3.43 -.75 Q4.45 -.75 4.40 -.04 Q4.32 .56 3.44 .65 L-5.95 .4Z","#8e9b9d","#536264",.27);
    ell(ctx,-6.40,0,2.08,1.20,"#819094","#536467",.28);
    path(ctx,"M-8.18 -.22 Q-6.86 -.86 -5.40 -.30 Q-6.06 .21 -7.80 .25", "#c0c9c5");
    if(food) {
      ctx.translate(-1.05,0);
      path(ctx,"M-6.94 -.37 Q-6.45 -1.19 -6.01 -1.08 Q-5.61 -1.91 -5.04 -1.65 Q-4.32 -1.58 -4.35 -.51 Q-4.79 .33 -5.50 .45 Q-6.85 .46 -6.94 -.37Z","#d9bc8e","#ae916f",.23);
    }
  },false,angle);
}

function meal(ctx, state, t) {
  const {rig,bowl,spoon}=state;
  chair(ctx);
  drawActor(ctx,rig,{
    overLegs:()=>desk(ctx,...mealDesk),
    beforeNearHand:()=>{
      drawBowl(ctx,bowl,t>=mealEvents.bite+.09);
      drawSpoon(ctx,spoon);
      drawBowlFront(ctx,bowl);
    }
  });
}

function foreground(ctx, shot, state, t) {
  if (shot === "bottle") water(ctx, state);
  else if (shot === "meal") meal(ctx, state, t);
  else drawActor(ctx, state.rig, {headset: state.headset});
}

module.exports = {foreground, drawSpoon, drawBowl};
