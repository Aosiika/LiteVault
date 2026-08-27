function yt(t, h) {
  for (var e = 0; e < h.length; e++) {
    const s = h[e];
    if (typeof s != "string" && !Array.isArray(s)) {
      for (const o in s)
        if (o !== "default" && !(o in t)) {
          const p = Object.getOwnPropertyDescriptor(s, o);
          p && Object.defineProperty(t, o, p.get ? p : {
            enumerable: !0,
            get: () => s[o]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }));
}
var st = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, Z = {}, tt = { exports: {} };
/*! https://mths.be/punycode v1.3.2 by @mathias */
tt.exports;
(function(t, h) {
  (function(e) {
    var s = h && !h.nodeType && h, o = t && !t.nodeType && t, p = typeof st == "object" && st;
    (p.global === p || p.window === p || p.self === p) && (e = p);
    var l, f = 2147483647, i = 36, n = 1, c = 26, v = 38, g = 700, d = 72, A = 128, C = "-", U = /^xn--/, D = /[^\x20-\x7E]/, j = /[\x2E\u3002\uFF0E\uFF61]/g, Y = {
      overflow: "Overflow: input needs wider integers to process",
      "not-basic": "Illegal input >= 0x80 (not a basic code point)",
      "invalid-input": "Invalid input"
    }, $ = i - n, w = Math.floor, L = String.fromCharCode, z;
    function F(r) {
      throw RangeError(Y[r]);
    }
    function E(r, a) {
      for (var u = r.length, m = []; u--; )
        m[u] = a(r[u]);
      return m;
    }
    function Q(r, a) {
      var u = r.split("@"), m = "";
      u.length > 1 && (m = u[0] + "@", r = u[1]), r = r.replace(j, ".");
      var y = r.split("."), O = E(y, a).join(".");
      return m + O;
    }
    function N(r) {
      for (var a = [], u = 0, m = r.length, y, O; u < m; )
        y = r.charCodeAt(u++), y >= 55296 && y <= 56319 && u < m ? (O = r.charCodeAt(u++), (O & 64512) == 56320 ? a.push(((y & 1023) << 10) + (O & 1023) + 65536) : (a.push(y), u--)) : a.push(y);
      return a;
    }
    function G(r) {
      return E(r, function(a) {
        var u = "";
        return a > 65535 && (a -= 65536, u += L(a >>> 10 & 1023 | 55296), a = 56320 | a & 1023), u += L(a), u;
      }).join("");
    }
    function k(r) {
      return r - 48 < 10 ? r - 22 : r - 65 < 26 ? r - 65 : r - 97 < 26 ? r - 97 : i;
    }
    function B(r, a) {
      return r + 22 + 75 * (r < 26) - ((a != 0) << 5);
    }
    function ht(r, a, u) {
      var m = 0;
      for (r = u ? w(r / g) : r >> 1, r += w(r / a); r > $ * c >> 1; m += i)
        r = w(r / $);
      return w(m + ($ + 1) * r / (r + v));
    }
    function at(r) {
      var a = [], u = r.length, m, y = 0, O = A, b = d, I, q, M, _, x, P, T, S, K;
      for (I = r.lastIndexOf(C), I < 0 && (I = 0), q = 0; q < I; ++q)
        r.charCodeAt(q) >= 128 && F("not-basic"), a.push(r.charCodeAt(q));
      for (M = I > 0 ? I + 1 : 0; M < u; ) {
        for (_ = y, x = 1, P = i; M >= u && F("invalid-input"), T = k(r.charCodeAt(M++)), (T >= i || T > w((f - y) / x)) && F("overflow"), y += T * x, S = P <= b ? n : P >= b + c ? c : P - b, !(T < S); P += i)
          K = i - S, x > w(f / K) && F("overflow"), x *= K;
        m = a.length + 1, b = ht(y - _, m, _ == 0), w(y / m) > f - O && F("overflow"), O += w(y / m), y %= m, a.splice(y++, 0, O);
      }
      return G(a);
    }
    function it(r) {
      var a, u, m, y, O, b, I, q, M, _, x, P = [], T, S, K, et;
      for (r = N(r), T = r.length, a = A, u = 0, O = d, b = 0; b < T; ++b)
        x = r[b], x < 128 && P.push(L(x));
      for (m = y = P.length, y && P.push(C); m < T; ) {
        for (I = f, b = 0; b < T; ++b)
          x = r[b], x >= a && x < I && (I = x);
        for (S = m + 1, I - a > w((f - u) / S) && F("overflow"), u += (I - a) * S, a = I, b = 0; b < T; ++b)
          if (x = r[b], x < a && ++u > f && F("overflow"), x == a) {
            for (q = u, M = i; _ = M <= O ? n : M >= O + c ? c : M - O, !(q < _); M += i)
              et = q - _, K = i - _, P.push(
                L(B(_ + et % K, 0))
              ), q = w(et / K);
            P.push(L(B(q, 0))), O = ht(u, S, m == y), u = 0, ++m;
          }
        ++u, ++a;
      }
      return P.join("");
    }
    function mt(r) {
      return Q(r, function(a) {
        return U.test(a) ? at(a.slice(4).toLowerCase()) : a;
      });
    }
    function dt(r) {
      return Q(r, function(a) {
        return D.test(a) ? "xn--" + it(a) : a;
      });
    }
    if (l = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      version: "1.3.2",
      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      ucs2: {
        decode: N,
        encode: G
      },
      decode: at,
      encode: it,
      toASCII: dt,
      toUnicode: mt
    }, s && o)
      if (t.exports == s)
        o.exports = l;
      else
        for (z in l)
          l.hasOwnProperty(z) && (s[z] = l[z]);
    else
      e.punycode = l;
  })(st);
})(tt, tt.exports);
var gt = tt.exports, W = {};
function bt(t, h) {
  return Object.prototype.hasOwnProperty.call(t, h);
}
var xt = function(t, h, e, s) {
  h = h || "&", e = e || "=";
  var o = {};
  if (typeof t != "string" || t.length === 0)
    return o;
  var p = /\+/g;
  t = t.split(h);
  var l = 1e3;
  s && typeof s.maxKeys == "number" && (l = s.maxKeys);
  var f = t.length;
  l > 0 && f > l && (f = l);
  for (var i = 0; i < f; ++i) {
    var n = t[i].replace(p, "%20"), c = n.indexOf(e), v, g, d, A;
    c >= 0 ? (v = n.substr(0, c), g = n.substr(c + 1)) : (v = n, g = ""), d = decodeURIComponent(v), A = decodeURIComponent(g), bt(o, d) ? Array.isArray(o[d]) ? o[d].push(A) : o[d] = [o[d], A] : o[d] = A;
  }
  return o;
}, J = function(t) {
  switch (typeof t) {
    case "string":
      return t;
    case "boolean":
      return t ? "true" : "false";
    case "number":
      return isFinite(t) ? t : "";
    default:
      return "";
  }
}, vt = function(t, h, e, s) {
  return h = h || "&", e = e || "=", t === null && (t = void 0), typeof t == "object" ? Object.keys(t).map(function(o) {
    var p = encodeURIComponent(J(o)) + e;
    return Array.isArray(t[o]) ? t[o].map(function(l) {
      return p + encodeURIComponent(J(l));
    }).join(h) : p + encodeURIComponent(J(t[o]));
  }).join(h) : s ? encodeURIComponent(J(s)) + e + encodeURIComponent(J(t)) : "";
};
W.decode = W.parse = xt;
W.encode = W.stringify = vt;
var Ct = gt, Ot = Z.parse = X, wt = Z.resolve = _t, At = Z.resolveObject = Lt, jt = Z.format = Dt, Ft = Z.Url = R;
function R() {
  this.protocol = null, this.slashes = null, this.auth = null, this.host = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.query = null, this.pathname = null, this.path = null, this.href = null;
}
var It = /^([a-z0-9.+-]+:)/i, Ut = /:[0-9]*$/, Pt = ["<", ">", '"', "`", " ", "\r", `
`, "	"], Rt = ["{", "}", "|", "\\", "^", "`"].concat(Pt), rt = ["'"].concat(Rt), ft = ["%", "/", "?", ";", "#"].concat(rt), ut = ["/", "?", "#"], qt = 255, ct = /^[a-z0-9A-Z_-]{0,63}$/, Tt = /^([a-z0-9A-Z_-]{0,63})(.*)$/, Mt = {
  javascript: !0,
  "javascript:": !0
}, nt = {
  javascript: !0,
  "javascript:": !0
}, V = {
  http: !0,
  https: !0,
  ftp: !0,
  gopher: !0,
  file: !0,
  "http:": !0,
  "https:": !0,
  "ftp:": !0,
  "gopher:": !0,
  "file:": !0
}, lt = W;
function X(t, h, e) {
  if (t && pt(t) && t instanceof R) return t;
  var s = new R();
  return s.parse(t, h, e), s;
}
R.prototype.parse = function(t, h, e) {
  if (!ot(t))
    throw new TypeError("Parameter 'url' must be a string, not " + typeof t);
  var s = t;
  s = s.trim();
  var o = It.exec(s);
  if (o) {
    o = o[0];
    var p = o.toLowerCase();
    this.protocol = p, s = s.substr(o.length);
  }
  if (e || o || s.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var l = s.substr(0, 2) === "//";
    l && !(o && nt[o]) && (s = s.substr(2), this.slashes = !0);
  }
  if (!nt[o] && (l || o && !V[o])) {
    for (var f = -1, i = 0; i < ut.length; i++) {
      var n = s.indexOf(ut[i]);
      n !== -1 && (f === -1 || n < f) && (f = n);
    }
    var c, v;
    f === -1 ? v = s.lastIndexOf("@") : v = s.lastIndexOf("@", f), v !== -1 && (c = s.slice(0, v), s = s.slice(v + 1), this.auth = decodeURIComponent(c)), f = -1;
    for (var i = 0; i < ft.length; i++) {
      var n = s.indexOf(ft[i]);
      n !== -1 && (f === -1 || n < f) && (f = n);
    }
    f === -1 && (f = s.length), this.host = s.slice(0, f), s = s.slice(f), this.parseHost(), this.hostname = this.hostname || "";
    var g = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
    if (!g)
      for (var d = this.hostname.split(/\./), i = 0, A = d.length; i < A; i++) {
        var C = d[i];
        if (C && !C.match(ct)) {
          for (var U = "", D = 0, j = C.length; D < j; D++)
            C.charCodeAt(D) > 127 ? U += "x" : U += C[D];
          if (!U.match(ct)) {
            var Y = d.slice(0, i), $ = d.slice(i + 1), w = C.match(Tt);
            w && (Y.push(w[1]), $.unshift(w[2])), $.length && (s = "/" + $.join(".") + s), this.hostname = Y.join(".");
            break;
          }
        }
      }
    if (this.hostname.length > qt ? this.hostname = "" : this.hostname = this.hostname.toLowerCase(), !g) {
      for (var L = this.hostname.split("."), z = [], i = 0; i < L.length; ++i) {
        var F = L[i];
        z.push(F.match(/[^A-Za-z0-9_-]/) ? "xn--" + Ct.encode(F) : F);
      }
      this.hostname = z.join(".");
    }
    var E = this.port ? ":" + this.port : "", Q = this.hostname || "";
    this.host = Q + E, this.href += this.host, g && (this.hostname = this.hostname.substr(1, this.hostname.length - 2), s[0] !== "/" && (s = "/" + s));
  }
  if (!Mt[p])
    for (var i = 0, A = rt.length; i < A; i++) {
      var N = rt[i], G = encodeURIComponent(N);
      G === N && (G = escape(N)), s = s.split(N).join(G);
    }
  var k = s.indexOf("#");
  k !== -1 && (this.hash = s.substr(k), s = s.slice(0, k));
  var B = s.indexOf("?");
  if (B !== -1 ? (this.search = s.substr(B), this.query = s.substr(B + 1), h && (this.query = lt.parse(this.query)), s = s.slice(0, B)) : h && (this.search = "", this.query = {}), s && (this.pathname = s), V[p] && this.hostname && !this.pathname && (this.pathname = "/"), this.pathname || this.search) {
    var E = this.pathname || "", F = this.search || "";
    this.path = E + F;
  }
  return this.href = this.format(), this;
};
function Dt(t) {
  return ot(t) && (t = X(t)), t instanceof R ? t.format() : R.prototype.format.call(t);
}
R.prototype.format = function() {
  var t = this.auth || "";
  t && (t = encodeURIComponent(t), t = t.replace(/%3A/i, ":"), t += "@");
  var h = this.protocol || "", e = this.pathname || "", s = this.hash || "", o = !1, p = "";
  this.host ? o = t + this.host : this.hostname && (o = t + (this.hostname.indexOf(":") === -1 ? this.hostname : "[" + this.hostname + "]"), this.port && (o += ":" + this.port)), this.query && pt(this.query) && Object.keys(this.query).length && (p = lt.stringify(this.query));
  var l = this.search || p && "?" + p || "";
  return h && h.substr(-1) !== ":" && (h += ":"), this.slashes || (!h || V[h]) && o !== !1 ? (o = "//" + (o || ""), e && e.charAt(0) !== "/" && (e = "/" + e)) : o || (o = ""), s && s.charAt(0) !== "#" && (s = "#" + s), l && l.charAt(0) !== "?" && (l = "?" + l), e = e.replace(/[?#]/g, function(f) {
    return encodeURIComponent(f);
  }), l = l.replace("#", "%23"), h + o + e + l + s;
};
function _t(t, h) {
  return X(t, !1, !0).resolve(h);
}
R.prototype.resolve = function(t) {
  return this.resolveObject(X(t, !1, !0)).format();
};
function Lt(t, h) {
  return t ? X(t, !1, !0).resolveObject(h) : h;
}
R.prototype.resolveObject = function(t) {
  if (ot(t)) {
    var h = new R();
    h.parse(t, !1, !0), t = h;
  }
  var e = new R();
  if (Object.keys(this).forEach(function(j) {
    e[j] = this[j];
  }, this), e.hash = t.hash, t.href === "")
    return e.href = e.format(), e;
  if (t.slashes && !t.protocol)
    return Object.keys(t).forEach(function(j) {
      j !== "protocol" && (e[j] = t[j]);
    }), V[e.protocol] && e.hostname && !e.pathname && (e.path = e.pathname = "/"), e.href = e.format(), e;
  if (t.protocol && t.protocol !== e.protocol) {
    if (!V[t.protocol])
      return Object.keys(t).forEach(function(j) {
        e[j] = t[j];
      }), e.href = e.format(), e;
    if (e.protocol = t.protocol, !t.host && !nt[t.protocol]) {
      for (var c = (t.pathname || "").split("/"); c.length && !(t.host = c.shift()); ) ;
      t.host || (t.host = ""), t.hostname || (t.hostname = ""), c[0] !== "" && c.unshift(""), c.length < 2 && c.unshift(""), e.pathname = c.join("/");
    } else
      e.pathname = t.pathname;
    if (e.search = t.search, e.query = t.query, e.host = t.host || "", e.auth = t.auth, e.hostname = t.hostname || t.host, e.port = t.port, e.pathname || e.search) {
      var s = e.pathname || "", o = e.search || "";
      e.path = s + o;
    }
    return e.slashes = e.slashes || t.slashes, e.href = e.format(), e;
  }
  var p = e.pathname && e.pathname.charAt(0) === "/", l = t.host || t.pathname && t.pathname.charAt(0) === "/", f = l || p || e.host && t.pathname, i = f, n = e.pathname && e.pathname.split("/") || [], c = t.pathname && t.pathname.split("/") || [], v = e.protocol && !V[e.protocol];
  if (v && (e.hostname = "", e.port = null, e.host && (n[0] === "" ? n[0] = e.host : n.unshift(e.host)), e.host = "", t.protocol && (t.hostname = null, t.port = null, t.host && (c[0] === "" ? c[0] = t.host : c.unshift(t.host)), t.host = null), f = f && (c[0] === "" || n[0] === "")), l)
    e.host = t.host || t.host === "" ? t.host : e.host, e.hostname = t.hostname || t.hostname === "" ? t.hostname : e.hostname, e.search = t.search, e.query = t.query, n = c;
  else if (c.length)
    n || (n = []), n.pop(), n = n.concat(c), e.search = t.search, e.query = t.query;
  else if (!St(t.search)) {
    if (v) {
      e.hostname = e.host = n.shift();
      var g = e.host && e.host.indexOf("@") > 0 ? e.host.split("@") : !1;
      g && (e.auth = g.shift(), e.host = e.hostname = g.shift());
    }
    return e.search = t.search, e.query = t.query, (!H(e.pathname) || !H(e.search)) && (e.path = (e.pathname ? e.pathname : "") + (e.search ? e.search : "")), e.href = e.format(), e;
  }
  if (!n.length)
    return e.pathname = null, e.search ? e.path = "/" + e.search : e.path = null, e.href = e.format(), e;
  for (var d = n.slice(-1)[0], A = (e.host || t.host) && (d === "." || d === "..") || d === "", C = 0, U = n.length; U >= 0; U--)
    d = n[U], d == "." ? n.splice(U, 1) : d === ".." ? (n.splice(U, 1), C++) : C && (n.splice(U, 1), C--);
  if (!f && !i)
    for (; C--; C)
      n.unshift("..");
  f && n[0] !== "" && (!n[0] || n[0].charAt(0) !== "/") && n.unshift(""), A && n.join("/").substr(-1) !== "/" && n.push("");
  var D = n[0] === "" || n[0] && n[0].charAt(0) === "/";
  if (v) {
    e.hostname = e.host = D ? "" : n.length ? n.shift() : "";
    var g = e.host && e.host.indexOf("@") > 0 ? e.host.split("@") : !1;
    g && (e.auth = g.shift(), e.host = e.hostname = g.shift());
  }
  return f = f || e.host && n.length, f && !D && n.unshift(""), n.length ? e.pathname = n.join("/") : (e.pathname = null, e.path = null), (!H(e.pathname) || !H(e.search)) && (e.path = (e.pathname ? e.pathname : "") + (e.search ? e.search : "")), e.auth = t.auth || e.auth, e.slashes = e.slashes || t.slashes, e.href = e.format(), e;
};
R.prototype.parseHost = function() {
  var t = this.host, h = Ut.exec(t);
  h && (h = h[0], h !== ":" && (this.port = h.substr(1)), t = t.substr(0, t.length - h.length)), t && (this.hostname = t);
};
function ot(t) {
  return typeof t == "string";
}
function pt(t) {
  return typeof t == "object" && t !== null;
}
function H(t) {
  return t === null;
}
function St(t) {
  return t == null;
}
const $t = /* @__PURE__ */ yt({
  __proto__: null,
  Url: Ft,
  default: Z,
  format: jt,
  parse: Ot,
  resolve: wt,
  resolveObject: At
}, [Z]);
export {
  $t as u
};
