/* =========================================================
   MODELOS 3D DOS BRINQUEDOS (feitos com Three.js, sem arquivos externos)
   Cada função cria e devolve um THREE.Group pronto para a cena.
   ========================================================= */
(function () {
  const C = {
    red: 0xe8352b, blue: 0x1f5fd6, yellow: 0xffc21a, green: 0x22a94b,
    white: 0xffffff, black: 0x222222, orange: 0xff7a1a, purple: 0x7b3fe4,
    sky: 0x3fb6ff, wood: 0xb07a45, metal: 0xa8b2bd, grass: 0x3cb043
  };
  const BALL_COLORS = [C.red, C.blue, C.yellow, C.green, C.orange, C.purple];

  /* ---------- utilitários ---------- */
  const matCache = new Map();
  function mat(color, opts) {
    const key = color + "|" + JSON.stringify(opts || {});
    if (!matCache.has(key)) {
      matCache.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.42, metalness: 0.04 }, opts || {})));
    }
    return matCache.get(key);
  }
  function mesh(geo, color, opts) {
    const m = new THREE.Mesh(geo, mat(color, opts));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function box(w, h, d, color, x = 0, y = 0, z = 0, opts) {
    const m = mesh(new THREE.BoxGeometry(w, h, d), color, opts);
    m.position.set(x, y, z);
    return m;
  }
  function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 24, opts) {
    const m = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color, opts);
    m.position.set(x, y, z);
    return m;
  }
  function sphere(r, color, x = 0, y = 0, z = 0, opts) {
    const m = mesh(new THREE.SphereGeometry(r, 20, 14), color, opts);
    m.position.set(x, y, z);
    return m;
  }
  /* tubo "inflável" entre dois pontos, com pontas arredondadas */
  function tube(a, b, r, color, caps = true) {
    const g = new THREE.Group();
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const c = mesh(new THREE.CylinderGeometry(r, r, len, 20), color);
    c.position.copy(va).add(vb).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    g.add(c);
    if (caps) [va, vb].forEach((p) => { const s = mesh(new THREE.SphereGeometry(r, 20, 14), color); s.position.copy(p); g.add(s); });
    return g;
  }
  /* anel horizontal (toro deitado) */
  function ring(R, r, color, y, flatten = 1, arc = Math.PI * 2) {
    const m = mesh(new THREE.TorusGeometry(R, r, 14, 72, arc), color);
    m.rotation.x = Math.PI / 2;
    m.scale.z = flatten;
    m.position.y = y;
    return m;
  }
  /* rede (malha de arame) */
  function netMat(color = 0x1b2a4a, opacity = 0.55) {
    return new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
  }
  /* gerador aleatório com semente (o modelo fica sempre igual) */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* várias bolinhas coloridas em um único objeto (rápido) */
  function balls(count, r, place, colors = BALL_COLORS) {
    const geo = new THREE.SphereGeometry(r, 12, 9);
    const m = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.02 });
    const inst = new THREE.InstancedMesh(geo, m, count);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const p = place(i);
      d.position.set(p[0], p[1], p[2]);
      d.scale.setScalar(p[3] || 1);
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
      inst.setColorAt(i, col.setHex(colors[i % colors.length]));
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    return inst;
  }
  /* cobertura tipo tenda em gomos coloridos */
  function tentRoof(radius, height, y, colors, sides = 4, rot = Math.PI / 4) {
    const g = new THREE.Group();
    const step = (Math.PI * 2) / sides;
    for (let i = 0; i < sides; i++) {
      const geo = new THREE.ConeGeometry(radius, height, 1, 1, true, rot + i * step, step);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.55, side: THREE.DoubleSide }));
      m.castShadow = true;
      m.position.y = y + height / 2;
      g.add(m);
    }
    return g;
  }

  /* ========================= MODELOS ========================= */

  /* ---------- Pula-pula ---------- */
  function trampoline(R, pad, accent, ph = 1.75) {
    const g = new THREE.Group();
    const h = 0.72;
    // pernas em "W"
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      g.add(tube([x, 0.04, z], [x, h, z], 0.045, C.metal, false));
      const foot = cyl(0.07, 0.07, 0.04, C.black, x, 0.02, z, 12);
      g.add(foot);
    }
    g.add(ring(R, 0.06, C.metal, 0.08));
    g.add(ring(R, 0.05, C.metal, h));
    // lona
    g.add(cyl(R - 0.12, R - 0.12, 0.03, C.black, 0, h, 0, 48));
    // proteção das molas
    g.add(ring(R - 0.06, 0.16, pad, h + 0.04, 0.45));
    // postes da rede
    const poles = 8;
    for (let i = 0; i < poles; i++) {
      const a = (i / poles) * Math.PI * 2;
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      g.add(tube([x, h, z], [x, h + ph, z], 0.06, accent, false));
      g.add(sphere(0.08, pad, x, h + ph, z));
    }
    g.add(ring(R, 0.04, accent, h + ph));
    // rede
    const net = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, ph, 40, 9, true), netMat());
    net.position.y = h + ph / 2;
    g.add(net);
    const veil = new THREE.Mesh(
      new THREE.CylinderGeometry(R - 0.03, R - 0.03, ph, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x2a3b66, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
    );
    veil.position.y = h + ph / 2;
    g.add(veil);
    // escadinha
    const sx = R + 0.25;
    g.add(box(0.06, 0.75, 0.06, C.metal, sx, 0.37, -0.22));
    g.add(box(0.06, 0.75, 0.06, C.metal, sx, 0.37, 0.22));
    [0.25, 0.52].forEach((y) => g.add(box(0.12, 0.04, 0.5, accent, sx, y, 0)));
    return g;
  }
  function pulaPequeno() { return trampoline(1.15, C.red, C.yellow, 1.35); }
  function pulaMedio() { return trampoline(1.6, C.blue, C.green, 1.75); }

  /* ---------- Piscina de bolinhas (com cobertura) ---------- */
  function piscinaBolinhas() {
    const g = new THREE.Group();
    const S = 2.4, half = S / 2, wallH = 0.6;
    g.add(box(S, 0.06, S, C.blue, 0, 0.03, 0));
    const colors = [C.red, C.yellow, C.green, C.blue];
    // paredes em painéis coloridos
    const n = 4, pw = S / n;
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < n; i++) {
        const off = -half + pw / 2 + i * pw;
        const c = colors[(i + side) % colors.length];
        const p = side < 2
          ? box(pw - 0.02, wallH, 0.1, c, off, wallH / 2, side === 0 ? half : -half)
          : box(0.1, wallH, pw - 0.02, c, side === 2 ? half : -half, wallH / 2, off);
        g.add(p);
      }
    }
    // acabamento acolchoado
    const y = wallH + 0.05;
    g.add(tube([-half, y, half], [half, y, half], 0.09, C.blue));
    g.add(tube([-half, y, -half], [half, y, -half], 0.09, C.blue));
    g.add(tube([half, y, -half], [half, y, half], 0.09, C.blue));
    g.add(tube([-half, y, -half], [-half, y, half], 0.09, C.blue));
    // postes + cobertura
    const postH = 2.0;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      g.add(tube([sx * half, 0, sz * half], [sx * half, postH, sz * half], 0.055, C.white, false));
    });
    g.add(tentRoof(Math.SQRT2 * half + 0.05, 0.9, postH, [C.red, C.yellow, C.blue, C.green]));
    g.add(sphere(0.09, C.yellow, 0, postH + 0.95, 0));
    // bandeirinha
    g.add(box(0.02, 0.35, 0.02, C.white, 0, postH + 1.12, 0));
    g.add(box(0.22, 0.13, 0.01, C.red, 0.11, postH + 1.22, 0));
    // bolinhas
    const rand = rng(7);
    g.add(balls(520, 0.075, () => [
      (rand() * 2 - 1) * (half - 0.15),
      0.1 + rand() * 0.34,
      (rand() * 2 - 1) * (half - 0.15)
    ]));
    return g;
  }

  /* ---------- Pebolim ---------- */
  function pebolim() {
    const g = new THREE.Group();
    const L = 2.2, W = 1.25, topY = 1.0;
    // pernas
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      g.add(box(0.14, topY - 0.3, 0.14, 0x6b4527, sx * (L / 2 - 0.15), (topY - 0.3) / 2, sz * (W / 2 - 0.15)));
      g.add(box(0.22, 0.05, 0.22, C.black, sx * (L / 2 - 0.15), 0.025, sz * (W / 2 - 0.15)));
    });
    g.add(box(L - 0.3, 0.06, 0.08, 0x6b4527, 0, 0.3, 0));
    // corpo
    g.add(box(L, 0.32, W, C.wood, 0, topY - 0.14, 0));
    // campo
    g.add(box(L - 0.12, 0.02, W - 0.12, 0x1f9d47, 0, topY + 0.02, 0));
    const line = (w, d, x, z) => g.add(box(w, 0.005, d, C.white, x, topY + 0.035, z, { roughness: 0.8 }));
    line(0.02, W - 0.16, 0, 0);
    const circle = mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 40), C.white);
    circle.rotation.x = Math.PI / 2; circle.position.y = topY + 0.035; g.add(circle);
    [-1, 1].forEach((s) => {
      line(0.02, 0.5, s * (L / 2 - 0.3), 0);
      line(0.24, 0.02, s * (L / 2 - 0.18), 0.25);
      line(0.24, 0.02, s * (L / 2 - 0.18), -0.25);
      g.add(box(0.06, 0.12, 0.34, C.black, s * (L / 2 - 0.03), topY + 0.06, 0));
    });
    // bordas
    g.add(box(L, 0.16, 0.06, 0x8a5a30, 0, topY + 0.1, W / 2 - 0.03));
    g.add(box(L, 0.16, 0.06, 0x8a5a30, 0, topY + 0.1, -W / 2 + 0.03));
    g.add(box(0.06, 0.16, W, 0x8a5a30, L / 2 - 0.03, topY + 0.1, 0));
    g.add(box(0.06, 0.16, W, 0x8a5a30, -L / 2 + 0.03, topY + 0.1, 0));
    // varetas e jogadores
    const plan = [[1, "r"], [2, "r"], [3, "b"], [5, "r"], [5, "b"], [3, "r"], [2, "b"], [1, "b"]];
    const rodY = topY + 0.2;
    plan.forEach(([count, team], i) => {
      const x = -L / 2 + 0.2 + i * ((L - 0.4) / 7);
      const rod = cyl(0.014, 0.014, W + 0.7, 0xdfe4ea, x, rodY, 0, 10, { metalness: 0.8, roughness: 0.25 });
      rod.rotation.x = Math.PI / 2;
      g.add(rod);
      const hz = team === "r" ? W / 2 + 0.35 : -W / 2 - 0.35;
      const handle = cyl(0.035, 0.035, 0.18, C.black, x, rodY, hz, 12);
      handle.rotation.x = Math.PI / 2;
      g.add(handle);
      const color = team === "r" ? C.red : C.blue;
      const spread = W - 0.3;
      for (let k = 0; k < count; k++) {
        const z = count === 1 ? 0 : -spread / 2 + (k * spread) / (count - 1);
        g.add(box(0.05, 0.16, 0.07, color, x, rodY - 0.06, z));
        g.add(sphere(0.035, 0xf2c9a0, x, rodY + 0.045, z));
        g.add(box(0.035, 0.08, 0.05, C.black, x, rodY - 0.17, z));
      }
    });
    g.add(sphere(0.035, C.white, 0.08, topY + 0.065, 0.1));
    return g;
  }

  /* ---------- Guerra de cotonetes ---------- */
  function guerraCotonetes() {
    const g = new THREE.Group();
    const L = 4.2, W = 3.2, baseH = 0.35;
    g.add(box(L, baseH, W, C.blue, 0, baseH / 2, 0));
    g.add(box(L - 0.4, 0.04, W - 0.4, C.yellow, 0, baseH + 0.02, 0));
    const hx = L / 2, hz = W / 2, ty = baseH + 0.15;
    // bordas infláveis
    g.add(tube([-hx, ty, hz], [hx, ty, hz], 0.2, C.red));
    g.add(tube([-hx, ty, -hz], [hx, ty, -hz], 0.2, C.red));
    g.add(tube([hx, ty, -hz], [hx, ty, hz], 0.2, C.red));
    g.add(tube([-hx, ty, -hz], [-hx, ty, hz], 0.2, C.red));
    // colunas e paredes
    const colH = 2.0;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
      g.add(tube([sx * hx, 0.1, sz * hz], [sx * hx, colH, sz * hz], 0.24, C.yellow));
    });
    g.add(tube([-hx, 1.1, -hz], [hx, 1.1, -hz], 0.16, C.red));
    g.add(tube([-hx, colH - 0.05, -hz], [hx, colH - 0.05, -hz], 0.16, C.blue));
    g.add(tube([-hx, 1.1, -hz], [-hx, 1.1, hz], 0.16, C.red));
    g.add(tube([hx, 1.1, -hz], [hx, 1.1, hz], 0.16, C.red));
    // painel do fundo
    g.add(box(L - 0.3, colH - 0.6, 0.08, C.sky, 0, 0.35 + (colH - 0.6) / 2 + 0.05, -hz));
    // arco frontal
    const arch = mesh(new THREE.TorusGeometry(hx, 0.2, 14, 48, Math.PI), C.green);
    arch.position.set(0, colH, hz);
    arch.scale.y = 0.35;
    g.add(arch);
    // pedestais
    [-0.75, 0.75].forEach((x, i) => {
      g.add(cyl(0.42, 0.46, 0.9, i ? C.red : C.blue, x, baseH + 0.45, 0, 32));
      g.add(cyl(0.44, 0.44, 0.08, C.yellow, x, baseH + 0.94, 0, 32));
    });
    // cotonetes gigantes
    function cotonete(x, y, z, tilt, ry, color) {
      const c = new THREE.Group();
      const len = 2.3;
      c.add(cyl(0.07, 0.07, len, color, 0, 0, 0, 16));
      [-1, 1].forEach((s) => {
        const tip = sphere(0.26, C.white, 0, s * (len / 2 + 0.1), 0, { roughness: 0.95 });
        tip.scale.y = 1.4;
        c.add(tip);
      });
      c.rotation.order = "YXZ";
      c.rotation.y = ry;
      c.rotation.z = Math.PI / 2 - tilt;
      c.position.set(x, y, z);
      return c;
    }
    g.add(cotonete(-0.75, baseH + 1.55, 0.15, 0.25, 0.5, C.blue));
    g.add(cotonete(0.75, baseH + 1.75, -0.15, -0.3, -0.5, C.red));
    return g;
  }

  /* ---------- Piscina de bolinhas inflável ---------- */
  function piscinaInflavel() {
    const g = new THREE.Group();
    const R = 1.9;
    g.add(cyl(R + 0.15, R + 0.15, 0.2, C.blue, 0, 0.1, 0, 48));
    const rings = [C.red, C.yellow, C.blue];
    rings.forEach((c, i) => g.add(ring(R, 0.24, c, 0.3 + i * 0.42)));
    // arcos cruzados
    [0, Math.PI / 2].forEach((ry, i) => {
      const a = mesh(new THREE.TorusGeometry(R, 0.13, 14, 64, Math.PI), i ? C.green : C.red);
      a.rotation.y = ry;
      a.position.y = 1.15;
      a.scale.y = 0.75;
      g.add(a);
    });
    g.add(sphere(0.26, C.yellow, 0, 1.15 + R * 0.75 + 0.1, 0));
    // bolinhas decorativas no topo dos anéis
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.add(sphere(0.11, BALL_COLORS[i % BALL_COLORS.length], Math.cos(a) * R, 1.42, Math.sin(a) * R));
    }
    const rand = rng(11);
    g.add(balls(650, 0.08, () => {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * (R - 0.3);
      return [Math.cos(a) * r, 0.25 + rand() * 0.42, Math.sin(a) * r];
    }));
    return g;
  }

  /* ---------- Futebol de sabão ---------- */
  function futebolSabao() {
    const g = new THREE.Group();
    const L = 7, W = 3.8, hx = L / 2, hz = W / 2;
    g.add(box(L + 0.3, 0.22, W + 0.3, C.blue, 0, 0.11, 0));
    g.add(box(L - 0.2, 0.03, W - 0.2, C.grass, 0, 0.235, 0, { roughness: 0.7 }));
    // linhas do campo
    const ly = 0.255;
    const line = (w, d, x, z) => g.add(box(w, 0.008, d, C.white, x, ly, z, { roughness: 0.8 }));
    line(0.06, W - 0.4, 0, 0);
    const circ = mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 48), C.white);
    circ.rotation.x = Math.PI / 2; circ.position.y = ly; g.add(circ);
    [-1, 1].forEach((s) => {
      line(0.06, 1.8, s * (hx - 0.9), 0);
      line(0.8, 0.06, s * (hx - 0.5), 0.9);
      line(0.8, 0.06, s * (hx - 0.5), -0.9);
    });
    // paredes infláveis
    const wallCol = [C.red, C.yellow];
    [0.45, 0.9].forEach((y, i) => {
      g.add(tube([-hx, y, hz], [hx, y, hz], 0.2, wallCol[i]));
      g.add(tube([-hx, y, -hz], [hx, y, -hz], 0.2, wallCol[i]));
      g.add(tube([hx, y, -hz], [hx, y, hz], 0.2, wallCol[i]));
      g.add(tube([-hx, y, -hz], [-hx, y, hz], 0.2, wallCol[i]));
    });
    // colunas
    const cols = [[-hx, -hz], [-hx, hz], [hx, -hz], [hx, hz], [0, -hz], [0, hz]];
    cols.forEach(([x, z]) => {
      g.add(tube([x, 0.2, z], [x, 1.35, z], 0.27, C.blue));
      g.add(sphere(0.3, C.yellow, x, 1.6, z));
    });
    // traves
    [-1, 1].forEach((s) => {
      const x = s * (hx - 0.25);
      const gw = 1.5, gh = 1.0;
      g.add(tube([x, 0.24, -gw / 2], [x, 0.24 + gh, -gw / 2], 0.06, C.white));
      g.add(tube([x, 0.24, gw / 2], [x, 0.24 + gh, gw / 2], 0.06, C.white));
      g.add(tube([x, 0.24 + gh, -gw / 2], [x, 0.24 + gh, gw / 2], 0.06, C.white));
      const net = new THREE.Mesh(new THREE.BoxGeometry(0.5, gh, gw, 3, 6, 8), netMat(0xffffff, 0.7));
      net.position.set(x + s * 0.25, 0.24 + gh / 2, 0);
      g.add(net);
    });
    // espuma
    const rand = rng(21);
    g.add(balls(340, 0.2, () => {
      const nearWall = rand() < 0.7;
      let x = (rand() * 2 - 1) * (hx - 0.3), z = (rand() * 2 - 1) * (hz - 0.3);
      if (nearWall) z = Math.sign(z || 1) * (hz - 0.3 - rand() * 0.5);
      return [x, 0.26 + rand() * 0.12, z, 0.45 + rand() * 0.9];
    }, [0xffffff, 0xf4fbff, 0xe9f6ff]));
    // bola
    const ball = sphere(0.18, C.white, 0.9, 0.43, 0.3);
    g.add(ball);
    [[0, 1, 0], [0.8, 0.5, 0.3], [-0.6, 0.4, 0.7], [0.2, 0.3, -0.95], [-0.7, -0.2, -0.6]].forEach((v) => {
      const p = new THREE.Vector3(...v).normalize().multiplyScalar(0.165);
      g.add(sphere(0.05, C.black, 0.9 + p.x, 0.43 + p.y, 0.3 + p.z));
    });
    return g;
  }

  /* ---------- Tobogã ---------- */
  function toboga() {
    const g = new THREE.Group();
    const W = 2.4, hw = W / 2;
    const topY = 3.6, zBack = -3.0, zFront = -1.6;
    // base
    g.add(box(W + 0.4, 0.3, 7.4, C.blue, 0, 0.15, 0.2));
    // torre
    g.add(box(W, topY - 0.3, zFront - zBack, C.blue, 0, 0.3 + (topY - 0.3) / 2, (zBack + zFront) / 2));
    g.add(box(W - 0.2, 0.08, zFront - zBack - 0.1, C.yellow, 0, topY + 0.04, (zBack + zFront) / 2));
    // agarras da escalada (parte de trás)
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 2; j++) {
        g.add(sphere(0.1, BALL_COLORS[(i + j) % BALL_COLORS.length], (j ? 0.45 : -0.45) + (i % 2 ? 0.15 : -0.15), 0.6 + i * 0.45, zBack - 0.06));
      }
    }
    // colunas e arcos
    const colH = topY + 1.3;
    [[1, zBack], [-1, zBack], [1, zFront], [-1, zFront]].forEach(([s, z]) => {
      g.add(tube([s * hw, 0.3, z], [s * hw, colH, z], 0.3, C.red));
    });
    [zBack, zFront].forEach((z) => {
      const arch = mesh(new THREE.TorusGeometry(hw, 0.22, 14, 40, Math.PI), C.yellow);
      arch.position.set(0, colH, z);
      g.add(arch);
    });
    g.add(tube([-hw, topY + 0.5, zBack], [-hw, topY + 0.5, zFront], 0.2, C.yellow));
    g.add(tube([hw, topY + 0.5, zBack], [hw, topY + 0.5, zFront], 0.2, C.yellow));
    // rampa de descida
    const z0 = zFront, y0 = topY, z1 = 2.6, y1 = 0.55;
    const len = Math.hypot(z1 - z0, y0 - y1);
    const ramp = box(W - 0.2, 0.3, len, C.yellow, 0, (y0 + y1) / 2 - 0.1, (z0 + z1) / 2);
    ramp.rotation.x = Math.atan2(y0 - y1, z1 - z0);
    g.add(ramp);
    // divisória das pistas
    g.add(tube([0, y0 + 0.08, z0 + 0.1], [0, y1 + 0.08, z1], 0.07, C.red));
    // corrimãos infláveis
    [-1, 1].forEach((s) => {
      g.add(tube([s * hw, y0 + 0.4, z0], [s * hw, y1 + 0.4, z1], 0.26, C.red));
      // laterais altas
      const side = box(0.1, 0.6, len, C.blue, s * hw, (y0 + y1) / 2 + 0.1, (z0 + z1) / 2);
      side.rotation.x = ramp.rotation.x;
      g.add(side);
    });
    // área de chegada
    g.add(box(W, 0.45, 1.5, C.yellow, 0, 0.3, 3.3));
    g.add(tube([-hw, 0.6, 4.05], [hw, 0.6, 4.05], 0.22, C.red));
    g.add(tube([-hw, 0.6, 2.55], [-hw, 0.6, 4.05], 0.22, C.red));
    g.add(tube([hw, 0.6, 2.55], [hw, 0.6, 4.05], 0.22, C.red));
    // bola decorativa no topo
    g.add(sphere(0.32, C.white, 0, colH + hw + 0.35, (zBack + zFront) / 2));
    return g;
  }

  /* ---------- Castelo com escorregador ---------- */
  function castelo() {
    const g = new THREE.Group();
    const S = 3.4, h = S / 2;
    g.add(box(S, 0.45, S, C.blue, 0, 0.225, 0));
    g.add(box(S - 0.5, 0.04, S - 0.5, C.yellow, 0, 0.47, 0));
    // torres
    const towerH = 2.5;
    const towerCol = [C.red, C.purple, C.red, C.purple];
    [[1, 1], [1, -1], [-1, -1], [-1, 1]].forEach(([sx, sz], i) => {
      const x = sx * h, z = sz * h;
      g.add(cyl(0.36, 0.4, towerH, towerCol[i], x, towerH / 2, z, 28));
      // faixas
      const band = ring(0.38, 0.07, C.yellow, 0.9); band.position.set(x, 0.9, z); g.add(band);
      const band2 = ring(0.37, 0.07, C.yellow, 1.8); band2.position.set(x, 1.8, z); g.add(band2);
      const cone = mesh(new THREE.ConeGeometry(0.5, 0.85, 28), i % 2 ? C.yellow : C.green);
      cone.position.set(x, towerH + 0.42, z);
      g.add(cone);
      g.add(sphere(0.11, C.red, x, towerH + 0.9, z));
    });
    // paredes baixas infláveis
    const wy = 0.95;
    g.add(tube([-h, wy, -h], [h, wy, -h], 0.22, C.green));
    g.add(tube([-h, wy, -h], [-h, wy, h], 0.22, C.green));
    g.add(tube([h, wy, -h], [h, wy, h], 0.22, C.green));
    g.add(tube([-h, wy, h], [-0.55, wy, h], 0.22, C.green));
    g.add(tube([0.55, wy, h], [h, wy, h], 0.22, C.green));
    // redes laterais
    const netH = 1.25;
    [[0, -h, 0], [-h, 0, Math.PI / 2], [h, 0, Math.PI / 2]].forEach(([x, z, ry]) => {
      const n = new THREE.Mesh(new THREE.PlaneGeometry(S, netH, 14, 6), netMat());
      n.position.set(x, wy + netH / 2 + 0.1, z);
      n.rotation.y = ry;
      g.add(n);
    });
    // fachada frontal com arco de entrada
    const arch = mesh(new THREE.TorusGeometry(0.55, 0.2, 14, 36, Math.PI), C.yellow);
    arch.position.set(0, wy + 0.4, h);
    g.add(arch);
    g.add(tube([-h, towerH - 0.2, h], [h, towerH - 0.2, h], 0.18, C.blue));
    g.add(tube([-h, towerH - 0.2, -h], [h, towerH - 0.2, -h], 0.18, C.blue));
    // ameias
    for (let i = 0; i < 5; i++) {
      const x = -1.1 + i * 0.55;
      g.add(box(0.28, 0.3, 0.2, i % 2 ? C.red : C.yellow, x, towerH + 0.05, h));
    }
    // cobertura
    g.add(tentRoof(h * Math.SQRT2 + 0.1, 0.9, towerH + 0.1, [C.red, C.yellow, C.blue, C.green], 8, 0));
    // rampa de entrada
    const ramp = box(1.0, 0.3, 0.8, C.red, 0, 0.18, h + 0.4);
    ramp.rotation.x = 0.35;
    g.add(ramp);
    // escorregador lateral
    const sx0 = h, sy0 = 1.5, sx1 = h + 2.2, sy1 = 0.35;
    const len = Math.hypot(sx1 - sx0, sy0 - sy1);
    const slide = box(len, 0.25, 1.1, C.yellow, (sx0 + sx1) / 2, (sy0 + sy1) / 2, 0);
    slide.rotation.z = -Math.atan2(sy0 - sy1, sx1 - sx0);
    g.add(slide);
    [-0.6, 0.6].forEach((z) => g.add(tube([sx0, sy0 + 0.3, z], [sx1, sy1 + 0.3, z], 0.17, C.red)));
    g.add(box(0.8, 0.3, 1.4, C.blue, sx1 + 0.3, 0.15, 0));
    g.add(box(0.5, 1.2, 1.3, C.blue, h + 0.15, 0.85, 0));
    return g;
  }

  /* ---------- registro ---------- */
  const BUILDERS = {
    pulaPequeno: { fn: pulaPequeno, size: 3.1 },
    pulaMedio: { fn: pulaMedio, size: 4.0 },
    piscinaBolinhas: { fn: piscinaBolinhas, size: 3.6 },
    pebolim: { fn: pebolim, size: 3.9 },
    guerraCotonetes: { fn: guerraCotonetes, size: 4.3 },
    piscinaInflavel: { fn: piscinaInflavel, size: 3.9 },
    futebolSabao: { fn: futebolSabao, size: 4.9 },
    toboga: { fn: toboga, size: 4.4 },
    castelo: { fn: castelo, size: 4.6 }
  };

  /* centraliza e ajusta o tamanho para caber na cena */
  function build(key) {
    const def = BUILDERS[key];
    const inner = def.fn();
    const b = new THREE.Box3().setFromObject(inner);
    const s = new THREE.Vector3();
    b.getSize(s);
    const k = def.size / Math.max(s.x, s.y, s.z);
    inner.scale.setScalar(k);
    const b2 = new THREE.Box3().setFromObject(inner);
    const c = new THREE.Vector3();
    b2.getCenter(c);
    inner.position.set(-c.x, -b2.min.y, -c.z);
    const wrap = new THREE.Group();
    wrap.add(inner);
    wrap.userData.height = b2.max.y - b2.min.y;
    return wrap;
  }

  /* cena padrão: luzes + chão que recebe sombra */
  function setupScene(scene) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fd47a, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 25;
    sun.shadow.bias = -0.0008;
    sun.shadow.radius = 4;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xcfe6ff, 0.35);
    fill.position.set(-6, 4, -4);
    scene.add(fill);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.ShadowMaterial({ opacity: 0.2 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  window.ArenaModels = { build, setupScene, keys: Object.keys(BUILDERS) };
})();
