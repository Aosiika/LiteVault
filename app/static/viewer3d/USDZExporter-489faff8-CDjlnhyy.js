import { u as Xt, C as W, N as Yt } from "./main-VBpWXpeE.js";
/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/
var S = Uint8Array, R = Uint16Array, ht = Int32Array, mt = new S([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]), yt = new S([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]), xt = new S([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), St = function(t, r) {
  for (var e = new R(31), n = 0; n < 31; ++n)
    e[n] = r += 1 << t[n - 1];
  for (var o = new ht(e[30]), n = 1; n < 30; ++n)
    for (var a = e[n]; a < e[n + 1]; ++a)
      o[a] = a - e[n] << 5 | n;
  return { b: e, r: o };
}, kt = St(mt, 2), Ft = kt.b, ut = kt.r;
Ft[28] = 258, ut[258] = 28;
var Vt = St(yt, 0), Mt = Vt.r, Ut = new R(32768);
for (var M = 0; M < 32768; ++M) {
  var X = (M & 43690) >> 1 | (M & 21845) << 1;
  X = (X & 52428) >> 2 | (X & 13107) << 2, X = (X & 61680) >> 4 | (X & 3855) << 4, Ut[M] = ((X & 65280) >> 8 | (X & 255) << 8) >> 1;
}
var tt = function(t, r, e) {
  for (var n = t.length, o = 0, a = new R(r); o < n; ++o)
    t[o] && ++a[t[o] - 1];
  var i = new R(r);
  for (o = 1; o < r; ++o)
    i[o] = i[o - 1] + a[o - 1] << 1;
  var l;
  for (l = new R(n), o = 0; o < n; ++o)
    t[o] && (l[o] = Ut[i[t[o] - 1]++] >> 15 - t[o]);
  return l;
}, Y = new S(288);
for (var M = 0; M < 144; ++M)
  Y[M] = 8;
for (var M = 144; M < 256; ++M)
  Y[M] = 9;
for (var M = 256; M < 280; ++M)
  Y[M] = 7;
for (var M = 280; M < 288; ++M)
  Y[M] = 8;
var et = new S(32);
for (var M = 0; M < 32; ++M)
  et[M] = 5;
var Kt = /* @__PURE__ */ tt(Y, 9), Qt = /* @__PURE__ */ tt(et, 5), Dt = function(t) {
  return (t + 7) / 8 | 0;
}, At = function(t, r, e) {
  return (e == null || e > t.length) && (e = t.length), new S(t.subarray(r, e));
}, Wt = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
], ot = function(t, r, e) {
  var n = new Error(r || Wt[t]);
  if (n.code = t, Error.captureStackTrace && Error.captureStackTrace(n, ot), !e)
    throw n;
  return n;
}, G = function(t, r, e) {
  e <<= r & 7;
  var n = r / 8 | 0;
  t[n] |= e, t[n + 1] |= e >> 8;
}, J = function(t, r, e) {
  e <<= r & 7;
  var n = r / 8 | 0;
  t[n] |= e, t[n + 1] |= e >> 8, t[n + 2] |= e >> 16;
}, ct = function(t, r) {
  for (var e = [], n = 0; n < t.length; ++n)
    t[n] && e.push({ s: n, f: t[n] });
  var o = e.length, a = e.slice();
  if (!o)
    return { t: Rt, l: 0 };
  if (o == 1) {
    var i = new S(e[0].s + 1);
    return i[e[0].s] = 1, { t: i, l: 1 };
  }
  e.sort(function(k, U) {
    return k.f - U.f;
  }), e.push({ s: -1, f: 25001 });
  var l = e[0], c = e[1], p = 0, s = 1, d = 2;
  for (e[0] = { s: -1, f: l.f + c.f, l, r: c }; s != o - 1; )
    l = e[e[p].f < e[d].f ? p++ : d++], c = e[p != s && e[p].f < e[d].f ? p++ : d++], e[s++] = { s: -1, f: l.f + c.f, l, r: c };
  for (var f = a[0].s, n = 1; n < o; ++n)
    a[n].s > f && (f = a[n].s);
  var u = new R(f + 1), v = pt(e[s - 1], u, 0);
  if (v > r) {
    var n = 0, m = 0, P = v - r, w = 1 << P;
    for (a.sort(function(U, T) {
      return u[T.s] - u[U.s] || U.f - T.f;
    }); n < o; ++n) {
      var x = a[n].s;
      if (u[x] > r)
        m += w - (1 << v - u[x]), u[x] = r;
      else
        break;
    }
    for (m >>= P; m > 0; ) {
      var y = a[n].s;
      u[y] < r ? m -= 1 << r - u[y]++ - 1 : ++n;
    }
    for (; n >= 0 && m; --n) {
      var _ = a[n].s;
      u[_] == r && (--u[_], ++m);
    }
    v = r;
  }
  return { t: new S(u), l: v };
}, pt = function(t, r, e) {
  return t.s == -1 ? Math.max(pt(t.l, r, e + 1), pt(t.r, r, e + 1)) : r[t.s] = e;
}, wt = function(t) {
  for (var r = t.length; r && !t[--r]; )
    ;
  for (var e = new R(++r), n = 0, o = t[0], a = 1, i = function(c) {
    e[n++] = c;
  }, l = 1; l <= r; ++l)
    if (t[l] == o && l != r)
      ++a;
    else {
      if (!o && a > 2) {
        for (; a > 138; a -= 138)
          i(32754);
        a > 2 && (i(a > 10 ? a - 11 << 5 | 28690 : a - 3 << 5 | 12305), a = 0);
      } else if (a > 3) {
        for (i(o), --a; a > 6; a -= 6)
          i(8304);
        a > 2 && (i(a - 3 << 5 | 8208), a = 0);
      }
      for (; a--; )
        i(o);
      a = 1, o = t[l];
    }
  return { c: e.subarray(0, n), n: r };
}, N = function(t, r) {
  for (var e = 0, n = 0; n < r.length; ++n)
    e += t[n] * r[n];
  return e;
}, Ot = function(t, r, e) {
  var n = e.length, o = Dt(r + 2);
  t[o] = n & 255, t[o + 1] = n >> 8, t[o + 2] = t[o] ^ 255, t[o + 3] = t[o + 1] ^ 255;
  for (var a = 0; a < n; ++a)
    t[o + a + 4] = e[a];
  return (o + 4 + n) * 8;
}, _t = function(t, r, e, n, o, a, i, l, c, p, s) {
  G(r, s++, e), ++o[256];
  for (var d = ct(o, 15), f = d.t, u = d.l, v = ct(a, 15), m = v.t, P = v.l, w = wt(f), x = w.c, y = w.n, _ = wt(m), k = _.c, U = _.n, T = new R(19), g = 0; g < x.length; ++g)
    ++T[x[g] & 31];
  for (var g = 0; g < k.length; ++g)
    ++T[k[g] & 31];
  for (var h = ct(T, 7), D = h.t, F = h.l, A = 19; A > 4 && !D[xt[A - 1]]; --A)
    ;
  var V = p + 5 << 3, j = N(o, Y) + N(a, et) + i, H = N(o, f) + N(a, m) + i + 14 + 3 * A + N(T, D) + 2 * T[16] + 3 * T[17] + 7 * T[18];
  if (c >= 0 && V <= j && V <= H)
    return Ot(r, s, t.subarray(c, c + p));
  var L, b, I, q;
  if (G(r, s, 1 + (H < j)), s += 2, H < j) {
    L = tt(f, u), b = f, I = tt(m, P), q = m;
    var at = tt(D, F);
    G(r, s, y - 257), G(r, s + 5, U - 1), G(r, s + 10, A - 4), s += 14;
    for (var g = 0; g < A; ++g)
      G(r, s + 3 * g, D[xt[g]]);
    s += 3 * A;
    for (var z = [x, k], B = 0; B < 2; ++B)
      for (var K = z[B], g = 0; g < K.length; ++g) {
        var Z = K[g] & 31;
        G(r, s, at[Z]), s += D[Z], Z > 15 && (G(r, s, K[g] >> 5 & 127), s += K[g] >> 12);
      }
  } else
    L = Kt, b = Y, I = Qt, q = et;
  for (var g = 0; g < l; ++g) {
    var C = n[g];
    if (C > 255) {
      var Z = C >> 18 & 31;
      J(r, s, L[Z + 257]), s += b[Z + 257], Z > 7 && (G(r, s, C >> 23 & 31), s += mt[Z]);
      var Q = C & 31;
      J(r, s, I[Q]), s += q[Q], Q > 3 && (J(r, s, C >> 5 & 8191), s += yt[Q]);
    } else
      J(r, s, L[C]), s += b[C];
  }
  return J(r, s, L[256]), s + b[256];
}, Bt = /* @__PURE__ */ new ht([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]), Rt = /* @__PURE__ */ new S(0), Jt = function(t, r, e, n, o, a) {
  var i = a.z || t.length, l = new S(n + i + 5 * (1 + Math.ceil(i / 7e3)) + o), c = l.subarray(n, l.length - o), p = a.l, s = (a.r || 0) & 7;
  if (r) {
    s && (c[0] = a.r >> 3);
    for (var d = Bt[r - 1], f = d >> 13, u = d & 8191, v = (1 << e) - 1, m = a.p || new R(32768), P = a.h || new R(v + 1), w = Math.ceil(e / 3), x = 2 * w, y = function(lt) {
      return (t[lt] ^ t[lt + 1] << w ^ t[lt + 2] << x) & v;
    }, _ = new ht(25e3), k = new R(288), U = new R(32), T = 0, g = 0, h = a.i || 0, D = 0, F = a.w || 0, A = 0; h + 2 < i; ++h) {
      var V = y(h), j = h & 32767, H = P[V];
      if (m[j] = H, P[V] = j, F <= h) {
        var L = i - h;
        if ((T > 7e3 || D > 24576) && (L > 423 || !p)) {
          s = _t(t, c, 0, _, k, U, g, D, A, h - A, s), D = T = g = 0, A = h;
          for (var b = 0; b < 286; ++b)
            k[b] = 0;
          for (var b = 0; b < 30; ++b)
            U[b] = 0;
        }
        var I = 2, q = 0, at = u, z = j - H & 32767;
        if (L > 2 && V == y(h - z))
          for (var B = Math.min(f, L) - 1, K = Math.min(32767, h), Z = Math.min(258, L); z <= K && --at && j != H; ) {
            if (t[h + I] == t[h + I - z]) {
              for (var C = 0; C < Z && t[h + C] == t[h + C - z]; ++C)
                ;
              if (C > I) {
                if (I = C, q = z, C > B)
                  break;
                for (var Q = Math.min(z, C - 2), gt = 0, b = 0; b < Q; ++b) {
                  var it = h - z + b & 32767, qt = m[it], vt = it - qt & 32767;
                  vt > gt && (gt = vt, H = it);
                }
              }
            }
            j = H, H = m[j], z += j - H & 32767;
          }
        if (q) {
          _[D++] = 268435456 | ut[I] << 18 | Mt[q];
          var $t = ut[I] & 31, Pt = Mt[q] & 31;
          g += mt[$t] + yt[Pt], ++k[257 + $t], ++U[Pt], F = h + I, ++T;
        } else
          _[D++] = t[h], ++k[t[h]];
      }
    }
    for (h = Math.max(h, F); h < i; ++h)
      _[D++] = t[h], ++k[t[h]];
    s = _t(t, c, p, _, k, U, g, D, A, h - A, s), p || (a.r = s & 7 | c[s / 8 | 0] << 3, s -= 7, a.h = P, a.p = m, a.i = h, a.w = F);
  } else {
    for (var h = a.w || 0; h < i + p; h += 65535) {
      var st = h + 65535;
      st >= i && (c[s / 8 | 0] = p, st = i), s = Ot(c, s + 1, t.subarray(h, st));
    }
    a.i = i;
  }
  return At(l, 0, n + Dt(s) + o);
}, Nt = /* @__PURE__ */ function() {
  for (var t = new Int32Array(256), r = 0; r < 256; ++r) {
    for (var e = r, n = 9; --n; )
      e = (e & 1 && -306674912) ^ e >>> 1;
    t[r] = e;
  }
  return t;
}(), tr = function() {
  var t = -1;
  return {
    p: function(r) {
      for (var e = t, n = 0; n < r.length; ++n)
        e = Nt[e & 255 ^ r[n]] ^ e >>> 8;
      t = e;
    },
    d: function() {
      return ~t;
    }
  };
}, rr = function(t, r, e, n, o) {
  if (!o && (o = { l: 1 }, r.dictionary)) {
    var a = r.dictionary.subarray(-32768), i = new S(a.length + t.length);
    i.set(a), i.set(t, a.length), t = i, o.w = a.length;
  }
  return Jt(t, r.level == null ? 6 : r.level, r.mem == null ? o.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(t.length))) * 1.5) : 20 : 12 + r.mem, e, n, o);
}, jt = function(t, r) {
  var e = {};
  for (var n in t)
    e[n] = t[n];
  for (var n in r)
    e[n] = r[n];
  return e;
}, E = function(t, r, e) {
  for (; e; ++r)
    t[r] = e, e >>>= 8;
};
function er(t, r) {
  return rr(t, r || {}, 0, 0);
}
var Ht = function(t, r, e, n) {
  for (var o in t) {
    var a = t[o], i = r + o, l = n;
    Array.isArray(a) && (l = jt(n, a[1]), a = a[0]), a instanceof S ? e[i] = [a, l] : (e[i += "/"] = [new S(0), l], Ht(a, i, e, n));
  }
}, Tt = typeof TextEncoder < "u" && /* @__PURE__ */ new TextEncoder(), nr = typeof TextDecoder < "u" && /* @__PURE__ */ new TextDecoder(), or = 0;
try {
  nr.decode(Rt, { stream: !0 }), or = 1;
} catch {
}
function nt(t, r) {
  var e;
  if (Tt)
    return Tt.encode(t);
  for (var n = t.length, o = new S(t.length + (t.length >> 1)), a = 0, i = function(s) {
    o[a++] = s;
  }, e = 0; e < n; ++e) {
    if (a + 5 > o.length) {
      var l = new S(a + 8 + (n - e << 1));
      l.set(o), o = l;
    }
    var c = t.charCodeAt(e);
    c < 128 || r ? i(c) : c < 2048 ? (i(192 | c >> 6), i(128 | c & 63)) : c > 55295 && c < 57344 ? (c = 65536 + (c & 1047552) | t.charCodeAt(++e) & 1023, i(240 | c >> 18), i(128 | c >> 12 & 63), i(128 | c >> 6 & 63), i(128 | c & 63)) : (i(224 | c >> 12), i(128 | c >> 6 & 63), i(128 | c & 63));
  }
  return At(o, 0, a);
}
var ft = function(t) {
  var r = 0;
  if (t)
    for (var e in t) {
      var n = t[e].length;
      n > 65535 && ot(9), r += n + 4;
    }
  return r;
}, bt = function(t, r, e, n, o, a, i, l) {
  var c = n.length, p = e.extra, s = l && l.length, d = ft(p);
  E(t, r, i != null ? 33639248 : 67324752), r += 4, i != null && (t[r++] = 20, t[r++] = e.os), t[r] = 20, r += 2, t[r++] = e.flag << 1 | (a < 0 && 8), t[r++] = o && 8, t[r++] = e.compression & 255, t[r++] = e.compression >> 8;
  var f = new Date(e.mtime == null ? Date.now() : e.mtime), u = f.getFullYear() - 1980;
  if ((u < 0 || u > 119) && ot(10), E(t, r, u << 25 | f.getMonth() + 1 << 21 | f.getDate() << 16 | f.getHours() << 11 | f.getMinutes() << 5 | f.getSeconds() >> 1), r += 4, a != -1 && (E(t, r, e.crc), E(t, r + 4, a < 0 ? -a - 2 : a), E(t, r + 8, e.size)), E(t, r + 12, c), E(t, r + 14, d), r += 16, i != null && (E(t, r, s), E(t, r + 6, e.attrs), E(t, r + 10, i), r += 14), t.set(n, r), r += c, d)
    for (var v in p) {
      var m = p[v], P = m.length;
      E(t, r, +v), E(t, r + 2, P), t.set(m, r + 4), r += 4 + P;
    }
  return s && (t.set(l, r), r += s), r;
}, ar = function(t, r, e, n, o) {
  E(t, r, 101010256), E(t, r + 8, e), E(t, r + 10, e), E(t, r + 12, n), E(t, r + 16, o);
};
function ir(t, r) {
  r || (r = {});
  var e = {}, n = [];
  Ht(t, "", e, r);
  var o = 0, a = 0;
  for (var i in e) {
    var l = e[i], c = l[0], p = l[1], s = p.level == 0 ? 0 : 8, d = nt(i), f = d.length, u = p.comment, v = u && nt(u), m = v && v.length, P = ft(p.extra);
    f > 65535 && ot(11);
    var w = s ? er(c, p) : c, x = w.length, y = tr();
    y.p(c), n.push(jt(p, {
      size: c.length,
      crc: y.d(),
      c: w,
      f: d,
      m: v,
      u: f != i.length || v && u.length != m,
      o,
      compression: s
    })), o += 30 + f + P + x, a += 76 + 2 * (f + P) + (m || 0) + x;
  }
  for (var _ = new S(a + 22), k = o, U = a - o, T = 0; T < n.length; ++T) {
    var d = n[T];
    bt(_, d.o, d, d.f, d.u, d.c.length);
    var g = 30 + d.f.length + ft(d.extra);
    _.set(d.c, d.o + g), bt(_, o, d, d.f, d.u, d.c.length, d.o, d.m), o += 16 + g + (d.m ? d.m.length : 0);
  }
  return ar(_, o, n.length, U, k), _;
}
class O {
  constructor(r, e = "", n = [], o = []) {
    this.name = r, this.type = e, this.metadata = n, this.properties = o, this.children = [];
  }
  addMetadata(r, e) {
    this.metadata.push({ key: r, value: e });
  }
  addProperty(r, e = []) {
    this.properties.push({ property: r, metadata: e });
  }
  addChild(r) {
    this.children.push(r);
  }
  toString(r = 0) {
    const e = "	".repeat(r), n = this.metadata.map((s) => {
      const d = s.key, f = s.value;
      if (Array.isArray(f)) {
        const u = [];
        return u.push(`${d} = {`), f.forEach((v) => {
          u.push(`${e}		${v}`);
        }), u.push(`${e}	}`), u.join(`
`);
      } else
        return `${d} = ${f}`;
    }), o = n.length ? ` (
${n.map((s) => `${e}	${s}`).join(`
`)}
${e})` : "", a = this.properties.map((s) => {
      const d = s.property, f = s.metadata.length ? ` (
${s.metadata.map((u) => `${e}		${u}`).join(`
`)}
${e}	)` : "";
      return `${e}	${d}${f}`;
    }), i = this.children.map((s) => s.toString(r + 1)), l = [];
    if (a.length > 0 && l.push(...a), i.length > 0) {
      a.length > 0 && l.push("");
      for (let s = 0; s < i.length; s++)
        l.push(i[s]), s < i.length - 1 && l.push("");
    }
    const c = l.join(`
`), p = this.type ? this.type + " " : "";
    return `${e}def ${p}"${this.name}"${o}
${e}{
${c}
${e}}`;
  }
}
class $r {
  /**
   * Constructs a new USDZ exporter.
   */
  constructor() {
    this.textureUtils = null;
  }
  /**
   * Sets the texture utils for this exporter. Only relevant when compressed textures have to be exported.
   *
   * Depending on whether you use {@link WebGLRenderer} or {@link WebGPURenderer}, you must inject the
   * corresponding texture utils {@link WebGLTextureUtils} or {@link WebGPUTextureUtils}.
   *
   * @param {WebGLTextureUtils|WebGPUTextureUtils} utils - The texture utils.
   */
  setTextureUtils(r) {
    this.textureUtils = r;
  }
  /**
   * Parse the given 3D object and generates the USDZ output.
   *
   * @param {Object3D} scene - The 3D object to export.
   * @param {USDZExporter~OnDone} onDone - A callback function that is executed when the export has finished.
   * @param {USDZExporter~OnError} onError - A callback function that is executed when an error happens.
   * @param {USDZExporter~Options} options - The export options.
   */
  parse(r, e, n, o) {
    this.parseAsync(r, o).then(e).catch(n);
  }
  /**
   * Async version of {@link USDZExporter#parse}.
   *
   * @async
   * @param {Object3D} scene - The 3D object to export.
   * @param {USDZExporter~Options} options - The export options.
   * @return {Promise<ArrayBuffer>} A Promise that resolved with the exported USDZ data.
   */
  async parseAsync(r, e = {}) {
    e = Object.assign(
      {
        ar: {
          anchoring: { type: "plane" },
          planeAnchoring: { alignment: "horizontal" }
        },
        includeAnchoringProperties: !0,
        onlyVisible: !0,
        quickLookCompatible: !1,
        maxTextureSize: 1024
      },
      e
    );
    const n = /* @__PURE__ */ new Set(), o = {}, a = "model.usda";
    o[a] = null;
    const i = new O("Root", "Xform"), l = new O("Scenes", "Scope");
    l.addMetadata("kind", '"sceneLibrary"'), i.addChild(l);
    const c = "Scene", p = new O(c, "Xform");
    p.addMetadata("customData", [
      "bool preliminary_collidesWithEnvironment = 0",
      `string sceneName = "${c}"`
    ]), p.addMetadata("sceneName", `"${c}"`), e.includeAnchoringProperties && (p.addProperty(
      `token preliminary:anchoring:type = "${e.ar.anchoring.type}"`
    ), p.addProperty(
      `token preliminary:planeAnchoring:alignment = "${e.ar.planeAnchoring.alignment}"`
    )), l.addChild(p);
    let s;
    const d = {}, f = {};
    zt(r, p, d, n, o, e);
    const u = hr(
      d,
      f,
      e.quickLookCompatible
    );
    s = Lt() + `
` + i.toString() + `

` + u.toString(), o[a] = nt(s), s = null;
    for (const m in f) {
      let P = f[m];
      if (P.isCompressedTexture === !0) {
        if (this.textureUtils === null)
          throw new Error(
            "THREE.USDZExporter: setTextureUtils() must be called to process compressed textures."
          );
        P = await this.textureUtils.decompress(P);
      }
      const w = sr(
        P.image,
        P.flipY,
        e.maxTextureSize
      ), x = await new Promise(
        (y) => w.toBlob(y, "image/png", 1)
      );
      o[`textures/Texture_${m}.png`] = new Uint8Array(
        await x.arrayBuffer()
      );
    }
    let v = 0;
    for (const m in o) {
      const P = o[m], w = 34 + m.length;
      v += w;
      const x = v & 63;
      if (x !== 4) {
        const y = 64 - x, _ = new Uint8Array(y);
        o[m] = [P, { extra: { 12345: _ } }];
      }
      v = P.length;
    }
    return ir(o, { level: 0 });
  }
}
function It(t, r) {
  let e = t.name;
  return e = e.replace(/[^A-Za-z0-9_]/g, ""), /^[0-9]/.test(e) && (e = "_" + e), e === "" && (t.isCamera ? e = "Camera" : e = "Object"), r.has(e) && (e = e + "_" + t.id), r.add(e), e;
}
function sr(t, r, e) {
  if (typeof HTMLImageElement < "u" && t instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && t instanceof HTMLCanvasElement || typeof OffscreenCanvas < "u" && t instanceof OffscreenCanvas || typeof ImageBitmap < "u" && t instanceof ImageBitmap) {
    const n = e / Math.max(t.width, t.height), o = document.createElement("canvas");
    o.width = t.width * Math.min(1, n), o.height = t.height * Math.min(1, n);
    const a = o.getContext("2d");
    return r === !0 && (a.translate(0, o.height), a.scale(1, -1)), a.drawImage(t, 0, 0, o.width, o.height), o;
  } else
    throw new Error(
      "THREE.USDZExporter: No valid image data found. Unable to process texture."
    );
}
const $ = 7;
function Lt() {
  return `#usda 1.0
(
	customLayerData = {
		string creator = "Three.js USDZExporter"
	}
	defaultPrim = "Root"
	metersPerUnit = 1
	upAxis = "Y"
)
`;
}
function zt(t, r, e, n, o, a) {
  for (let i = 0, l = t.children.length; i < l; i++) {
    const c = t.children[i];
    if (c.visible === !1 && a.onlyVisible === !0)
      continue;
    let p;
    if (c.isMesh) {
      const s = c.geometry, d = c.material;
      if (d.isMeshStandardMaterial) {
        const f = "geometries/Geometry_" + s.id + ".usda";
        if (!(f in o)) {
          const u = cr(s);
          o[f] = nt(
            Lt() + `
` + u.toString()
          );
        }
        d.uuid in e || (e[d.uuid] = d), p = lr(
          c,
          s,
          e[d.uuid],
          n
        );
      } else
        console.warn(
          "THREE.USDZExporter: Unsupported material type (USDZ only supports MeshStandardMaterial)",
          c
        );
    } else
      c.isCamera ? p = gr(c, n) : p = Zt(c, n);
    p && (r.addChild(p), zt(c, p, e, n, o, a));
  }
}
function Zt(t, r) {
  const e = It(t, r);
  t.matrix.determinant() < 0 && console.warn(
    "THREE.USDZExporter: USDZ does not support negative scales",
    t
  );
  const n = new O(e, "Xform");
  if (t.pivot !== null) {
    const o = t.position, a = t.quaternion, i = t.scale, l = t.pivot;
    n.addProperty(`float3 xformOp:translate = (${o.x.toPrecision($)}, ${o.y.toPrecision($)}, ${o.z.toPrecision($)})`), n.addProperty(`float3 xformOp:translate:pivot = (${l.x.toPrecision($)}, ${l.y.toPrecision($)}, ${l.z.toPrecision($)})`), n.addProperty(`quatf xformOp:orient = (${a.w.toPrecision($)}, ${a.x.toPrecision($)}, ${a.y.toPrecision($)}, ${a.z.toPrecision($)})`), n.addProperty(`float3 xformOp:scale = (${i.x.toPrecision($)}, ${i.y.toPrecision($)}, ${i.z.toPrecision($)})`), n.addProperty('uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:translate:pivot", "xformOp:orient", "xformOp:scale", "!invert!xformOp:translate:pivot"]');
  } else {
    const o = Gt(t.matrix);
    n.addProperty(`matrix4d xformOp:transform = ${o}`), n.addProperty('uniform token[] xformOpOrder = ["xformOp:transform"]');
  }
  return n;
}
function lr(t, r, e, n) {
  const o = Zt(t, n);
  return o.addMetadata(
    "prepend references",
    `@./geometries/Geometry_${r.id}.usda@</Geometry>`
  ), o.addMetadata("prepend apiSchemas", '["MaterialBindingAPI"]'), o.addProperty(
    `rel material:binding = </Materials/Material_${e.id}>`
  ), o;
}
function Gt(t) {
  const r = t.elements;
  return `( ${rt(r, 0)}, ${rt(
    r,
    4
  )}, ${rt(r, 8)}, ${rt(r, 12)} )`;
}
function rt(t, r) {
  return `(${t[r + 0]}, ${t[r + 1]}, ${t[r + 2]}, ${t[r + 3]})`;
}
function cr(t) {
  const r = new O("Geometry"), e = dr(t);
  return r.addChild(e), r;
}
function dr(t) {
  const r = "Geometry", e = t.attributes, n = e.position.count, o = new O(r, "Mesh");
  o.addProperty(
    `int[] faceVertexCounts = [${ur(t)}]`
  ), o.addProperty(
    `int[] faceVertexIndices = [${pr(t)}]`
  ), o.addProperty(
    `normal3f[] normals = [${dt(e.normal, n)}]`,
    ['interpolation = "vertex"']
  ), o.addProperty(
    `point3f[] points = [${dt(e.position, n)}]`
  );
  for (let i = 0; i < 4; i++) {
    const l = i > 0 ? i : "", c = e["uv" + l];
    c !== void 0 && o.addProperty(
      `texCoord2f[] primvars:st${l} = [${fr(c)}]`,
      ['interpolation = "vertex"']
    );
  }
  const a = e.color;
  return a !== void 0 && o.addProperty(
    `color3f[] primvars:displayColor = [${dt(
      a,
      n
    )}]`,
    ['interpolation = "vertex"']
  ), o.addProperty('uniform token subdivisionScheme = "none"'), o;
}
function ur(t) {
  const r = t.index !== null ? t.index.count : t.attributes.position.count;
  return Array(r / 3).fill(3).join(", ");
}
function pr(t) {
  const r = t.index, e = [];
  if (r !== null)
    for (let n = 0; n < r.count; n++)
      e.push(r.getX(n));
  else {
    const n = t.attributes.position.count;
    for (let o = 0; o < n; o++)
      e.push(o);
  }
  return e.join(", ");
}
function dt(t, r) {
  if (t === void 0)
    return console.warn("USDZExporter: Normals missing."), Array(r).fill("(0, 0, 0)").join(", ");
  const e = [];
  for (let n = 0; n < t.count; n++) {
    const o = t.getX(n), a = t.getY(n), i = t.getZ(n);
    e.push(
      `(${o.toPrecision($)}, ${a.toPrecision(
        $
      )}, ${i.toPrecision($)})`
    );
  }
  return e.join(", ");
}
function fr(t) {
  const r = [];
  for (let e = 0; e < t.count; e++) {
    const n = t.getX(e), o = t.getY(e);
    r.push(
      `(${n.toPrecision($)}, ${1 - o.toPrecision($)})`
    );
  }
  return r.join(", ");
}
function hr(t, r, e = !1) {
  const n = new O("Materials");
  for (const o in t) {
    const a = t[o];
    n.addChild(
      mr(a, r, e)
    );
  }
  return n;
}
function mr(t, r, e = !1) {
  const n = new O(`Material_${t.id}`, "Material");
  function o(i, l, c) {
    const p = i.source.id + "_" + i.flipY;
    r[p] = i;
    const s = i.channel > 0 ? "st" + i.channel : "st", d = {
      1e3: "repeat",
      // RepeatWrapping
      1001: "clamp",
      // ClampToEdgeWrapping
      1002: "mirror"
      // MirroredRepeatWrapping
    }, f = i.repeat.clone(), u = i.offset.clone(), v = i.rotation, m = Math.sin(v), P = Math.cos(v);
    u.y = 1 - u.y - f.y, e ? (u.x = u.x / f.x, u.y = u.y / f.y, u.x += m / f.x, u.y += P - 1) : (u.x += m * f.x, u.y += (1 - P) * f.y);
    const w = new O(`PrimvarReader_${l}`, "Shader");
    w.addProperty(
      'uniform token info:id = "UsdPrimvarReader_float2"'
    ), w.addProperty("float2 inputs:fallback = (0.0, 0.0)"), w.addProperty(`string inputs:varname = "${s}"`), w.addProperty("float2 outputs:result");
    const x = new O(`Transform2d_${l}`, "Shader");
    x.addProperty('uniform token info:id = "UsdTransform2d"'), x.addProperty(
      `float2 inputs:in.connect = </Materials/Material_${t.id}/PrimvarReader_${l}.outputs:result>`
    ), x.addProperty(
      `float inputs:rotation = ${(v * (180 / Math.PI)).toFixed(
        $
      )}`
    ), x.addProperty(
      `float2 inputs:scale = ${Ct(f)}`
    ), x.addProperty(
      `float2 inputs:translation = ${Ct(u)}`
    ), x.addProperty("float2 outputs:result");
    const y = new O(
      `Texture_${i.id}_${l}`,
      "Shader"
    );
    return y.addProperty('uniform token info:id = "UsdUVTexture"'), y.addProperty(`asset inputs:file = @textures/Texture_${p}.png@`), y.addProperty(
      `float2 inputs:st.connect = </Materials/Material_${t.id}/Transform2d_${l}.outputs:result>`
    ), c !== void 0 && y.addProperty(`float4 inputs:scale = ${yr(c)}`), l === "normal" && (y.addProperty("float4 inputs:scale = (2, 2, 2, 1)"), y.addProperty("float4 inputs:bias = (-1, -1, -1, 0)")), y.addProperty(
      `token inputs:sourceColorSpace = "${i.colorSpace === Yt ? "raw" : "sRGB"}"`
    ), y.addProperty(
      `token inputs:wrapS = "${d[i.wrapS]}"`
    ), y.addProperty(
      `token inputs:wrapT = "${d[i.wrapT]}"`
    ), y.addProperty("float outputs:r"), y.addProperty("float outputs:g"), y.addProperty("float outputs:b"), y.addProperty("float3 outputs:rgb"), (t.transparent || t.alphaTest > 0) && y.addProperty("float outputs:a"), [w, x, y];
  }
  t.side === Xt && console.warn(
    "THREE.USDZExporter: USDZ does not support double sided materials",
    t
  );
  const a = new O("PreviewSurface", "Shader");
  if (a.addProperty('uniform token info:id = "UsdPreviewSurface"'), t.map !== null ? (a.addProperty(
    `color3f inputs:diffuseColor.connect = </Materials/Material_${t.id}/Texture_${t.map.id}_diffuse.outputs:rgb>`
  ), t.transparent ? a.addProperty(
    `float inputs:opacity.connect = </Materials/Material_${t.id}/Texture_${t.map.id}_diffuse.outputs:a>`
  ) : t.alphaTest > 0 && (a.addProperty(
    `float inputs:opacity.connect = </Materials/Material_${t.id}/Texture_${t.map.id}_diffuse.outputs:a>`
  ), a.addProperty(
    `float inputs:opacityThreshold = ${t.alphaTest}`
  )), o(
    t.map,
    "diffuse",
    t.color
  ).forEach((i) => n.addChild(i))) : a.addProperty(
    `color3f inputs:diffuseColor = ${Et(t.color)}`
  ), t.emissiveMap !== null) {
    a.addProperty(
      `color3f inputs:emissiveColor.connect = </Materials/Material_${t.id}/Texture_${t.emissiveMap.id}_emissive.outputs:rgb>`
    );
    const i = new W(
      t.emissive.r * t.emissiveIntensity,
      t.emissive.g * t.emissiveIntensity,
      t.emissive.b * t.emissiveIntensity
    );
    o(
      t.emissiveMap,
      "emissive",
      i
    ).forEach((l) => n.addChild(l));
  } else
    t.emissive.getHex() > 0 && a.addProperty(
      `color3f inputs:emissiveColor = ${Et(t.emissive)}`
    );
  if (t.normalMap !== null && (a.addProperty(
    `normal3f inputs:normal.connect = </Materials/Material_${t.id}/Texture_${t.normalMap.id}_normal.outputs:rgb>`
  ), o(t.normalMap, "normal").forEach((i) => n.addChild(i))), t.aoMap !== null) {
    a.addProperty(
      `float inputs:occlusion.connect = </Materials/Material_${t.id}/Texture_${t.aoMap.id}_occlusion.outputs:r>`
    );
    const i = new W(
      t.aoMapIntensity,
      t.aoMapIntensity,
      t.aoMapIntensity
    );
    o(
      t.aoMap,
      "occlusion",
      i
    ).forEach((l) => n.addChild(l));
  }
  if (t.roughnessMap !== null) {
    a.addProperty(
      `float inputs:roughness.connect = </Materials/Material_${t.id}/Texture_${t.roughnessMap.id}_roughness.outputs:g>`
    );
    const i = new W(
      t.roughness,
      t.roughness,
      t.roughness
    );
    o(
      t.roughnessMap,
      "roughness",
      i
    ).forEach((l) => n.addChild(l));
  } else
    a.addProperty(
      `float inputs:roughness = ${t.roughness}`
    );
  if (t.metalnessMap !== null) {
    a.addProperty(
      `float inputs:metallic.connect = </Materials/Material_${t.id}/Texture_${t.metalnessMap.id}_metallic.outputs:b>`
    );
    const i = new W(
      t.metalness,
      t.metalness,
      t.metalness
    );
    o(
      t.metalnessMap,
      "metallic",
      i
    ).forEach((l) => n.addChild(l));
  } else
    a.addProperty(
      `float inputs:metallic = ${t.metalness}`
    );
  if (t.alphaMap !== null ? (a.addProperty(
    `float inputs:opacity.connect = </Materials/Material_${t.id}/Texture_${t.alphaMap.id}_opacity.outputs:r>`
  ), a.addProperty("float inputs:opacityThreshold = 0.0001"), o(t.alphaMap, "opacity").forEach((i) => n.addChild(i))) : a.addProperty(
    `float inputs:opacity = ${t.opacity}`
  ), t.isMeshPhysicalMaterial) {
    if (t.clearcoatMap !== null) {
      a.addProperty(
        `float inputs:clearcoat.connect = </Materials/Material_${t.id}/Texture_${t.clearcoatMap.id}_clearcoat.outputs:r>`
      );
      const i = new W(
        t.clearcoat,
        t.clearcoat,
        t.clearcoat
      );
      o(
        t.clearcoatMap,
        "clearcoat",
        i
      ).forEach((l) => n.addChild(l));
    } else
      a.addProperty(
        `float inputs:clearcoat = ${t.clearcoat}`
      );
    if (t.clearcoatRoughnessMap !== null) {
      a.addProperty(
        `float inputs:clearcoatRoughness.connect = </Materials/Material_${t.id}/Texture_${t.clearcoatRoughnessMap.id}_clearcoatRoughness.outputs:g>`
      );
      const i = new W(
        t.clearcoatRoughness,
        t.clearcoatRoughness,
        t.clearcoatRoughness
      );
      o(
        t.clearcoatRoughnessMap,
        "clearcoatRoughness",
        i
      ).forEach((l) => n.addChild(l));
    } else
      a.addProperty(
        `float inputs:clearcoatRoughness = ${t.clearcoatRoughness}`
      );
    a.addProperty(`float inputs:ior = ${t.ior}`);
  }
  return a.addProperty("int inputs:useSpecularWorkflow = 0"), a.addProperty("token outputs:surface"), n.addChild(a), n.addProperty(
    `token outputs:surface.connect = </Materials/Material_${t.id}/PreviewSurface.outputs:surface>`
  ), n;
}
function Et(t) {
  return `(${t.r}, ${t.g}, ${t.b})`;
}
function yr(t) {
  return `(${t.r}, ${t.g}, ${t.b}, 1.0)`;
}
function Ct(t) {
  return `(${t.x}, ${t.y})`;
}
function gr(t, r) {
  const e = It(t, r), n = Gt(t.matrix);
  t.matrix.determinant() < 0 && console.warn(
    "THREE.USDZExporter: USDZ does not support negative scales",
    t
  );
  const o = new O(e, "Camera");
  o.addProperty(`matrix4d xformOp:transform = ${n}`), o.addProperty('uniform token[] xformOpOrder = ["xformOp:transform"]');
  const a = t.isOrthographicCamera ? "orthographic" : "perspective";
  o.addProperty(`token projection = "${a}"`);
  const i = `(${t.near.toPrecision(
    $
  )}, ${t.far.toPrecision($)})`;
  o.addProperty(`float2 clippingRange = ${i}`);
  let l;
  t.isOrthographicCamera ? l = ((Math.abs(t.left) + Math.abs(t.right)) * 10).toPrecision($) : l = t.getFilmWidth().toPrecision($), o.addProperty(`float horizontalAperture = ${l}`);
  let c;
  if (t.isOrthographicCamera ? c = ((Math.abs(t.top) + Math.abs(t.bottom)) * 10).toPrecision($) : c = t.getFilmHeight().toPrecision($), o.addProperty(`float verticalAperture = ${c}`), t.isPerspectiveCamera) {
    const p = t.getFocalLength().toPrecision($);
    o.addProperty(`float focalLength = ${p}`);
    const s = t.focus.toPrecision($);
    o.addProperty(`float focusDistance = ${s}`);
  }
  return o;
}
export {
  $r as USDZExporter
};
