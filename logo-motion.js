/* Hero logo motion: the approved sturgeon swims in place, a gold sheen crosses
   the wordmark, and every loop starts and ends on the untouched approved artwork. */
(function () {
  var LOOP = 9.0;            // seconds per cycle
  var SWIM_PERIOD = 1.25;    // seconds per tail beat
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parse(d) {
    var toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi), i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0, out = [];
    function n() { return parseFloat(toks[i++]); }
    while (i < toks.length) {
      if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
      var rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      var ox = rel ? cx : 0, oy = rel ? cy : 0;
      if (C === 'M') { cx = ox + n(); cy = oy + n(); sx = cx; sy = cy; out.push(['M', cx, cy]); cmd = rel ? 'l' : 'L'; }
      else if (C === 'L') { cx = ox + n(); cy = oy + n(); out.push(['L', cx, cy]); }
      else if (C === 'H') { cx = (rel ? cx : 0) + n(); out.push(['L', cx, cy]); }
      else if (C === 'V') { cy = (rel ? cy : 0) + n(); out.push(['L', cx, cy]); }
      else if (C === 'C') { var a = ox + n(), b = oy + n(), c = ox + n(), e = oy + n(); cx = ox + n(); cy = oy + n(); out.push(['C', a, b, c, e, cx, cy]); }
      else if (C === 'Z') { cx = sx; cy = sy; out.push(['Z']); }
      else { i++; }
    }
    return out;
  }

  function start(svg) {
    var fish = svg.querySelector('[data-part="fish"]');
    var sheen = svg.querySelector('[data-part="sheen"]');
    var grad = svg.querySelector('linearGradient');
    if (!fish) return;
    var orig = fish.getAttribute('d'), segs = parse(orig);
    var xs = [], ys = [];
    segs.forEach(function (s) { for (var k = 1; k < s.length; k += 2) { xs.push(s[k]); ys.push(s[k + 1]); } });
    var xmin = Math.min.apply(0, xs), xmax = Math.max.apply(0, xs);
    var ymin = Math.min.apply(0, ys), ymax = Math.max.apply(0, ys);
    var L = xmax - xmin, cyM = (ymin + ymax) / 2, cxM = (xmin + xmax) / 2;
    var H = L / 2, F = 2.4 * L;  // half-length, camera distance for perspective

    // Each point of the flat drawing is placed in 3D space, bent, turned and
    // projected back with perspective, so the line drawing reads as a solid body.
    function warp(x, y, m) {
      var u = x - cxM, v = y - cyM;
      var t = (xmax - x) / L, env = Math.pow(t, 1.6);           // 0 at snout, 1 at tail
      var w = 2 * Math.PI * 1.05 * t - m.phi;                   // swim wave, snout -> tail
      // 1. arch the body (hump up, ends down), like the fish curling as it turns
      var X = u, Y = v, k = m.curl / H;
      if (Math.abs(k) > 1e-6) { var an = k * u; X = Math.sin(an) / k - v * Math.sin(an); Y = (1 - Math.cos(an)) / k + v * Math.cos(an); }
      // 2. tail sweeps into and out of the page (real swimming motion, seen side-on)
      var Z = m.swim * 0.16 * L * env * Math.sin(w);
      Y += m.swim * 0.03 * L * env * Math.sin(w + 1.2);
      // 3. roll about the long axis
      var cr = Math.cos(m.roll), sr = Math.sin(m.roll), Y2 = Y * cr - Z * sr, Z2 = Y * sr + Z * cr;
      // 4. yaw: turn the head toward the viewer
      var cy = Math.cos(m.yaw), sy = Math.sin(m.yaw), X3 = X * cy + Z2 * sy, Z3 = -X * sy + Z2 * cy;
      // 5. perspective projection
      var p = F / (F + Z3);
      return [cxM + X3 * p, cyM + (Y2 + m.lift) * p];
    }

    function frame(m) {
      if (!m || (m.swim < 1e-4 && m.turn < 1e-4)) { fish.setAttribute('d', orig); return; }
      var p = [];
      for (var s = 0; s < segs.length; s++) {
        var g = segs[s];
        if (g[0] === 'Z') { p.push('Z'); continue; }
        var q = [g[0]];
        for (var k = 1; k < g.length; k += 2) { var r = warp(g[k], g[k + 1], m); q.push(r[0].toFixed(3), r[1].toFixed(3)); }
        p.push(q.join(' '));
      }
      fish.setAttribute('d', p.join(' '));
    }

    function bell(u) { return u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(Math.PI * u), 2); }
    function motion(s) {
      var swim = ease((s - 0.6) / 0.8) * (1 - ease((s - 5.6) / 0.9));
      var u = (s - 1.6) / 3.6, turn = bell(u);
      var arch = bell((s - 2.1) / 2.6);
      return {
        phi: 2 * Math.PI * (s - 0.6) / SWIM_PERIOD, swim: swim, turn: turn + arch,
        yaw: 0.62 * turn * Math.sin(Math.PI * Math.min(1, Math.max(0, u)) * 1.0 + 0.3),
        roll: 0.38 * turn,
        curl: 0.55 * arch,
        lift: -0.08 * L * arch
      };
    }
    function ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
    var t0 = null, raf = 0;

    function tick(now) {
      if (t0 === null) t0 = now;
      var s = ((now - t0) / 1000) % LOOP;
      frame(motion(s));
      if (grad) {
        var u = (s - 6.4) / 1.3, on = u > 0 && u < 1;
        sheen.style.opacity = on ? 1 : 0;
        grad.setAttribute('gradientTransform', 'translate(' + (-0.75 + 1.5 * ease(u)).toFixed(4) + ' 0)');
      }
      raf = requestAnimationFrame(tick);
    }

    svg.trlReplay = function () { t0 = null; };
    if (reduce) { frame(null); return; }
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); frame(null); }
      else { t0 = null; raf = requestAnimationFrame(tick); }
    });
  }

  function init() { document.querySelectorAll('svg[data-trl-motion]').forEach(start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
