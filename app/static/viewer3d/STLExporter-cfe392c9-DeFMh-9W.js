import { e as u } from "./main-VBpWXpeE.js";
class j {
  /**
   * Parses the given 3D object and generates the STL output.
   *
   * If the 3D object is composed of multiple children and geometry, they are merged into a single mesh in the file.
   *
   * @param {Object3D} scene - A scene, mesh or any other 3D object containing meshes to encode.
   * @param {STLExporter~Options} options - The export options.
   * @return {string|ArrayBuffer} The exported STL.
   */
  parse(M, x = {}) {
    x = Object.assign({
      binary: !1
    }, x);
    const f = x.binary, y = [];
    let d = 0;
    M.traverse(function(e) {
      if (e.isMesh) {
        const o = e.geometry, a = o.index, i = o.getAttribute("position");
        d += a !== null ? a.count / 3 : i.count / 3, y.push({
          object3d: e,
          geometry: o
        });
      }
    });
    let t, r = 80;
    if (f === !0) {
      const e = d * 2 + d * 3 * 4 * 4 + 80 + 4, o = new ArrayBuffer(e);
      t = new DataView(o), t.setUint32(r, d, !0), r += 4;
    } else
      t = "", t += `solid exported
`;
    const c = new u(), p = new u(), m = new u(), b = new u(), z = new u(), l = new u();
    for (let e = 0, o = y.length; e < o; e++) {
      const a = y[e].object3d, i = y[e].geometry, n = i.index, w = i.getAttribute("position");
      if (n !== null)
        for (let s = 0; s < n.count; s += 3) {
          const B = n.getX(s + 0), A = n.getX(s + 1), F = n.getX(s + 2);
          h(B, A, F, w, a);
        }
      else
        for (let s = 0; s < w.count; s += 3) {
          const B = s + 0, A = s + 1, F = s + 2;
          h(B, A, F, w, a);
        }
    }
    return f === !1 && (t += `endsolid exported
`), t;
    function h(e, o, a, i, n) {
      c.fromBufferAttribute(i, e), p.fromBufferAttribute(i, o), m.fromBufferAttribute(i, a), n.isSkinnedMesh === !0 && (n.applyBoneTransform(e, c), n.applyBoneTransform(o, p), n.applyBoneTransform(a, m)), c.applyMatrix4(n.matrixWorld), p.applyMatrix4(n.matrixWorld), m.applyMatrix4(n.matrixWorld), V(c, p, m), g(c), g(p), g(m), f === !0 ? (t.setUint16(r, 0, !0), r += 2) : (t += `		endloop
`, t += `	endfacet
`);
    }
    function V(e, o, a) {
      b.subVectors(a, o), z.subVectors(e, o), b.cross(z).normalize(), l.copy(b).normalize(), f === !0 ? (t.setFloat32(r, l.x, !0), r += 4, t.setFloat32(r, l.y, !0), r += 4, t.setFloat32(r, l.z, !0), r += 4) : (t += "	facet normal " + l.x + " " + l.y + " " + l.z + `
`, t += `		outer loop
`);
    }
    function g(e) {
      f === !0 ? (t.setFloat32(r, e.x, !0), r += 4, t.setFloat32(r, e.y, !0), r += 4, t.setFloat32(r, e.z, !0), r += 4) : t += "			vertex " + e.x + " " + e.y + " " + e.z + `
`;
    }
  }
}
export {
  j as STLExporter
};
