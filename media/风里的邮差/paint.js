'use strict';

const Film = (() => {
  const W = 1600, H = 900, duration = 32, shot = 8, wipe = 1.48;
  const scale = 1.43, roadY = 738, contactY = 796, delivery = 28.92;
  const TAU = 2 * Math.PI;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, v) => a + (b - a) * v;
  const mod = (x, p) => (x % p + p) % p;
  function smooth(lo, hi, x) {
    const u = clamp((x - lo) / (hi - lo));
    return u * u * (3 - 2 * u);
  }
  function rng(seed) {
    let state = seed >>> 0;
    return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
  }
  function surface(w, h) {
    const s = document.createElement('canvas');
    s.width = Math.ceil(w);
    s.height = Math.ceil(h);
    return s;
  }
  const paths = new Map();
  function path(d) {
    if (typeof d !== 'string') return d;
    if (!paths.has(d)) paths.set(d, new Path2D(d));
    return paths.get(d);
  }
  function shape(c, d, fill, stroke, width = 1) {
    const p = path(d);
    if (fill) { c.fillStyle = fill; c.fill(p); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
  }
  function line(c, points, color, width = 1) {
    c.beginPath();
    c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function ellipse(c, x, y, rx, ry, fill, stroke, width = 1, rotation = 0) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function gradient(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (const [at, color] of stops) g.addColorStop(at, color);
    return g;
  }
  function dotGlow(c, x, y, r, color, edge) {
    const g = c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color); g.addColorStop(1,edge);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function limbJoint(hx, hy, ax, ay, l1, l2, side = 1) {
    const dx = ax - hx, dy = ay - hy, dist = Math.max(.01, Math.hypot(dx, dy));
    const ux = dx / dist, uy = dy / dist;
    const along = clamp((l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), -l1, l1);
    const across = Math.sqrt(Math.max(0, l1 * l1 - along * along)) * side;
    return [hx + along * ux + across * uy, hy + along * uy - across * ux];
  }
  // The same travelled distance drives both wheels and the chainset.
  function distance(t) {
    return 368 * t + 47 * Math.sin(.62 * t) + 19 * Math.sin(1.17 * t);
  }
  function trackingX(t) {
    return 516 + 218 * smooth(0,3.7,t) + 48 * Math.sin(t * .39) + 19 * Math.sin(t * .85);
  }
  function camera(t) {
    const brake = delivery + .14;
    if (t <= brake) return scale * distance(t) - trackingX(t);
    const start = scale * distance(brake) - trackingX(brake);
    const velocity = ((scale * distance(brake) - trackingX(brake)) -
                      (scale * distance(brake - .005) - trackingX(brake - .005))) / .005;
    return start + velocity * .51 * (1 - Math.exp(-(t - brake) / .51));
  }
  function motion(t) {
    const dist = distance(t), cam = camera(t);
    const crank = dist / (57.5 * 1.55) + .76;
    const wind = smooth(15,17,t) * (1 - smooth(22,24,t)) *
      (.65 + .27 * Math.sin(t * 3.7) + .08 * Math.sin(t * 7.5));
    const wet = smooth(7,8.1,t) * (1 - smooth(15,16,t));
    const bump = .72 * Math.sin(dist * .052) + .43 * Math.sin(dist * .105);
    return {t, dist, cam, x:scale * dist - cam, y:contactY + bump * (.35 + .65 * wet),
            crank, wheel:dist / 57.5, wind, wet, bob:1.8 * Math.sin(crank*2-.6) + .5*bump};
  }
  const palettes = [
    {ink:'#2b3934', skin:'#96a35e', light:'#c0c989', dark:'#667d4b', belly:'#ecd29a', ridge:'#596d46',
     cream:'#f6dfac', shirt:'#e4c88a', stripe:'#284b55', navy:'#263f4f', blue:'#4f6c70',
     red:'#d84d32', redDark:'#923a32', frame:'#df7839', metal:'#aebdb2', brass:'#dab05e', tire:'#303e3e',
     leather:'#ac663a', leatherDark:'#754b35', outline:1.8},
    {ink:'#303938', skin:'#889c83', light:'#c1c6a1', dark:'#5c7265', belly:'#dfceb0', ridge:'#52685c',
     cream:'#ebe0c2', shirt:'#cec5a6', stripe:'#4c6567', navy:'#344951', blue:'#6e8080',
     red:'#b74836', redDark:'#833e37', frame:'#aa7350', metal:'#a8b5ad', brass:'#c3ab7c', tire:'#424b49',
     leather:'#937657', leatherDark:'#635245', outline:1.5},
    {ink:'#3b2e32', skin:'#93964e', light:'#cfbe6f', dark:'#626b47', belly:'#f3c77b', ridge:'#55583c',
     cream:'#ffda92', shirt:'#e0ad62', stripe:'#314a50', navy:'#333e48', blue:'#606d66',
     red:'#ce4927', redDark:'#8f392e', frame:'#dd6529', metal:'#cdc39f', brass:'#eeb75a', tire:'#3e3538',
     leather:'#ae6136', leatherDark:'#743c32', outline:2.2},
    {ink:'#192f49', skin:'#75a79c', light:'#b8d3b7', dark:'#456f78', belly:'#d6d2ac', ridge:'#486873',
     cream:'#e4e6cd', shirt:'#bfc5ae', stripe:'#36596e', navy:'#293f5b', blue:'#597b91',
     red:'#d55949', redDark:'#8c4150', frame:'#c67a4f', metal:'#b3cacf', brass:'#e5bc7c', tire:'#29394d',
     leather:'#a17259', leatherDark:'#674a49', outline:1.65}
  ];
  return {W,H,duration,shot,wipe,scale,roadY,contactY,delivery,TAU,clamp,mix,mod,smooth,rng,surface,
          path,shape,line,ellipse,gradient,dotGlow,limbJoint,distance,camera,motion,palettes};
})();
