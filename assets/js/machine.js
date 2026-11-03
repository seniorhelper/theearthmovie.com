(function () {
  "use strict";
  var hero = document.querySelector(".hero");
  var cv = document.getElementById("machine");
  var sc = document.getElementById("stars");
  var bc = document.getElementById("gback");
  var stage = document.querySelector(".hero-stage");
  if (!hero || !cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var sctx = sc.getContext("2d");
  var bctx = bc.getContext("2d");
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = mq.matches;
  var TAU = Math.PI * 2;
  var W = 0, H = 0, HF = 0, DPR = 1, BDPR = 1, halfRate = false, fcount = 0, S = 1, R = 50, CX = 0, CY = 0, mobile = false;
  var quality = 1;
  var gears = [], layers = [[], [], []], planet = null, chunks = [], drops = [], ripples = [], sprays = [], puffs = [], winds = [], streams = [];
  var emitters = [], wetGears = [];
  var waterTop = 0, t = 0, last = 0, raf = 0, running = false, visible = true, onscreen = true;
  var px = 0, py = 0, tpx = 0, tpy = 0, scrollY = 0;
  var dropTimer = 0, puffTimer = 0, frameAcc = 0, frameN = 0;
  var puffSprite = null, chunkSprites = [], texCanvas = null, cloudCanvas = null;
  var seed = 7, ready = false;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function rr(a, b) { return a + (b - a) * Math.random(); }

  var PAL = {
    pink: ["#ff8cc4", "#ff3d9a", "#a3115a"],
    lime: ["#d6ff8a", "#9be22d", "#4f8a0c"],
    orange: ["#ffc27a", "#ff8a1f", "#a8500a"],
    cyan: ["#9be8ff", "#22c7ff", "#0a6f9a"],
    purple: ["#d2a6ff", "#a24bff", "#5a1fa0"],
    yellow: ["#fff09a", "#ffd23d", "#a8820a"],
    steel: ["#eef3fb", "#a9b6cc", "#4b5670"],
    deep1: ["#3d5ca8", "#22397a", "#101c46"],
    deep2: ["#4a3f9e", "#2c2470", "#150f3e"],
    deep3: ["#2d7f96", "#1a4f66", "#0b2a3a"],
    dark: ["#5a6380", "#2a3048", "#11141f"]
  };

  function makeGearSprite(g) {
    var m = g.m, N = g.N, r = g.r, ro = r + m, rd = r - 1.25 * m;
    var pad = g.blur ? g.blur * 3 + 6 : 10;
    var SD = g.layer === 0 ? BDPR : g.layer === 2 ? DPR * 0.6 : DPR;
    var size = Math.ceil((ro + pad) * 2 * SD);
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var x = c.getContext("2d");
    x.scale(SD, SD);
    x.translate(ro + pad, ro + pad);
    if (g.blur) x.filter = "blur(" + g.blur + "px)";
    var pa = TAU / N;
    x.beginPath();
    for (var i = 0; i < N; i++) {
      var a = i * pa;
      x.lineTo(Math.cos(a - pa * 0.3) * rd, Math.sin(a - pa * 0.3) * rd);
      x.lineTo(Math.cos(a - pa * 0.17) * ro, Math.sin(a - pa * 0.17) * ro);
      x.lineTo(Math.cos(a + pa * 0.17) * ro, Math.sin(a + pa * 0.17) * ro);
      x.lineTo(Math.cos(a + pa * 0.3) * rd, Math.sin(a + pa * 0.3) * rd);
      x.arc(0, 0, rd, a + pa * 0.3, a + pa * 0.7);
    }
    x.closePath();
    var c3 = PAL[g.color];
    var gr = x.createRadialGradient(-ro * 0.3, -ro * 0.35, ro * 0.05, 0, 0, ro);
    gr.addColorStop(0, c3[0]);
    gr.addColorStop(0.55, c3[1]);
    gr.addColorStop(1, c3[2]);
    x.save();
    if (!g.blur) { x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 14; }
    x.fillStyle = gr;
    x.globalAlpha = g.alpha || 1;
    x.fill();
    x.restore();
    x.globalAlpha = g.alpha || 1;
    x.lineWidth = Math.max(1, m * 0.12);
    x.strokeStyle = "rgba(255,255,255,.28)";
    x.stroke();
    x.globalCompositeOperation = "destination-out";
    var holes = g.ring ? 0 : N >= 26 ? 6 : N >= 16 ? 5 : 0;
    if (g.ring) { x.beginPath(); x.arc(0, 0, rd * 0.7, 0, TAU); x.fill(); }
    var hr = rd * 0.62;
    if (holes) {
      for (var h = 0; h < holes; h++) {
        var ha = h * TAU / holes;
        x.beginPath();
        x.arc(Math.cos(ha) * hr * 0.92, Math.sin(ha) * hr * 0.92, rd * (holes === 6 ? 0.2 : 0.24), 0, TAU);
        x.fill();
      }
    } else if (!g.ring) {
      x.beginPath(); x.arc(0, 0, rd * 0.3, 0, TAU); x.fill();
    }
    x.globalCompositeOperation = "source-over";
    x.lineWidth = Math.max(1.5, m * 0.35);
    x.strokeStyle = "rgba(0,0,0,.25)";
    x.beginPath(); x.arc(0, 0, rd * 0.86, 0, TAU); x.stroke();
    if (g.ring) {
      for (var bo = 0; bo < 12; bo++) { var boa = bo * TAU / 12; x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.arc(Math.cos(boa) * rd * 0.78, Math.sin(boa) * rd * 0.78, Math.max(1.2, m * 0.16), 0, TAU); x.fill(); }
      x.strokeStyle = "rgba(120,220,255,.6)"; x.lineWidth = Math.max(1.5, m * 0.22);
      x.beginPath(); x.arc(0, 0, rd * 0.71, 0, TAU); x.stroke();
    }
    x.strokeStyle = "rgba(255,255,255,.22)";
    x.lineWidth = Math.max(1, m * 0.15);
    x.beginPath(); x.arc(0, 0, rd * 0.8, 0, TAU); x.stroke();
    if (holes) {
      var hg = x.createRadialGradient(-rd * 0.06, -rd * 0.08, 1, 0, 0, rd * 0.32);
      hg.addColorStop(0, "#ffffff"); hg.addColorStop(0.45, PAL.steel[1]); hg.addColorStop(1, PAL.steel[2]);
      x.fillStyle = hg;
      x.beginPath(); x.arc(0, 0, rd * 0.3, 0, TAU); x.fill();
      x.fillStyle = "rgba(10,14,30,.85)";
      x.beginPath(); x.arc(0, 0, rd * 0.09, 0, TAU); x.fill();
      x.fillStyle = "rgba(255,255,255,.5)";
      for (var b = 0; b < 4; b++) {
        var ba = b * TAU / 4 + 0.4;
        x.beginPath(); x.arc(Math.cos(ba) * rd * 0.2, Math.sin(ba) * rd * 0.2, Math.max(1, rd * 0.025), 0, TAU); x.fill();
      }
    }
    g.sprite = c; g.half = ro + pad;
  }

  function gear(layer, N, m, color, opts) {
    var g = { layer: layer, N: N, m: m, r: m * N / 2, color: color, rot: 0, x: 0, y: 0, parent: null, theta: 0, w: 0 };
    if (opts) for (var k in opts) g[k] = opts[k];
    gears.push(g); layers[layer].push(g);
    return g;
  }
  function mesh(parent, angleDeg, N, color, opts) {
    var g = gear(parent.layer, N, parent.m, color, opts);
    g.parent = parent;
    g.theta = angleDeg * Math.PI / 180;
    var d = parent.r + g.r + parent.m * 0.06;
    g.x = parent.x + Math.cos(g.theta) * d;
    g.y = parent.y + Math.sin(g.theta) * d;
    return g;
  }
  function solve(g) {
    if (!g.parent) { g.rot = g.phase + g.w * t; return; }
    var p = g.parent, th = g.theta;
    var phi1 = (th - p.rot) * p.N / TAU;
    g.rot = th + Math.PI - (0.5 - phi1) * TAU / g.N;
    g.w = -p.w * p.N / g.N;
  }

  function buildLayout() {
    gears = []; layers = [[], [], []]; emitters = []; wetGears = [];
    var hb = hero.getBoundingClientRect(), sb = stage.getBoundingClientRect();
    W = Math.round(hb.width); HF = H = Math.round(hb.height);
    mobile = W < 761;
    var maxD = mobile ? 1.35 : 1.5;
    DPR = Math.min(window.devicePixelRatio || 1, maxD);
    if (quality < 1) DPR = 1;
    if (DPR < 1) DPR = 1;
    BDPR = Math.max(0.5, DPR * 0.5);
    var sx = sb.left - hb.left, sy = sb.top - hb.top;
    if (mobile) H = Math.min(HF, Math.round(sy + sb.height + 90));
    cv.style.height = bc.style.height = H + "px";
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    bc.width = Math.round(W * BDPR); bc.height = Math.round(H * BDPR);
    sc.width = Math.round(W * DPR); sc.height = Math.round(HF * DPR);
    S = Math.min(W, HF);
    if (mobile) {
      CX = W * 0.5; CY = sy + sb.height * 0.52;
      R = Math.max(40, Math.min(sb.height * 0.23, W * 0.16));
      waterTop = sy + sb.height + 6;
    } else {
      CX = sx + sb.width * 0.5; CY = sy + sb.height * 0.5;
      R = Math.max(70, Math.min(sb.width * 0.19, sb.height * 0.21));
      waterTop = H * 0.87;
    }
    var m = R * 0.08;
    var g0 = gear(1, 40, m, "steel", { x: CX, y: CY, w: 0.16, phase: 0, driver: true, ring: true });
    var g1 = mesh(g0, -38, 18, "pink", { wet: true });
    var g2 = mesh(g0, 198, 24, "orange");
    var g3 = mesh(g0, 104, 13, "cyan", { wet: true });
    var g4 = mesh(g1, -78, 26, "lime", { wet: true });
    var g5 = mesh(g2, 150, 15, "purple");
    var g6 = mesh(g3, 40, 20, "yellow");
    var g7 = mesh(g2, 238, 12, "cyan");
    var g8 = mesh(g4, -8, 11, "purple");
    var g9 = mesh(g1, 22, 10, "yellow");
    if (!mobile) { mesh(g6, 10, 14, "pink"); mesh(g5, 205, 22, "lime"); }
    wetGears = [g1, g3, g4, g6];
    emitters.push({ g: g0, h: g1, k: 0 }, { g: g0, h: g2, k: 0 }, { g: g4, h: null, k: 0 }, { g: g3, h: g6, k: 0 }, { g: g2, h: g5, k: 0 });

    var bm = S * (mobile ? 0.016 : 0.012);
    var b0 = gear(0, 30, bm, "deep1", { x: W * 0.1, y: H * 0.18, w: -0.09, phase: 0.3, blur: 1.6, alpha: 0.85 });
    mesh(b0, 30, 16, "deep2", { blur: 1.6, alpha: 0.85 });
    mesh(b0, 120, 22, "deep3", { blur: 1.6, alpha: 0.85 });
    var b1 = gear(0, 36, bm, "deep2", { x: W * 0.92, y: H * 0.78, w: 0.07, phase: 1.1, blur: 1.6, alpha: 0.85 });
    mesh(b1, 200, 18, "deep1", { blur: 1.6, alpha: 0.85 });
    mesh(b1, 260, 14, "deep3", { blur: 1.6, alpha: 0.85 });
    var b2 = gear(0, 24, bm, "deep3", { x: W * (mobile ? 0.86 : 0.52), y: H * (mobile ? 0.08 : 0.12), w: 0.11, phase: 0.6, blur: 1.6, alpha: 0.8 });
    mesh(b2, 160, 12, "deep2", { blur: 1.6, alpha: 0.8 });
    if (!mobile) {
      var b3 = gear(0, 28, bm, "deep1", { x: W * 0.36, y: H * 0.9, w: -0.08, phase: 0.2, blur: 1.6, alpha: 0.8 });
      mesh(b3, -60, 16, "deep2", { blur: 1.6, alpha: 0.8 });
    }

    var fm = S * (mobile ? 0.024 : 0.019);
    var f0 = gear(2, mobile ? 26 : 34, fm, "dark", { x: W * (mobile ? 1.04 : 1.0), y: H * (mobile ? -0.01 : -0.04), w: -0.05, phase: 0.1, blur: 2.4 });
    if (!mobile) mesh(f0, 98, 14, "pink", { blur: 2.4, alpha: 0.95 });
    if (!mobile) {
      var f1 = gear(2, 30, fm, "dark", { x: W * 0.02, y: H * 1.04, w: 0.06, phase: 0.5, blur: 2.4 });
      mesh(f1, -58, 13, "cyan", { blur: 2.4, alpha: 0.95 });
    }
    for (var i = 0; i < gears.length; i++) if (reduced || i < 6) makeGearSprite(gears[i]);

    planet = { tex: 0, cloud: 0 };
    chunks = [];
    var nC = mobile ? 26 : 40;
    for (var c = 0; c < nC; c++) chunks.push(newChunk(true));
    winds = [];
    var nW = Math.round(Math.max(22, Math.min(70, W * H / 15000)) * (quality < 1 ? 0.6 : 1));
    for (var w = 0; w < nW; w++) winds.push(newWind(true));
    streams = [];
    for (var s = 0; s < 4; s++) streams.push({ y: H * (0.15 + s * 0.2) + rr(-20, 20), amp: rr(14, 34), f: rr(0.004, 0.008), ph: rr(0, TAU), sp: rr(40, 80), len: rr(90, 180) });
    drops = []; ripples = []; sprays = []; puffs = [];
    drawStars();
  }

  function newChunk(init) {
    return { a: rnd() * TAU, rf: init ? 1.25 + rnd() * 0.7 : 1.95 + rnd() * 0.2, sp: 0.15 + rnd() * 0.25, fall: 0.012 + rnd() * 0.03, s: 0.05 + rnd() * 0.07, i: Math.floor(rnd() * 6), spin: rnd() * TAU, vs: (rnd() - 0.5) * 2 };
  }
  function newWind(init) {
    var p = { x: init ? Math.random() * W : -30, y: Math.random() * H, tr: [], sp: rr(0.7, 1.3) };
    return p;
  }

  function drawStars() {
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sctx.clearRect(0, 0, W, HF);
    var n = Math.round(W * HF / 2600);
    var s0 = seed; seed = 99;
    for (var i = 0; i < n; i++) {
      var x = rnd() * W, y = rnd() * HF, r = rnd() < 0.08 ? 1.3 : 0.6 + rnd() * 0.5;
      sctx.globalAlpha = 0.25 + rnd() * 0.6;
      sctx.fillStyle = rnd() < 0.15 ? "#ffd9a8" : rnd() < 0.3 ? "#bfe8ff" : "#ffffff";
      sctx.beginPath(); sctx.arc(x, y, r, 0, TAU); sctx.fill();
    }
    seed = s0;
    sctx.globalAlpha = 1;
    var ng = sctx.createRadialGradient(W * 0.2, H * 0.75, 0, W * 0.2, H * 0.75, S * 0.7);
    ng.addColorStop(0, "rgba(162,75,255,.16)"); ng.addColorStop(1, "rgba(162,75,255,0)");
    sctx.fillStyle = ng; sctx.fillRect(0, 0, W, H);
    var ng2 = sctx.createRadialGradient(W * 0.85, H * 0.2, 0, W * 0.85, H * 0.2, S * 0.6);
    ng2.addColorStop(0, "rgba(34,199,255,.12)"); ng2.addColorStop(1, "rgba(34,199,255,0)");
    sctx.fillStyle = ng2; sctx.fillRect(0, 0, W, H);
    if (HF > H + 2) {
      var dg = sctx.createLinearGradient(0, H - 40, 0, HF);
      dg.addColorStop(0, "rgb(6,18,58)"); dg.addColorStop(1, "rgb(5,10,32)");
      sctx.fillStyle = dg; sctx.fillRect(0, H - 40, W, HF - H + 40);
    }
  }

  function noise3() {
    var perm = [], i, j, tmp;
    for (i = 0; i < 256; i++) perm.push(i);
    for (i = 255; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; }
    var P = new Uint8Array(512), V = new Float32Array(256);
    for (i = 0; i < 512; i++) P[i] = perm[i & 255];
    for (i = 0; i < 256; i++) V[i] = rnd();
    function h(x, y, z) { return V[P[P[P[x & 255] + (y & 255)] + (z & 255)]]; }
    function L(a, b, t2) { return a + (b - a) * t2; }
    return function (x, y, z) {
      var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      var xf = x - xi, yf = y - yi, zf = z - zi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
      return L(L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
               L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
    };
  }
  var TW = 384, TH = 192, texReady = false;
  function buildPlanetTexture() {
    var n1 = noise3(), n2 = noise3();
    texCanvas = document.createElement("canvas"); texCanvas.width = TW * 2; texCanvas.height = TH;
    cloudCanvas = document.createElement("canvas"); cloudCanvas.width = TW * 2; cloudCanvas.height = TH;
    var tc = texCanvas.getContext("2d"), cc = cloudCanvas.getContext("2d");
    var img = tc.createImageData(TW, TH), cim = cc.createImageData(TW, TH);
    var cosT = new Float32Array(TW), sinT = new Float32Array(TW);
    for (var k = 0; k < TW; k++) { cosT[k] = Math.cos(k / TW * TAU); sinT[k] = Math.sin(k / TW * TAU); }
    function fbm(f, x, y, z, oct) {
      var s = 0, a = 0.5, fr = 1, n = 0;
      for (var o = 0; o < oct; o++) { s += a * f(x * fr + o * 17.3, y * fr, z * fr); n += a; a *= 0.5; fr *= 2.03; }
      return s / n;
    }
    var row = 0;
    function slice() {
      var t0 = performance.now();
      while (row < TH && performance.now() - t0 < 7) {
        var y = row, lat = Math.abs(y / TH - 0.5) * 2, yz = (y / TH) * 3.2;
        for (var x = 0; x < TW; x++) {
          var cx = cosT[x] * 1.6 + 2, cy = sinT[x] * 1.6 + 2;
          var e = fbm(n1, cx, cy, yz, 5) - lat * lat * 0.1;
          var i = (y * TW + x) * 4, r, g, b;
          var dp = Math.min(1, Math.max(0, (0.5 - e) * 3.2));
          var or = 22 - dp * 10, og = 118 - dp * 62, ob = 206 - dp * 70;
          var land = Math.min(1, Math.max(0, (e - 0.5) / 0.035));
          var hg = Math.min(1, Math.max(0, (e - 0.54) * 4.5));
          var dry = lat < 0.42 ? Math.min(1, Math.max(0, (fbm(n2, cx * 2, cy * 2, yz * 2 + 9, 2) - 0.56) * 5)) : 0;
          var lr = 58 + hg * 60 + dry * 110, lg = 146 - hg * 22 + dry * 14, lb = 64 + hg * 16 + dry * 20;
          r = or + (lr - or) * land; g = og + (lg - og) * land; b = ob + (lb - ob) * land;
          var ice = Math.min(1, Math.max(0, (lat - 0.8) * 8));
          r += (236 - r) * ice; g += (244 - g) * ice; b += (250 - b) * ice;
          img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
          var cl = fbm(n2, cx * 1.4, cy * 1.4, yz * 1.8, 4);
          var ca = Math.max(0, Math.min(1, (cl - 0.53) * 4.5));
          cim.data[i] = 255; cim.data[i + 1] = 255; cim.data[i + 2] = 255; cim.data[i + 3] = ca * 215;
        }
        row++;
      }
      if (row < TH) { setTimeout(slice, 0); return; }
      tc.putImageData(img, 0, 0); tc.putImageData(img, TW, 0);
      cc.putImageData(cim, 0, 0); cc.putImageData(cim, TW, 0);
      texReady = true;
      if (reduced || !running) { if (gears.length) draw(true); }
    }
    slice();
  }
  function buildTextures() {
    buildPlanetTexture();
    puffSprite = document.createElement("canvas"); puffSprite.width = puffSprite.height = 64;
    var px3 = puffSprite.getContext("2d");
    var pg = px3.createRadialGradient(32, 32, 0, 32, 32, 32);
    pg.addColorStop(0, "rgba(235,245,255,.9)"); pg.addColorStop(0.45, "rgba(220,235,255,.45)"); pg.addColorStop(1, "rgba(220,235,255,0)");
    px3.fillStyle = pg; px3.fillRect(0, 0, 64, 64);
    chunkSprites = [];
    var cols = [["#c9a27a", "#7a5534"], ["#9fa6b4", "#4f5666"], ["#b98b5c", "#5f3f22"], ["#7fb36a", "#3f6a2e"], ["#d6c3a3", "#806a4a"], ["#8a7f99", "#463e57"]];
    for (var k = 0; k < 6; k++) {
      var cs = document.createElement("canvas"); cs.width = cs.height = 48;
      var cx = cs.getContext("2d"); cx.translate(24, 24);
      cx.beginPath();
      var nv = 6 + (k % 3);
      for (var j = 0; j < nv; j++) { var aa = j / nv * TAU, rad = 14 + rnd() * 8; cx.lineTo(Math.cos(aa) * rad, Math.sin(aa) * rad); }
      cx.closePath();
      var cgr = cx.createLinearGradient(-16, -16, 16, 16);
      cgr.addColorStop(0, cols[k][0]); cgr.addColorStop(1, cols[k][1]);
      cx.fillStyle = cgr; cx.fill();
      cx.strokeStyle = "rgba(255,255,255,.35)"; cx.lineWidth = 1.5; cx.stroke();
      chunkSprites.push(cs);
    }
  }

  function offs(layer) {
    var d = layer === 0 ? 0.35 : layer === 1 ? 1 : 1.8;
    var k = mobile ? 6 : 16;
    return [px * k * d, py * k * d - scrollY * (d - 1) * 0.12];
  }

  function step(dt) {
    t += dt;
    px += (tpx - px) * Math.min(1, dt * 3); py += (tpy - py) * Math.min(1, dt * 3);
    for (var i = 0; i < gears.length; i++) solve(gears[i]);
    var sc2 = S / 800;
    for (var c = 0; c < chunks.length; c++) {
      var ch = chunks[c];
      ch.a += ch.sp * dt; ch.rf -= ch.fall * dt; ch.spin += ch.vs * dt;
      if (ch.rf < 1.02) chunks[c] = newChunk(false);
    }
    dropTimer -= dt;
    var maxDrops = (mobile ? 16 : 28) * quality;
    if (dropTimer <= 0 && drops.length < maxDrops) {
      dropTimer = rr(0.18, 0.4);
      var g = wetGears[Math.floor(Math.random() * wetGears.length)];
      var wa = -Math.PI / 2 + rr(-0.6, 0.6);
      drops.push({ g: g, la: wa - g.rot, free: false, x: 0, y: 0, vx: 0, vy: 0, s: rr(0.8, 1.3) });
    }
    var grav = 900 * sc2;
    for (var d = drops.length - 1; d >= 0; d--) {
      var dr = drops[d];
      if (!dr.free) {
        var gg = dr.g, ro = gg.r + gg.m * 0.9, wa2 = gg.rot + dr.la;
        dr.x = gg.x + Math.cos(wa2) * ro; dr.y = gg.y + Math.sin(wa2) * ro;
        if (Math.sin(wa2) > 0.15) {
          dr.free = true;
          var tv = gg.w * ro;
          dr.vx = -Math.sin(wa2) * tv; dr.vy = Math.cos(wa2) * tv;
        }
      } else {
        dr.vy += grav * dt; dr.x += dr.vx * dt; dr.y += dr.vy * dt;
        if (dr.y >= waterY(dr.x)) {
          ripples.push({ x: dr.x, y: waterY(dr.x), r: 2, a: 0.7 });
          if (sprays.length < 60) for (var k = 0; k < 3; k++) sprays.push({ x: dr.x, y: dr.y - 2, vx: rr(-60, 60) * sc2, vy: rr(-160, -80) * sc2, l: 0.5 });
          drops.splice(d, 1);
        } else if (dr.y > H + 20 || dr.x < -40 || dr.x > W + 40) drops.splice(d, 1);
      }
    }
    for (var p = ripples.length - 1; p >= 0; p--) { var rp = ripples[p]; rp.r += 40 * sc2 * dt * 1.4; rp.a -= dt * 0.9; if (rp.a <= 0) ripples.splice(p, 1); }
    for (var q = sprays.length - 1; q >= 0; q--) { var sp = sprays[q]; sp.vy += grav * dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.l -= dt; if (sp.l <= 0) sprays.splice(q, 1); }
    puffTimer -= dt;
    var maxP = (mobile ? 24 : 42) * quality;
    if (puffTimer <= 0 && puffs.length < maxP) {
      puffTimer = rr(0.08, 0.2);
      var em = emitters[Math.floor(Math.random() * emitters.length)];
      var ex, ey;
      if (em.h) { ex = em.g.x + Math.cos(em.h.theta) * em.g.r; ey = em.g.y + Math.sin(em.h.theta) * em.g.r; }
      else { ex = em.g.x; ey = em.g.y; }
      puffs.push({ x: ex, y: ey, vx: rr(-10, 25) * sc2, vy: rr(-46, -24) * sc2, r: R * rr(0.12, 0.22), gr: R * rr(0.25, 0.45), l: 0, ml: rr(2.2, 3.6) });
    }
    for (var u = puffs.length - 1; u >= 0; u--) {
      var pf = puffs[u]; pf.l += dt;
      pf.x += (pf.vx + 22 * sc2) * dt; pf.y += pf.vy * dt; pf.r += pf.gr * dt;
      if (pf.l >= pf.ml) puffs.splice(u, 1);
    }
    for (var w = 0; w < winds.length; w++) {
      var wp = winds[w];
      var vx = (70 + 46 * Math.sin(wp.y * 0.009 + t * 0.45)) * wp.sp * sc2 * 1.4;
      var vy = 22 * Math.sin(wp.x * 0.007 + t * 0.6 + wp.sp * 3) * sc2;
      var dxp = wp.x - CX, dyp = wp.y - CY, dd = dxp * dxp + dyp * dyp, rr2 = R * R * 4.5;
      if (dd < rr2) { vy += (dyp > 0 ? 1 : -1) * 60 * sc2 * (1 - dd / rr2); }
      wp.x += vx * dt; wp.y += vy * dt;
      wp.tr.push(wp.x, wp.y);
      if (wp.tr.length > 20) wp.tr.splice(0, 2);
      if (wp.x > W + 30 || wp.y < -30 || wp.y > H + 30) winds[w] = newWind(false);
    }
  }

  function waterY(x) {
    var a = mobile ? 3 : 5;
    return waterTop + Math.sin(x * 0.012 + t * 1.1) * a + Math.sin(x * 0.031 - t * 1.7) * a * 0.45;
  }

  function drawGearLayer(L, c) {
    c = c || ctx;
    var o = offs(L), arr = layers[L], made = 0;
    for (var i = 0; i < arr.length; i++) {
      var g = arr[i];
      if (!g.sprite) { if (made++ > 1) continue; makeGearSprite(g); }
      c.save();
      c.translate(g.x + o[0], g.y + o[1]);
      c.rotate(g.rot);
      c.drawImage(g.sprite, -g.half, -g.half, g.half * 2, g.half * 2);
      c.restore();
      if (L === 1) {
        var rd = g.r - 1.25 * g.m;
        ctx.strokeStyle = "rgba(255,255,255,.32)"; ctx.lineWidth = Math.max(1, g.m * 0.16);
        ctx.beginPath(); ctx.arc(g.x + o[0], g.y + o[1], rd * 0.97, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
      }
    }
  }

  function drawPlanet() {
    var o = offs(1), x = CX + o[0], y = CY + o[1];
    var glow = ctx.createRadialGradient(x, y, R * 0.9, x, y, R * 1.45);
    glow.addColorStop(0, "rgba(90,200,255,.45)"); glow.addColorStop(1, "rgba(90,200,255,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, R * 1.45, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
    ctx.fillStyle = "#0b3f8f"; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    var strips = quality < 1 ? 16 : 28;
    var off = (t * 9) % TW, coff = (t * 14) % TW;
    for (var pass = 0; pass < (texReady ? 2 : 0); pass++) {
      var src = pass ? cloudCanvas : texCanvas, so = pass ? coff : off;
      for (var i = 0; i < strips; i++) {
        var p0 = -Math.PI / 2 + i / strips * Math.PI, p1 = -Math.PI / 2 + (i + 1) / strips * Math.PI;
        var x0 = x + Math.sin(p0) * R, x1 = x + Math.sin(p1) * R;
        var u0 = so + (i / strips) * (TW / 2);
        ctx.drawImage(src, u0, 0, TW / 2 / strips + 0.6, TH, x0, y - R, x1 - x0 + 0.6, R * 2);
      }
    }
    var sh = ctx.createRadialGradient(x - R * 0.42, y - R * 0.38, R * 0.1, x, y, R * 1.05);
    sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(0.5, "rgba(0,0,0,0)"); sh.addColorStop(0.82, "rgba(4,8,30,.55)"); sh.addColorStop(1, "rgba(2,4,18,.9)");
    ctx.fillStyle = sh; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    var lg = ctx.createLinearGradient(x - R, 0, x + R, 0);
    lg.addColorStop(0, "rgba(120,220,255,0)"); lg.addColorStop(0.55, "rgba(120,220,255,0)"); lg.addColorStop(1, "rgba(120,220,255,.55)");
    ctx.strokeStyle = lg; ctx.lineWidth = 1;
    var gm = (t * 0.25) % (Math.PI / 6);
    for (var mrd = 0; mrd < 6; mrd++) {
      var ang = mrd * Math.PI / 6 + gm, ex = Math.abs(Math.cos(ang)) * R;
      ctx.beginPath(); ctx.ellipse(x, y, ex, R, 0, 0, TAU); ctx.stroke();
    }
    for (var la = 1; la < 6; la++) {
      var yy = y - R + la * R / 3, hw = Math.sqrt(Math.max(0, R * R - (yy - y) * (yy - y)));
      ctx.beginPath(); ctx.moveTo(x - hw, yy); ctx.lineTo(x + hw, yy); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(150,225,255,.7)"; ctx.lineWidth = Math.max(1.2, R * 0.03);
    ctx.beginPath(); ctx.arc(x, y, R, Math.PI * 0.75, Math.PI * 1.6); ctx.stroke();
  }

  function drawChunks(front) {
    var o = offs(1), x = CX + o[0], y = CY + o[1], tilt = -0.22, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (var i = 0; i < chunks.length; i++) {
      var c = chunks[i], sa = Math.sin(c.a);
      if ((sa > 0) !== front) continue;
      var ex = Math.cos(c.a) * R * c.rf, ey = sa * R * c.rf * 0.3;
      var cx = x + ex * ct - ey * st, cy = y + ex * st + ey * ct;
      var s = R * c.s * (front ? 1.15 : 0.8) * 2;
      ctx.globalAlpha = front ? 1 : 0.7;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(c.spin);
      ctx.drawImage(chunkSprites[c.i], -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawPuffs() {
    var o = offs(1);
    for (var i = 0; i < puffs.length; i++) {
      var p = puffs[i], k = p.l / p.ml;
      ctx.globalAlpha = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * 0.85;
      ctx.drawImage(puffSprite, p.x + o[0] - p.r, p.y + o[1] - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawDrops() {
    var o = offs(1);
    ctx.fillStyle = "rgba(170,235,255,.95)";
    ctx.strokeStyle = "rgba(170,235,255,.55)";
    ctx.lineWidth = Math.max(1.2, R * 0.025);
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i], x = d.x + o[0], y = d.y + o[1], rs = Math.max(1.6, R * 0.035) * d.s;
      ctx.beginPath(); ctx.arc(x, y, rs, 0, TAU); ctx.fill();
      if (d.free) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d.vx * 0.03, y - d.vy * 0.03); ctx.stroke(); }
    }
    ctx.fillStyle = "rgba(200,240,255,.8)";
    for (var j = 0; j < sprays.length; j++) { var s = sprays[j]; ctx.fillRect(s.x + o[0] - 1, s.y + o[1] - 1, 2, 2); }
  }

  function drawWater() {
    var o = offs(1), step2 = mobile ? 14 : 22;
    var bands = [["rgba(34,140,230,.55)", 0, 1], ["rgba(20,96,190,.75)", 10, 0.7], ["rgba(9,44,120,.92)", 22, 0.45]];
    for (var b = 0; b < bands.length; b++) {
      var off = bands[b][1] * (S / 800), am = bands[b][2];
      var grd = ctx.createLinearGradient(0, waterTop + off - 10, 0, H);
      grd.addColorStop(0, bands[b][0]); grd.addColorStop(1, mobile ? "rgb(6,18,58)" : "rgba(5,14,48,.98)");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (var x = 0; x <= W + step2; x += step2) {
        var yy = waterTop + off + o[1] * 0.2 + Math.sin(x * 0.012 + t * 1.1 + b) * 5 * am + Math.sin(x * 0.031 - t * 1.7 + b * 2) * 2.4 * am;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = "rgba(190,240,255,.55)"; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var x2 = 0; x2 <= W + step2; x2 += step2) { var y2 = waterY(x2) + o[1] * 0.2; if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2); }
    ctx.stroke();
    ctx.fillStyle = "rgba(210,245,255,.35)";
    for (var k = 0; k < 14; k++) {
      var gx = ((k * 137.5 + t * 26) % (W + 60)) - 30, gy = waterTop + 14 + (k % 4) * 9;
      ctx.fillRect(gx, gy + o[1] * 0.2, 18 + (k % 3) * 10, 1.4);
    }
    for (var r = 0; r < ripples.length; r++) {
      var rp = ripples[r];
      ctx.strokeStyle = "rgba(200,245,255," + (rp.a * 0.8).toFixed(3) + ")";
      ctx.beginPath(); ctx.ellipse(rp.x + o[0], rp.y + o[1] * 0.2, rp.r, rp.r * 0.28, 0, 0, TAU); ctx.stroke();
    }
  }

  function drawStreams() {
    var o = offs(0);
    ctx.lineWidth = mobile ? 1.5 : 2;
    ctx.strokeStyle = "rgba(200,235,255,.16)";
    for (var i = 0; i < streams.length; i++) {
      var s = streams[i];
      ctx.setLineDash([s.len, s.len * 2.2]);
      ctx.lineDashOffset = -t * s.sp;
      ctx.beginPath();
      for (var x = -20; x <= W + 20; x += 24) {
        var y = s.y + o[1] + Math.sin(x * s.f + s.ph + t * 0.25) * s.amp;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawWind() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(205,240,255,.3)";
    ctx.beginPath();
    for (var i = 0; i < winds.length; i++) {
      var tr = winds[i].tr;
      if (tr.length < 4) continue;
      ctx.moveTo(tr[0], tr[1]);
      for (var j = 2; j < tr.length; j += 2) ctx.lineTo(tr[j], tr[j + 1]);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(230,248,255,.75)";
    for (var k = 0; k < winds.length; k++) { var w = winds[k]; ctx.fillRect(w.x - 0.9, w.y - 0.9, 1.8, 1.8); }
  }

  function drawBack() {
    bctx.setTransform(BDPR, 0, 0, BDPR, 0, 0);
    bctx.clearRect(0, 0, W, H);
    drawGearLayer(0, bctx);
  }
  function draw(full) {
    if (full || fcount % 3 === 0) drawBack();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawStreams();
    drawGearLayer(1);
    drawChunks(false);
    drawPlanet();
    drawChunks(true);
    drawPuffs();
    drawDrops();
    drawWater();
    drawWind();
    drawGearLayer(2);
  }

  function downgrade() {
    quality = 0.6;
    if (DPR > 1) { DPR = 1; cv.width = W; cv.height = H; }
    winds.length = Math.round(winds.length * 0.6);
    chunks.length = Math.round(chunks.length * 0.7);
  }
  function frame(now) {
    raf = 0;
    if (!running) return;
    fcount++;
    if (halfRate && fcount % 2) { raf = requestAnimationFrame(frame); return; }
    var dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    if (dt > 0.1) dt = 0.1;
    frameAcc += dt; frameN++;
    if (frameN >= 45) {
      var avg = frameAcc / frameN;
      frameAcc = 0; frameN = 0;
      if (avg > 0.024 && quality === 1) downgrade();
      else if (avg > (halfRate ? 0.06 : 0.034) && quality < 1) halfRate = true;
    }
    step(dt);
    draw(false);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!ready || running || reduced || !visible || !onscreen) return;
    running = true; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function still() {
    for (var j = 0; j < gears.length; j++) if (!gears[j].sprite) makeGearSprite(gears[j]);
    for (var i = 0; i < 150; i++) step(1 / 30);
    draw(true);
  }

  var rt = 0, lastW = 0, lastH = 0;
  function relayout() {
    var b = hero.getBoundingClientRect();
    if (Math.round(b.width) === lastW && Math.abs(Math.round(b.height) - lastH) < 80 && gears.length) return;
    lastW = Math.round(b.width); lastH = Math.round(b.height);
    buildLayout();
    if (reduced || !running) still();
  }

  function init() {
    buildTextures();
    relayout();
    ready = true;
    if (reduced) { still(); return; }
    start();
  }

  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(relayout, 160); }, { passive: true });
  window.addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    tpx = e.clientX / window.innerWidth - 0.5; tpy = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    visible = document.visibilityState === "visible";
    if (visible) start(); else stop();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      onscreen = en[0].isIntersecting;
      if (onscreen) start(); else stop();
    }).observe(hero);
  }
  var onMq = function (e) { reduced = e.matches; if (!ready) return; if (reduced) { stop(); still(); } else start(); };
  if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
