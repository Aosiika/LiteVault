import { a4 as g, a5 as u, a6 as p, u as m, f as h, a7 as f, a8 as w, a9 as d, aa as y, ab as E, e as b } from "./main-VBpWXpeE.js";
var _ = Object.defineProperty, v = (s, e, t) => e in s ? _(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t, i = (s, e, t) => (v(s, typeof e != "symbol" ? e + "" : e, t), t);
class S {
  constructor(e, t = 20) {
    i(this, "group"), i(this, "plane"), i(this, "nearEdge"), i(this, "farEdge"), i(this, "center"), i(this, "parent"), i(this, "disposed", !1), this.parent = e, this.group = new g(), this.group.name = "tilt-shift-gizmo", this.group.renderOrder = 999, this.group.visible = !1;
    const o = new u(t, t), r = new p({
      color: 16755251,
      transparent: !0,
      opacity: 0.18,
      side: m,
      depthWrite: !1
    });
    this.plane = new h(o, r), this.group.add(this.plane);
    const a = new f(o), n = new w({
      color: 16746496,
      transparent: !0,
      opacity: 0.55,
      depthWrite: !1
    });
    this.nearEdge = new d(a, n), this.farEdge = new d(a, n), this.group.add(this.nearEdge), this.group.add(this.farEdge);
    const l = new y(0.25, 16, 12), c = new p({
      color: 16755251,
      depthWrite: !1
    });
    this.center = new h(l, c), this.group.add(this.center), e.add(this.group);
  }
  /**
   * Sync the gizmo to the current focus parameters.
   * @param focusPoint world-space anchor of the focus plane
   * @param focusNormal unit vector orienting the plane
   * @param focusRange half-width of the in-focus slab (world units)
   */
  update(e, t, o) {
    if (this.disposed)
      return;
    this.group.position.copy(e);
    const r = new E().setFromUnitVectors(
      new b(0, 0, 1),
      t.clone().normalize()
    );
    this.plane.quaternion.copy(r), this.nearEdge.quaternion.copy(r), this.farEdge.quaternion.copy(r);
    const a = t.clone().normalize().multiplyScalar(o);
    this.nearEdge.position.copy(a).negate(), this.farEdge.position.copy(a);
  }
  setVisible(e) {
    this.group.visible = e;
  }
  isVisible() {
    return this.group.visible;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.parent.remove(this.group), this.plane.geometry.dispose(), this.plane.material.dispose(), this.nearEdge.geometry.dispose(), this.nearEdge.material.dispose(), this.center.geometry.dispose(), this.center.material.dispose());
  }
}
export {
  S as TiltShiftGizmo
};
