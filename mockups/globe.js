import * as THREE from 'three';

const R = 1, d2r = Math.PI / 180;
const ll = (lat, lon, r = R) => new THREE.Vector3(r * Math.cos(lat * d2r) * Math.cos(lon * d2r), r * Math.sin(lat * d2r), -r * Math.cos(lat * d2r) * Math.sin(lon * d2r));

function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,235,190,1)'); gr.addColorStop(.18, 'rgba(255,150,70,.95)'); gr.addColorStop(.5, 'rgba(255,90,20,.28)'); gr.addColorStop(1, 'rgba(255,90,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export async function initGlobe(canvas, { lat = 10, lon = -30, fires = true, layers = ['fire'], px = 900, selected = null, light = [-1.4, 0.9, 1.6] } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(px, px, false);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50); cam.position.set(0, 0, 5.6);
  const L = new THREE.TextureLoader();
  const load = (u) => new Promise((res) => L.load(u, res));
  const [map, normal, clouds] = await Promise.all([load('/textures/earth_atmos_2048.jpg'), load('/textures/earth_normal_2048.jpg'), load('/textures/earth_clouds_1024.png')]);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const outer = new THREE.Group(), inner = new THREE.Group();
  outer.rotation.x = lat * d2r; inner.rotation.y = (-90 - lon) * d2r; outer.add(inner); scene.add(outer);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), new THREE.MeshPhongMaterial({ map, normalMap: normal, normalScale: new THREE.Vector2(.6, .6), shininess: 14, specular: new THREE.Color(0x223344) }));
  inner.add(earth);
  const cl = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 96, 64), new THREE.MeshPhongMaterial({ map: clouds, transparent: true, opacity: .55, depthWrite: false }));
  inner.add(cl);
  // atmosphere rim (fresnel)
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.14, 96, 64), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 n;void main(){float i=pow(.72-dot(n,vec3(0.,0.,1.)),3.2);gl_FragColor=vec4(.25,.62,1.,1.)*i*.85;}'
  }));
  scene.add(atm);
  const rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 96, 64), new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 n;void main(){float i=pow(1.-dot(n,vec3(0.,0.,1.)),2.6);gl_FragColor=vec4(.3,.65,1.,1.)*i*.55;}'
  }));
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x6b86a8, .75));
  const sun = new THREE.DirectionalLight(0xfff1dd, 2.5); sun.position.set(...light); scene.add(sun);

  const marks = [];
  if (fires) {
    const [fd, pd, sd] = await Promise.all([fetch('/data/firms_snapshot.json').then(r => r.json()), fetch('/data/precip_snapshot.json').then(r => r.json()).catch(() => null), fetch('/data/sst_snapshot.json').then(r => r.json()).catch(() => null)]);
    const tex = glowTex();
    const add = (o, color, size, tx) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.position.copy(ll(o.latitude, o.longitude, R * 1.012)); sp.scale.setScalar(size); inner.add(sp);
    };
    if (layers.includes('fire')) for (const o of fd.slices[0].observations) add(o, 0xffffff, .05 + Math.min(.13, Math.sqrt(o.value) / 160), tex);
    if (layers.includes('rain') && pd) for (const o of (pd.slices?.[0]?.observations ?? []).slice(0, 60)) add(o, 0x4cc3ff, .06, tex);
    if (layers.includes('sst') && sd) for (const o of (sd.slices?.[0]?.observations ?? []).slice(0, 50)) add(o, 0xf25c8a, .06, tex);
  }
  renderer.render(scene, cam);
  await new Promise(r => setTimeout(r, 200));
  renderer.render(scene, cam);
  scene.updateMatrixWorld(true);
  const project = (la, lo) => {
    const w = ll(la, lo, R * 1.01).applyMatrix4(inner.matrixWorld), v = w.clone().project(cam);
    return { x: (v.x + 1) / 2 * px, y: (1 - v.y) / 2 * px, visible: w.z > 0.15 };
  };
  return { ll, project };
}

export function drawStars(canvas, n = 420, seed = 7) {
  const w = canvas.width = canvas.clientWidth, h = canvas.height = canvas.clientHeight, g = canvas.getContext('2d');
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const r = rnd() * 1.2 + .2; g.fillStyle = `rgba(220,235,255,${.15 + rnd() * .6})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, r, 0, 7); g.fill(); }
}

export function waveform(el, { n = 90, color = '#3fd1b5', seed = 3, h = 70 } = {}) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const w = el.clientWidth; let out = '';
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / n) * Math.PI) * .6 + .4, v = Math.max(.08, rnd() * env), bh = v * h, x = (i / n) * w;
    out += `<rect x="${x.toFixed(1)}" y="${((h - bh) / 2).toFixed(1)}" width="${(w / n * .55).toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5" fill="${color}" opacity="${(.45 + v * .55).toFixed(2)}"/>`;
  }
  el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${out}</svg>`;
}

// Sound-wave ribbons orbiting the globe. half: 'back' (draw behind globe) or 'front'.
export function ribbons(canvas, { rx = 520, ry = 150, tilt = -16, half = 'front', bands = [['#3fd1b5', 1, 3], ['#ff7a3d', .8, 7], ['#4cc3ff', 1.12, 11]], seed = 1 } = {}) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  g.translate(w / 2, h / 2); g.rotate(tilt * Math.PI / 180);
  const t0 = half === 'front' ? 0 : Math.PI, t1 = t0 + Math.PI;
  for (const [col, sc, fq] of bands) {
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let i = 0; i <= 600; i++) {
        const t = t0 + (t1 - t0) * i / 600;
        const env = Math.pow(Math.sin(((t % Math.PI) + Math.PI) % Math.PI), 1.6);
        const a = (10 + k * 5) * env * Math.sin(t * fq * 6 + seed + k) * Math.sin(t * 2.3 + k);
        const x = Math.cos(t) * (rx * sc + a), y = Math.sin(t) * (ry * sc + a * .6);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = col; g.globalAlpha = half === 'front' ? .75 - k * .2 : .35 - k * .1; g.lineWidth = k ? 1 : 2;
      g.shadowColor = col; g.shadowBlur = 14; g.stroke();
    }
  }
  g.globalAlpha = 1;
}
