"use strict";
const fs = require("node:fs");
const canvas = require(process.env.APARTMENT_CANVAS || "@napi-rs/canvas");
for (const [file, name] of [["msyh.ttc","FilmSans"],["msyhbd.ttc","FilmBold"]]) {
  const url = (process.env.WINDIR || "C:/Windows") + "/Fonts/" + file;
  if (fs.existsSync(url)) canvas.GlobalFonts.registerFromPath(url,name);
}
if (process.env.FILM_CJK_FONT) canvas.GlobalFonts.registerFromPath(process.env.FILM_CJK_FONT,"FilmSans");
module.exports = canvas;
