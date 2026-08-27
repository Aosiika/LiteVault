import { C as L, ac as V, e as w, V as j, ad as E, m as h } from "./main-HXTyBbHH.js";
class I {
  /**
   * Parses the given 3D object and generates the OBJ output.
   *
   * If the 3D object is composed of multiple children and geometry, they are merged into a single mesh in the file.
   *
   * @param {Object3D} object - The 3D object to export.
   * @return {string} The exported OBJ.
   */
  parse(z) {
    let r = "", l = 0, d = 0, A = 0;
    const i = new w(), b = new L(), v = new w(), B = new j(), y = [];
    function C(o) {
      let c = 0, x = 0, a = 0;
      const f = o.geometry, t = new V(), n = f.getAttribute("position"), u = f.getAttribute("normal"), p = f.getAttribute("uv"), M = f.getIndex();
      if (r += "o " + o.name + `
`, o.material && o.material.name && (r += "usemtl " + o.material.name + `
`), n !== void 0)
        for (let e = 0, m = n.count; e < m; e++, c++)
          i.fromBufferAttribute(n, e), i.applyMatrix4(o.matrixWorld), r += "v " + i.x + " " + i.y + " " + i.z + `
`;
      if (p !== void 0)
        for (let e = 0, m = p.count; e < m; e++, a++)
          B.fromBufferAttribute(p, e), r += "vt " + B.x + " " + B.y + `
`;
      if (u !== void 0) {
        t.getNormalMatrix(o.matrixWorld);
        for (let e = 0, m = u.count; e < m; e++, x++)
          v.fromBufferAttribute(u, e), v.applyMatrix3(t).normalize(), r += "vn " + v.x + " " + v.y + " " + v.z + `
`;
      }
      if (M !== null)
        for (let e = 0, m = M.count; e < m; e += 3) {
          for (let s = 0; s < 3; s++) {
            const g = M.getX(e + s) + 1;
            y[s] = l + g + (u || p ? "/" + (p ? d + g : "") + (u ? "/" + (A + g) : "") : "");
          }
          r += "f " + y.join(" ") + `
`;
        }
      else
        for (let e = 0, m = n.count; e < m; e += 3) {
          for (let s = 0; s < 3; s++) {
            const g = e + s + 1;
            y[s] = l + g + (u || p ? "/" + (p ? d + g : "") + (u ? "/" + (A + g) : "") : "");
          }
          r += "f " + y.join(" ") + `
`;
        }
      l += c, d += a, A += x;
    }
    function W(o) {
      let c = 0;
      const x = o.geometry, a = o.type, f = x.getAttribute("position");
      if (r += "o " + o.name + `
`, f !== void 0)
        for (let t = 0, n = f.count; t < n; t++, c++)
          i.fromBufferAttribute(f, t), i.applyMatrix4(o.matrixWorld), r += "v " + i.x + " " + i.y + " " + i.z + `
`;
      if (a === "Line") {
        r += "l ";
        for (let t = 1, n = f.count; t <= n; t++)
          r += l + t + " ";
        r += `
`;
      }
      if (a === "LineSegments")
        for (let t = 1, n = t + 1, u = f.count; t < u; t += 2, n = t + 1)
          r += "l " + (l + t) + " " + (l + n) + `
`;
      l += c;
    }
    function S(o) {
      let c = 0;
      const x = o.geometry, a = x.getAttribute("position"), f = x.getAttribute("color");
      if (r += "o " + o.name + `
`, a !== void 0) {
        for (let t = 0, n = a.count; t < n; t++, c++)
          i.fromBufferAttribute(a, t), i.applyMatrix4(o.matrixWorld), r += "v " + i.x + " " + i.y + " " + i.z, f !== void 0 && (b.fromBufferAttribute(f, t), E.workingToColorSpace(b, h), r += " " + b.r + " " + b.g + " " + b.b), r += `
`;
        r += "p ";
        for (let t = 1, n = a.count; t <= n; t++)
          r += l + t + " ";
        r += `
`;
      }
      l += c;
    }
    return z.traverse(function(o) {
      o.isMesh === !0 && C(o), o.isLine === !0 && W(o), o.isPoints === !0 && S(o);
    }), r;
  }
}
export {
  I as OBJExporter
};
