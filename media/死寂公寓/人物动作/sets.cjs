"use strict";

const {rect, round, ell, line, path, poly, grad, glow, rand} = require("../开篇九十秒/drawing.cjs");

const rooms = {
  walk: {wall: ["#788482", "#555f5f", "#49585d"], floor: ["#4f5457", "#353d44"], trim: "#424b50", joints: "#434b50"},
  bottle: {wall: ["#a69980", "#8a7d68", "#6e6c61"], floor: ["#767366", "#53554e"], trim: "#676456", joints: "#68675c"},
  meal: {wall: ["#9d9180", "#a39889", "#77786e"], floor: ["#736d62", "#55554e"], trim: "#655f54", joints: "#69645a"},
  listen: {wall: ["#68787b", "#576469", "#414f59"], floor: ["#444e55", "#333a42"], trim: "#3c4850", joints: "#414b53"}
};

function room(ctx, id) {
  const p = rooms[id];
  rect(ctx, -60, -35, 600, 282, grad(ctx, 24, 2, 481, 238,
    [[0, p.wall[0]], [.5, p.wall[1]], [1, p.wall[2]]]));
  rect(ctx, -60, 224, 600, 96, grad(ctx, 0, 223, 8, 307, [[0, p.floor[0]], [1, p.floor[1]]]));
  rect(ctx, -60, 218, 600, 6.6, p.trim);
  rect(ctx, -60, 218, 600, .65, "rgba(215,219,200,.20)");
  for (const y of [231.5, 246.4, 265.8, 289.0]) line(ctx, [[-60, y], [540, y]], p.joints, .45);
  for (let i = -1; i <= 8; i++) {
    const x = i * 68;
    line(ctx, [[x, 224], [x + (x - 245) * .24, 307]], p.joints, .46);
  }
  for (let i = 0; i < 55; i++) {
    const x = rand(i + 302) * 520 - 18, y = 21 + rand(i + 418) * 192;
    const w = 1.5 + rand(i + 613) * 10;
    path(ctx, `M${x} ${y} q${w * .53} ${rand(i) * 1.8 - .9} ${w} ${rand(i + 72) - .75}`,
      null, i % 2 ? "rgba(42,47,50,.075)" : "rgba(234,223,193,.105)", .45);
  }
}

function door(ctx, x, y, w, h, paint, warm = false) {
  rect(ctx, x - 5, y - 3, w + 13, h + 9, "rgba(25,30,33,.25)");
  rect(ctx, x - 2, y - 2, w + 4, h + 4, warm ? "#695e50" : "#3b494d");
  rect(ctx, x, y, w, h, paint);
  rect(ctx, x + 4, y + 5, w - 8, h - 9, grad(ctx, x, y, x + w, y + h, [[0, "rgba(205,214,204,.12)"], [1, "rgba(9,16,22,.10)"]]));
  round(ctx, x + 8.3, y + 14, w - 16.6, h - 37, .8, null, "rgba(29,35,38,.28)", .62);
  round(ctx, x + 9.2, y + 14.9, w - 18.5, h - 37.9, .8, null, "rgba(201,204,187,.14)", .52);
  ell(ctx, x + w * .54, y + h * .31, .99, .9, "#2f393a", "#999882", .29);
  round(ctx, x + w - 12, y + h * .56, 3.5, 12.3, .8, "#424748");
  round(ctx, x + w - 15, y + h * .56 + 2.2, 7.7, 1.6, .69, "#a5a290", "#343b39", .33);
  line(ctx, [[x - 1, y + h + 1], [x + w + 2, y + h + 1]], "#9a9985", .8);
  for (let i = 0; i < 2; i++) rect(ctx, x - 1, y + 22 + 90 * i, 2.1, 5.5, "#676a62");
}

function window(ctx, x, y, w, h, t, warm) {
  rect(ctx, x - 4, y - 3, w + 8, h + 8, "rgba(31,41,43,.21)");
  rect(ctx, x, y, w, h, grad(ctx, x, y, x + w, y + h, [[0, "#afbabc"], [.60, "#929fa0"], [1, "#67787e"]]));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const city = y + h * .58;
  for (let i = 0; i < 10; i++) {
    const tower = x - 6 + w * .117 * i;
    const top = city - (6 + rand(i + 484) * 25);
    rect(ctx, tower, top, 7.5 + w * .066, h, i % 3 ? "#788b90" : "#6e828a");
    for (let row = 0; row < 5; row++) {
      for (let j = 0; j < 2; j++) {
        const bright = rand(i * 10 + row + j * 43) > .83;
        rect(ctx, tower + 2 + j * 5.2, top + 5 + 6.7 * row, 1.9, 2.5, bright ? "#adada0" : "#687b83");
      }
    }
  }
  for (let i = 0; i < 20; i++) {
    const rx = x + ((rand(i + 28) * w + t * 2.1) % w);
    const ry = y + ((rand(i + 61) * h + t * (17 + i * .53)) % h);
    line(ctx, [[rx, ry], [rx - 1.1, ry + 3.3]], "rgba(213,223,215,.25)", .45);
  }
  poly(ctx, [[x - 1, y + 10], [x + 9, y], [x + w * .64, y], [x, y + h * .78]], "rgba(231,228,202,.075)");
  ctx.restore();
  round(ctx, x, y, w, h, .4, null, warm ? "#8f8879" : "#57696e", 2.2);
  rect(ctx, x + w * .51 - .9, y, 2.4, h, warm ? "#9d9686" : "#65787b");
  rect(ctx, x, y + h * .55, w, 1.9, warm ? "#9d9686" : "#65787b");
  rect(ctx, x - 3, y + h, w + 6, 3.4, warm ? "#c0b39a" : "#7a8580");
}

