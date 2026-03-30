import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Rings are driven purely by uBass/uMid/uHigh/uBeat.
// No autonomous expansion — completely invisible when nothing plays.
const fragmentShader = `
precision highp float;

uniform float uTime;
uniform float uBass, uMid, uHigh, uBeat;
uniform float uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep;
uniform float uOpacity, uNoiseAmount, uRotation;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax;
uniform float uIsPlaying;
uniform vec2  uResolution, uMouse;
uniform vec3  uColor, uColorTwo;
uniform int   uRingCount;

const float HP = 1.5707963;

float ring(vec2 p, float baseR, float px, float energy) {
  float r  = baseR + energy * 0.18;
  float d  = abs(length(p) - r);
  float th = px * (uLineThickness + uBeat * 6.0);
  float edge = 1.0 - smoothstep(th * 0.5, th * 1.8, d);
  float glow = exp(-uAttenuation * d * (1.0 - uBeat * 0.4));
  return (edge + glow * 0.6) * energy;
}

void main() {
  if (uIsPlaying < 0.01) { gl_FragColor = vec4(0.0); return; }

  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;

  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;

  float sc = 1.0 + uHoverAmount * (uHoverScale - 1.0) + uBeat * 0.06;
  p /= sc;

  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);

  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    float t  = fi / rcf;

    // Inner rings respond to bass, outer to highs
    float energy = mix(mix(uBass, uMid, t), uHigh, t * t);

    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, t);
    rc = mix(rc, vec3(1.0), uBeat * 0.3);

    float intensity = ring(pr, uBaseRadius + fi * uRadiusStep, px, energy);
    c = max(c, rc * intensity);
  }

  c *= 1.0 + uBeat * 1.2;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;

  float alpha = max(c.r, max(c.g, c.b)) * uOpacity * uIsPlaying;
  gl_FragColor = vec4(c, alpha);
}
`;

