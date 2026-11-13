import * as THREE from 'three'

// GPU 流体求解器（Stable Fluids），参考 PavelDoGreat/WebGL-Fluid-Simulation（MIT）。
//
// 这里只做「水面细节」这一层：速度场 + 染料场跑在 2D 域上，
// 输出两张纹理给水面着色器用（速度 → 法线扰动，染料/涡量 → 泡沫）。
// 真正的水位、连通、体积守恒仍然由 flood.js 的 CPU 模拟负责——
// 那是要能被断言和测量的物理，不适合放进 GPU 里。
//
// 管线：advect → curl → vorticity → divergence → pressure(Jacobi) → gradient subtract

const QUAD_VERT = /* glsl */ `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAG_HEAD = /* glsl */ `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
`

const CLEAR_FRAG = `${FRAG_HEAD}
uniform sampler2D uTexture;
uniform float value;
void main() { gl_FragColor = value * texture2D(uTexture, vUv); }
`

const SPLAT_FRAG = `${FRAG_HEAD}
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}
`

const ADVECTION_FRAG = `${FRAG_HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 sourceTexelSize;
uniform float dt;
uniform float dissipation;

void main() {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  vec4 result = texture2D(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  gl_FragColor = result / decay;
}
`

const DIVERGENCE_FRAG = `${FRAG_HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`

const CURL_FRAG = `${FRAG_HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`

const VORTICITY_FRAG = `${FRAG_HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`

const PRESSURE_FRAG = `${FRAG_HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`

const GRADIENT_SUBTRACT_FRAG = `${FRAG_HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`

function makeTarget(w, h, { type, format = THREE.RGBAFormat } = {}) {
  return new THREE.WebGLRenderTarget(w, h, {
    type,
    format,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  })
}

function createFBO(w, h, type) {
  let read = makeTarget(w, h, { type })
  let write = makeTarget(w, h, { type })
  return {
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    get read() {
      return read
    },
    get write() {
      return write
    },
    get texture() {
      return read.texture
    },
    swap() {
      const t = read
      read = write
      write = t
    },
    dispose() {
      read.dispose()
      write.dispose()
    },
  }
}

export function createFluidSolver(renderer, { simRes = 96, dyeRes = 192, pressureIterations = 18 } = {}) {
  const gl = renderer.getContext()
  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
  // 半浮点能不能渲染，决定这套细节要不要开
  const canHalfFloat =
    isWebGL2 && !!(gl.getExtension('EXT_color_buffer_half_float') || gl.getExtension('EXT_color_buffer_float'))
  if (!canHalfFloat) return null

  const type = THREE.HalfFloatType
  const simH = Math.max(24, Math.round(simRes / 2))
  const dyeH = Math.max(24, Math.round(dyeRes / 2))
  const aspect = simRes / simH

  const velocity = createFBO(simRes, simH, type)
  const dye = createFBO(dyeRes, dyeH, type)
  const divergence = createFBO(simRes, simH, type)
  const curl = createFBO(simRes, simH, type)
  const pressure = createFBO(simRes, simH, type)

  const quad = new THREE.BufferGeometry()
  quad.setAttribute(
    'aPosition',
    new THREE.BufferAttribute(new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), 2),
  )
  quad.setIndex([0, 1, 2, 0, 2, 3])

  const scene = new THREE.Scene()
  const mesh = new THREE.Mesh(quad, null)
  mesh.frustumCulled = false
  scene.add(mesh)
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  function material(fragmentShader, uniforms) {
    return new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    })
  }

  const clearMat = material(CLEAR_FRAG, {
    uTexture: { value: null },
    value: { value: 1 },
    texelSize: { value: new THREE.Vector2(1, 1) },
  })
  const splatMat = material(SPLAT_FRAG, {
    uTarget: { value: null },
    aspectRatio: { value: aspect },
    color: { value: new THREE.Vector3() },
    point: { value: new THREE.Vector2() },
    radius: { value: 0.02 },
    texelSize: { value: new THREE.Vector2(1, 1) },
  })
  const advectMat = material(ADVECTION_FRAG, {
    uVelocity: { value: null },
    uSource: { value: null },
    sourceTexelSize: { value: new THREE.Vector2() },
    dt: { value: 0.016 },
    dissipation: { value: 1.2 },
    texelSize: { value: new THREE.Vector2() },
  })
  const divergenceMat = material(DIVERGENCE_FRAG, {
    uVelocity: { value: null },
    texelSize: { value: new THREE.Vector2() },
  })
  const curlMat = material(CURL_FRAG, {
    uVelocity: { value: null },
    texelSize: { value: new THREE.Vector2() },
  })
  const vorticityMat = material(VORTICITY_FRAG, {
    uVelocity: { value: null },
    uCurl: { value: null },
    curl: { value: 22 },
    dt: { value: 0.016 },
    texelSize: { value: new THREE.Vector2() },
  })
  const pressureMat = material(PRESSURE_FRAG, {
    uPressure: { value: null },
    uDivergence: { value: null },
    texelSize: { value: new THREE.Vector2() },
  })
  const gradientMat = material(GRADIENT_SUBTRACT_FRAG, {
    uPressure: { value: null },
    uVelocity: { value: null },
    texelSize: { value: new THREE.Vector2() },
  })

  function blit(target, mat) {
    mesh.material = mat
    renderer.setRenderTarget(target)
    renderer.render(scene, cam)
    renderer.setRenderTarget(null)
  }

  function resize() {
    // 目标尺寸固定，不需要跟屏幕走；留空以免外部误用
  }

  function splatVel(x, y, dx, dy, radius = 0.012) {
    splatMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    splatMat.uniforms.uTarget.value = velocity.texture
    splatMat.uniforms.point.value.set(x, y)
    splatMat.uniforms.color.value.set(dx, dy, 0)
    splatMat.uniforms.radius.value = radius
    blit(velocity.write, splatMat)
    velocity.swap()
  }

  function splatDye(x, y, r, g, b, radius = 0.02) {
    splatMat.uniforms.texelSize.value.set(dye.texelSizeX, dye.texelSizeY)
    splatMat.uniforms.uTarget.value = dye.texture
    splatMat.uniforms.point.value.set(x, y)
    splatMat.uniforms.color.value.set(r, g, b)
    splatMat.uniforms.radius.value = radius
    blit(dye.write, splatMat)
    dye.swap()
  }

  function step(dt) {
    const k = Math.min(0.033, dt)

    // 速度自平流
    advectMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    advectMat.uniforms.uVelocity.value = velocity.texture
    advectMat.uniforms.uSource.value = velocity.texture
    advectMat.uniforms.dt.value = k
    advectMat.uniforms.dissipation.value = 0.4
    blit(velocity.write, advectMat)
    velocity.swap()

    // 涡量增强
    curlMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    curlMat.uniforms.uVelocity.value = velocity.texture
    blit(curl.write, curlMat)
    curl.swap()

    vorticityMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    vorticityMat.uniforms.uVelocity.value = velocity.texture
    vorticityMat.uniforms.uCurl.value = curl.texture
    vorticityMat.uniforms.dt.value = k
    blit(velocity.write, vorticityMat)
    velocity.swap()

    // 投影：散度 → 压力 → 减梯度
    divergenceMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    divergenceMat.uniforms.uVelocity.value = velocity.texture
    blit(divergence.write, divergenceMat)
    divergence.swap()

    clearMat.uniforms.texelSize.value.set(pressure.texelSizeX, pressure.texelSizeY)
    clearMat.uniforms.uTexture.value = pressure.texture
    clearMat.uniforms.value.value = 0.8
    blit(pressure.write, clearMat)
    pressure.swap()

    pressureMat.uniforms.texelSize.value.set(pressure.texelSizeX, pressure.texelSizeY)
    pressureMat.uniforms.uDivergence.value = divergence.texture
    for (let i = 0; i < pressureIterations; i += 1) {
      pressureMat.uniforms.uPressure.value = pressure.texture
      blit(pressure.write, pressureMat)
      pressure.swap()
    }

    gradientMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    gradientMat.uniforms.uPressure.value = pressure.texture
    gradientMat.uniforms.uVelocity.value = velocity.texture
    blit(velocity.write, gradientMat)
    velocity.swap()

    // 染料被速度搬运
    advectMat.uniforms.texelSize.value.set(velocity.texelSizeX, velocity.texelSizeY)
    advectMat.uniforms.uVelocity.value = velocity.texture
    advectMat.uniforms.uSource.value = dye.texture
    advectMat.uniforms.dt.value = k
    advectMat.uniforms.dissipation.value = 1.6
    blit(dye.write, advectMat)
    dye.swap()
  }

  return {
    step,
    splatVel,
    splatDye,
    resize,
    get velocityTexture() {
      return velocity.texture
    },
    get dyeTexture() {
      return dye.texture
    },
    get curlTexture() {
      return curl.texture
    },
    dispose() {
      velocity.dispose()
      dye.dispose()
      divergence.dispose()
      curl.dispose()
      pressure.dispose()
      quad.dispose()
      ;[clearMat, splatMat, advectMat, divergenceMat, curlMat, vorticityMat, pressureMat, gradientMat].forEach((m) =>
        m.dispose(),
      )
    },
  }
}