function sconce(ctx, x, y, warm) {
  glow(ctx, x, y + 16, 65, 62, warm ? "rgba(237,185,111,.26)" : "rgba(191,218,205,.20)");
  round(ctx, x - 12, y - 3, 24, 7.0, 1.4, "#474f4c");
  round(ctx, x - 9.3, y, 18.6, 2.9, 1, warm ? "#e6c89e" : "#c6d7c6");
}

function hallway(ctx, id, t) {
  const blue = id === "listen";
  rect(ctx, 131, -12, 5, 232, "rgba(33,40,46,.13)");
  rect(ctx, 136, -12, 4, 232, "rgba(188,186,162,.15)");
  path(ctx, "M-20 36 L135 39 L157 35 L334 35 L345 30 L501 30", null, "#444e53", 1.4);
  path(ctx, "M-20 37.7 L135 40.7 L157 36.7 L334 36.7 L345 31.7 L501 31.7", null, "rgba(200,202,184,.44)", .51);
  if (blue) {
    door(ctx, 340, 64, 86, 154, "#52616b");
    door(ctx, 63, 73, 69, 145, "#546166");
    round(ctx, 310, 98, 13, 21, 1.3, "#454f58", "#6c797b", .63);
    for (let i = 0; i < 4; i++) line(ctx, [[313, 102 + i * 2.5], [319, 102 + i * 2.5]], "#90989a", .40);
    ell(ctx, 316, 115, .85, .75, "#a48264");
    sconce(ctx, 231, 43, false);
    poly(ctx, [[285, 225], [374, 225], [436, 270], [283, 270]], "rgba(154,169,172,.085)");
  } else {
    window(ctx, 2, 74, 75, 79, t, false);
    door(ctx, 170, 61, 73, 157, "#6d746a");
    door(ctx, 345, 57, 80, 161, "#65706d");
    sconce(ctx, 277, 52, true);
    poly(ctx, [[4, 225], [82, 225], [165, 270], [68, 270]], "rgba(171,197,198,.12)");
  }
  round(ctx, 451, 59, 5, 160, 1.2, "#505e60", "#39484b", .47);
  rect(ctx, 450, 109, 7, 3.4, "#465156");
  rect(ctx, 450, 170, 7, 3.4, "#465156");
}

function cabinet(ctx, x, y, width) {
  rect(ctx, x + 1.3, y + 1.3, width + 3, 44, "rgba(29,28,26,.19)");
  rect(ctx, x, y, width, 42, "#766452");
  rect(ctx, x - 1, y - 1.4, width + 2, 2.0, "#ac9175");
  for (let i = 0; i < 3; i++) {
    const w = (width - 6) / 3, tx = x + 2.3 + w * i;
    round(ctx, tx, y + 3, w - 2, 35.6, .45, "#86735c", "#625344", .50);
    round(ctx, tx + 2, y + 6, w - 6, 29.2, .44, null, "#938069", .39);
    round(ctx, tx + w - 6, y + 10.5, 1.28, 7.7, .3, "#b0a38d");
  }
}

function kitchen(ctx, id, t) {
  const morning = id === "bottle";
  window(ctx, morning ? 55 : 47, morning ? 48 : 41, morning ? 92 : 102, morning ? 83 : 92, t, true);
  glow(ctx, 141, 97, 185, 129, "rgba(238,211,158,.11)");
  rect(ctx, 344, 146, 152, 3.8, "#a4957a");
  rect(ctx, 344, 149.2, 152, 3, "#645a4d");
  poly(ctx, [[366, 150], [371, 151], [366, 174]], "#6f6556");
  poly(ctx, [[442, 150], [448, 151], [443, 174]], "#6f6556");
  round(ctx, 364, 129, 14.2, 16, 1.7, "#777e74", "#5e665e", .47);
  rect(ctx, 365.4, 128, 11.3, 2, "#a5a490");
  path(ctx, "M393 141 Q396 133 396 124 L402 124 Q402 133 405 141 L404 145 L394 145Z", "#8d9080", "#70786d", .44);
  round(ctx, 423, 127, 10.1, 18.5, 1.1, "#8f735b", "#726455", .47);
  rect(ctx, 423.4, 129.2, 9.5, 2.8, "#b39a77");
  if (morning) {
    rect(ctx, 45, 182, 106, .87, "#aa9e8a");
    cabinet(ctx, 45, 176, 106);
    poly(ctx, [[66, 225], [141, 225], [267, 270], [161, 270]], "rgba(224,212,169,.13)");
    path(ctx, "M303 68 q5.7 0 6.2 7 v22 l-6 3 v-8 h-3 l2 -20Z", "#8d8370", "#776d5d", .4);
  } else {
    const curtain = grad(ctx, 39, 65, 77, 175, [[0, "#b1a798"], [1, "#8f8271"]]);
    path(ctx, "M39 35 L77 36 Q75 74 69 105 Q68 114 70 139 Q67 154 64 180 L39 181 Q45 144 42 110 Q36 64 39 35Z", curtain, "#897e6e", .52);
    path(ctx, "M48 39 Q44 82 51 107 Q53 132 45 165 M57 40 Q54 73 58 98 Q61 123 55 162 M69 40 Q68 82 62 107", null, "#c0b6a5", .63);
    line(ctx, [[35, 34], [156, 34]], "#7d7162", 1.4);
    rect(ctx, 337, 204, 157, 3.4, "#746557");
  }
}

function backdrop(ctx, id, t) {
  room(ctx, id);
  if (id === "walk" || id === "listen") hallway(ctx, id, t);
  else kitchen(ctx, id, t);
}

module.exports = {backdrop};
