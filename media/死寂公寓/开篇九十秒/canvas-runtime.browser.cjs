"use strict";
function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
module.exports = {createCanvas, Path2D: globalThis.Path2D};
