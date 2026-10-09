import * as THREE from 'three'

/**
 * Interference Ribbons (SPEC §0-bis, inspirado no preview do React Bits Pro): fita de fios finos
 * numa curva em S que abre e fecha devagar. Quad de tela cheia no mesmo canvas do HeroBackdrop,
 * desenhado antes das formas de vidro. Quase branco/cinza-azulado com alfa baixo, só em volta do
 * crachá (máscara radial) e na metade direita; fora da máscara o fragmento é descartado.
 */
const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uCenter;
  uniform float uOpacity;

  const int WIRES = 36;

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv - uCenter;
    p.x *= aspect;

    // máscara: elipse em volta do crachá + corte suave na metade esquerda
    float m = smoothstep(0.62, 0.08, length(p * vec2(0.9, 0.75)));
    m *= smoothstep(0.42, 0.62, uv.x);
    if (m < 0.002) discard;

    float t = uTime * 0.07;
    float y = p.y;
    float center = 0.16 * sin(y * 2.1 + t) + 0.05 * sin(y * 4.7 - t * 1.3) - y * 0.22;
    float spread = 0.075 * sin(y * 2.8 + t * 1.6) + 0.02; // passa por zero: torção da fita
    float px = 1.4 / uRes.y;

    float acc = 0.0;
    for (int i = 0; i < WIRES; i++) {
      float k = float(i) / float(WIRES - 1) - 0.5;
      float x = center + k * spread * 2.0 + 0.006 * sin(y * 8.0 + float(i) * 0.9 + t * 2.0);
      float d = abs(p.x - x);
      acc += 1.0 - smoothstep(0.0, px, d);
      acc += 0.12 * exp(-d * 260.0); // brilho fraco em volta do fio
    }
    acc = clamp(acc, 0.0, 1.6);

    vec3 col = vec3(0.839, 0.875, 0.918); // #d6dfea
    gl_FragColor = vec4(col, acc * 0.42 * m * uOpacity);
  }
`

export function createRibbons() {
  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uCenter: { value: new THREE.Vector2(0.73, 0.5) },
    uOpacity: { value: 0 },
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  )
  mesh.frustumCulled = false
  mesh.renderOrder = -1
  return {
    mesh,
    update(t: number, renderer: THREE.WebGLRenderer) {
      renderer.getDrawingBufferSize(uniforms.uRes.value)
      uniforms.uTime.value = t
      // fade-in de ~1.5s depois que o canvas aparece
      uniforms.uOpacity.value = Math.min(1, uniforms.uOpacity.value + 0.011)
    },
  }
}
