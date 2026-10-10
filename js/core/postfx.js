/* ============================================================
 * js/core/postfx.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { camera, renderer } from "./engine.js";
import { world } from "./state.js";
import { clamp, damp } from "./util.js";

export const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
export const quadScene = new THREE.Scene();
export const quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
quadScene.add(quadMesh);
export const blendMat = new THREE.ShaderMaterial({
  uniforms: {
    tScene: { value: null },
    tPrev: { value: null },
    damp: { value: 0 },
  },
  vertexShader:
    "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
  fragmentShader:
    "varying vec2 vUv;uniform sampler2D tScene;uniform sampler2D tPrev;uniform float damp;void main(){vec3 c=texture2D(tScene,vUv).rgb;vec3 p=texture2D(tPrev,vUv).rgb;gl_FragColor=vec4(mix(c,p,damp),1.0);}",
  depthTest: false,
  depthWrite: false,
});
export const copyMat = new THREE.ShaderMaterial({
  uniforms: { tCopy: { value: null }, encode: { value: 1 } },
  vertexShader:
    "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}",
  fragmentShader:
    "varying vec2 vUv;uniform sampler2D tCopy;uniform float encode;vec3 lin2srgb(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c));}void main(){vec3 c=texture2D(tCopy,vUv).rgb;if(encode>0.5)c=lin2srgb(c);gl_FragColor=vec4(c,1.0);}",
  depthTest: false,
  depthWrite: false,
});
export let blurRT = null,
  accA = null,
  accB = null,
  blurWas = false;
export let rtType = THREE.UnsignedByteType;
try {
  if (
    renderer.extensions.has("EXT_color_buffer_float") ||
    renderer.extensions.has("EXT_color_buffer_half_float")
  )
    rtType = THREE.HalfFloatType;
} catch (e) {}
export const rtSize = new THREE.Vector2();
export function ensureRTs() {
  renderer.getDrawingBufferSize(rtSize);
  const w = Math.max(4, Math.floor(rtSize.x)),
    h = Math.max(4, Math.floor(rtSize.y));
  if (blurRT && blurRT.width === w && blurRT.height === h) return;
  if (blurRT) {
    blurRT.dispose();
    accA.dispose();
    accB.dispose();
  }
  blurRT = new THREE.WebGLRenderTarget(w, h, {
    type: rtType,
    depthBuffer: true,
  });
  accA = new THREE.WebGLRenderTarget(w, h, {
    type: rtType,
    depthBuffer: false,
  });
  accB = new THREE.WebGLRenderTarget(w, h, {
    type: rtType,
    depthBuffer: false,
  });
  blurWas = false;
}
export function renderFrame(scene) {
  ensureRTs();
  const blur =
    world && world.riding ? clamp(world.riding.blur, 0, 0.85) : 0;
  if (blur > 0.004 || blurWas) {
    if (!blurWas) {
      renderer.setRenderTarget(blurRT);
      renderer.render(scene, camera);
      renderer.setRenderTarget(accA);
      copyMat.uniforms.tCopy.value = blurRT.texture;
      copyMat.uniforms.encode.value = 0;
      quadMesh.material = copyMat;
      renderer.render(quadScene, quadCam);
    }
    renderer.setRenderTarget(blurRT);
    renderer.render(scene, camera);
    renderer.setRenderTarget(accB);
    blendMat.uniforms.tScene.value = blurRT.texture;
    blendMat.uniforms.tPrev.value = accA.texture;
    blendMat.uniforms.damp.value = blur;
    quadMesh.material = blendMat;
    renderer.render(quadScene, quadCam);
    renderer.setRenderTarget(null);
    copyMat.uniforms.tCopy.value = accB.texture;
    copyMat.uniforms.encode.value = 1;
    quadMesh.material = copyMat;
    renderer.render(quadScene, quadCam);
    const tmp = accA;
    accA = accB;
    accB = tmp;
    blurWas = blur > 0.008;
  } else {
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }
}

/* ================= GLOBAL & KOMPAS ================= */

export function setBlurWas(v) { blurWas = v; }
