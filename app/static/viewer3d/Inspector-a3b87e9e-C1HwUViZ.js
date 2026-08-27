import { WebGPURenderer as G, TSL as e, REVISION as Nt, setConsoleFunction as Pt, InspectorBase as Dt, TimestampQuery as H, warnOnce as At, CanvasTarget as Wt, NoToneMapping as nt, NodeMaterial as _t, QuadMesh as Vt, RendererUtils as rt, LinearSRGBColorSpace as Ht, WebGLBackend as jt, Node as st } from "./three.webgpu-6f9ca086-BB0GN91i.js";
import { E as $, y as Ot, z as Ut, o as Gt, F as $t, U as qt, I as Xt, G as Yt, J as Zt, H as Qt, K as Jt, Q as Kt, l as te, X as ee, Y as ie, R as ne, n as re, Z as se, _ as oe, $ as ae, a0 as le, a1 as de, a2 as ce, c as he, a3 as pe } from "./main-HXTyBbHH.js";
let me, P, D, be = (async () => {
  class q {
    constructor(t, i) {
      this.uid = t, this.cid = t.match(/^(.*):f(\d+)$/)[1], this.name = i, this.timestamp = 0, this.cpu = 0, this.gpu = 0, this.fps = 0, this.children = [], this.parent = null;
    }
  }
  class ot extends q {
    constructor(t, i, n, r) {
      let s = i.name;
      s === "" && (i.isScene ? s = "Scene" : i.isQuadMesh && (s = "QuadMesh")), super(t, s), this.scene = i, this.camera = n, this.renderTarget = r, this.isRenderStats = !0;
    }
  }
  let at = class extends q {
    constructor(t, i) {
      super(t, i.name), this.computeNode = i, this.isComputeStats = !0;
    }
  };
  class lt extends Dt {
    constructor() {
      super(), this.currentFrame = null, this.currentRender = null, this.currentNodes = null, this.lastFrame = null, this.frames = [], this.framesLib = {}, this.maxFrames = 512, this._lastFinishTime = 0, this._resolveTimestampPromise = null, this.isRendererInspector = !0;
    }
    getParent() {
      return this.currentRender || this.getFrame();
    }
    begin() {
      this.currentFrame = this._createFrame(), this.currentRender = this.currentFrame, this.currentNodes = [];
    }
    finish() {
      const t = performance.now(), i = this.currentFrame;
      i.finishTime = t, i.deltaTime = t - (this._lastFinishTime > 0 ? this._lastFinishTime : t), this.addFrame(i), this.fps = this._getFPS(), this.lastFrame = i, this.currentFrame = null, this.currentRender = null, this.currentNodes = null, this._lastFinishTime = t;
    }
    _getFPS() {
      let t = 0, i = 0;
      for (let n = this.frames.length - 1; n >= 0; n--) {
        const r = this.frames[n];
        if (t++, i += r.deltaTime, i >= 1e3)
          break;
      }
      return t * 1e3 / i;
    }
    _createFrame() {
      return {
        frameId: this.nodeFrame.frameId,
        resolvedCompute: !1,
        resolvedRender: !1,
        deltaTime: 0,
        startTime: performance.now(),
        finishTime: 0,
        miscellaneous: 0,
        children: [],
        renders: [],
        computes: []
      };
    }
    getFrame() {
      return this.currentFrame || this.lastFrame;
    }
    getFrameById(t) {
      return this.framesLib[t] || null;
    }
    updateTabs() {
    }
    resolveFrame() {
    }
    async resolveTimestamp() {
      return this._resolveTimestampPromise !== null ? this._resolveTimestampPromise : (this._resolveTimestampPromise = new Promise((t) => {
        requestAnimationFrame(async () => {
          const i = this.getRenderer();
          await i.resolveTimestampsAsync(H.COMPUTE), await i.resolveTimestampsAsync(H.RENDER);
          const n = i.backend.getTimestampFrames(H.COMPUTE), r = i.backend.getTimestampFrames(H.RENDER), s = [
            .../* @__PURE__ */ new Set([
              ...n,
              ...r
            ])
          ];
          for (const o of s) {
            const a = this.getFrameById(o);
            if (a !== null) {
              if (a.resolvedCompute === !1)
                if (a.computes.length > 0) {
                  if (n.includes(o)) {
                    for (const l of a.computes)
                      i.backend.hasTimestamp(l.uid) ? l.gpu = i.backend.getTimestamp(l.uid) : (l.gpu = 0, l.gpuNotAvailable = !0);
                    a.resolvedCompute = !0;
                  }
                } else
                  a.resolvedCompute = !0;
              if (a.resolvedRender === !1)
                if (a.renders.length > 0) {
                  if (r.includes(o)) {
                    for (const l of a.renders)
                      i.backend.hasTimestamp(l.uid) ? l.gpu = i.backend.getTimestamp(l.uid) : (l.gpu = 0, l.gpuNotAvailable = !0);
                    a.resolvedRender = !0;
                  }
                } else
                  a.resolvedRender = !0;
              a.resolvedCompute === !0 && a.resolvedRender === !0 && this.resolveFrame(a);
            }
          }
          this._resolveTimestampPromise = null, t();
        });
      }), this._resolveTimestampPromise);
    }
    get isAvailable() {
      return this.getRenderer() !== null;
    }
    addFrame(t) {
      if (this.frames.length >= this.maxFrames) {
        const i = this.frames.shift();
        delete this.framesLib[i.frameId];
      }
      this.frames.push(t), this.framesLib[t.frameId] = t, this.isAvailable && (this.updateTabs(), this.resolveTimestamp());
    }
    inspect(t) {
      const i = this.currentNodes;
      i !== null ? i.push(t) : At('RendererInspector: Unable to inspect node outside of frame scope. Use "renderer.setAnimationLoop()".');
    }
    beginCompute(t, i) {
      const n = this.getFrame();
      if (!n)
        return;
      const r = new at(t, i);
      r.timestamp = performance.now(), r.parent = this.currentCompute || this.getParent(), n.computes.push(r), this.currentRender !== null ? this.currentRender.children.push(r) : n.children.push(r), this.currentCompute = r;
    }
    finishCompute() {
      if (!this.getFrame())
        return;
      const t = this.currentCompute;
      t.cpu = performance.now() - t.timestamp, this.currentCompute = t.parent.isComputeStats ? t.parent : null;
    }
    beginRender(t, i, n, r) {
      const s = this.getFrame();
      if (!s)
        return;
      const o = new ot(t, i, n, r);
      o.timestamp = performance.now(), o.parent = this.getParent(), s.renders.push(o), this.currentRender !== null ? this.currentRender.children.push(o) : s.children.push(o), this.currentRender = o;
    }
    finishRender() {
      if (!this.getFrame())
        return;
      const t = this.currentRender;
      t.cpu = performance.now() - t.timestamp, this.currentRender = t.parent;
    }
  }
  class dt {
    static init() {
      if (document.getElementById("profiler-styles"))
        return;
      const t = `
:root {
	--profiler-bg: #1e1e24f5;
	--profiler-header-bg: #2a2a33aa;
	--profiler-header: #2a2a33;
	--profiler-border: #4a4a5a;
	--text-primary: #e0e0e0;
	--text-secondary: #9a9aab;
	--accent-color: #00aaff;
	--color-green: #4caf50;
	--color-yellow: #ffc107;
	--color-red: #f44336;
	--color-fps: rgb(63, 81, 181);
	--color-call: rgba(255, 185, 34, 1);
	--font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	--font-mono: 'Fira Code', 'Courier New', Courier, monospace;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Fira+Code&display=swap');

#profiler-panel *, #profiler-toggle * {
	text-transform: initial;
	line-height: normal;
	box-sizing: border-box;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

#profiler-toggle {
	position: fixed;
	top: 15px;
	right: 15px;
	background-color: rgba(30, 30, 36, 0.85);
	border: 1px solid #4a4a5a54;
	border-radius: 12px 6px 6px 12px;
	color: var(--text-primary);
	cursor: pointer;
	z-index: 1001;
	transition: all 0.2s ease-in-out;
	/*font-size: 14px;*/
	font-size: 15px;
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: stretch;
	padding: 0;
	overflow: hidden;
	font-family: var(--font-family);
}

#profiler-toggle.position-right.panel-open {
	right: auto;
	left: 15px;
	border-radius: 6px 12px 12px 6px;
	flex-direction: row-reverse;
}

#profiler-toggle.position-right.panel-open #builtin-tabs-container {
	border-right: none;
	border-left: 1px solid #262636;
}

#profiler-toggle:hover {
	border-color: var(--accent-color);
}

#profiler-toggle.panel-open #toggle-icon {
	background-color: rgba(0, 170, 255, 0.2);
	color: var(--accent-color);
}

#toggle-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	font-size: 20px;
	transition: background-color 0.2s;
}

#profiler-toggle:hover #toggle-icon {
	background-color: rgba(255, 255, 255, 0.05);
}

#profiler-toggle.panel-open:hover #toggle-icon {
	background-color: rgba(0, 170, 255, 0.3);
}

.toggle-separator {
	width: 1px;
	background-color: var(--profiler-border);
}

#toggle-text {
	display: flex;
	align-items: baseline;
	padding: 8px 14px;
	min-width: 80px;
	justify-content: right;
}

#toggle-text .fps-label {
	font-size: 0.7em;
	margin-left: 10px;
    color: #999;
}

#builtin-tabs-container {
	display: flex;
	align-items: stretch;
	gap: 0;
	border-right: 1px solid #262636;
	order: -1;
}

.builtin-tab-btn {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 8px 14px;
	font-family: var(--font-family);
	font-size: 13px;
	font-weight: 600;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 32px;
	position: relative;
}

.builtin-tab-btn svg {
	width: 20px;
	height: 20px;
	stroke: currentColor;
}

.builtin-tab-btn:hover {
	background-color: rgba(255, 255, 255, 0.08);
	color: var(--accent-color);
}

.builtin-tab-btn:active {
	background-color: rgba(255, 255, 255, 0.12);
}

.builtin-tab-btn.active {
	background-color: rgba(0, 170, 255, 0.2);
	color: var(--accent-color);
}

.builtin-tab-btn.active:hover {
	background-color: rgba(0, 170, 255, 0.3);
}

#profiler-mini-panel {
	position: fixed;
	top: 60px;
	right: 15px;
	background-color: rgba(30, 30, 36, 0.85);
	border: 1px solid #4a4a5a54;
	border-radius: 8px;
	color: var(--text-primary);
	z-index: 9999;
	backdrop-filter: blur(8px);
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
	font-family: var(--font-family);
	font-size: 11px;
	width: 350px;
	max-height: calc(100vh - 100px);
	overflow-y: auto;
	overflow-x: hidden;
	display: none;
	opacity: 0;
	transform: translateY(-10px) scale(0.98);
	transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
	            transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

#profiler-mini-panel.position-right.panel-open {
	right: auto;
	left: 15px;
}

#profiler-mini-panel.visible {
	display: block;
	opacity: 1;
	transform: translateY(0) scale(1);
}

#profiler-mini-panel::-webkit-scrollbar {
	width: 6px;
}

#profiler-mini-panel::-webkit-scrollbar-track {
	background: transparent;
}

#profiler-mini-panel::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.15);
	border-radius: 3px;
	transition: background 0.2s;
}

#profiler-mini-panel::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.25);
}

.mini-panel-content {
	padding: 0;
	font-size: 11px;
	line-height: 1.5;
	font-family: var(--font-mono);
	letter-spacing: 0.3px;
	user-select: none;
	-webkit-user-select: none;
}

.mini-panel-content .profiler-content {
	display: block !important;
	background: transparent;
}

.mini-panel-content .list-scroll-wrapper {
	max-height: calc(100vh - 120px);
	overflow-y: auto;
	overflow-x: hidden;
	width: 100%;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar {
	width: 4px;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar-track {
	background: transparent;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 2px;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.2);
}

.mini-panel-content .parameters {
	background: transparent;
	border: none;
	box-shadow: none;
	padding: 4px;
}

.mini-panel-content .list-container.parameters {
	padding: 2px 6px 0px 6px !important;
}

.mini-panel-content .list-header {
	display: none;
	padding: 2px 4px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.mini-panel-content .list-item {
	border-bottom: 1px solid rgba(74, 74, 90, 0.2);
	transition: background-color 0.15s;
}

.mini-panel-content .list-item:last-child {
	border-bottom: none;
}

.mini-panel-content .list-item:hover {
	background-color: rgba(255, 255, 255, 0.04);
}

.mini-panel-content .list-item.actionable:hover {
	background-color: rgba(255, 255, 255, 0.06);
	cursor: pointer;
}

/* Style adjustments for lil-gui look */
.mini-panel-content .item-row {
	padding: 3px 8px;
	min-height: 24px;
}

.mini-panel-content .list-item-row {
	padding: 1px 4px;
	gap: 8px;
	min-height: 21px;
	align-items: center;
}

.mini-panel-content input[type="checkbox"] {
	width: 12px;
	height: 12px;
}

.mini-panel-content input[type="range"] {
	height: 18px;
}

.mini-panel-content .value-number input,
.mini-panel-content .value-slider input {
	background-color: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(74, 74, 90, 0.5);
	font-size: 10px;
}

.mini-panel-content .value-number input:focus,
.mini-panel-content .value-slider input:focus {
	border-color: var(--accent-color);
}

.mini-panel-content .value-slider {
	gap: 6px;
}

/* Compact nested items */
.mini-panel-content .list-item .list-item {
	margin-left: 8px;
}

.mini-panel-content .list-item .list-item .item-row,
.mini-panel-content .list-item .list-item .list-item-row {
	padding: 2px 6px;
	min-height: 22px;
}

/* Compact collapsible headers */
.mini-panel-content .collapsible .item-row,
.mini-panel-content .list-item-row.collapsible {
	padding: 2px 8px;
	font-weight: 600;
	min-height: 16px;
	display: flex;
	align-items: center;
}

.mini-panel-content .collapsible-icon {
	font-size: 10px;
	width: 14px;
	height: 14px;
}

.mini-panel-content .param-control input[type="range"] {
	height: 12px;
	margin-top: 1px;
	padding-top: 5px;
	user-select: none;
	-webkit-user-select: none;
	outline: none;
}

.mini-panel-content .param-control input[type="range"]::-webkit-slider-thumb {
	width: 14px;
	height: 14px;
	margin-top: -5px;
	user-select: none;
	-webkit-user-select: none;
}

.mini-panel-content .param-control input[type="range"]::-moz-range-thumb {
	width: 14px;
	height: 14px;
	user-select: none;
	-moz-user-select: none;
}

.mini-panel-content .list-children-container {
	padding-left: 0;
}

.mini-panel-content .param-control input[type="number"] {
	flex-basis: 60px !important;
}

.mini-panel-content .param-control {
	align-items: center;
}

.mini-panel-content .param-control select {
	font-size: 11px;
}

.mini-panel-content .list-item-wrapper {
	margin-top: 0;
	margin-bottom: 0;
}

#profiler-panel {
	position: fixed;
	z-index: 1001 !important;
	bottom: 0;
	left: 0;
	right: 0;
	height: 350px;
	background-color: var(--profiler-bg);
	backdrop-filter: blur(8px);
	border-top: 2px solid var(--profiler-border);
	color: var(--text-primary);
	display: flex;
	flex-direction: column;
	z-index: 1000;
	/*box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.5);*/
	transform: translateY(100%);
	transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.3s ease-out, width 0.3s ease-out;
	font-family: var(--font-mono);
}

#profiler-panel.resizing,
#profiler-panel.dragging {
	transition: none;
}

#profiler-panel.visible {
	transform: translateY(0);
}

#profiler-panel.maximized {
	height: 100vh;
}

/* Position-specific styles */
#profiler-panel.position-top {
	bottom: auto;
	top: 0;
	border-top: none;
	border-bottom: 2px solid var(--profiler-border);
	transform: translateY(-100%);
}

#profiler-panel.position-top.visible {
	transform: translateY(0);
}

#profiler-panel.position-bottom {
	/* Default position - already defined above */
}

#profiler-panel.position-left {
	top: 0;
	bottom: 0;
	left: 0;
	right: auto;
	width: 350px;
	height: 100%;
	border-top: none;
	border-right: 2px solid var(--profiler-border);
	transform: translateX(-100%);
}

#profiler-panel.position-left.visible {
	transform: translateX(0);
}

#profiler-panel.position-right {
	top: 0;
	bottom: 0;
	left: auto;
	right: 0;
	width: 350px;
	height: 100%;
	border-top: none;
	border-left: 2px solid var(--profiler-border);
	transform: translateX(100%);
}

#profiler-panel.position-right.visible {
	transform: translateX(0);
}

#profiler-panel.position-floating {
	border: 2px solid var(--profiler-border);
	border-radius: 8px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	transform: none !important;
	overflow: hidden;
}

#profiler-panel.position-floating.visible {
	transform: none !important;
}

#profiler-panel.position-floating .profiler-header {
	border-radius: 6px 6px 0 0;
}

#profiler-panel.position-floating .panel-resizer {
	bottom: 0;
	right: 0;
	top: auto;
	left: auto;
	width: 16px;
	height: 16px;
	cursor: nwse-resize;
	border-radius: 0 0 6px 0;
}

#profiler-panel.position-floating .panel-resizer::after {
	content: '';
	position: absolute;
	right: 2px;
	bottom: 2px;
	width: 10px;
	height: 10px;
	background: linear-gradient(135deg, transparent 0%, transparent 45%, var(--profiler-border) 45%, var(--profiler-border) 55%, transparent 55%);
}


.panel-resizer {
	position: absolute;
	top: -2px;
	left: 0;
	width: 100%;
	height: 5px;
	cursor: ns-resize;
	z-index: 1001;
	touch-action: none;
}

#profiler-panel.position-top .panel-resizer {
	top: auto;
	bottom: -2px;
}

#profiler-panel.position-left .panel-resizer {
	top: 0;
	left: auto;
	right: -2px;
	width: 5px;
	height: 100%;
	cursor: ew-resize;
}

#profiler-panel.position-right .panel-resizer {
	top: 0;
	left: -2px;
	right: auto;
	width: 5px;
	height: 100%;
	cursor: ew-resize;
}

.profiler-header {
	display: flex;
	background-color: var(--profiler-header-bg);
	border-bottom: 1px solid var(--profiler-border);
	flex-shrink: 0;
	justify-content: space-between;
	align-items: stretch;

	overflow-x: auto;
	overflow-y: hidden;
	width: calc(100% - 134px);
	height: 38px;
	user-select: none;
	-webkit-user-select: none;
}

/* Adjust header width based on panel position */
#profiler-panel.position-right .profiler-header,
#profiler-panel.position-left .profiler-header {
	width: calc(100% - 134px);
}

#profiler-panel.position-bottom .profiler-header,
#profiler-panel.position-top .profiler-header {
	width: calc(100% - 134px);
}

/* Adjust header width when position toggle button is hidden (mobile) */
#profiler-panel.hide-position-toggle .profiler-header {
	width: calc(100% - 90px);
}

/* ===== RULES FOR WHEN THERE ARE NO TABS ===== */

/* Horizontal mode (bottom/top) without tabs */
#profiler-panel.position-bottom.no-tabs:not(.maximized),
#profiler-panel.position-top.no-tabs:not(.maximized) {
	height: 38px !important;
	min-height: 38px !important;
}

#profiler-panel.position-bottom.no-tabs .profiler-header,
#profiler-panel.position-top.no-tabs .profiler-header {
	width: 100%;
	height: 38px;
	border-bottom: none;
}

#profiler-panel.position-bottom.no-tabs .profiler-content-wrapper,
#profiler-panel.position-top.no-tabs .profiler-content-wrapper {
	display: none;
}

#profiler-panel.position-bottom.no-tabs .panel-resizer,
#profiler-panel.position-top.no-tabs .panel-resizer {
	display: none;
}

/* Vertical mode (right/left) without tabs */
#profiler-panel.position-right.no-tabs:not(.maximized),
#profiler-panel.position-left.no-tabs:not(.maximized) {
	width: 45px !important;
	min-width: 45px !important;
}

/* Vertical layout for header when no tabs */
#profiler-panel.position-right.no-tabs .profiler-header,
#profiler-panel.position-left.no-tabs .profiler-header {
	width: 100%;
	flex-direction: column;
	height: 100%;
	border-bottom: none;
}

/* Vertical layout for controls when no tabs */
#profiler-panel.position-right.no-tabs .profiler-controls,
#profiler-panel.position-left.no-tabs .profiler-controls {
	position: static;
	flex-direction: column-reverse;
	justify-content: flex-end;
	width: 100%;
	height: 100%;
	border-bottom: none;
	border-left: none;
	background: transparent;
}

#profiler-panel.position-right.no-tabs .profiler-controls button,
#profiler-panel.position-left.no-tabs .profiler-controls button {
	width: 100%;
	height: 45px;
	border-left: none;
	border-top: none;
	border-bottom: 1px solid var(--profiler-border);
}

#profiler-panel.position-right.no-tabs .profiler-content-wrapper,
#profiler-panel.position-left.no-tabs .profiler-content-wrapper {
	display: none;
}

#profiler-panel.position-right.no-tabs .profiler-tabs,
#profiler-panel.position-left.no-tabs .profiler-tabs {
	display: none;
}

#profiler-panel.position-right.no-tabs .panel-resizer,
#profiler-panel.position-left.no-tabs .panel-resizer {
	display: none;
}

/* Hide position toggle on mobile without tabs */
#profiler-panel.hide-position-toggle.position-right.no-tabs:not(.maximized),
#profiler-panel.hide-position-toggle.position-left.no-tabs:not(.maximized) {
	width: 45px !important;
	min-width: 45px !important;
}

/* Hide drag indicator on mobile devices */
#profiler-panel.is-mobile .tab-btn.active::before {
	display: none;
}

.profiler-header::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.profiler-header::-webkit-scrollbar-track {
	background: transparent;
}

.profiler-header::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.profiler-header::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.profiler-header::-webkit-scrollbar-corner {
	background: transparent;
}

#profiler-panel.dragging .profiler-header {
	cursor: grabbing !important;
}

#profiler-panel.dragging {
	opacity: 0.8;
}

.profiler-tabs {
	display: flex;
	cursor: grab;
	position: relative;
}

.profiler-tabs:active {
	cursor: grabbing;
}

.profiler-tabs::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.profiler-tabs::-webkit-scrollbar-track {
	background: transparent;
}

.profiler-tabs::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.profiler-tabs::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.profiler-tabs::-webkit-scrollbar-corner {
	background: transparent;
}

.profiler-controls {
	display: flex;
	position: absolute;
	right: 0;
	top: 0;
	height: 38px;
	background: var(--profiler-header-bg);
	border-bottom: 1px solid var(--profiler-border);
}

.tab-btn {
	position: relative;
	background: transparent;
	border: none;
	/*border-right: 1px solid var(--profiler-border);*/
	color: var(--text-secondary);
	padding: 8px 18px;
	cursor: default;
	display: flex;
	align-items: center;
	font-family: var(--font-family);
	font-weight: 600;
	font-size: 14px;
	user-select: none;
	transition: opacity 0.2s, transform 0.2s;
	touch-action: pan-x;
}

.tab-btn.active {
	border-bottom: 2px solid var(--accent-color);
	color: white;
}

.tab-btn.active::before {
	content: '⋮⋮';
	position: absolute;
	left: 3px;
	top: calc(50% - .1rem);
	transform: translateY(-50%);
	color: var(--profiler-border);
	font-size: 18px;
	letter-spacing: -2px;
	opacity: 0.6;
}

.tab-btn.no-detach.active::before {
	display: none;
}

#floating-btn,
#maximize-btn,
#hide-panel-btn {
	background: transparent;
	border: none;
	border-left: 1px solid var(--profiler-border);
	color: var(--text-secondary);
	width: 45px;
	height: 100%;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

/* Disable transitions in vertical mode to avoid broken animations */
#profiler-panel.position-right #floating-btn,
#profiler-panel.position-right #maximize-btn,
#profiler-panel.position-right #hide-panel-btn,
#profiler-panel.position-left #floating-btn,
#profiler-panel.position-left #maximize-btn,
#profiler-panel.position-left #hide-panel-btn {
	transition: background-color 0.2s, color 0.2s;
}

#floating-btn:hover,
#maximize-btn:hover,
#hide-panel-btn:hover {
	background-color: rgba(255, 255, 255, 0.1);
	color: var(--text-primary);
}

/* Hide maximize button when there are no tabs */
#profiler-panel.position-right.no-tabs #maximize-btn,
#profiler-panel.position-left.no-tabs #maximize-btn,
#profiler-panel.position-bottom.no-tabs #maximize-btn,
#profiler-panel.position-top.no-tabs #maximize-btn {
	display: none !important;
}

.profiler-content-wrapper {
	flex-grow: 1;
	overflow: hidden;
	position: relative;
}

.profiler-content {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow-y: auto;
	font-size: 13px;
	visibility: hidden;
	opacity: 0;
	transition: opacity 0.2s, visibility 0.2s;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	user-select: none;
	-webkit-user-select: none;
}

.profiler-content.active {
	visibility: visible;
	opacity: 1;
}

.profiler-content {
	overflow: auto; /* make sure scrollbars can appear */
}

.profiler-content::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.profiler-content::-webkit-scrollbar-track {
	background: transparent;
}

.profiler-content::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.profiler-content::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.profiler-content::-webkit-scrollbar-corner {
	background: transparent;
}

.profiler-content {
	scrollbar-width: thin; /* "auto" | "thin" */
	scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}

.list-item-row {
	display: grid;
	align-items: center;
	padding: 4px 8px;
	border-radius: 3px;
	transition: background-color 0.2s;
	gap: 10px;
	border-bottom: none;
	user-select: none;
	-webkit-user-select: none;
}

.parameters .list-item-row {
	min-height: 31px;
}

.mini-panel-content .parameters .list-item-row {
	min-height: 21px;
}

.list-item-wrapper {
	margin-top: 2px;
	margin-bottom: 2px;
	user-select: none;
	-webkit-user-select: none;
}

.list-item-wrapper:first-child {
	/*margin-top: 0;*/
}

.list-item-wrapper:not(.header-wrapper):nth-child(odd) > .list-item-row {
	background-color: rgba(0,0,0,0.1);
}

.list-item-wrapper.header-wrapper>.list-item-row {
	color: var(--accent-color);
	background-color: rgba(0, 170, 255, 0.1);
}

.list-item-wrapper.header-wrapper>.list-item-row>.list-item-cell:first-child {
	font-weight: 600;
	line-height: 1;
}

.list-item-row.collapsible,
.list-item-row.actionable {
	cursor: pointer;
}

.list-item-row.collapsible {
	background-color: rgba(0, 170, 255, 0.15) !important;
	min-height: 23px;
}

.list-item-row.collapsible.alert,
.list-item-row.alert {
	background-color: rgba(244, 67, 54, 0.1) !important;
}

@media (hover: hover) {

	.list-item-row:hover:not(.collapsible):not(.no-hover),
	.list-item-row:hover:not(.no-hover),
	.list-item-row.actionable:hover,
	.list-item-row.collapsible.actionable:hover {
		background-color: rgba(255, 255, 255, 0.05) !important;
	}

	.list-item-row.collapsible:hover {
		background-color: rgba(0, 170, 255, 0.25) !important;
	}

}

.list-item-cell {
	white-space: pre;
	display: flex;
	align-items: center;
	user-select: none;
	-webkit-user-select: none;
}

.list-item-cell:not(:first-child) {
	justify-content: flex-end;
	font-weight: 600;
}

.list-header {
	display: grid;
	align-items: center;
	padding: 4px 8px;
	font-weight: 600;
	color: var(--text-secondary);
	padding-bottom: 6px;
	border-bottom: 1px solid var(--profiler-border);
	margin-bottom: 5px;
	gap: 10px;
	user-select: none;
	-webkit-user-select: none;
}

.list-item-wrapper.section-start {
	margin-top: 5px;
	margin-bottom: 5px;
}

.list-header .list-header-cell:not(:first-child) {
	text-align: right;
}

.list-children-container {
	padding-left: 1.5em;
	overflow: hidden;
	transition: max-height 0.1s ease-out;
	margin-top: 2px;
}

.list-children-container.closed {
	max-height: 0;
}

.item-toggler {
	display: inline-block;
	margin-right: 0.8em;
	text-align: left;
}

.list-item-row.open .item-toggler::before {
	content: '-';
}

.list-item-row:not(.open) .item-toggler::before {
	content: '+';
}

.list-item-cell .value.good {
	color: var(--color-green);
}

.list-item-cell .value.warn {
	color: var(--color-yellow);
}

.list-item-cell .value.bad {
	color: var(--color-red);
}

.list-scroll-wrapper {
	width: max-content;
	min-width: 100%;
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

.list-container.parameters .list-item-row:not(.collapsible) {
}

.graph-container {
	width: 100%;
	box-sizing: border-box;
	padding: 8px 0;
	position: relative;
}

.graph-svg {
	width: 100%;
	height: 80px;
	background-color: var(--profiler-header);
	border: 1px solid var(--profiler-border);
	border-radius: 4px;
}

.graph-path {
	stroke-width: 2;
	fill-opacity: 0.4;
}

.console-header {
	padding: 10px;
	border-bottom: 1px solid var(--profiler-border);
	display: flex;
	gap: 20px;
	flex-shrink: 0;
	align-items: center;
	justify-content: space-between;
}

.console-buttons-group {
	display: flex;
	gap: 20px;
}

.console-filter-input {
	background-color: var(--profiler-bg);
	border: 1px solid var(--profiler-border);
	color: var(--text-primary);
	border-radius: 4px;
	padding: 4px 8px;
	font-family: var(--font-mono);
	flex-grow: 1;
	max-width: 300px;
	border-radius: 15px;
}

.console-filter-input:focus {
	outline: none;
	border-color: var(--text-secondary);
}

.console-copy-button {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: color 0.2s, background-color 0.2s;
}

.console-copy-button:hover {
	color: var(--text-primary);
	background-color: var(--profiler-hover);
}

.console-copy-button.copied {
	color: var(--color-green);
}

#console-log {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 10px;
	overflow-y: auto;
	flex-grow: 1;
	user-select: text;
	-webkit-user-select: text;
}

.log-message {
	padding: 2px 5px;
	white-space: pre-wrap;
	word-break: break-all;
	border-radius: 3px;
	line-height: 1.5 !important;
}

.log-message.hidden {
	display: none;
}

.log-message.info {
	color: var(--text-primary);
}

.log-message.warn {
	color: var(--color-yellow);
}

.log-message.error {
	color: #f9dedc;
	background-color: rgba(244, 67, 54, 0.1);
}

.log-prefix {
	color: var(--text-secondary);
	margin-right: 8px;
}

.log-code {
	background-color: rgba(255, 255, 255, 0.1);
	border-radius: 3px;
	padding: 1px 4px;
}

.thumbnail-container {
	display: flex;
	align-items: center;
}

.thumbnail-svg {
	width: 40px;
	height: 22.5px;
	flex-shrink: 0;
	margin-right: 8px;
}

.param-control {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	width: 100%;
}

.param-control input,
.param-control select,
.param-control button {
	background-color: var(--profiler-bg);
	border: 1px solid var(--profiler-border);
	color: var(--text-primary);
	border-radius: 4px;
	padding: 4px 6px;
	padding-bottom: 2px;
	font-family: var(--font-mono);
	width: 100%;
	box-sizing: border-box;
}

.param-control input:focus {
	outline: none;
	border-color: var(--accent-color);
}

.param-control select {
	padding-top: 3px;
	padding-bottom: 1px;
}

.param-control input[type="number"] {
	cursor: ns-resize;
}

.param-control input[type="color"] {
	padding: 2px;
}

.param-control button {
	cursor: pointer;
	transition: background-color 0.2s;
}

.param-control button:hover {
	background-color: var(--profiler-header);
}

.param-control-vector {
	display: flex;
	gap: 5px;
}

.custom-checkbox {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	gap: 8px;
	will-change: transform;
}

.custom-checkbox input {
	display: none;
}

.custom-checkbox .checkmark {
	width: 14px;
	height: 14px;
	border: 1px solid var(--accent-color);
	border-radius: 3px;
	display: inline-flex;
	justify-content: center;
	align-items: center;
	transition: background-color 0.2s, border-color 0.2s;
}

.custom-checkbox .checkmark::after {
	content: '';
	width: 6px;
	height: 6px;
	background-color: var(--accent-color);
	border-radius: 1px;
	display: block;
	transform: scale(0);
	transition: transform 0.2s;
}

.custom-checkbox input:checked+.checkmark {
	border-color: var(--accent-color);
}

.custom-checkbox input:checked+.checkmark::after {
	transform: scale(1);
}

.param-control input[type="range"] {
	-webkit-appearance: none;
	appearance: none;
	width: 100%;
	height: 16px;
	background: var(--profiler-header);
	border-radius: 5px;
	border: 1px solid var(--profiler-border);
	outline: none;
	padding: 0px;
	padding-top: 8px;
}

.param-control input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 18px;
	height: 18px;
	background: var(--profiler-bg);
	border: 1px solid var(--accent-color);
	border-radius: 3px;
	cursor: pointer;
	margin-top: -8px;
}

.param-control input[type="range"]::-moz-range-thumb {
	width: 18px;
	height: 18px;
	background: var(--profiler-bg);
	border: 2px solid var(--accent-color);
	border-radius: 3px;
	cursor: pointer;
}

.param-control input[type="range"]::-moz-range-track {
	width: 100%;
	height: 16px;
	background: var(--profiler-header);
	border-radius: 5px;
	border: 1px solid var(--profiler-border);
}

/* Override .param-control styles for mini-panel-content */
.mini-panel-content input,
.mini-panel-content select,
.mini-panel-content button {
	padding: 2px 4px;
	height: 21px;
	line-height: 1.4;
	padding-top: 4px;
}

.mini-panel-content .param-control input,
.mini-panel-content .param-control select,
.mini-panel-content .param-control button {
	background-color: #1e1e24c2;
	line-height: 1.0;
}

.mini-panel-content .param-control select {
	padding: 2px 2px;
	padding-top: 3px;
}

.mini-panel-content .param-control input[type="number"]::-webkit-outer-spin-button,
.mini-panel-content .param-control input[type="number"]::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.mini-panel-content .param-control input[type="number"] {
	-moz-appearance: textfield;
}

.mini-panel-content .list-item-cell span {
	position: relative;
	top: 1px;
	margin-left: 2px;
}

.mini-panel-content .custom-checkbox .checkmark {
	width: 12px;
	height: 12px;
	margin-bottom: 2px;
	will-change: transform;
}

.mini-panel-content .list-container.parameters .list-item-row:not(.collapsible) {
	margin-bottom: 2px;
}

@media screen and (max-width: 450px) and (orientation: portrait) {

	.console-filter-input {
		max-width: 100px;
	}

}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {

	.panel-resizer {
		top: -10px !important;
		height: 20px !important;
	}

	#profiler-panel.position-top .panel-resizer {
		top: auto !important;
		bottom: -10px !important;
		height: 20px !important;
	}

	#profiler-panel.position-left .panel-resizer {
		right: -10px !important;
		width: 20px !important;
		height: 100% !important;
	}

	#profiler-panel.position-right .panel-resizer {
		left: -10px !important;
		width: 20px !important;
		height: 100% !important;
	}

	.detached-tab-resizer-top,
	.detached-tab-resizer-bottom {
		height: 10px !important;
	}

	.detached-tab-resizer-left,
	.detached-tab-resizer-right {
		width: 10px !important;
	}

}

.drag-preview-indicator {
	position: fixed;
	background-color: rgba(0, 170, 255, 0.2);
	border: 2px dashed var(--accent-color);
	z-index: 999;
	pointer-events: none;
	transition: all 0.2s ease-out;
}

/* Detached Tab Windows */
.detached-tab-panel {
	position: fixed;
	width: 500px;
	height: 400px;
	background: var(--profiler-bg);
	border: 1px solid var(--profiler-border);
	border-radius: 8px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	z-index: 1002;
	display: flex;
	flex-direction: column;
	backdrop-filter: blur(10px);
	overflow: hidden;
	opacity: 1;
	visibility: visible;
	transition: opacity 0.2s, visibility 0.2s;
}

#profiler-panel:not(.visible) ~ * .detached-tab-panel,
body:has(#profiler-panel:not(.visible)) .detached-tab-panel {
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
}

.detached-tab-header {
	background: var(--profiler-header-bg);
	padding: 0 7px 0 15px;
	font-family: var(--font-family);
	font-size: 14px;
	color: var(--text-primary);
	font-weight: 600;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--profiler-border);
	cursor: grab;
	user-select: none;
	height: 38px;
	flex-shrink: 0;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	touch-action: none;
}

.detached-tab-header:active {
	cursor: grabbing;
}

.detached-header-controls {
	display: flex;
	gap: 5px;
}

.detached-reattach-btn {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	font-family: var(--font-family);
	font-size: 18px;
	line-height: 1;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

.detached-reattach-btn:hover {
	background: rgba(0, 170, 255, 0.2);
	color: var(--accent-color);
}

.detached-tab-content {
	flex: 1;
	overflow: auto;
	position: relative;
	background: var(--profiler-bg);
}

.detached-tab-content::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.detached-tab-content::-webkit-scrollbar-track {
	background: transparent;
}

.detached-tab-content::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.detached-tab-content::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.detached-tab-content::-webkit-scrollbar-corner {
	background: transparent;
}

.detached-tab-content .profiler-content {
	display: block !important;
	height: 100%;
	visibility: visible !important;
	opacity: 1 !important;
	position: relative !important;
}

.detached-tab-content .profiler-content > * {
	font-family: var(--font-mono);
	color: var(--text-primary);
}

.detached-tab-resizer {
	position: absolute;
	bottom: 0;
	right: 0;
	width: 20px;
	height: 20px;
	cursor: nwse-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer::after {
	content: '';
	position: absolute;
	bottom: 2px;
	right: 2px;
	width: 12px;
	height: 12px;
	border-right: 2px solid var(--profiler-border);
	border-bottom: 2px solid var(--profiler-border);
	border-bottom-right-radius: 6px;
	opacity: 0.5;
}

.detached-tab-resizer:hover::after {
	opacity: 1;
	border-color: var(--accent-color);
}

/* Edge resizers */
.detached-tab-resizer-top {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 5px;
	cursor: ns-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer-right {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	width: 5px;
	cursor: ew-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer-bottom {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 5px;
	cursor: ns-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer-left {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	width: 5px;
	cursor: ew-resize;
	z-index: 10;
	touch-action: none;
}

/* Input number spin buttons - hide arrows */
/* Chrome, Safari, Edge, Opera */
#profiler-panel input[type="number"]::-webkit-outer-spin-button,
#profiler-panel input[type="number"]::-webkit-inner-spin-button,
.detached-tab-content input[type="number"]::-webkit-outer-spin-button,
.detached-tab-content input[type="number"]::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

/* Firefox */
#profiler-panel input[type="number"],
.detached-tab-content input[type="number"] {
	-moz-appearance: textfield;
}

.panel-action-btn {
	background: transparent;
	color: var(--text-primary);
	border: 1px solid var(--profiler-border);
	border-radius: 4px;
	padding: 6px 12px;
	cursor: pointer;
	font-family: var(--font-family);
	font-size: 12px;
	transition: background-color 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
}

.panel-action-btn:hover {
	background-color: rgba(255, 255, 255, 0.05);
}
`, i = document.createElement("style");
      i.id = "profiler-styles", i.textContent = t, document.head.appendChild(i);
    }
  }
  class ct extends $ {
    constructor(t) {
      super(), this.inspector = t, this.tabs = {}, this.activeTabId = null, this.isResizing = !1, this.lastHeightBottom = 350, this.lastWidthRight = 450, this.position = "bottom", this.detachedWindows = [], this.maxZIndex = 1002, this.nextTabOriginalIndex = 0, dt.init(), this.setupShell(), this.setupResizing(), this.setupWindowResizeListener(), this.setupOrientationListener();
    }
    getSize() {
      return this.panel.classList.contains("visible") === !1 || this.panel.classList.contains("no-tabs") ? {
        width: 0,
        height: 0
      } : this.position === "right" ? {
        width: this.panel.offsetWidth,
        height: 0
      } : {
        width: 0,
        height: this.panel.offsetHeight
      };
    }
    get isMobile() {
      return this.detectMobile();
    }
    get isSmallScreen() {
      return window.innerWidth <= 768;
    }
    detectMobile() {
      const t = navigator.userAgent || navigator.vendor || window.opera, i = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(t), n = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      return i || n && this.isSmallScreen;
    }
    setupOrientationListener() {
      const t = () => {
        if (!this.isMobile)
          return;
        const i = window.innerWidth > window.innerHeight ? "right" : "bottom";
        this.position !== i && this.setPosition(i);
      };
      t(), window.addEventListener("orientationchange", t), window.addEventListener("resize", t);
    }
    setupWindowResizeListener() {
      const t = () => {
        this.detachedWindows.forEach((n) => {
          this.constrainWindowToBounds(n.panel);
        });
      }, i = () => {
        if (this.panel.classList.contains("maximized"))
          return;
        const n = window.innerWidth, r = window.innerHeight;
        if (this.position === "bottom") {
          const s = this.panel.offsetHeight, o = r - 50;
          s > o && (this.panel.style.height = `${o}px`, this.lastHeightBottom = o);
        } else if (this.position === "right") {
          const s = this.panel.offsetWidth, o = n - 50;
          s > o && (this.panel.style.width = `${o}px`, this.lastWidthRight = o);
        }
      };
      window.addEventListener("resize", () => {
        this.isSmallScreen ? (this.floatingBtn.style.display = "none", this.panel.classList.add("hide-position-toggle")) : (this.floatingBtn.style.display = "", this.panel.classList.remove("hide-position-toggle")), this.isMobile ? this.panel.classList.add("is-mobile") : this.panel.classList.remove("is-mobile"), t(), i();
      });
    }
    constrainWindowToBounds(t) {
      const i = window.innerWidth, n = window.innerHeight, r = t.offsetWidth, s = t.offsetHeight;
      let o = parseFloat(t.style.left) || t.offsetLeft || 0, a = parseFloat(t.style.top) || t.offsetTop || 0;
      const l = r / 2, c = s / 2;
      o + r > i + l && (o = i + l - r), o < -l && (o = -l), a + s > n + c && (a = n + c - s), a < -c && (a = -c), t.style.left = `${o}px`, t.style.top = `${a}px`;
    }
    setupShell() {
      this.domElement = document.createElement("div"), this.domElement.id = "profiler-shell", this.toggleButton = document.createElement("button"), this.toggleButton.id = "profiler-toggle", this.toggleButton.innerHTML = `
<span id="builtin-tabs-container"></span>
<span id="toggle-text">
	<span id="fps-counter">-</span>
	<span class="fps-label">FPS</span>
</span>
<span id="toggle-icon">
	<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-device-ipad-horizontal-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11.5 20h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5.5" /><path d="M9 17h2" /><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M20.2 20.2l1.8 1.8" /></svg>
</span>
`, this.toggleButton.onclick = () => this.togglePanel(), this.builtinTabsContainer = this.toggleButton.querySelector("#builtin-tabs-container"), this.miniPanel = document.createElement("div"), this.miniPanel.id = "profiler-mini-panel", this.miniPanel.className = "profiler-mini-panel", this.panel = document.createElement("div"), this.panel.id = "profiler-panel";
      const t = document.createElement("div");
      t.className = "profiler-header", t.addEventListener("wheel", (s) => {
        s.deltaY !== 0 && (s.preventDefault(), t.scrollLeft += s.deltaY * 0.25);
      }, {
        passive: !1
      }), this.tabsContainer = document.createElement("div"), this.tabsContainer.className = "profiler-tabs";
      const i = document.createElement("div");
      i.className = "profiler-controls", this.floatingBtn = document.createElement("button"), this.floatingBtn.id = "floating-btn", this.floatingBtn.title = "Switch to Right Side", this.floatingBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>', this.floatingBtn.onclick = () => this.togglePosition(), this.isSmallScreen && (this.floatingBtn.style.display = "none", this.panel.classList.add("hide-position-toggle")), this.isMobile && this.panel.classList.add("is-mobile"), this.maximizeBtn = document.createElement("button"), this.maximizeBtn.id = "maximize-btn", this.maximizeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>', this.maximizeBtn.onclick = () => this.toggleMaximize();
      const n = document.createElement("button");
      n.id = "hide-panel-btn", n.textContent = "-", n.onclick = () => this.togglePanel(), i.append(this.floatingBtn, this.maximizeBtn, n), t.append(this.tabsContainer, i), this.contentWrapper = document.createElement("div"), this.contentWrapper.className = "profiler-content-wrapper";
      const r = document.createElement("div");
      r.className = "panel-resizer", this.panel.append(r, t, this.contentWrapper), this.domElement.append(this.toggleButton, this.miniPanel, this.panel), this.panel.classList.add(`position-${this.position}`), this.position === "right" && (this.toggleButton.classList.add("position-right"), this.miniPanel.classList.add("position-right"));
    }
    setupResizing() {
      const t = this.panel.querySelector(".panel-resizer"), i = (n) => {
        this.isResizing = !0, this.panel.classList.add("resizing"), t.setPointerCapture(n.pointerId);
        const r = n.clientX, s = n.clientY, o = this.panel.offsetHeight, a = this.panel.offsetWidth, l = (h) => {
          if (!this.isResizing)
            return;
          h.preventDefault();
          const m = h.clientX, p = h.clientY;
          if (this.position === "bottom") {
            const u = o - (p - s);
            u > 100 && u < window.innerHeight - 50 && (this.panel.style.height = `${u}px`);
          } else if (this.position === "right") {
            const u = a - (m - r);
            u > 200 && u < window.innerWidth - 50 && (this.panel.style.width = `${u}px`);
          }
          this.dispatchEvent({
            type: "resize"
          });
        }, c = () => {
          this.isResizing = !1, this.panel.classList.remove("resizing"), t.removeEventListener("pointermove", l), t.removeEventListener("pointerup", c), t.removeEventListener("pointercancel", c), this.panel.classList.contains("maximized") || (this.position === "bottom" ? this.lastHeightBottom = this.panel.offsetHeight : this.position === "right" && (this.lastWidthRight = this.panel.offsetWidth), this.saveLayout());
        };
        t.addEventListener("pointermove", l), t.addEventListener("pointerup", c), t.addEventListener("pointercancel", c);
      };
      t.addEventListener("pointerdown", i);
    }
    toggleMaximize() {
      this.panel.classList.contains("maximized") ? (this.panel.classList.remove("maximized"), this.position === "bottom" ? (this.panel.style.height = `${this.lastHeightBottom}px`, this.panel.style.width = "100%") : this.position === "right" && (this.panel.style.height = "100%", this.panel.style.width = `${this.lastWidthRight}px`), this.maximizeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>') : (this.position === "bottom" ? this.lastHeightBottom = this.panel.offsetHeight : this.position === "right" && (this.lastWidthRight = this.panel.offsetWidth), this.panel.classList.add("maximized"), this.position === "bottom" ? (this.panel.style.height = "100vh", this.panel.style.width = "100%") : this.position === "right" && (this.panel.style.height = "100%", this.panel.style.width = "100vw"), this.maximizeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>'), this.dispatchEvent({
        type: "resize"
      });
    }
    hide() {
      this.miniPanel.classList.remove("visible"), this.miniPanel.querySelectorAll(".mini-panel-content").forEach((t) => {
        t.style.display = "none";
      }), this.builtinTabsContainer.querySelectorAll(".builtin-tab-btn").forEach((t) => {
        t.classList.remove("active");
      });
    }
    show(t) {
      if (this.hide(), t.builtinButton.classList.add("active"), !t.miniContent.firstChild)
        for (; t.content.firstChild; )
          t.miniContent.appendChild(t.content.firstChild);
      t.miniContent.style.display = "block", this.miniPanel.classList.add("visible");
    }
    addTab(t) {
      this.tabs[t.id] = t, t.originalIndex = this.nextTabOriginalIndex++, t.allowDetach === !1 && t.button.classList.add("no-detach"), t.onVisibilityChange = () => this.updatePanelSize(), this.setupTabDragAndDrop(t), t.builtin || this.tabsContainer.appendChild(t.button), this.contentWrapper.appendChild(t.content), t.isVisible || (t.button.style.display = "none", t.content.style.display = "none"), t.builtin && this.addBuiltinTab(t), this.updatePanelSize(), t.profiler = this;
    }
    addBuiltinTab(t) {
      const i = document.createElement("button");
      i.className = "builtin-tab-btn", t.icon ? i.innerHTML = t.icon : i.textContent = t.button.textContent.charAt(0).toUpperCase(), i.title = t.button.textContent;
      const n = document.createElement("div");
      n.className = "mini-panel-content", n.style.display = "none", t.builtinButton = i, t.miniContent = n, this.miniPanel.appendChild(n), i.onclick = (r) => {
        r.stopPropagation(), n.style.display !== "none" && n.children.length > 0 ? this.hide() : this.show(t);
      }, this.builtinTabsContainer.appendChild(i), t.builtinButton = i, t.miniContent = n, t.isVisible || (i.style.display = "none", n.style.display = "none", Array.from(this.builtinTabsContainer.querySelectorAll(".builtin-tab-btn")).some((r) => r.style.display !== "none") || (this.builtinTabsContainer.style.display = "none"));
    }
    removeTab(t) {
      if (!(!t || this.tabs[t.id] === void 0)) {
        if (delete this.tabs[t.id], t.isDetached && t.detachedWindow) {
          t.detachedWindow.panel && t.detachedWindow.panel.parentNode && t.detachedWindow.panel.parentNode.removeChild(t.detachedWindow.panel);
          const i = this.detachedWindows.indexOf(t.detachedWindow);
          i !== -1 && this.detachedWindows.splice(i, 1);
        }
        if (t.builtin ? (t.builtinButton && t.builtinButton.parentNode && t.builtinButton.parentNode.removeChild(t.builtinButton), t.miniContent && t.miniContent.parentNode && t.miniContent.parentNode.removeChild(t.miniContent), Array.from(this.builtinTabsContainer.querySelectorAll(".builtin-tab-btn")).some((i) => i.style.display !== "none") || (this.builtinTabsContainer.style.display = "none")) : t.button && t.button.parentNode && t.button.parentNode.removeChild(t.button), t.content && t.content.parentNode && t.content.parentNode.removeChild(t.content), this.activeTabId === t.id) {
          this.activeTabId = null;
          const i = Object.values(this.tabs).filter((n) => !n.isDetached && n.isVisible);
          i.length > 0 ? this.setActiveTab(i[0].id) : this.updatePanelSize();
        } else
          this.updatePanelSize();
        t.onVisibilityChange = null, t.profiler = null;
      }
    }
    updatePanelSize() {
      Object.values(this.tabs).some((t) => !t.isDetached && t.isVisible) ? (this.panel.classList.remove("no-tabs"), Object.keys(this.tabs).length > 0 && (this.position === "bottom" ? parseInt(this.panel.style.height) === 38 && (this.panel.style.height = `${this.lastHeightBottom}px`) : this.position === "right" && parseInt(this.panel.style.width) === 45 && (this.panel.style.width = `${this.lastWidthRight}px`))) : (this.panel.classList.add("no-tabs"), this.panel.classList.contains("maximized") && (this.panel.classList.remove("maximized"), this.maximizeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'), this.position === "bottom" ? this.panel.style.height = "38px" : this.position === "right" && (this.panel.style.width = "45px")), this.dispatchEvent({
        type: "resize"
      });
    }
    setupTabDragAndDrop(t) {
      if (t.button.addEventListener("click", () => {
        i || this.setActiveTab(t.id);
      }), t.allowDetach === !1) {
        t.button.style.cursor = "default";
        return;
      }
      let i = !1, n, r, s = !1, o = null;
      const a = 10, l = (m) => {
        n = m.clientX, r = m.clientY, i = !1, s = !1, t.button.setPointerCapture(m.pointerId);
      }, c = (m) => {
        const p = m.clientX, u = m.clientY, g = Math.abs(p - n), f = Math.abs(u - r);
        !i && (g > a || f > a) && (i = !0, t.button.style.cursor = "grabbing", t.button.style.opacity = "0.5", t.button.style.transform = "scale(1.05)", o = this.createPreviewWindow(t, p, u), o.style.opacity = "0.8"), i && o && (s = !0, m.preventDefault(), o.style.left = `${p - 200}px`, o.style.top = `${u - 20}px`);
      }, h = () => {
        if (i && s && o) {
          o.parentNode && o.parentNode.removeChild(o);
          const m = parseInt(o.style.left) + 200, p = parseInt(o.style.top) + 20;
          this.detachTab(t, m, p);
        } else
          s || this.setActiveTab(t.id), o && o.parentNode && o.parentNode.removeChild(o);
        t.button.style.opacity = "", t.button.style.transform = "", t.button.style.cursor = "", i = !1, s = !1, o = null, t.button.removeEventListener("pointermove", c), t.button.removeEventListener("pointerup", h), t.button.removeEventListener("pointercancel", h);
      };
      t.button.addEventListener("pointerdown", (m) => {
        this.isMobile && m.pointerType !== "mouse" || (l(m), t.button.addEventListener("pointermove", c), t.button.addEventListener("pointerup", h), t.button.addEventListener("pointercancel", h));
      }), t.button.style.cursor = "grab";
    }
    createPreviewWindow(t, i, n) {
      const r = document.createElement("div");
      r.className = "detached-tab-panel", r.style.left = `${i - 200}px`, r.style.top = `${n - 20}px`, r.style.pointerEvents = "none", this.maxZIndex++, r.style.setProperty("z-index", this.maxZIndex, "important");
      const s = document.createElement("div");
      s.className = "detached-tab-header";
      const o = document.createElement("span");
      o.textContent = t.button.textContent.replace("⇱", "").trim(), s.appendChild(o);
      const a = document.createElement("div");
      a.className = "detached-header-controls";
      const l = document.createElement("button");
      l.className = "detached-reattach-btn", l.innerHTML = "↩", a.appendChild(l), s.appendChild(a);
      const c = document.createElement("div");
      c.className = "detached-tab-content";
      const h = document.createElement("div");
      return h.className = "detached-tab-resizer", r.appendChild(h), r.appendChild(s), r.appendChild(c), document.body.appendChild(r), r;
    }
    detachTab(t, i, n) {
      if (t.isDetached || t.allowDetach === !1)
        return;
      const r = Array.from(this.tabsContainer.children).map((l) => Object.keys(this.tabs).find((c) => this.tabs[c].button === l)).filter((l) => l !== void 0), s = r.indexOf(t.id);
      let o = null;
      if (this.activeTabId === t.id) {
        t.setActive(!1);
        const l = r.filter((c) => c !== t.id && !this.tabs[c].isDetached && this.tabs[c].isVisible);
        if (l.length > 0) {
          for (let c = s - 1; c >= 0; c--)
            if (l.includes(r[c])) {
              o = r[c];
              break;
            }
          if (!o) {
            for (let c = s + 1; c < r.length; c++)
              if (l.includes(r[c])) {
                o = r[c];
                break;
              }
          }
          o || (o = l[0]);
        }
      }
      t.button.parentNode && t.button.parentNode.removeChild(t.button), t.content.parentNode && t.content.parentNode.removeChild(t.content);
      const a = this.createDetachedWindow(t, i, n);
      this.detachedWindows.push(a), t.isDetached = !0, t.detachedWindow = a, o ? this.setActiveTab(o) : this.activeTabId === t.id && (this.activeTabId = null), this.updatePanelSize(), this.saveLayout();
    }
    createDetachedWindow(t, i, n) {
      const r = window.innerWidth, s = window.innerHeight, o = 400, a = 300;
      let l = i - 200, c = n - 20;
      l + o > r && (l = r - o), l < 0 && (l = 0), c + a > s && (c = s - a), c < 0 && (c = 0);
      const h = document.createElement("div");
      h.className = "detached-tab-panel", h.style.left = `${l}px`, h.style.top = `${c}px`, this.panel.classList.contains("visible") || (h.style.opacity = "0", h.style.visibility = "hidden", h.style.pointerEvents = "none"), t.isVisible || (h.style.display = "none");
      const m = document.createElement("div");
      m.className = "detached-tab-header";
      const p = document.createElement("span");
      p.textContent = t.button.textContent.replace("⇱", "").trim(), m.appendChild(p);
      const u = document.createElement("div");
      u.className = "detached-header-controls";
      const g = document.createElement("button");
      g.className = "detached-reattach-btn", g.innerHTML = "↩", g.title = "Reattach to main panel", g.onclick = () => this.reattachTab(t), u.appendChild(g), m.appendChild(u);
      const f = document.createElement("div");
      f.className = "detached-tab-content", f.appendChild(t.content), t.content.style.display = "block", t.content.classList.add("active");
      const C = document.createElement("div");
      C.className = "detached-tab-resizer-top";
      const w = document.createElement("div");
      w.className = "detached-tab-resizer-right";
      const k = document.createElement("div");
      k.className = "detached-tab-resizer-bottom";
      const L = document.createElement("div");
      L.className = "detached-tab-resizer-left";
      const y = document.createElement("div");
      return y.className = "detached-tab-resizer", h.appendChild(C), h.appendChild(w), h.appendChild(k), h.appendChild(L), h.appendChild(y), h.appendChild(m), h.appendChild(f), document.body.appendChild(h), this.setupDetachedWindowDrag(h, m, t), this.setupDetachedWindowResize(h, C, w, k, L, y), h.style.setProperty("z-index", this.maxZIndex, "important"), {
        panel: h,
        tab: t
      };
    }
    bringWindowToFront(t) {
      this.maxZIndex++, t.style.setProperty("z-index", this.maxZIndex, "important");
    }
    setupDetachedWindowDrag(t, i, n) {
      let r = !1, s, o, a, l;
      t.addEventListener("pointerdown", () => {
        this.bringWindowToFront(t);
      });
      const c = (p) => {
        if (p.target.classList.contains("detached-reattach-btn"))
          return;
        this.bringWindowToFront(t), r = !0, i.style.cursor = "grabbing", i.setPointerCapture(p.pointerId), s = p.clientX, o = p.clientY;
        const u = t.getBoundingClientRect();
        a = u.left, l = u.top;
      }, h = (p) => {
        if (!r)
          return;
        p.preventDefault();
        const u = p.clientX, g = p.clientY, f = u - s, C = g - o;
        let w = a + f, k = l + C;
        const L = window.innerWidth, y = window.innerHeight, A = t.offsetWidth, W = t.offsetHeight, I = A / 2, B = W / 2;
        w + A > L + I && (w = L + I - A), w < -I && (w = -I), k + W > y + B && (k = y + B - W), k < -B && (k = -B), t.style.left = `${w}px`, t.style.top = `${k}px`;
        const N = this.panel.getBoundingClientRect();
        u >= N.left && u <= N.right && g >= N.top && g <= N.bottom ? (t.style.opacity = "0.5", this.panel.style.outline = "2px solid var(--accent-color)") : (t.style.opacity = "", this.panel.style.outline = "");
      }, m = (p) => {
        if (!r)
          return;
        r = !1, i.style.cursor = "", t.style.opacity = "", this.panel.style.outline = "";
        const u = p.clientX, g = p.clientY;
        if (u !== void 0 && g !== void 0) {
          const f = this.panel.getBoundingClientRect();
          u >= f.left && u <= f.right && g >= f.top && g <= f.bottom && n ? this.reattachTab(n) : this.saveLayout();
        }
        i.removeEventListener("pointermove", h), i.removeEventListener("pointerup", m), i.removeEventListener("pointercancel", m);
      };
      i.addEventListener("pointerdown", (p) => {
        c(p), i.addEventListener("pointermove", h), i.addEventListener("pointerup", m), i.addEventListener("pointercancel", m);
      }), i.style.cursor = "grab";
    }
    setupDetachedWindowResize(t, i, n, r, s, o) {
      const a = (l, c) => {
        let h = !1, m, p, u, g, f, C;
        const w = (y) => {
          y.preventDefault(), y.stopPropagation(), h = !0, this.bringWindowToFront(t), l.setPointerCapture(y.pointerId), m = y.clientX, p = y.clientY, u = t.offsetWidth, g = t.offsetHeight, f = t.offsetLeft, C = t.offsetTop;
        }, k = (y) => {
          if (!h)
            return;
          y.preventDefault();
          const A = y.clientX, W = y.clientY, I = A - m, B = W - p, N = window.innerWidth, Rt = window.innerHeight;
          if (c === "right" || c === "corner") {
            const E = u + I, M = N - f;
            E >= 250 && E <= M && (t.style.width = `${E}px`);
          }
          if (c === "bottom" || c === "corner") {
            const E = g + B, M = Rt - C;
            E >= 150 && E <= M && (t.style.height = `${E}px`);
          }
          if (c === "left") {
            const E = u - I, M = f + u - 250;
            if (E >= 250) {
              const z = f + I;
              z >= 0 && z <= M && (t.style.width = `${E}px`, t.style.left = `${z}px`);
            }
          }
          if (c === "top") {
            const E = g - B, M = C + g - 150;
            if (E >= 150) {
              const z = C + B;
              z >= 0 && z <= M && (t.style.height = `${E}px`, t.style.top = `${z}px`);
            }
          }
        }, L = () => {
          h = !1, l.removeEventListener("pointermove", k), l.removeEventListener("pointerup", L), l.removeEventListener("pointercancel", L), this.saveLayout();
        };
        l.addEventListener("pointerdown", (y) => {
          w(y), l.addEventListener("pointermove", k), l.addEventListener("pointerup", L), l.addEventListener("pointercancel", L);
        });
      };
      a(i, "top"), a(n, "right"), a(r, "bottom"), a(s, "left"), a(o, "corner");
    }
    reattachTab(t) {
      if (!t.isDetached)
        return;
      if (t.detachedWindow) {
        const s = this.detachedWindows.indexOf(t.detachedWindow);
        s > -1 && this.detachedWindows.splice(s, 1), t.detachedWindow.panel.parentNode && t.detachedWindow.panel.parentNode.removeChild(t.detachedWindow.panel), t.detachedWindow = null;
      }
      t.isDetached = !1;
      const i = Object.values(this.tabs).filter((s) => s.originalIndex !== void 0 && s.isVisible).sort((s, o) => s.originalIndex - o.originalIndex), n = Array.from(this.tabsContainer.children);
      let r = 0;
      for (const s of i) {
        if (s.id === t.id)
          break;
        s.isDetached || r++;
      }
      r >= n.length || n.length === 0 ? this.tabsContainer.appendChild(t.button) : this.tabsContainer.insertBefore(t.button, n[r]), this.contentWrapper.appendChild(t.content), this.setActiveTab(t.id), this.updatePanelSize(), this.saveLayout();
    }
    setActiveTab(t) {
      this.activeTabId && this.tabs[this.activeTabId] && !this.tabs[this.activeTabId].isDetached && this.tabs[this.activeTabId].setActive(!1), this.activeTabId = t, this.tabs[t] && this.tabs[t].setActive(!0), this.saveLayout();
    }
    togglePanel() {
      this.panel.classList.toggle("visible"), this.toggleButton.classList.toggle("panel-open"), this.miniPanel.classList.toggle("panel-open");
      const t = this.panel.classList.contains("visible");
      this.detachedWindows.forEach((i) => {
        t ? (i.panel.style.opacity = "", i.panel.style.visibility = "", i.panel.style.pointerEvents = "") : (i.panel.style.opacity = "0", i.panel.style.visibility = "hidden", i.panel.style.pointerEvents = "none");
      }), this.dispatchEvent({
        type: "resize"
      }), this.saveLayout();
    }
    togglePosition() {
      const t = this.position === "bottom" ? "right" : "bottom";
      this.setPosition(t);
    }
    setPosition(t) {
      if (this.position === t)
        return;
      this.panel.style.transition = "none";
      const i = this.panel.classList.contains("maximized");
      t === "right" ? (this.position = "right", this.floatingBtn.classList.add("active"), this.floatingBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 15h18"></path></svg>', this.floatingBtn.title = "Switch to Bottom", this.panel.classList.remove("position-bottom"), this.panel.classList.add("position-right"), this.toggleButton.classList.add("position-right"), this.miniPanel.classList.add("position-right"), this.panel.style.bottom = "", this.panel.style.top = "0", this.panel.style.right = "0", this.panel.style.left = "", i ? (this.panel.style.width = "100vw", this.panel.style.height = "100%") : (this.panel.style.width = `${this.lastWidthRight}px`, this.panel.style.height = "100%")) : (this.position = "bottom", this.floatingBtn.classList.remove("active"), this.floatingBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>', this.floatingBtn.title = "Switch to Right Side", this.panel.classList.remove("position-right"), this.panel.classList.add("position-bottom"), this.toggleButton.classList.remove("position-right"), this.miniPanel.classList.remove("position-right"), this.panel.style.top = "", this.panel.style.right = "", this.panel.style.bottom = "0", this.panel.style.left = "0", i ? (this.panel.style.width = "100%", this.panel.style.height = "100vh") : (this.panel.style.width = "100%", this.panel.style.height = `${this.lastHeightBottom}px`)), setTimeout(() => {
        this.panel.style.transition = "";
      }, 50), this.updatePanelSize(), this.saveLayout();
    }
    saveLayout() {
      if (this.isLoadingLayout)
        return;
      const t = {
        position: this.position,
        lastHeightBottom: this.lastHeightBottom,
        lastWidthRight: this.lastWidthRight,
        activeTabId: this.activeTabId,
        detachedTabs: [],
        isVisible: this.panel.classList.contains("visible")
      };
      this.detachedWindows.forEach((i) => {
        const n = i.tab, r = i.panel, s = parseFloat(r.style.left) || r.offsetLeft || 0, o = parseFloat(r.style.top) || r.offsetTop || 0, a = r.offsetWidth, l = r.offsetHeight;
        t.detachedTabs.push({
          tabId: n.id,
          originalIndex: n.originalIndex !== void 0 ? n.originalIndex : 0,
          left: s,
          top: o,
          width: a,
          height: l
        });
      });
      try {
        D("layout", t);
      } catch (i) {
        console.warn("Failed to save profiler layout:", i);
      }
    }
    loadLayout() {
      this.isLoadingLayout = !0;
      try {
        const t = P("layout");
        if (Object.keys(t).length === 0)
          return;
        if (t.detachedTabs && t.detachedTabs.length > 0) {
          const r = window.innerWidth, s = window.innerHeight;
          t.detachedTabs = t.detachedTabs.map((o) => {
            let { left: a, top: l, width: c, height: h } = o;
            c > r && (c = r - 100), h > s && (h = s - 100);
            const m = c / 2, p = h / 2;
            return a + c > r + m && (a = r + m - c), a < -m && (a = -m), l + h > s + p && (l = s + p - h), l < -p && (l = -p), {
              ...o,
              left: a,
              top: l,
              width: c,
              height: h
            };
          });
        }
        t.position && (this.position = t.position), t.lastHeightBottom && (this.lastHeightBottom = t.lastHeightBottom), t.lastWidthRight && (this.lastWidthRight = t.lastWidthRight);
        const i = window.innerWidth, n = window.innerHeight;
        this.lastHeightBottom > n - 50 && (this.lastHeightBottom = n - 50), this.lastWidthRight > i - 50 && (this.lastWidthRight = i - 50), this.position === "right" ? (this.floatingBtn.classList.add("active"), this.floatingBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 15h18"></path></svg>', this.floatingBtn.title = "Switch to Bottom", this.panel.classList.remove("position-bottom"), this.panel.classList.add("position-right"), this.toggleButton.classList.add("position-right"), this.miniPanel.classList.add("position-right"), this.panel.style.bottom = "", this.panel.style.top = "0", this.panel.style.right = "0", this.panel.style.left = "", this.panel.style.width = `${this.lastWidthRight}px`, this.panel.style.height = "100%") : this.panel.style.height = `${this.lastHeightBottom}px`, t.isVisible && (this.panel.classList.add("visible"), this.toggleButton.classList.add("panel-open")), t.activeTabId && this.setActiveTab(t.activeTabId), t.detachedTabs && t.detachedTabs.length > 0 && (this.pendingDetachedTabs = t.detachedTabs, this.restoreDetachedTabs()), this.updatePanelSize(), this.panel.classList.contains("visible") && this.miniPanel.classList.add("panel-open");
      } catch (t) {
        console.warn("Failed to load profiler layout:", t);
      } finally {
        this.isLoadingLayout = !1;
      }
    }
    restoreDetachedTabs() {
      if (!(!this.pendingDetachedTabs || this.pendingDetachedTabs.length === 0)) {
        if (this.pendingDetachedTabs.forEach((t) => {
          const i = this.tabs[t.tabId];
          if (!i || i.isDetached)
            return;
          t.originalIndex !== void 0 && (i.originalIndex = t.originalIndex), i.button.parentNode && i.button.parentNode.removeChild(i.button), i.content.parentNode && i.content.parentNode.removeChild(i.content);
          const n = this.createDetachedWindow(i, 0, 0);
          n.panel.style.left = `${t.left}px`, n.panel.style.top = `${t.top}px`, n.panel.style.width = `${t.width}px`, n.panel.style.height = `${t.height}px`, this.constrainWindowToBounds(n.panel), this.detachedWindows.push(n), i.isDetached = !0, i.detachedWindow = n;
        }), this.pendingDetachedTabs = null, this.detachedWindows.forEach((t) => {
          const i = parseInt(getComputedStyle(t.panel).zIndex) || 0;
          i > this.maxZIndex && (this.maxZIndex = i);
        }), !this.activeTabId || !this.tabs[this.activeTabId] || this.tabs[this.activeTabId].isDetached || !this.tabs[this.activeTabId].isVisible) {
          const t = Object.keys(this.tabs).filter((i) => !this.tabs[i].isDetached && this.tabs[i].isVisible);
          if (t.length > 0) {
            const i = Array.from(this.tabsContainer.children).map((n) => Object.keys(this.tabs).find((r) => this.tabs[r].button === n)).filter((n) => n !== void 0 && !this.tabs[n].isDetached && this.tabs[n].isVisible);
            this.setActiveTab(i[0] || t[0]);
          } else
            this.activeTabId = null;
        }
        this.updatePanelSize();
      }
    }
  }
  class R extends $ {
    constructor(t, i = {}) {
      super(), this.id = t.toLowerCase(), this.button = document.createElement("button"), this.button.className = "tab-btn", this.button.textContent = t, this.content = document.createElement("div"), this.content.id = `${this.id}-content`, this.content.className = "profiler-content", this._isActive = !1, this.isVisible = !0, this.isDetached = !1, this.detachedWindow = null, this.allowDetach = i.allowDetach !== void 0 ? i.allowDetach : !0, this.builtin = i.builtin !== void 0 ? i.builtin : !1, this.icon = i.icon || null, this.builtinButton = null, this.miniContent = null, this.profiler = null, this.onVisibilityChange = null;
    }
    get inspector() {
      return this.profiler.inspector;
    }
    get isActive() {
      return this.profiler && this.profiler.panel.classList.contains("visible") ? this.isDetached || this._isActive : !1;
    }
    set isActive(t) {
      this._isActive = t;
    }
    init() {
    }
    update() {
    }
    setActive(t) {
      this.button.classList.toggle("active", t), this.content.classList.toggle("active", t), this.isActive = t;
    }
    show() {
      this.content.style.display = "", this.button.style.display = "", this.isVisible = !0, this.isDetached && this.detachedWindow && (this.detachedWindow.panel.style.display = ""), this.onVisibilityChange && this.onVisibilityChange(), this.showBuiltin();
    }
    hide() {
      this.content.style.display = "none", this.button.style.display = "none", this.isVisible = !1, this.isDetached && this.detachedWindow && (this.detachedWindow.panel.style.display = "none"), this.onVisibilityChange && this.onVisibilityChange(), this.hideBuiltin();
    }
    showBuiltin() {
      if (this.builtin && (this.profiler && this.profiler.builtinTabsContainer && (this.profiler.builtinTabsContainer.style.display = ""), this.builtinButton && (this.builtinButton.style.display = ""), this.miniContent && this.profiler)) {
        if (this.profiler.miniPanel.querySelectorAll(".mini-panel-content").forEach((t) => {
          t.style.display = "none";
        }), this.profiler.builtinTabsContainer.querySelectorAll(".builtin-tab-btn").forEach((t) => {
          t.classList.remove("active");
        }), this.builtinButton && this.builtinButton.classList.add("active"), !this.miniContent.firstChild)
          for (; this.content.firstChild; )
            this.miniContent.appendChild(this.content.firstChild);
        this.miniContent.style.display = "block", this.profiler.miniPanel.classList.add("visible");
      }
    }
    hideBuiltin() {
      if (this.builtin) {
        if (this.builtinButton && (this.builtinButton.style.display = "none"), this.miniContent && (this.miniContent.style.display = "none", this.miniContent.firstChild))
          for (; this.miniContent.firstChild; )
            this.content.appendChild(this.miniContent.firstChild);
        this.builtinButton && this.builtinButton.classList.remove("active"), this.profiler && (Array.from(this.profiler.miniPanel.querySelectorAll(".mini-panel-content")).some((t) => t.style.display !== "none") || this.profiler.miniPanel.classList.remove("visible"), Array.from(this.profiler.builtinTabsContainer.querySelectorAll(".builtin-tab-btn")).some((t) => t.style.display !== "none") || (this.profiler.builtinTabsContainer.style.display = "none"));
      }
    }
  }
  class _ {
    constructor(...t) {
      this.headers = t, this.children = [], this.domElement = document.createElement("div"), this.domElement.className = "list-container", this.domElement.style.padding = "10px", this.id = `list-${Math.random().toString(36).slice(2, 11)}`, this.domElement.dataset.listId = this.id, this.gridStyleElement = document.createElement("style"), this.domElement.appendChild(this.gridStyleElement);
      const i = document.createElement("div");
      i.className = "list-header", this.headers.forEach((n) => {
        const r = document.createElement("div");
        r.className = "list-header-cell", r.textContent = n, i.appendChild(r);
      }), this.domElement.appendChild(i);
    }
    setGridStyle(t) {
      this.gridStyleElement.textContent = `
[data-list-id="${this.id}"] > .list-header,
[data-list-id="${this.id}"] .list-item-row {
	grid-template-columns: ${t};
}
`;
    }
    add(t) {
      t.parent !== null && t.parent.remove(t), t.domElement.classList.add("header-wrapper", "section-start"), t.parent = this, this.children.push(t), this.domElement.appendChild(t.domElement);
    }
    remove(t) {
      const i = this.children.indexOf(t);
      return i !== -1 && (this.children.splice(i, 1), this.domElement.removeChild(t.domElement), t.parent = null), this;
    }
  }
  class j {
    constructor(t = 512) {
      this.maxPoints = t, this.lines = {}, this.limit = 0, this.limitIndex = 0, this.domElement = document.createElementNS("http://www.w3.org/2000/svg", "svg"), this.domElement.setAttribute("class", "graph-svg");
    }
    addLine(t, i) {
      const n = document.createElementNS("http://www.w3.org/2000/svg", "path");
      n.setAttribute("class", "graph-path"), n.style.stroke = i, n.style.fill = i, this.domElement.appendChild(n), this.lines[t] = {
        path: n,
        color: i,
        points: []
      };
    }
    addPoint(t, i) {
      const n = this.lines[t];
      n && (n.points.push(i), n.points.length > this.maxPoints && n.points.shift(), i > this.limit && (this.limit = i, this.limitIndex = 0));
    }
    resetLimit() {
      this.limit = 0, this.limitIndex = 0;
    }
    update() {
      const t = this.domElement.clientWidth, i = this.domElement.clientHeight;
      if (t === 0)
        return;
      const n = t / (this.maxPoints - 1);
      for (const r in this.lines) {
        const s = this.lines[r];
        let o = `M 0,${i}`;
        for (let l = 0; l < s.points.length; l++) {
          const c = l * n, h = i - s.points[l] / this.limit * i;
          o += ` L ${c},${h}`;
        }
        o += ` L ${(s.points.length - 1) * n},${i} Z`;
        const a = t - (s.points.length - 1) * n;
        s.path.setAttribute("transform", `translate(${a}, 0)`), s.path.setAttribute("d", o);
      }
      this.limitIndex++ > this.maxPoints && this.resetLimit();
    }
  }
  class v {
    constructor(...t) {
      this.children = [], this.isOpen = !0, this.childrenContainer = null, this.parent = null, this.domElement = document.createElement("div"), this.domElement.className = "list-item-wrapper", this.itemRow = document.createElement("div"), this.itemRow.className = "list-item-row", this.userData = {}, this.data = t, this.data.forEach((i) => {
        const n = document.createElement("div");
        n.className = "list-item-cell", i instanceof HTMLElement ? n.appendChild(i) : n.append(String(i)), this.itemRow.appendChild(n);
      }), this.domElement.appendChild(this.itemRow), this.onItemClick = this.onItemClick.bind(this);
    }
    onItemClick(t) {
      t.target.closest("button, a, input, label") || this.toggle();
    }
    add(t, i = this.children.length) {
      return t.parent !== null && t.parent.remove(t), t.parent = this, this.children.splice(i, 0, t), this.itemRow.classList.add("collapsible"), this.childrenContainer || (this.childrenContainer = document.createElement("div"), this.childrenContainer.className = "list-children-container", this.childrenContainer.classList.toggle("closed", !this.isOpen), this.domElement.appendChild(this.childrenContainer), this.itemRow.addEventListener("click", this.onItemClick)), this.childrenContainer.insertBefore(t.domElement, this.childrenContainer.children[i] || null), this.updateToggler(), this;
    }
    remove(t) {
      const i = this.children.indexOf(t);
      return i !== -1 && (this.children.splice(i, 1), this.childrenContainer.removeChild(t.domElement), t.parent = null, this.children.length === 0 && (this.itemRow.classList.remove("collapsible"), this.itemRow.removeEventListener("click", this.onItemClick), this.childrenContainer.remove(), this.childrenContainer = null), this.updateToggler()), this;
    }
    updateToggler() {
      const t = this.itemRow.querySelector(".list-item-cell:first-child");
      let i = this.itemRow.querySelector(".item-toggler");
      this.children.length > 0 ? (i || (i = document.createElement("span"), i.className = "item-toggler", t.prepend(i)), this.isOpen && this.itemRow.classList.add("open")) : i && i.remove();
    }
    toggle() {
      return this.isOpen = !this.isOpen, this.itemRow.classList.toggle("open", this.isOpen), this.childrenContainer && this.childrenContainer.classList.toggle("closed", !this.isOpen), this;
    }
    close() {
      return this.isOpen && this.toggle(), this;
    }
  }
  function b(d = null) {
    const t = document.createElement("span");
    return t.className = "value", d !== null && (t.id = d), t;
  }
  function x(d, t) {
    const i = d instanceof HTMLElement ? d : document.getElementById(d);
    i && i.textContent !== t && (i.textContent = t);
  }
  function ht(d) {
    const t = d.lastIndexOf("/");
    if (t === -1)
      return {
        path: "",
        name: d.trim()
      };
    const i = d.substring(0, t).trim(), n = d.substring(t + 1).trim();
    return {
      path: i,
      name: n
    };
  }
  function pt(d) {
    return d.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
  }
  function S(d, t = 2) {
    if (d === 0)
      return "0 Bytes";
    const i = 1024, n = t < 0 ? 0 : t, r = [
      "Bytes",
      "KB",
      "MB",
      "GB",
      "TB",
      "PB",
      "EB",
      "ZB",
      "YB"
    ], s = Math.floor(Math.log(d) / Math.log(i));
    return parseFloat((d / Math.pow(i, s)).toFixed(n)) + " " + r[s];
  }
  class mt extends R {
    constructor(t = {}) {
      super("Performance", t);
      const i = new _("Name", "CPU", "GPU", "Total");
      i.setGridStyle("minmax(200px, 2fr) 80px 80px 80px"), i.domElement.style.minWidth = "600px";
      const n = document.createElement("div");
      n.className = "list-scroll-wrapper", n.appendChild(i.domElement), this.content.appendChild(n);
      const r = document.createElement("div");
      r.className = "graph-container";
      const s = new j();
      s.addLine("fps", "var( --color-fps )"), r.append(s.domElement);
      const o = new v("Graph Stats", b(), b(), b("graph-fps-counter"));
      i.add(o);
      const a = new v(r);
      a.itemRow.childNodes[0].style.gridColumn = "1 / -1", o.add(a);
      const l = new v("Frame Stats", b(), b(), b());
      i.add(l);
      const c = new v("Miscellaneous & Idle", b(), b(), b());
      c.domElement.firstChild.style.backgroundColor = "#00ff0b1a", c.domElement.firstChild.classList.add("no-hover"), l.add(c), this.notInUse = /* @__PURE__ */ new Map(), this.frameStats = l, this.graphStats = o, this.graph = s, this.miscellaneous = c, this.currentRender = null, this.currentItem = null, this.frameItems = /* @__PURE__ */ new Map();
    }
    resolveStats(t, i) {
      const n = t.getStatsData(i.cid);
      let r = n.item;
      if (r === void 0)
        r = new v(b(), b(), b(), b()), i.name ? i.isComputeStats === !0 && (i.name = `${i.name} [ Compute ]`) : i.name = `Unnamed ${i.cid}`, r.userData.name = i.name, this.currentItem.add(r), n.item = r;
      else {
        r.userData.name = i.name, this.notInUse.has(i.cid) && (r.domElement.firstElementChild.classList.remove("alert"), this.notInUse.delete(i.cid));
        const a = i.parent.children.indexOf(i);
        (r.parent === null || r.parent.children.indexOf(r) !== a) && this.currentItem.add(r, a);
      }
      let s = r.userData.name;
      i.isComputeStats && (s += " [ Compute ]"), x(r.data[0], s), x(r.data[1], n.cpu.toFixed(2)), x(r.data[2], i.gpuNotAvailable === !0 ? "-" : n.gpu.toFixed(2)), x(r.data[3], n.total.toFixed(2));
      const o = this.currentItem;
      this.currentItem = r;
      for (const a of i.children)
        this.resolveStats(t, a);
      this.currentItem = o, this.frameItems.set(i.cid, r);
    }
    updateGraph(t) {
      this.graph.addPoint("fps", t.fps), this.graph.update();
    }
    addNotInUse(t, i) {
      i.domElement.firstElementChild.classList.add("alert"), this.notInUse.set(t, {
        item: i,
        time: performance.now()
      }), this.updateNotInUse(t);
    }
    updateNotInUse(t) {
      const { item: i, time: n } = this.notInUse.get(t), r = performance.now(), s = 5 - Math.floor((r - n) / 1e3);
      if (s >= 0) {
        const o = "*".repeat(Math.max(0, s)), a = i.domElement.querySelector(".list-item-cell .value");
        x(a, i.userData.name + " (not in use) " + o);
      } else
        i.domElement.firstElementChild.classList.remove("alert"), i.parent.remove(i), this.notInUse.delete(t);
    }
    updateText(t, i) {
      const n = new Map(this.frameItems);
      this.frameItems.clear(), this.currentItem = this.frameStats;
      for (const r of i.children)
        this.resolveStats(t, r);
      for (const [r, s] of n)
        this.frameItems.has(r) || (this.addNotInUse(r, s), n.delete(r));
      for (const r of this.notInUse.keys())
        this.updateNotInUse(r);
      x("graph-fps-counter", t.fps.toFixed() + " FPS"), x(this.frameStats.data[1], i.cpu.toFixed(2)), x(this.frameStats.data[2], i.gpu.toFixed(2)), x(this.frameStats.data[3], i.total.toFixed(2)), x(this.miscellaneous.data[1], i.miscellaneous.toFixed(2)), x(this.miscellaneous.data[2], "-"), x(this.miscellaneous.data[3], i.miscellaneous.toFixed(2)), this.currentItem = null;
    }
  }
  class ut extends R {
    constructor(t = {}) {
      super("Memory", t);
      const i = new _("Name", "Count", "Size");
      i.setGridStyle("minmax(200px, 2fr) 60px 100px"), i.domElement.style.minWidth = "300px";
      const n = document.createElement("div");
      n.className = "list-scroll-wrapper", n.appendChild(i.domElement), this.content.appendChild(n);
      const r = document.createElement("div");
      r.className = "graph-container";
      const s = new j();
      s.addLine("total", "var( --color-yellow )"), r.append(s.domElement);
      const o = new v("Graph Stats", "", "");
      i.add(o);
      const a = new v(r);
      a.itemRow.childNodes[0].style.gridColumn = "1 / -1", o.add(a), this.memoryStats = new v("Renderer Info", "", b()), this.memoryStats.domElement.firstChild.classList.add("no-hover"), i.add(this.memoryStats), this.attributes = new v("Attributes", b(), b()), this.memoryStats.add(this.attributes), this.geometries = new v("Geometries", b(), "N/A"), this.memoryStats.add(this.geometries), this.indexAttributes = new v("Index Attributes", b(), b()), this.memoryStats.add(this.indexAttributes), this.indirectStorageAttributes = new v("Indirect Storage Attributes", b(), b()), this.memoryStats.add(this.indirectStorageAttributes), this.programs = new v("Programs", b(), b()), this.memoryStats.add(this.programs), this.readbackBuffers = new v("Readback Buffers", b(), b()), this.memoryStats.add(this.readbackBuffers), this.renderTargets = new v("Render Targets", b(), "N/A"), this.memoryStats.add(this.renderTargets), this.storageAttributes = new v("Storage Attributes", b(), b()), this.memoryStats.add(this.storageAttributes), this.textures = new v("Textures", b(), b()), this.memoryStats.add(this.textures), this.graph = s;
    }
    updateGraph(t) {
      const i = t.getRenderer();
      if (!i)
        return;
      const n = i.info.memory;
      this.graph.addPoint("total", n.total), this.graph.limit === 0 && (this.graph.limit = 1), this.graph.update();
    }
    updateText(t) {
      const i = t.getRenderer();
      if (!i)
        return;
      const n = i.info.memory;
      x(this.memoryStats.data[2], S(n.total)), x(this.attributes.data[1], n.attributes.toString()), x(this.attributes.data[2], S(n.attributesSize)), x(this.geometries.data[1], n.geometries.toString()), x(this.indexAttributes.data[1], n.indexAttributes.toString()), x(this.indexAttributes.data[2], S(n.indexAttributesSize)), x(this.indirectStorageAttributes.data[1], n.indirectStorageAttributes.toString()), x(this.indirectStorageAttributes.data[2], S(n.indirectStorageAttributesSize)), x(this.programs.data[1], n.programs.toString()), x(this.programs.data[2], S(n.programsSize)), x(this.readbackBuffers.data[1], n.readbackBuffers.toString()), x(this.readbackBuffers.data[2], S(n.readbackBuffersSize)), x(this.renderTargets.data[1], n.renderTargets.toString()), x(this.storageAttributes.data[1], n.storageAttributes.toString()), x(this.storageAttributes.data[2], S(n.storageAttributesSize)), x(this.textures.data[1], n.textures.toString()), x(this.textures.data[2], S(n.texturesSize));
    }
  }
  class gt extends R {
    constructor(t = {}) {
      super("Console", t), this.filters = {
        info: !0,
        warn: !0,
        error: !0
      }, this.filterText = "", this.buildHeader(), this.logContainer = document.createElement("div"), this.logContainer.id = "console-log", this.content.appendChild(this.logContainer);
    }
    buildHeader() {
      const t = document.createElement("div");
      t.className = "console-header";
      const i = document.createElement("input");
      i.type = "text", i.className = "console-filter-input", i.placeholder = "Filter...", i.addEventListener("input", (s) => {
        this.filterText = s.target.value.toLowerCase(), this.applyFilters();
      });
      const n = document.createElement("button");
      n.className = "console-copy-button", n.title = "Copy all", n.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>', n.addEventListener("click", () => this.copyAll(n));
      const r = document.createElement("div");
      r.className = "console-buttons-group", Object.keys(this.filters).forEach((s) => {
        const o = document.createElement("label");
        o.className = "custom-checkbox", o.style.color = `var(--${s === "info" ? "text-primary" : "color-" + (s === "warn" ? "yellow" : "red")})`;
        const a = document.createElement("input");
        a.type = "checkbox", a.checked = this.filters[s], a.dataset.type = s;
        const l = document.createElement("span");
        l.className = "checkmark", o.appendChild(a), o.appendChild(l), o.append(s.charAt(0).toUpperCase() + s.slice(1)), r.appendChild(o);
      }), r.addEventListener("change", (s) => {
        const o = s.target.dataset.type;
        o in this.filters && (this.filters[o] = s.target.checked, this.applyFilters());
      }), r.appendChild(n), t.appendChild(i), t.appendChild(r), this.content.appendChild(t);
    }
    applyFilters() {
      this.logContainer.querySelectorAll(".log-message").forEach((t) => {
        const i = t.dataset.type, n = t.dataset.rawText.toLowerCase(), r = this.filters[i], s = n.includes(this.filterText);
        t.classList.toggle("hidden", !(r && s));
      });
    }
    copyAll(t) {
      const i = this.logContainer.ownerDocument.defaultView.getSelection(), n = i.toString(), r = n && this.logContainer.contains(i.anchorNode);
      let s;
      if (r)
        s = n;
      else {
        const o = this.logContainer.querySelectorAll(".log-message:not(.hidden)");
        s = Array.from(o).map((a) => a.dataset.rawText).join(`
`);
      }
      navigator.clipboard.writeText(s), t.classList.add("copied"), setTimeout(() => t.classList.remove("copied"), 350);
    }
    _getIcon(t, i) {
      let n;
      return i === "tip" ? n = "💭" : i === "tsl" ? n = "✨" : i === "webgpurenderer" ? n = "🎨" : t === "warn" ? n = "⚠️" : t === "error" ? n = "🔴" : t === "info" && (n = "ℹ️"), n;
    }
    _formatMessage(t, i) {
      const n = document.createDocumentFragment(), r = i.match(/^([\w\.]+:\s)/);
      let s = i;
      if (r) {
        const a = r[0], l = a.slice(0, -2).split("."), c = (l.length > 1 ? l[l.length - 1] : l[0]) + ":", h = this._getIcon(t, c.split(":")[0].toLowerCase());
        n.appendChild(document.createTextNode(h + " "));
        const m = document.createElement("span");
        m.className = "log-prefix", m.textContent = c, n.appendChild(m), s = i.substring(a.length);
      }
      const o = s.split(/(".*?"|'.*?'|`.*?`)/g).map((a) => a.trim()).filter(Boolean);
      return o.forEach((a, l) => {
        if (/^("|'|`)/.test(a)) {
          const c = document.createElement("span");
          c.className = "log-code", c.textContent = a.slice(1, -1), n.appendChild(c);
        } else
          l > 0 && (a = " " + a), l < o.length - 1 && (a += " "), n.appendChild(document.createTextNode(a));
      }), n;
    }
    addMessage(t, i) {
      const n = document.createElement("div");
      n.className = `log-message ${t}`, n.dataset.type = t, n.dataset.rawText = i, n.appendChild(this._formatMessage(t, i));
      const r = this.filters[t], s = i.toLowerCase().includes(this.filterText);
      n.classList.toggle("hidden", !(r && s)), this.logContainer.appendChild(n), this.logContainer.scrollTop = this.logContainer.scrollHeight, this.logContainer.children.length > 200 && this.logContainer.removeChild(this.logContainer.firstChild);
    }
  }
  class F extends $ {
    constructor() {
      super(), this.domElement = document.createElement("div"), this.domElement.className = "param-control", this._onChangeFunction = null, this.addEventListener("change", (t) => {
        requestAnimationFrame(() => {
          this._onChangeFunction && this._onChangeFunction(t.value);
        });
      });
    }
    setValue() {
      return this.dispatchChange(), this;
    }
    getValue() {
      return null;
    }
    dispatchChange() {
      this.dispatchEvent({
        type: "change",
        value: this.getValue()
      });
    }
    onChange(t) {
      return this._onChangeFunction = t, this;
    }
  }
  class X extends F {
    constructor({ value: t = 0, step: i = 0.1, min: n = -1 / 0, max: r = 1 / 0 }) {
      super(), this.input = document.createElement("input"), this.input.type = "number", this.input.value = t, this.input.step = i, this.input.min = n, this.input.max = r, this.input.addEventListener("change", this._onChangeValue.bind(this)), this.domElement.appendChild(this.input), this.addDragHandler();
    }
    _onChangeValue() {
      const t = parseFloat(this.input.value), i = parseFloat(this.input.min), n = parseFloat(this.input.max);
      t > n ? this.input.value = n : t < i ? this.input.value = i : isNaN(t) && (this.input.value = i), this.dispatchChange();
    }
    addDragHandler() {
      let t = !1, i, n;
      this.input.addEventListener("mousedown", (r) => {
        t = !0, i = r.clientY, n = parseFloat(this.input.value), document.body.style.cursor = "ns-resize";
      }), document.addEventListener("mousemove", (r) => {
        if (t) {
          const s = i - r.clientY, o = parseFloat(this.input.step) || 1, a = parseFloat(this.input.min), l = parseFloat(this.input.max);
          let c = o;
          !isNaN(l) && isFinite(a) && (c = (l - a) / 100);
          const h = s * c;
          let m = n + h;
          m = Math.max(a, Math.min(m, l));
          const p = (String(o).split(".")[1] || []).length;
          this.input.value = m.toFixed(p), this.input.dispatchEvent(new Event("input")), this.dispatchChange();
        }
      }), document.addEventListener("mouseup", () => {
        t && (t = !1, document.body.style.cursor = "default");
      });
    }
    setValue(t) {
      return this.input.value = t, super.setValue(t);
    }
    getValue() {
      return parseFloat(this.input.value);
    }
  }
  class bt extends F {
    constructor({ value: t = !1 }) {
      super();
      const i = document.createElement("label");
      i.className = "custom-checkbox";
      const n = document.createElement("input");
      n.type = "checkbox", n.checked = t, this.checkbox = n;
      const r = document.createElement("span");
      r.className = "checkmark", i.appendChild(n), i.appendChild(r), this.domElement.appendChild(i), n.addEventListener("change", () => {
        this.dispatchChange();
      });
    }
    setValue(t) {
      return this.checkbox.checked = t, super.setValue(t);
    }
    getValue() {
      return this.checkbox.checked;
    }
  }
  class ft extends F {
    constructor({ value: t = 0, min: i = 0, max: n = 1, step: r = 0.01 }) {
      super(), this.slider = document.createElement("input"), this.slider.type = "range", this.slider.min = i, this.slider.max = n, this.slider.step = r;
      const s = new X({
        value: t,
        min: i,
        max: n,
        step: r
      });
      this.numberInput = s.input, this.numberInput.style.flexBasis = "80px", this.numberInput.style.flexShrink = "0", this.slider.value = t, this.domElement.append(this.slider, this.numberInput), this.slider.addEventListener("input", () => {
        this.numberInput.value = this.slider.value, this.dispatchChange();
      }), s.addEventListener("change", () => {
        this.slider.value = parseFloat(this.numberInput.value), this.dispatchChange();
      });
    }
    setValue(t) {
      return this.slider.value = t, this.numberInput.value = t, super.setValue(t);
    }
    getValue() {
      return parseFloat(this.slider.value);
    }
    step(t) {
      return this.slider.step = t, this.numberInput.step = t, this;
    }
  }
  class xt extends F {
    constructor({ options: t = [], value: i = "" }) {
      super();
      const n = document.createElement("select"), r = (s, o) => {
        const a = document.createElement("option");
        return a.value = s, a.textContent = s, o == i && (a.selected = !0), n.appendChild(a), a;
      };
      Array.isArray(t) ? t.forEach((s) => r(s, s)) : Object.entries(t).forEach(([s, o]) => r(s, o)), this.domElement.appendChild(n), n.addEventListener("change", () => {
        this.dispatchChange();
      }), this.options = t, this.select = n;
    }
    getValue() {
      const t = this.options;
      return Array.isArray(t) ? t[this.select.selectedIndex] : t[this.select.value];
    }
  }
  class vt extends F {
    constructor({ value: t = "#ffffff" }) {
      super();
      const i = document.createElement("input");
      i.type = "color", i.value = this._getColorHex(t), this.colorInput = i, this._value = t, i.addEventListener("input", () => {
        const n = i.value;
        this._value.isColor ? this._value.setHex(parseInt(n.slice(1), 16)) : this._value = n, this.dispatchChange();
      }), this.domElement.appendChild(i);
    }
    _getColorHex(t) {
      return t.isColor && (t = t.getHex()), typeof t == "number" ? t = `#${t.toString(16)}` : t[0] !== "#" && (t = "#" + t), t;
    }
    getValue() {
      let t = this._value;
      return typeof t == "string" && (t = parseInt(t.slice(1), 16)), t;
    }
  }
  class yt extends F {
    constructor({ text: t = "Button", value: i = () => {
    } }) {
      super();
      const n = document.createElement("button");
      n.textContent = t, n.onclick = i, this.domElement.appendChild(n);
    }
  }
  class wt extends F {
    constructor({ value: t = "" }) {
      super();
      const i = document.createElement("input");
      i.type = "text", i.value = t, this.input = i, i.addEventListener("input", () => {
        this.dispatchChange();
      }), this.domElement.appendChild(i);
    }
    setValue(t) {
      return this.input.value = t, super.setValue(t);
    }
    getValue() {
      return this.input.value;
    }
  }
  class O {
    constructor(t, i) {
      this.parameters = t, this.name = i, this.paramList = new v(i), this.objects = [];
    }
    close() {
      return this.paramList.close(), this;
    }
    add(t, i, ...n) {
      const r = typeof t[i];
      let s = null;
      return typeof n[0] == "object" ? s = this.addSelect(t, i, n[0]) : r === "number" ? n.length >= 2 ? s = this.addSlider(t, i, ...n) : s = this.addNumber(t, i, ...n) : r === "boolean" ? s = this.addBoolean(t, i) : r === "string" ? s = this.addString(t, i) : r === "function" && (s = this.addButton(t, i, ...n)), s;
    }
    _addParameter(t, i, n, r) {
      n.name = (s) => (r.data[0].textContent = s, n), n.listen = () => {
        const s = () => {
          const o = n.getValue(), a = t[i];
          o !== a && n.setValue(a), requestAnimationFrame(s);
        };
        return requestAnimationFrame(s), n;
      }, this._registerParameter(t, i, n, r);
    }
    _registerParameter(t, i, n, r) {
      this.objects.push({
        object: t,
        key: i,
        editor: n,
        subItem: r
      });
    }
    addString(t, i) {
      const n = t[i], r = new wt({
        value: n
      });
      r.addEventListener("change", ({ value: a }) => {
        t[i] = a;
      });
      const s = b();
      s.textContent = i;
      const o = new v(s, r.domElement);
      return this.paramList.add(o), o.domElement.firstChild.classList.add("actionable"), this._addParameter(t, i, r, o), r;
    }
    addFolder(t) {
      const i = new O(this.parameters, t);
      return this.paramList.add(i.paramList), i;
    }
    addBoolean(t, i) {
      const n = t[i], r = new bt({
        value: n
      });
      r.addEventListener("change", ({ value: l }) => {
        t[i] = l;
      });
      const s = b();
      s.textContent = i;
      const o = new v(s, r.domElement);
      this.paramList.add(o);
      const a = o.domElement.firstChild;
      return a.classList.add("actionable"), a.addEventListener("click", (l) => {
        if (l.target.closest("label"))
          return;
        const c = a.querySelector('input[type="checkbox"]');
        c && (c.checked = !c.checked, c.dispatchEvent(new Event("change")));
      }), this._addParameter(t, i, r, o), r;
    }
    addSelect(t, i, n) {
      const r = t[i], s = new xt({
        options: n,
        value: r
      });
      s.addEventListener("change", ({ value: l }) => {
        t[i] = l;
      });
      const o = b();
      o.textContent = i;
      const a = new v(o, s.domElement);
      return this.paramList.add(a), a.domElement.firstChild.classList.add("actionable"), this._addParameter(t, i, s, a), s;
    }
    addColor(t, i) {
      const n = t[i], r = new vt({
        value: n
      });
      r.addEventListener("change", ({ value: a }) => {
        t[i] = a;
      });
      const s = b();
      s.textContent = i;
      const o = new v(s, r.domElement);
      return this.paramList.add(o), o.domElement.firstChild.classList.add("actionable"), this._addParameter(t, i, r, o), r;
    }
    addSlider(t, i, n = 0, r = 1, s = 0.01) {
      const o = t[i], a = new ft({
        value: o,
        min: n,
        max: r,
        step: s
      });
      a.addEventListener("change", ({ value: h }) => {
        t[i] = h;
      });
      const l = b();
      l.textContent = i;
      const c = new v(l, a.domElement);
      return this.paramList.add(c), c.domElement.firstChild.classList.add("actionable"), this._addParameter(t, i, a, c), a;
    }
    addNumber(t, i, ...n) {
      const r = t[i], [s, o] = n, a = new X({
        value: r,
        min: s,
        max: o
      });
      a.addEventListener("change", ({ value: h }) => {
        t[i] = h;
      });
      const l = b();
      l.textContent = i;
      const c = new v(l, a.domElement);
      return this.paramList.add(c), c.domElement.firstChild.classList.add("actionable"), this._addParameter(t, i, a, c), a;
    }
    addButton(t, i) {
      const n = t[i], r = new yt({
        text: i,
        value: n
      });
      r.addEventListener("change", ({ value: o }) => {
        t[i] = o;
      });
      const s = new v(r.domElement);
      return s.itemRow.childNodes[0].style.gridColumn = "1 / -1", this.paramList.add(s), s.domElement.firstChild.classList.add("actionable"), r.name = (o) => (r.domElement.childNodes[0].textContent = o, r), this._registerParameter(t, i, r, s), r;
    }
  }
  class Y extends R {
    constructor(t = {}) {
      super(t.name || "Parameters", t);
      const i = new _("Property", "Value");
      i.domElement.classList.add("parameters"), i.setGridStyle(".5fr 1fr"), i.domElement.style.minWidth = "300px";
      const n = document.createElement("div");
      n.className = "list-scroll-wrapper", n.appendChild(i.domElement), this.content.appendChild(n), this.paramList = i, this.groups = [];
    }
    createGroup(t) {
      const i = new O(this, t);
      return this.paramList.add(i.paramList), this.groups.push(i), i;
    }
  }
  const Z = "../extensions/extensions.json", Q = G.prototype.init;
  function J(d) {
    d ? G.prototype.init = async function() {
      if (this.backend.isWebGLBackend !== !0) {
        const t = this.backend.parameters;
        this.backend = new jt(t);
      }
      return Q.call(this);
    } : G.prototype.init = Q;
  }
  let T = null;
  function K() {
    if (T !== null)
      return T;
    const d = P("settings");
    return T = {
      forceWebGL: d.forceWebGL !== void 0 ? d.forceWebGL : !1,
      captureStackTrace: d.captureStackTrace !== void 0 ? d.captureStackTrace : !1,
      activeExtensions: d.activeExtensions !== void 0 ? d.activeExtensions : {}
    }, T.forceWebGL && J(!0), T.captureStackTrace && (st.captureStackTrace = !0), T;
  }
  function U() {
    D("settings", {
      forceWebGL: T.forceWebGL,
      captureStackTrace: T.captureStackTrace,
      activeExtensions: T.activeExtensions
    });
  }
  K();
  class kt extends Y {
    constructor() {
      super({
        name: "Settings"
      }), this.extensions = {};
      const t = K(), i = this.createGroup("Renderer");
      i.add(t, "forceWebGL").name("Force WebGL").onChange((n) => {
        J(n), U(), location.reload();
      }), i.add(t, "captureStackTrace").name("Capture Stack Trace").onChange((n) => {
        st.captureStackTrace = n, U(), location.reload();
      });
    }
    init() {
      const t = this.createGroup("Extensions");
      this._getExtensions().then((i) => {
        for (const n of i)
          n.active = !1, n.loaded = !1, n.tab = null, this.extensions[n.name] = n, n.ui = t.add({
            [n.name]: !1
          }, n.name).onChange(async (r) => {
            this.setActiveExtension(n.name, r), r ? T.activeExtensions[n.name] = {
              name: n.name,
              url: n.url
            } : delete T.activeExtensions[n.name], this._updateExtensionUI(n), U();
          }), T.activeExtensions[n.name] !== void 0 && n.ui.setValue(!0);
      });
    }
    async setActiveExtension(t, i) {
      const n = this.extensions[t], r = this.inspector;
      n && (i ? await this._loadExtension(r, n) : await this._unloadExtension(r, n));
    }
    _updateExtensionUI(t) {
      t.active && T.activeExtensions[t.name] === void 0 ? (t.ui.checkbox.checked = !0, t.ui.domElement.style.setProperty("--accent-color", "var(--color-green)")) : t.ui.domElement.style.removeProperty("--accent-color");
    }
    async _unloadExtension(t, i) {
      i.active !== !1 && (t.removeTab(i.tab), i.active = !1, i.loaded = !1, i.tab = null, this._updateExtensionUI(i), this.dispatchEvent({
        type: "extensionremoved",
        name: i.name
      }));
    }
    async _loadExtension(t, i) {
      if (i.active === !0)
        return;
      i.active = !0;
      const n = await import(new URL(i.url, new URL(Z, import.meta.url)).href).then(async (a) => (await a.__tla, a)), r = Object.keys(n), s = n[r[0]], o = new s();
      t.addTab(o), i.loaded = !0, i.tab = o, this._updateExtensionUI(i), this.dispatchEvent({
        type: "extensionadded",
        name: i.name,
        tab: o
      });
    }
    async _getExtensions() {
      const t = new URL(Z, import.meta.url);
      return await fetch(t).then((i) => i.json());
    }
  }
  e.BRDF_GGX, e.BRDF_Lambert, e.BasicPointShadowFilter, e.BasicShadowFilter, e.Break, e.Const, e.Continue, e.DFGLUT, e.D_GGX, e.Discard, e.EPSILON, e.F_Schlick;
  const Ct = e.Fn;
  e.INFINITY, e.If, e.Loop, e.NodeAccess, e.NodeShaderStage, e.NodeType, e.NodeUpdateType, e.PCFShadowFilter, e.PCFSoftShadowFilter, e.PI, e.PI2, e.TWO_PI, e.HALF_PI, e.PointShadowFilter, e.Return, e.Schlick_to_F0, e.ShaderNode, e.Stack, e.Switch, e.TBNViewMatrix, e.VSMShadowFilter, e.V_GGX_SmithCorrelated, e.Var, e.VarIntent, e.abs, e.acesFilmicToneMapping, e.acos, e.acosh, e.add, e.addMethodChaining, e.addNodeElement, e.agxToneMapping, e.all, e.alphaT, e.and, e.anisotropy, e.anisotropyB, e.anisotropyT, e.any, e.append, e.array, e.arrayBuffer, e.asin, e.asinh, e.assign, e.atan, e.atanh, e.atomicAdd, e.atomicAnd, e.atomicFunc, e.atomicLoad, e.atomicMax, e.atomicMin, e.atomicOr, e.atomicStore, e.atomicSub, e.atomicXor, e.attenuationColor, e.attenuationDistance, e.attribute, e.attributeArray, e.backgroundBlurriness, e.backgroundIntensity, e.backgroundRotation, e.batch, e.bentNormalView, e.billboarding, e.bitAnd, e.bitNot, e.bitOr, e.bitXor, e.bitangentGeometry, e.bitangentLocal, e.bitangentView, e.bitangentWorld, e.bitcast, e.blendBurn, e.blendColor, e.blendDodge, e.blendOverlay, e.blendScreen, e.blur, e.bool, e.buffer, e.bufferAttribute, e.bumpMap, e.builtin, e.builtinAOContext, e.builtinShadowContext, e.bvec2, e.bvec3, e.bvec4, e.bypass, e.cache, e.call, e.cameraFar, e.cameraIndex, e.cameraNear, e.cameraNormalMatrix, e.cameraPosition, e.cameraProjectionMatrix, e.cameraProjectionMatrixInverse, e.cameraViewMatrix, e.cameraViewport, e.cameraWorldMatrix, e.cbrt, e.cdl, e.ceil, e.checker, e.cineonToneMapping, e.clamp, e.clearcoat, e.clearcoatNormalView, e.clearcoatRoughness, e.clipSpace, e.code, e.color, e.colorSpaceToWorking, e.colorToDirection, e.compute, e.computeKernel, e.computeSkinning, e.context, e.convert, e.convertColorSpace, e.convertToTexture, e.countLeadingZeros, e.countOneBits, e.countTrailingZeros, e.cos, e.cosh, e.cross, e.cubeTexture, e.cubeTextureBase, e.dFdx, e.dFdy, e.dashSize, e.debug, e.decrement, e.decrementBefore, e.defaultBuildStages, e.defaultShaderStages, e.defined, e.degrees, e.deltaTime, e.densityFog, e.densityFogFactor, e.depth, e.depthPass, e.determinant, e.difference, e.diffuseColor, e.directPointLight, e.directionToColor, e.directionToFaceDirection, e.dispersion, e.distance, e.div, e.dot, e.drawIndex, e.dynamicBufferAttribute, e.element, e.emissive, e.equal, e.equirectUV, e.exp, e.exp2, e.exponentialHeightFogFactor, e.expression, e.faceDirection, e.faceForward, e.faceforward, e.float, e.floatBitsToInt, e.floatBitsToUint, e.floor, e.fog, e.fract, e.frameGroup, e.frameId, e.frontFacing, e.fwidth, e.gain, e.gapSize, e.getConstNodeType, e.getCurrentStack, e.getDirection, e.getDistanceAttenuation, e.getGeometryRoughness, e.getNormalFromDepth, e.interleavedGradientNoise, e.vogelDiskSample, e.getParallaxCorrectNormal, e.getRoughness, e.getScreenPosition, e.getShIrradianceAt, e.getShadowMaterial, e.getShadowRenderObjectFunction, e.getTextureIndex, e.getViewPosition, e.globalId, e.glsl, e.glslFn, e.grayscale, e.greaterThan, e.greaterThanEqual, e.hash, e.highpModelNormalViewMatrix, e.highpModelViewMatrix, e.hue, e.increment, e.incrementBefore, e.instance, e.instanceIndex, e.instancedArray, e.instancedBufferAttribute, e.instancedDynamicBufferAttribute, e.instancedMesh, e.int, e.intBitsToFloat, e.inverse, e.inverseSqrt, e.inversesqrt, e.invocationLocalIndex, e.invocationSubgroupIndex, e.ior, e.iridescence, e.iridescenceIOR, e.iridescenceThickness, e.ivec2, e.ivec3, e.ivec4, e.js, e.label, e.length, e.lengthSq, e.lessThan, e.lessThanEqual, e.lightPosition, e.lightProjectionUV, e.lightShadowMatrix, e.lightTargetDirection, e.lightTargetPosition, e.lightViewPosition, e.lightingContext, e.lights, e.linearDepth, e.linearToneMapping, e.localId, e.log, e.log2, e.logarithmicDepthToViewZ, e.luminance, e.mat2, e.mat3, e.mat4, e.matcapUV, e.materialAO, e.materialAlphaTest, e.materialAnisotropy, e.materialAnisotropyVector, e.materialAttenuationColor, e.materialAttenuationDistance, e.materialClearcoat, e.materialClearcoatNormal, e.materialClearcoatRoughness, e.materialColor, e.materialDispersion, e.materialEmissive, e.materialEnvIntensity, e.materialEnvRotation, e.materialIOR, e.materialIridescence, e.materialIridescenceIOR, e.materialIridescenceThickness, e.materialLightMap, e.materialLineDashOffset, e.materialLineDashSize, e.materialLineGapSize, e.materialLineScale, e.materialLineWidth, e.materialMetalness, e.materialNormal, e.materialOpacity, e.materialPointSize, e.materialReference, e.materialReflectivity, e.materialRefractionRatio, e.materialRotation, e.materialRoughness, e.materialSheen, e.materialSheenRoughness, e.materialShininess, e.materialSpecular, e.materialSpecularColor, e.materialSpecularIntensity, e.materialSpecularStrength, e.materialThickness, e.materialTransmission, e.max, e.maxMipLevel, e.mediumpModelViewMatrix, e.metalness, e.min, e.mix, e.mixElement, e.mod, e.modInt, e.modelDirection, e.modelNormalMatrix, e.modelPosition, e.modelRadius, e.modelScale, e.modelViewMatrix, e.modelViewPosition, e.modelViewProjection, e.modelWorldMatrix, e.modelWorldMatrixInverse, e.morphReference, e.mrt, e.mul, e.mx_aastep, e.mx_add, e.mx_atan2, e.mx_cell_noise_float, e.mx_contrast, e.mx_divide, e.mx_fractal_noise_float, e.mx_fractal_noise_vec2, e.mx_fractal_noise_vec3, e.mx_fractal_noise_vec4, e.mx_frame, e.mx_heighttonormal, e.mx_hsvtorgb, e.mx_ifequal, e.mx_ifgreater, e.mx_ifgreatereq, e.mx_invert, e.mx_modulo, e.mx_multiply, e.mx_noise_float, e.mx_noise_vec3, e.mx_noise_vec4, e.mx_place2d, e.mx_power, e.mx_ramp4, e.mx_ramplr, e.mx_ramptb, e.mx_rgbtohsv, e.mx_rotate2d, e.mx_rotate3d, e.mx_safepower, e.mx_separate, e.mx_splitlr, e.mx_splittb, e.mx_srgb_texture_to_lin_rec709, e.mx_subtract, e.mx_timer, e.mx_transform_uv, e.mx_unifiednoise2d, e.mx_unifiednoise3d, e.mx_worley_noise_float, e.mx_worley_noise_vec2, e.mx_worley_noise_vec3, e.negate, e.neutralToneMapping, e.nodeArray, e.nodeImmutable, e.nodeObject, e.nodeObjectIntent, e.nodeObjects, e.nodeProxy, e.nodeProxyIntent, e.normalFlat, e.normalGeometry, e.normalLocal, e.normalMap, e.normalView, e.normalViewGeometry, e.normalWorld, e.normalWorldGeometry, e.normalize, e.not, e.notEqual, e.numWorkgroups, e.objectDirection, e.objectGroup, e.objectPosition, e.objectRadius, e.objectScale, e.objectViewPosition, e.objectWorldMatrix, e.OnBeforeObjectUpdate, e.OnBeforeMaterialUpdate, e.OnObjectUpdate;
  const Tt = e.OnMaterialUpdate;
  e.oneMinus, e.or, e.orthographicDepthToViewZ, e.oscSawtooth, e.oscSine, e.oscSquare, e.oscTriangle, e.output, e.outputStruct, e.overloadingFn, e.packHalf2x16, e.packSnorm2x16, e.packUnorm2x16, e.parabola, e.parallaxDirection, e.parallaxUV, e.parameter, e.pass, e.passTexture, e.pcurve, e.perspectiveDepthToViewZ, e.pmremTexture, e.pointShadow, e.pointUV, e.pointWidth, e.positionGeometry, e.positionLocal, e.positionPrevious, e.positionView, e.positionViewDirection, e.positionWorld, e.positionWorldDirection, e.posterize, e.pow, e.pow2, e.pow3, e.pow4, e.premultiplyAlpha, e.property, e.radians, e.rand, e.range, e.rangeFog, e.rangeFogFactor, e.reciprocal, e.reference, e.referenceBuffer, e.reflect, e.reflectVector, e.reflectView, e.reflector, e.refract, e.refractVector, e.refractView, e.reinhardToneMapping, e.remap, e.remapClamp, e.renderGroup;
  const Et = e.renderOutput;
  e.rendererReference, e.replaceDefaultUV, e.rotate, e.rotateUV, e.roughness, e.round, e.rtt, e.sRGBTransferEOTF, e.sRGBTransferOETF, e.sample, e.sampler, e.samplerComparison, e.saturate, e.saturation, e.screen, e.screenCoordinate, e.screenDPR, e.screenSize;
  const Lt = e.screenUV;
  e.select, e.setCurrentStack, e.setName, e.shaderStages, e.shadow, e.shadowPositionWorld, e.shapeCircle, e.sharedUniformGroup, e.sheen, e.sheenRoughness, e.shiftLeft, e.shiftRight, e.shininess, e.sign, e.sin, e.sinh, e.sinc, e.skinning, e.smoothstep, e.smoothstepElement, e.specularColor, e.specularF90, e.spherizeUV, e.split, e.spritesheetUV, e.sqrt, e.stack;
  const V = e.step;
  e.stepElement, e.storage, e.storageBarrier, e.storageTexture, e.string, e.struct, e.sub, e.subgroupAdd, e.subgroupAll, e.subgroupAnd, e.subgroupAny, e.subgroupBallot, e.subgroupBroadcast, e.subgroupBroadcastFirst, e.subBuild, e.subgroupElect, e.subgroupExclusiveAdd, e.subgroupExclusiveMul, e.subgroupInclusiveAdd, e.subgroupInclusiveMul, e.subgroupIndex, e.subgroupMax, e.subgroupMin, e.subgroupMul, e.subgroupOr, e.subgroupShuffle, e.subgroupShuffleDown, e.subgroupShuffleUp, e.subgroupShuffleXor, e.subgroupSize, e.subgroupXor, e.tan, e.tanh, e.tangentGeometry, e.tangentLocal, e.tangentView, e.tangentWorld, e.texture, e.texture3D, e.textureBarrier, e.textureBicubic, e.textureBicubicLevel, e.textureCubeUV, e.textureLoad, e.textureSize, e.textureLevel, e.textureStore, e.thickness, e.time, e.toneMapping, e.toneMappingExposure, e.toonOutlinePass, e.transformDirection, e.transformNormal, e.transformNormalToView, e.transformedClearcoatNormalView, e.transformedNormalView, e.transformedNormalWorld, e.transmission, e.transpose, e.triNoise3D, e.triplanarTexture, e.triplanarTextures, e.trunc, e.uint, e.uintBitsToFloat;
  const St = e.uniform;
  e.uniformArray, e.uniformCubeTexture, e.uniformGroup, e.uniformFlow, e.uniformTexture, e.unpackHalf2x16, e.unpackSnorm2x16, e.unpackUnorm2x16, e.unpremultiplyAlpha, e.userData, e.uv, e.uvec2, e.uvec3, e.uvec4, e.varying, e.varyingProperty;
  const It = e.vec2, tt = e.vec3, Bt = e.vec4;
  e.vectorComponents, e.velocity, e.vertexColor, e.vertexIndex, e.vertexStage, e.vibrance, e.viewZToLogarithmicDepth, e.viewZToOrthographicDepth, e.viewZToPerspectiveDepth, e.viewZToReversedOrthographicDepth, e.viewZToReversedPerspectiveDepth, e.viewport, e.viewportCoordinate, e.viewportDepthTexture, e.viewportLinearDepth, e.viewportMipTexture, e.viewportOpaqueMipTexture, e.viewportResolution, e.viewportSafeUV, e.viewportSharedTexture, e.viewportSize, e.viewportTexture, e.viewportUV, e.wgsl, e.wgslFn, e.workgroupArray, e.workgroupBarrier, e.workgroupId, e.workingToColorSpace, e.xor;
  const Ft = Ct(([d, t]) => {
    const i = St(0);
    Tt(() => {
      const { width: o, height: a } = t.value;
      i.value = o / a;
    });
    const n = d.sub(0.5), r = It(n.x.div(i), n.y).add(0.5), s = V(0, r.x).mul(V(r.x, 1)).mul(V(0, r.y)).mul(V(r.y, 1));
    return tt(r, s);
  });
  class Mt extends R {
    constructor(t = {}) {
      super("Viewer", t);
      const i = new _("Viewer", "Name");
      i.setGridStyle("150px minmax(200px, 2fr)"), i.domElement.style.minWidth = "400px";
      const n = document.createElement("div");
      n.className = "list-scroll-wrapper", n.appendChild(i.domElement), this.content.appendChild(n);
      const r = new v("Nodes");
      i.add(r), this.itemLibrary = /* @__PURE__ */ new Map(), this.folderLibrary = /* @__PURE__ */ new Map(), this.canvasNodes = /* @__PURE__ */ new Map(), this.currentDataList = [], this.nodeList = i, this.nodes = r;
    }
    getFolder(t) {
      let i = this.folderLibrary.get(t);
      return i === void 0 && (i = new v(t), this.folderLibrary.set(t, i), this.nodeList.add(i)), i;
    }
    addNodeItem(t) {
      let i = this.itemLibrary.get(t.id);
      if (i === void 0) {
        const n = t.name, r = t.canvasTarget.domElement;
        i = new v(r, n), i.itemRow.children[1].style["justify-content"] = "flex-start", this.itemLibrary.set(t.id, i);
      }
      return i;
    }
    getCanvasDataByNode(t, i) {
      let n = this.canvasNodes.get(i);
      if (n === void 0) {
        const r = document.createElement("canvas"), s = new Wt(r);
        s.setPixelRatio(window.devicePixelRatio), s.setSize(140, 140);
        const o = i.id, { path: a, name: l } = ht(pt(i.getName() || "(unnamed)")), c = i.context({
          getUV: (u) => {
            const g = Ft(Lt, u), f = g.xy, C = g.z;
            return f.mul(C);
          }
        });
        let h = Bt(tt(c), 1);
        h = Et(h, nt, t.outputColorSpace), h = h.context({
          inspector: !0
        });
        const m = new _t();
        m.outputNode = h;
        const p = new Vt(m);
        p.name = "Viewer - " + l, n = {
          id: o,
          name: l,
          path: a,
          node: i,
          quad: p,
          canvasTarget: s,
          material: m
        }, this.canvasNodes.set(i, n);
      }
      return n;
    }
    update(t) {
      const i = t.getRenderer(), n = t.getNodes();
      if (n.length > 0) {
        if (!i.backend.isWebGPUBackend) {
          t.resolveConsoleOnce("warn", "Inspector: Viewer is only available with WebGPU.");
          return;
        }
        this.isVisible || this.show();
      }
      if (!this.isActive)
        return;
      const r = n.map((a) => this.getCanvasDataByNode(i, a)), s = [
        ...this.currentDataList
      ];
      for (const a of s)
        if (this.itemLibrary.has(a.id) && r.indexOf(a) === -1) {
          const l = this.itemLibrary.get(a.id), c = l.parent;
          c.remove(l), this.folderLibrary.has(c.data[0]) && c.children.length === 0 && (c.parent.remove(c), this.folderLibrary.delete(c.data[0])), this.itemLibrary.delete(a.id);
        }
      const o = {};
      for (const a of r) {
        const l = this.addNodeItem(a), c = i.getCanvasTarget(), h = a.path;
        if (h) {
          const p = this.getFolder(h);
          o[h] === void 0 && (o[h] = 0), (p.parent === null || l.parent !== p || p.children.indexOf(l) !== o[h]) && p.add(l), o[h]++;
        } else
          l.parent || this.nodes.add(l);
        this.currentDataList = r;
        const m = rt.resetRendererState(i);
        i.toneMapping = nt, i.outputColorSpace = Ht, i.setCanvasTarget(a.canvasTarget), a.quad.render(i), i.setCanvasTarget(c), rt.restoreRendererState(i, m);
      }
    }
  }
  const et = 500, it = 60;
  class zt extends R {
    constructor(t = {}) {
      super("Timeline", t), this.isRecording = !1, this.frames = [], this.baseTriangles = 0, this.currentFrame = null, this.isHierarchicalView = !0, this.callBlocks = /* @__PURE__ */ new WeakMap(), this.fallbackBlocks = [], this.originalBackend = null, this.originalMethods = /* @__PURE__ */ new Map(), this.renderer = null, this.graph = new j(et), this.graph.addLine("fps", "var( --color-fps )"), this.graph.addLine("calls", "var( --color-call )"), this.graph.addLine("triangles", "var( --color-red )");
      const i = document.createElement("div");
      i.className = "list-scroll-wrapper", this.scrollWrapper = i, this.content.appendChild(i), this.buildHeader(), this.buildUI(), window.addEventListener("resize", () => {
        !this.isRecording && this.frames.length > 0 && this.renderSlider();
      });
    }
    buildHeader() {
      const t = document.createElement("div");
      t.className = "console-header", this.recordButton = document.createElement("button"), this.recordButton.className = "console-copy-button", this.recordButton.title = "Record", this.recordButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>', this.recordButton.style.padding = "0 10px", this.recordButton.style.lineHeight = "24px", this.recordButton.style.display = "flex", this.recordButton.style.alignItems = "center", this.recordButton.addEventListener("click", () => this.toggleRecording());
      const i = document.createElement("button");
      i.className = "console-copy-button", i.title = "Clear", i.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>', i.style.padding = "0 10px", i.style.lineHeight = "24px", i.style.display = "flex", i.style.alignItems = "center", i.addEventListener("click", () => this.clear()), this.viewModeButton = document.createElement("button"), this.viewModeButton.className = "console-copy-button", this.viewModeButton.title = "Toggle View Mode", this.viewModeButton.textContent = "Mode: Hierarchy", this.viewModeButton.style.padding = "0 10px", this.viewModeButton.style.lineHeight = "24px", this.viewModeButton.addEventListener("click", () => {
        this.isHierarchicalView = !this.isHierarchicalView, this.viewModeButton.textContent = this.isHierarchicalView ? "Mode: Hierarchy" : "Mode: Counts", this.selectedFrameIndex !== void 0 && this.selectedFrameIndex !== -1 && this.selectFrame(this.selectedFrameIndex);
      }), this.recordRefreshButton = document.createElement("button"), this.recordRefreshButton.className = "console-copy-button", this.recordRefreshButton.title = "Refresh & Record", this.recordRefreshButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>', this.recordRefreshButton.style.padding = "0 10px", this.recordRefreshButton.style.lineHeight = "24px", this.recordRefreshButton.style.display = "flex", this.recordRefreshButton.style.alignItems = "center", this.recordRefreshButton.addEventListener("click", () => {
        const s = P("timeline");
        s.recording = !0, D("timeline", s), window.location.reload();
      }), this.exportButton = document.createElement("button"), this.exportButton.className = "console-copy-button", this.exportButton.title = "Export", this.exportButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>', this.exportButton.style.padding = "0 10px", this.exportButton.style.lineHeight = "24px", this.exportButton.style.display = "flex", this.exportButton.style.alignItems = "center", this.exportButton.addEventListener("click", () => this.exportData());
      const n = document.createElement("div");
      n.className = "console-buttons-group", n.appendChild(this.viewModeButton), n.appendChild(this.recordButton), n.appendChild(this.recordRefreshButton), n.appendChild(this.exportButton), n.appendChild(i), t.style.display = "flex", t.style.justifyContent = "space-between", t.style.padding = "6px", t.style.borderBottom = "1px solid var(--border-color)";
      const r = document.createElement("div");
      r.textContent = "Backend Calls", r.style.display = "flex", r.style.alignItems = "center", r.style.color = "var(--text-primary)", r.style.alignSelf = "center", r.style.paddingLeft = "5px", this.frameInfo = document.createElement("span"), this.frameInfo.style.display = "inline-flex", this.frameInfo.style.alignItems = "center", this.frameInfo.style.marginLeft = "15px", this.frameInfo.style.fontFamily = "monospace", this.frameInfo.style.color = "var(--text-secondary)", this.frameInfo.style.fontSize = "12px", r.appendChild(this.frameInfo), t.appendChild(r), t.appendChild(n), this.scrollWrapper.appendChild(t);
    }
    buildUI() {
      const t = document.createElement("div");
      t.style.display = "flex", t.style.flexDirection = "column", t.style.height = "calc(100% - 37px)", t.style.width = "100%";
      const i = document.createElement("div");
      i.style.height = "60px", i.style.minHeight = "60px", i.style.borderBottom = "1px solid var(--border-color)", i.style.backgroundColor = "var(--background-color)", this.graphSlider = document.createElement("div"), this.graphSlider.style.height = "100%", this.graphSlider.style.margin = "0 10px", this.graphSlider.style.position = "relative", this.graphSlider.style.cursor = "crosshair", i.appendChild(this.graphSlider), this.graph.domElement.style.width = "100%", this.graph.domElement.style.height = "100%", this.graphSlider.appendChild(this.graph.domElement), this.hoverIndicator = document.createElement("div"), this.hoverIndicator.style.position = "absolute", this.hoverIndicator.style.top = "0", this.hoverIndicator.style.bottom = "0", this.hoverIndicator.style.width = "1px", this.hoverIndicator.style.backgroundColor = "rgba(255, 255, 255, 0.3)", this.hoverIndicator.style.pointerEvents = "none", this.hoverIndicator.style.display = "none", this.hoverIndicator.style.zIndex = "9", this.hoverIndicator.style.transform = "translateX(-50%)", this.graphSlider.appendChild(this.hoverIndicator), this.playhead = document.createElement("div"), this.playhead.style.position = "absolute", this.playhead.style.top = "0", this.playhead.style.bottom = "0", this.playhead.style.width = "2px", this.playhead.style.backgroundColor = "var(--color-red)", this.playhead.style.boxShadow = "0 0 4px rgba(255,0,0,0.5)", this.playhead.style.pointerEvents = "none", this.playhead.style.display = "none", this.playhead.style.zIndex = "10", this.playhead.style.transform = "translateX(-50%)", this.graphSlider.appendChild(this.playhead);
      const n = document.createElement("div");
      n.style.position = "absolute", n.style.top = "0", n.style.left = "50%", n.style.transform = "translate(-50%, 0)", n.style.width = "0", n.style.height = "0", n.style.borderLeft = "6px solid transparent", n.style.borderRight = "6px solid transparent", n.style.borderTop = "8px solid var(--color-red)", this.playhead.appendChild(n), this.graphSlider.tabIndex = 0, this.graphSlider.style.outline = "none";
      let r = !1;
      const s = (a) => {
        if (this.frames.length === 0)
          return;
        const l = this.graphSlider.getBoundingClientRect();
        let c = a.clientX - l.left;
        c = Math.max(0, Math.min(c, l.width)), this.fixedScreenX = c;
        const h = this.graph.lines.calls.points.length;
        if (h === 0)
          return;
        const m = l.width / (this.graph.maxPoints - 1), p = l.width - (h - 1) * m;
        let u = Math.round((c - p) / m);
        u = Math.max(0, Math.min(u, h - 1)), u >= h - 2 ? this.isTrackingLatest = !0 : this.isTrackingLatest = !1;
        let g = u;
        this.frames.length > h && (g += this.frames.length - h), this.playhead.style.display = "block", this.selectFrame(g);
      };
      this.graphSlider.addEventListener("mousedown", (a) => {
        r = !0, this.isManualScrubbing = !0, this.graphSlider.focus(), s(a);
      }), this.graphSlider.addEventListener("mouseenter", () => {
        this.frames.length > 0 && !this.isRecording && (this.hoverIndicator.style.display = "block");
      }), this.graphSlider.addEventListener("mouseleave", () => {
        this.hoverIndicator.style.display = "none";
      }), this.graphSlider.addEventListener("mousemove", (a) => {
        if (this.frames.length === 0 || this.isRecording)
          return;
        const l = this.graphSlider.getBoundingClientRect();
        let c = a.clientX - l.left;
        c = Math.max(0, Math.min(c, l.width));
        const h = this.graph.lines.calls.points.length;
        if (h > 0) {
          const m = l.width / (this.graph.maxPoints - 1), p = l.width - (h - 1) * m;
          let u = Math.round((c - p) / m);
          u = Math.max(0, Math.min(u, h - 1));
          let g = p + u * m;
          g = Math.max(1, Math.min(g, l.width - 1)), this.hoverIndicator.style.left = g + "px";
        } else {
          const m = Math.max(1, Math.min(c, l.width - 1));
          this.hoverIndicator.style.left = m + "px";
        }
      }), this.graphSlider.addEventListener("keydown", (a) => {
        if (this.frames.length === 0 || this.isRecording)
          return;
        let l = this.selectedFrameIndex;
        if (a.key === "ArrowLeft" ? (l = Math.max(0, this.selectedFrameIndex - 1), a.preventDefault()) : a.key === "ArrowRight" && (l = Math.min(this.frames.length - 1, this.selectedFrameIndex + 1), a.preventDefault()), l !== this.selectedFrameIndex) {
          this.selectFrame(l);
          const c = this.graph.lines.calls.points.length;
          if (c > 0) {
            let h = l;
            this.frames.length > c && (h = l - (this.frames.length - c)), h >= c - 2 ? this.isTrackingLatest = !0 : this.isTrackingLatest = !1;
            const m = this.graphSlider.getBoundingClientRect(), p = m.width / (this.graph.maxPoints - 1), u = m.width - (c - 1) * p;
            this.fixedScreenX = u + h * p;
          }
        }
      }), window.addEventListener("mousemove", (a) => {
        if (r) {
          s(a);
          const l = this.graphSlider.getBoundingClientRect();
          let c = a.clientX - l.left;
          c = Math.max(0, Math.min(c, l.width));
          const h = this.graph.lines.calls.points.length;
          if (h > 0) {
            const m = l.width / (this.graph.maxPoints - 1), p = l.width - (h - 1) * m;
            let u = Math.round((c - p) / m);
            u = Math.max(0, Math.min(u, h - 1));
            let g = p + u * m;
            g = Math.max(1, Math.min(g, l.width - 1)), this.hoverIndicator.style.left = g + "px";
          } else {
            const m = Math.max(1, Math.min(c, l.width - 1));
            this.hoverIndicator.style.left = m + "px";
          }
        }
      }), window.addEventListener("mouseup", () => {
        r = !1, this.isManualScrubbing = !1;
      }), t.appendChild(i);
      const o = document.createElement("div");
      o.style.flex = "1", o.style.display = "flex", o.style.flexDirection = "column", o.style.overflow = "hidden", this.timelineTrack = document.createElement("div"), this.timelineTrack.style.flex = "1", this.timelineTrack.style.overflowY = "auto", this.timelineTrack.style.margin = "10px", this.timelineTrack.style.backgroundColor = "var(--background-color)", o.appendChild(this.timelineTrack), t.appendChild(o), this.scrollWrapper.appendChild(t);
    }
    setRenderer(t) {
      this.renderer = t;
      const i = P("timeline");
      i.recording && (i.recording = !1, D("timeline", i), this.toggleRecording());
    }
    toggleRecording() {
      if (!this.renderer) {
        console.warn("Timeline: No renderer defined.");
        return;
      }
      this.isRecording = !this.isRecording, this.isRecording ? (this.recordButton.title = "Stop", this.recordButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>', this.recordButton.style.color = "var(--color-red)", this.startRecording()) : (this.recordButton.title = "Record", this.recordButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>', this.recordButton.style.color = "", this.stopRecording(), this.renderSlider());
    }
    startRecording() {
      this.frames = [], this.currentFrame = null, this.selectedFrameIndex = -1, this.fixedScreenX = 0, this.isTrackingLatest = !0, this.isManualScrubbing = !1, this.clear(), this.frameInfo.textContent = "Recording...";
      const t = this.renderer.backend, i = Object.getOwnPropertyNames(Object.getPrototypeOf(t)).filter((n) => n !== "constructor");
      for (const n of i) {
        const r = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t), n);
        if (r && (r.get || r.set))
          continue;
        const s = t[n];
        typeof s == "function" && typeof n == "string" && (this.originalMethods.set(n, s), t[n] = (...o) => {
          if (n.toLowerCase().includes("timestamp") || n.startsWith("get") || n.startsWith("set") || n.startsWith("has") || n.startsWith("_") || n.startsWith("needs"))
            return s.apply(t, o);
          const a = this.renderer.info.frame;
          if (!this.currentFrame || this.currentFrame.id !== a) {
            if (this.currentFrame) {
              this.currentFrame.fps = this.renderer.inspector ? this.renderer.inspector.fps : 0, isFinite(this.currentFrame.fps) || (this.currentFrame.fps = 0);
              const h = this.currentFrame.triangles || 0;
              if (h > this.baseTriangles) {
                const p = this.baseTriangles;
                if (this.baseTriangles = h, p > 0) {
                  const u = p / this.baseTriangles, g = this.graph.lines.triangles.points;
                  for (let f = 0; f < g.length; f++)
                    g[f] *= u;
                }
              }
              const m = this.baseTriangles > 0 ? h / this.baseTriangles * it : 0;
              this.graph.addPoint("calls", this.currentFrame.calls.length), this.graph.addPoint("fps", this.currentFrame.fps), this.graph.addPoint("triangles", m), this.graph.update();
            }
            if (this.currentFrame = {
              id: a,
              calls: [],
              fps: 0,
              triangles: 0
            }, this.frames.push(this.currentFrame), this.frames.length > et && this.frames.shift(), !this.isManualScrubbing) {
              if (this.isTrackingLatest) {
                const h = this.frames.length > 1 ? this.frames.length - 2 : 0;
                this.selectFrame(h);
              } else if (this.selectedFrameIndex !== -1) {
                const h = this.graph.lines.calls.points.length;
                if (h > 0) {
                  const m = this.graphSlider.getBoundingClientRect(), p = m.width / (this.graph.maxPoints - 1), u = m.width - (h - 1) * p;
                  let g = Math.round((this.fixedScreenX - u) / p);
                  g = Math.max(0, Math.min(g, h - 1));
                  let f = g;
                  this.frames.length > h && (f += this.frames.length - h), this.selectFrame(f);
                }
              }
            }
          }
          const l = {
            method: n,
            target: o[0]
          }, c = this.getCallDetail(n, o);
          return c && (l.details = c, c.triangles !== void 0 && (this.currentFrame.triangles += c.triangles)), this.currentFrame.calls.push(l), s.apply(t, o);
        });
      }
    }
    stopRecording() {
      if (this.originalMethods.size > 0) {
        const t = this.renderer.backend;
        for (const [i, n] of this.originalMethods.entries())
          t[i] = n;
        this.originalMethods.clear(), this.currentFrame && (this.currentFrame.fps = this.renderer.inspector ? this.renderer.inspector.fps : 0);
      }
    }
    clear() {
      this.frames = [], this.timelineTrack.innerHTML = "", this.playhead.style.display = "none", this.frameInfo.textContent = "", this.baseTriangles = 0, this.graph.lines.calls.points = [], this.graph.lines.fps.points = [], this.graph.lines.triangles.points = [], this.graph.resetLimit(), this.graph.update();
    }
    exportData() {
      if (this.frames.length === 0)
        return;
      const t = JSON.stringify(this.frames, null, "	"), i = new Blob([
        t
      ], {
        type: "application/json"
      }), n = URL.createObjectURL(i), r = document.createElement("a");
      r.href = n, r.download = "threejs-timeline.json", r.click(), URL.revokeObjectURL(n);
    }
    getRenderTargetDetails(t) {
      const i = t.textures, n = [], r = (a) => {
        switch (a.type) {
          case ee:
          case te:
            return "8";
          case Kt:
          case Jt:
          case Qt:
          case Zt:
          case Yt:
            return "16";
          case Xt:
          case qt:
          case $t:
          case Gt:
          case Ut:
          case Ot:
            return "32";
          default:
            return "?";
        }
      }, s = (a) => {
        switch (a.format) {
          case pe:
            return "a";
          case he:
          case ce:
            return "r";
          case de:
          case le:
            return "rg";
          case ae:
          case oe:
            return "rgb";
          case se:
            return "depth";
          case re:
            return "depth-stencil";
          case ne:
          case ie:
          default:
            return "rgba";
        }
      };
      for (let a = 0; a < i.length; a++) {
        const l = i[a], c = r(l), h = s(l);
        let m = `[${a}]`;
        l.name && !(l.isDepthTexture && l.name === "depth") && (m += ` ${l.name}`), m += ` ${h} ${c} bpc`, n.push(m);
      }
      const o = {
        target: t.name || "RenderTarget",
        [`attachments(${i.length})`]: n.join(", ")
      };
      return t.depthTexture && (o.depth = `${r(t.depthTexture)} bpc`), o;
    }
    getCallDetail(t, i) {
      switch (t) {
        case "draw": {
          const n = i[0], r = {
            object: n.object.name || n.object.type,
            material: n.material.name || n.material.type,
            geometry: n.geometry.name || n.geometry.type
          };
          if (n.getDrawParameters) {
            const s = n.getDrawParameters();
            s && (n.object.isMesh || n.object.isSprite) && (r.triangles = s.vertexCount / 3, n.object.count > 1 && (r.instance = n.object.count, r["triangles per instance"] = r.triangles, r.triangles *= r.instance));
          }
          return r;
        }
        case "beginRender": {
          const n = i[0], r = {
            scene: this.renderer.inspector.currentRender.name || "unknown",
            camera: n.camera.name || n.camera.type
          };
          return n.renderTarget && !n.renderTarget.isPostProcessingRenderTarget ? Object.assign(r, this.getRenderTargetDetails(n.renderTarget)) : r.target = "CanvasTarget", r;
        }
        case "beginCompute":
          return {
            compute: this.renderer.inspector.currentCompute.name || "unknown"
          };
        case "compute": {
          const n = i[1], r = i[2], s = i[4] || n.dispatchSize || n.count, o = n.name || n.type || "unknown";
          let a = 0;
          r && (a = r.length);
          let l;
          return s.isIndirectStorageBufferAttribute ? l = "indirect" : Array.isArray(s) ? l = s.join(", ") : l = s, {
            node: o,
            bindings: a,
            dispatch: l
          };
        }
        case "updateBinding":
          return {
            group: i[0].name || "unknown"
          };
        case "clear": {
          const n = i[3], r = {
            color: i[0],
            depth: i[1],
            stencil: i[2]
          };
          if (n.renderTarget && !n.renderTarget.isPostProcessingRenderTarget) {
            const s = this.getRenderTargetDetails(n.renderTarget);
            s.depth && (s["depth texture"] = s.depth, delete s.depth), Object.assign(r, s);
          } else
            r.target = "CanvasTarget";
          return r;
        }
        case "updateViewport": {
          const n = i[0], { x: r, y: s, width: o, height: a } = n.viewportValue;
          return {
            x: r,
            y: s,
            width: o,
            height: a
          };
        }
        case "updateScissor": {
          const n = i[0], { x: r, y: s, width: o, height: a } = n.scissorValue;
          return {
            x: r,
            y: s,
            width: o,
            height: a
          };
        }
        case "createProgram":
        case "destroyProgram": {
          const n = i[0];
          return {
            stage: n.stage,
            name: n.name || "unknown"
          };
        }
        case "createRenderPipeline": {
          const n = i[0];
          return {
            object: n.object && (n.object.name || n.object.type) || "unknown",
            material: n.material && (n.material.name || n.material.type) || "unknown"
          };
        }
        case "createComputePipeline":
        case "destroyComputePipeline":
          return {
            name: i[0].name || "unknown"
          };
        case "createBindings":
        case "updateBindings": {
          const n = i[0], r = {
            group: n.name || "unknown"
          };
          return n.bindings && (r.count = n.bindings.length), r;
        }
        case "createNodeBuilder": {
          const n = i[0], r = {
            object: n.name || n.type || "unknown"
          };
          return n.material && (r.material = n.material.name || n.material.type || "unknown"), r;
        }
        case "createAttribute":
        case "createIndexAttribute":
        case "createStorageAttribute":
        case "destroyAttribute":
        case "destroyIndexAttribute":
        case "destroyStorageAttribute": {
          const n = i[0], r = {};
          return n.name && (r.name = n.name), n.count !== void 0 && (r.count = n.count), n.itemSize !== void 0 && (r.itemSize = n.itemSize), r;
        }
        case "copyFramebufferToTexture": {
          const n = i[0], r = i[2];
          return {
            target: this.getTextureName(n),
            width: r.z,
            height: r.w
          };
        }
        case "copyTextureToTexture": {
          const n = i[0], r = i[1];
          return {
            source: this.getTextureName(n),
            destination: this.getTextureName(r)
          };
        }
        case "updateSampler": {
          const n = i[0];
          return {
            magFilter: this.getTextureFilterName(n.magFilter),
            minFilter: this.getTextureFilterName(n.minFilter),
            wrapS: this.getTextureWrapName(n.wrapS),
            wrapT: this.getTextureWrapName(n.wrapT),
            anisotropy: n.anisotropy
          };
        }
        case "updateTexture":
        case "generateMipmaps":
        case "createTexture":
        case "destroyTexture": {
          const n = i[0], r = {
            texture: this.getTextureName(n)
          };
          return n.image && (n.image.width !== void 0 && (r.width = n.image.width), n.image.height !== void 0 && (r.height = n.image.height)), r;
        }
      }
      return null;
    }
    getTextureName(t) {
      if (t.name)
        return t.name;
      const i = [
        "isFramebufferTexture",
        "isDepthTexture",
        "isDataArrayTexture",
        "isData3DTexture",
        "isDataTexture",
        "isCompressedArrayTexture",
        "isCompressedTexture",
        "isCubeTexture",
        "isVideoTexture",
        "isCanvasTexture",
        "isTexture"
      ];
      for (const n of i)
        if (t[n])
          return n.replace("is", "");
      return "Texture";
    }
    getTextureFilterName(t) {
      return {
        1003: "Nearest",
        1004: "NearestMipmapNearest",
        1005: "NearestMipmapLinear",
        1006: "Linear",
        1007: "LinearMipmapNearest",
        1008: "LinearMipmapLinear"
      }[t] || t;
    }
    getTextureWrapName(t) {
      return {
        1e3: "Repeat",
        1001: "ClampToEdge",
        1002: "MirroredRepeat"
      }[t] || t;
    }
    formatDetails(t) {
      const i = [];
      for (const n in t)
        t[n] !== void 0 && i.push(`<span style="opacity: 0.5">${n}:</span> <span style="color: var(--text-secondary); opacity: 1">${t[n]}</span>`);
      return i.length === 0 ? "" : `<span style="font-size: 11px; margin-left: 8px; color: var(--text-secondary); opacity: 1;">{ ${i.join('<span style="opacity: 0.5">, </span>')} }</span>`;
    }
    renderSlider() {
      if (this.frames.length === 0) {
        this.playhead.style.display = "none", this.frameInfo.textContent = "";
        return;
      }
      this.graph.lines.calls.points = [], this.graph.lines.fps.points = [], this.graph.lines.triangles.points = [], this.graph.resetLimit();
      let t = this.frames;
      t.length > this.graph.maxPoints && (t = t.slice(-this.graph.maxPoints), this.frames = t);
      let i = 0;
      for (let r = 0; r < t.length; r++) {
        const s = t[r].triangles || 0;
        s > i && (i = s);
      }
      for (let r = 0; r < t.length; r++) {
        const s = t[r].triangles || 0, o = i > 0 ? s / i * it : 0;
        this.graph.addPoint("calls", t[r].calls.length), this.graph.addPoint("fps", t[r].fps || 0), this.graph.addPoint("triangles", o);
      }
      this.graph.update(), this.playhead.style.display = "block";
      let n = 0;
      this.selectedFrameIndex !== -1 && this.selectedFrameIndex < this.frames.length ? n = this.selectedFrameIndex : this.frames.length > 0 && (n = this.frames.length - 1), this.selectFrame(n);
    }
    selectFrame(t) {
      if (t < 0 || t >= this.frames.length)
        return;
      this.selectedFrameIndex = t;
      const i = this.frames[t];
      this.renderTimelineTrack(i);
      const n = (a, l) => `<span style="display:inline-flex;align-items:center;margin-left:12px;"><span style="width:6px;height:6px;border-radius:50%;background-color:${a};margin-right:6px;"></span>${l}</span>`, r = Math.max(this.baseTriangles, i.triangles || 0);
      this.frameInfo.innerHTML = "Frame: " + i.id + n("var(--color-fps)", (i.fps || 0).toFixed(1) + " FPS") + n("var(--color-call)", i.calls.length + " calls") + n("var(--color-red)", (i.triangles || 0) + " / " + r + " triangles");
      const s = this.graphSlider.getBoundingClientRect(), o = this.graph.lines.calls.points.length;
      if (o > 0) {
        const a = s.width / (this.graph.maxPoints - 1);
        let l = t;
        this.frames.length > o && (l = t - (this.frames.length - o));
        let c = s.width - (o - 1) * a + l * a;
        c = Math.max(1, Math.min(c, s.width - 1)), this.playhead.style.left = c + "px", this.playhead.style.display = "block";
      }
    }
    getCallBlock(t, i, n = 0) {
      const r = t.target;
      let s;
      if (r && typeof r == "object") {
        let o = this.callBlocks.get(r);
        o || (o = [], this.callBlocks.set(r, o)), s = o[n];
      } else
        s = this.fallbackBlocks[i];
      return s || (s = document.createElement("div"), s.style.padding = "4px 8px", s.style.margin = "2px 0", s.style.backgroundColor = "rgba(255, 255, 255, 0.03)", s.style.fontFamily = "monospace", s.style.fontSize = "12px", s.style.color = "var(--text-primary)", s.style.whiteSpace = "nowrap", s.style.overflow = "hidden", s.style.textOverflow = "ellipsis", s.style.display = "flex", s.style.alignItems = "center", s.arrow = document.createElement("span"), s.arrow.style.fontSize = "10px", s.arrow.style.marginRight = "10px", s.arrow.style.cursor = "pointer", s.arrow.style.width = "26px", s.arrow.style.textAlign = "center", s.appendChild(s.arrow), s.titleSpan = document.createElement("span"), s.appendChild(s.titleSpan), s.addEventListener("click", (o) => {
        s._groupId && (o.stopPropagation(), this.collapsedGroups.has(s._groupId) ? this.collapsedGroups.delete(s._groupId) : this.collapsedGroups.add(s._groupId), this.renderTimelineTrack(this.frames[this.selectedFrameIndex]));
      }), r && typeof r == "object" ? this.callBlocks.get(r)[n] = s : this.fallbackBlocks[i] = s), s.style.cursor = "default", s._groupId = null, s.arrow.style.display = "none", s;
    }
    renderTimelineTrack(t) {
      if (!t || t.calls.length === 0) {
        this.timelineTrack.innerHTML = "";
        return;
      }
      this.collapsedGroups || (this.collapsedGroups = /* @__PURE__ */ new Set());
      let i = 0;
      const n = this.timelineTrack.children;
      let r = 0;
      const s = /* @__PURE__ */ new WeakMap();
      if (this.isHierarchicalView) {
        const o = [];
        let a = null;
        for (let m = 0; m < t.calls.length; m++) {
          const p = t.calls[m], u = p.method.startsWith("begin") || p.method.startsWith("finish"), g = p.details ? this.formatDetails(p.details) : "";
          a && a.method === p.method && a.formatedDetails === g && !u ? a.count++ : (a = {
            method: p.method,
            count: 1,
            formatedDetails: g,
            target: p.target
          }, o.push(a));
        }
        let l = 0;
        const c = 24, h = [
          {
            element: this.timelineTrack,
            isCollapsed: !1,
            id: "",
            beginCount: 0
          }
        ];
        for (let m = 0; m < o.length; m++) {
          const p = o[m];
          let u = 0;
          p.target && typeof p.target == "object" && (u = s.get(p.target) || 0, s.set(p.target, u + 1));
          const g = this.getCallBlock(p, i++, u);
          g.style.marginLeft = l * c + "px", g.style.borderLeft = "4px solid " + this.getColorForMethod(p.method);
          const f = h[h.length - 1];
          if (f.isCollapsed || (n[r] !== g && this.timelineTrack.insertBefore(g, n[r]), r++), p.method.startsWith("begin")) {
            const C = f.beginCount++, w = f.id + "/" + p.method + "-" + C, k = this.collapsedGroups.has(w);
            g._groupId = w, g.style.cursor = "pointer", g.arrow.style.display = "inline-block", g.arrow.textContent = k ? "[ + ]" : "[ - ]", g.titleSpan.innerHTML = p.method + (p.formatedDetails ? p.formatedDetails : "") + (p.count > 1 ? ` <span style="opacity: 0.5">( ${p.count} )</span>` : ""), l++, h.push({
              element: g,
              isCollapsed: f.isCollapsed || k,
              id: w,
              beginCount: 0
            });
          } else
            p.method.startsWith("finish") ? (g.titleSpan.innerHTML = p.method + (p.formatedDetails ? p.formatedDetails : "") + (p.count > 1 ? ` <span style="opacity: 0.5">( ${p.count} )</span>` : ""), l = Math.max(0, l - 1), h.pop()) : g.titleSpan.innerHTML = p.method + (p.formatedDetails ? p.formatedDetails : "") + (p.count > 1 ? ` <span style="opacity: 0.5">( ${p.count} )</span>` : "");
        }
      } else {
        const o = {};
        for (let l = 0; l < t.calls.length; l++) {
          const c = t.calls[l].method;
          c.startsWith("finish") || (o[c] = (o[c] || 0) + 1);
        }
        const a = Object.keys(o).map((l) => ({
          method: l,
          count: o[l]
        }));
        a.sort((l, c) => c.count - l.count);
        for (let l = 0; l < a.length; l++) {
          const c = a[l], h = this.getCallBlock(c, i++);
          h.style.marginLeft = "0px", h.style.borderLeft = "4px solid " + this.getColorForMethod(c.method), h.titleSpan.innerHTML = c.method + (c.count > 1 ? ` <span style="opacity: 0.5">( ${c.count} )</span>` : ""), n[r] !== h && this.timelineTrack.insertBefore(h, n[r]), r++;
        }
      }
      for (; this.timelineTrack.children.length > r; )
        this.timelineTrack.removeChild(this.timelineTrack.lastChild);
    }
    getColorForMethod(t) {
      return t.startsWith("begin") ? "var(--color-green)" : t.startsWith("finish") || t.startsWith("destroy") ? "var(--color-red)" : t.startsWith("draw") || t.startsWith("compute") || t.startsWith("create") || t.startsWith("generate") ? "var(--color-yellow)" : "var(--text-secondary)";
    }
  }
  me = class extends lt {
    constructor() {
      super();
      const d = new ct(this);
      d.addEventListener("resize", (l) => this.dispatchEvent(l));
      const t = new Y({
        builtin: !0,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 6l8 0" /><path d="M16 6l4 0" /><path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 12l2 0" /><path d="M10 12l10 0" /><path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 18l11 0" /><path d="M19 18l1 0" /></svg>'
      });
      t.hide(), d.addTab(t);
      const i = new Mt();
      i.hide(), d.addTab(i);
      const n = new mt();
      d.addTab(n);
      const r = new ut();
      d.addTab(r);
      const s = new zt();
      d.addTab(s);
      const o = new gt();
      d.addTab(o);
      const a = new kt();
      d.addTab(a), d.loadLayout(), d.activeTabId || d.setActiveTab(n.id), this.statsData = /* @__PURE__ */ new Map(), this.profiler = d, this.performance = n, this.memory = r, this.console = o, this.parameters = t, this.viewer = i, this.timeline = s, this.settings = a, this.once = {}, this.extensionsData = /* @__PURE__ */ new WeakMap(), this.displayCycle = {
        text: {
          needsUpdate: !1,
          duration: 0.25,
          time: 0
        },
        graph: {
          needsUpdate: !1,
          duration: 0.02,
          time: 0
        }
      };
    }
    get domElement() {
      return this.profiler.domElement;
    }
    onExtension(d, t) {
      const i = (n) => {
        n.name === d && (t(n.tab), this.settings.removeEventListener("extensionadded", i));
      };
      return this.settings.extensions[d] && this.settings.extensions[d].loaded ? t(this.settings.extensions[d]) : this.settings.addEventListener("extensionadded", i), this;
    }
    hide() {
      this.profiler.hide();
    }
    show() {
      this.profiler.show();
    }
    getSize() {
      return this.profiler.getSize();
    }
    setActiveTab(d) {
      return this.profiler.setActiveTab(d.id), this;
    }
    addTab(d) {
      return this.profiler.addTab(d), this;
    }
    removeTab(d) {
      return this.profiler.removeTab(d), this;
    }
    setActiveExtension(d, t) {
      return this.settings.setActiveExtension(d, t), this;
    }
    resolveConsoleOnce(d, t) {
      const i = d + t;
      this.once[i] !== !0 && (this.resolveConsole(d, t), this.once[i] = !0);
    }
    resolveConsole(d, t, i = null) {
      switch (d) {
        case "log":
          this.console.addMessage("info", t), console.log(t);
          break;
        case "warn":
          this.console.addMessage("warn", t), i && i.isStackTrace ? console.warn(i.getError(t)) : console.warn(t);
          break;
        case "error":
          this.console.addMessage("error", t), i && i.isStackTrace ? console.error(i.getError(t)) : console.error(t);
          break;
      }
    }
    init() {
      const d = this.getRenderer();
      let t = `THREE.WebGPURenderer: ${Nt} [ "`;
      d.backend.isWebGPUBackend ? t += "WebGPU" : d.backend.isWebGLBackend && (t += "WebGL2"), t += '" ]', this.console.addMessage("info", t), d.inspector.domElement.parentElement === null && d.domElement.parentElement !== null && d.domElement.parentElement.appendChild(d.inspector.domElement);
    }
    setRenderer(d) {
      return super.setRenderer(d), d !== null && (Pt(this.resolveConsole.bind(this)), this.isAvailable && (d.init().then(() => {
        d.backend.trackTimestamp = !0, d.hasFeature("timestamp-query") !== !0 && this.console.addMessage("error", "THREE.Inspector: GPU Timestamp Queries not available.");
      }), this.timeline.setRenderer(d))), this;
    }
    createParameters(d) {
      return this.parameters.isVisible === !1 && this.parameters.show(), this.parameters.createGroup(d);
    }
    getStatsData(d) {
      let t = this.statsData.get(d);
      return t === void 0 && (t = {}, this.statsData.set(d, t)), t;
    }
    resolveStats(d) {
      const t = this.getStatsData(d.cid);
      t.initialized !== !0 && (t.cpu = d.cpu, t.gpu = d.gpu, t.stats = [], t.initialized = !0), t.stats.length > this.maxFrames && t.stats.shift(), t.stats.push(d), t.cpu = this.getAverageDeltaTime(t, "cpu"), t.gpu = this.getAverageDeltaTime(t, "gpu"), t.total = t.cpu + t.gpu;
      for (const i of d.children) {
        this.resolveStats(i);
        const n = this.getStatsData(i.cid);
        t.cpu += n.cpu, t.gpu += n.gpu, t.total += n.total;
      }
    }
    getNodes() {
      return this.currentNodes;
    }
    getAverageDeltaTime(d, t, i = this.fps) {
      const n = d.stats;
      let r = 0, s = 0;
      for (let o = n.length - 1; o >= 0 && s < i; o--) {
        const a = n[o][t];
        a > 0 && (r += a, s++);
      }
      return s > 0 ? r / s : 0;
    }
    updateTabs() {
      const d = Object.values(this.profiler.tabs);
      for (const t of d) {
        let i = this.extensionsData.get(t);
        i === void 0 && (t.init(this), i = {}, this.extensionsData.set(t, i)), t.update(this);
      }
    }
    resolveFrame(d) {
      const t = this.getFrameById(d.frameId + 1);
      if (t) {
        d.cpu = 0, d.gpu = 0, d.total = 0;
        for (const i of d.children) {
          this.resolveStats(i);
          const n = this.getStatsData(i.cid);
          d.cpu += n.cpu, d.gpu += n.gpu, d.total += n.total;
        }
        d.deltaTime = t.startTime - d.startTime, d.miscellaneous = d.deltaTime - d.total, d.miscellaneous < 0 && (d.miscellaneous = 0), this.updateCycle(this.displayCycle.text), this.updateCycle(this.displayCycle.graph), this.displayCycle.text.needsUpdate && (x("fps-counter", this.fps.toFixed()), this.performance.updateText(this, d), this.memory.updateText(this)), this.displayCycle.graph.needsUpdate && (this.performance.updateGraph(this, d), this.memory.updateGraph(this)), this.displayCycle.text.needsUpdate = !1, this.displayCycle.graph.needsUpdate = !1;
      }
    }
    updateCycle(d) {
      d.time += this.nodeFrame.deltaTime, d.time >= d.duration && (d.needsUpdate = !0, d.time = 0);
    }
    static getItem(d) {
      return console.warn("Inspector.getItem is deprecated. Use getItem directly instead."), P(d);
    }
    static setItem(d, t) {
      console.warn("Inspector.setItem is deprecated. Use setItem directly instead."), D(d, t);
    }
  }, P = function(d) {
    return JSON.parse(localStorage.getItem("threejs-inspector") || "{}")[d] || {};
  }, D = function(d, t) {
    const i = JSON.parse(localStorage.getItem("threejs-inspector") || "{}");
    t === null ? delete i[d] : i[d] = t, localStorage.setItem("threejs-inspector", JSON.stringify(i));
  };
})();
export {
  me as Inspector,
  be as __tla,
  P as getItem,
  D as setItem
};
