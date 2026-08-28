import { Effect as t, BlendFunction as m } from "./index-39bc63bb-C-icKIcL.js";
import { k as r } from "./main-VBpWXpeE.js";
class c extends t {
  constructor(o = 2.2) {
    super("GammaCorrectionEffect", a, {
      blendFunction: m.NORMAL,
      uniforms: /* @__PURE__ */ new Map([["gamma", new r(o)]])
    });
  }
  setGamma(o) {
    this.uniforms.get("gamma").value = o;
  }
}
const a = `
uniform float gamma;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (gamma == 0.0) {
        outputColor = inputColor;
        return;
    }
    vec3 color = pow(inputColor.rgb, vec3(1.0 / gamma));
    outputColor = vec4(color, inputColor.a);
}
`;
export {
  c as GammaCorrectionEffect
};