export default function MagicRings({
  audioRef,
  color         = '#fc42ff',
  colorTwo      = '#42fcff',
  ringCount     = 6,
  attenuation   = 8,
  lineThickness = 2,
  baseRadius    = 0.12,
  radiusStep    = 0.09,
  opacity       = 1,
  blur          = 0,
  noiseAmount   = 0.06,
  rotation      = 0,
  mouseInfluence= 0.08,
  hoverScale    = 1.1,
  parallax      = 0.02,
}) {
  const mountRef       = useRef(null);
  const propsRef       = useRef(null);
  const mouseRef       = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);
  const hoverAmountRef = useRef(0);
  const isHoveredRef   = useRef(false);

  // Audio
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const dataArrayRef     = useRef(null);
  const connectedRef     = useRef(false);
  const isPlayingRef     = useRef(false);
  const smoothBeatRef    = useRef(0);
  const smoothBassRef    = useRef(0);
  const smoothMidRef     = useRef(0);
  const smoothHighRef    = useRef(0);
  const smoothIsPlayRef  = useRef(0);

  propsRef.current = {
    color, colorTwo, ringCount, attenuation, lineThickness,
    baseRadius, radiusStep, opacity, noiseAmount, rotation,
    mouseInfluence, hoverScale, parallax,
  };

  // ── Poll for <audio> element (it only mounts after audioUrl is set) ────────
  useEffect(() => {
    let pollId;

    const tryConnect = () => {
      const audio = audioRef?.current;
      if (!audio || connectedRef.current) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current  = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      try {
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        connectedRef.current = true;
      } catch (e) {
        // Already wrapped (e.g. HMR) — mark connected so we stop polling
        console.warn('MagicRings:', e.message);
        connectedRef.current = true;
      }

      // Track play/pause state
      const onPlay  = () => {
        isPlayingRef.current = true;
        if (ctx.state === 'suspended') ctx.resume();
      };
      const onPause = () => { isPlayingRef.current = false; };
      const onEnded = () => { isPlayingRef.current = false; };
      audio.addEventListener('play',  onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      isPlayingRef.current = !audio.paused;

      clearInterval(pollId);
    };

    pollId = setInterval(tryConnect, 300);
    tryConnect();
    return () => clearInterval(pollId);
  }, [audioRef]);

  // ── Three.js ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { return; }

    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uTime:          { value: 0 },
      uBass:          { value: 0 },
      uMid:           { value: 0 },
      uHigh:          { value: 0 },
      uBeat:          { value: 0 },
      uIsPlaying:     { value: 0 },
      uAttenuation:   { value: 0 },
      uResolution:    { value: new THREE.Vector2() },
      uColor:         { value: new THREE.Color() },
      uColorTwo:      { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius:    { value: 0 },
      uRadiusStep:    { value: 0 },
      uOpacity:       { value: 1 },
      uNoiseAmount:   { value: 0 },
      uRotation:      { value: 0 },
      uMouse:         { value: new THREE.Vector2() },
      uMouseInfluence:{ value: 0 },
      uHoverAmount:   { value: 0 },
      uHoverScale:    { value: 1 },
      uParallax:      { value: 0 },
      uRingCount:     { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, uniforms, transparent: true,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material));

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] =  (e.clientX - rect.left) / rect.width  - 0.5;
      mouseRef.current[1] = -((e.clientY - rect.top)  / rect.height - 0.5);
    };
    const onMouseEnter = () => { isHoveredRef.current = true; };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      mouseRef.current[0]  = 0;
      mouseRef.current[1]  = 0;
    };
    mount.addEventListener('mousemove',  onMouseMove);
    mount.addEventListener('mouseenter', onMouseEnter);
    mount.addEventListener('mouseleave', onMouseLeave);

    const lerp   = (a, b, t) => a + (b - a) * t;
    const smooth = (prev, raw, attack, decay) =>
      raw > prev ? lerp(prev, raw, attack) : lerp(prev, raw, decay);

    let frameId;
    const animate = (t) => {
      frameId = requestAnimationFrame(animate);
      const p = propsRef.current;

      // ── Frequency analysis ──────────────────────────────────────────────
      let rawBass = 0, rawMid = 0, rawHigh = 0, rawBeat = 0;

      if (analyserRef.current && dataArrayRef.current && isPlayingRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const data = dataArrayRef.current;
        const len  = data.length;

        // fftSize=512 → 256 bins, ~86 Hz/bin (at 44.1kHz)
        const bassEnd = Math.max(3,  Math.floor(len * 0.025)); // ~0-215 Hz
        const midEnd  = Math.max(12, Math.floor(len * 0.12));  // ~215-1032 Hz
        const highEnd = Math.max(40, Math.floor(len * 0.35));  // ~1032-3010 Hz

        const avg = (lo, hi) => {
          let s = 0;
          for (let i = lo; i < hi; i++) s += data[i];
          return (hi > lo) ? s / (hi - lo) / 255 : 0;
        };

        rawBass = avg(0,       bassEnd);
        rawMid  = avg(bassEnd, midEnd);
        rawHigh = avg(midEnd,  highEnd);
        rawBeat = rawBass * 0.6 + rawMid * 0.3 + rawHigh * 0.1;
      }

      smoothBassRef.current    = smooth(smoothBassRef.current,    rawBass, 0.7,  0.12);
      smoothMidRef.current     = smooth(smoothMidRef.current,     rawMid,  0.6,  0.10);
      smoothHighRef.current    = smooth(smoothHighRef.current,    rawHigh, 0.5,  0.08);
      smoothBeatRef.current    = smooth(smoothBeatRef.current,    rawBeat, 0.85, 0.08);
      smoothIsPlayRef.current  = lerp(smoothIsPlayRef.current, isPlayingRef.current ? 1 : 0, 0.04);

      smoothMouseRef.current[0] = lerp(smoothMouseRef.current[0], mouseRef.current[0], 0.08);
      smoothMouseRef.current[1] = lerp(smoothMouseRef.current[1], mouseRef.current[1], 0.08);
      hoverAmountRef.current    = lerp(hoverAmountRef.current, isHoveredRef.current ? 1 : 0, 0.08);

      uniforms.uTime.value          = t * 0.001;
      uniforms.uBass.value          = smoothBassRef.current;
      uniforms.uMid.value           = smoothMidRef.current;
      uniforms.uHigh.value          = smoothHighRef.current;
      uniforms.uBeat.value          = smoothBeatRef.current;
      uniforms.uIsPlaying.value     = smoothIsPlayRef.current;
      uniforms.uAttenuation.value   = p.attenuation;
      uniforms.uColor.value.set(p.color);
      uniforms.uColorTwo.value.set(p.colorTwo);
      uniforms.uLineThickness.value = p.lineThickness;
      uniforms.uBaseRadius.value    = p.baseRadius;
      uniforms.uRadiusStep.value    = p.radiusStep;
      uniforms.uRingCount.value     = p.ringCount;
      uniforms.uOpacity.value       = p.opacity;
      uniforms.uNoiseAmount.value   = p.noiseAmount;
      uniforms.uRotation.value      = (p.rotation * Math.PI) / 180;
      uniforms.uMouse.value.set(smoothMouseRef.current[0], smoothMouseRef.current[1]);
      uniforms.uMouseInfluence.value= p.mouseInfluence;
      uniforms.uHoverAmount.value   = hoverAmountRef.current;
      uniforms.uHoverScale.value    = p.hoverScale;
      uniforms.uParallax.value      = p.parallax;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      mount.removeEventListener('mousemove',  onMouseMove);
      mount.removeEventListener('mouseenter', onMouseEnter);
      mount.removeEventListener('mouseleave', onMouseLeave);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
   
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        overflow: 'hidden',
        background: 'transparent',
        ...(blur > 0 ? { filter: `blur(${blur}px)` } : {}),
      }}
    />
  );
}