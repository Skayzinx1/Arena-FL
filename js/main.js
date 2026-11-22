/* =========================================================
   Arena FL Brinquedos — interações do site
   ========================================================= */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const has3D = typeof THREE !== "undefined" && window.ArenaModels;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const toyById = Object.fromEntries(TOYS.map((t) => [t.id, t]));

  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Menu ---------------- */
  const burger = $("#burger"), nav = $("#nav");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }));
  const navLinks = $$('.nav > a:not(.btn)');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["inicio", "brinquedos", "precos", "como-funciona", "contato"].forEach((id) => sectionObs.observe(document.getElementById(id)));

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 2400);
  }

  /* ---------------- Estado do orçamento ---------------- */
  const state = { selected: new Set(), date: null, time: null };

  /* ---------------- Cards dos brinquedos ---------------- */
  const grid = $("#toyGrid");
  grid.innerHTML = TOYS.map((t) => `
    <article class="card" data-id="${t.id}" data-cat="${t.categoria}">
      <div class="card__view${t.foto ? " card__view--photo" : ""}" title="${t.foto ? "Clique para ampliar" : "Arraste para girar"}">
        ${t.foto
          ? `<img src="${t.foto}" alt="${t.nome}" loading="lazy" />`
          : `<canvas aria-label="Modelo 3D: ${t.nome}"></canvas><span class="card__3d">3D</span>`}
        ${t.destaque ? `<span class="card__badge">⭐ ${t.destaque}</span>` : ""}
        <button class="card__expand" data-open="${t.id}">⤢ ${t.foto ? "Ver detalhes" : "Ver em 3D"}</button>
      </div>
      <div class="card__body">
        <h3>${t.nome}</h3>
        <p>${t.desc}</p>
        <div class="card__tags">
          ${t.categoria === "inflavel" ? '<span class="t-hot">⏱ 4 horas</span><span class="t-hot">👤 Monitor incluso</span>' : `<span>${t.itens[0]}</span>`}
        </div>
        <div class="card__foot">
          <div class="price">A partir de<strong>${brl(t.preco)}</strong></div>
          <button class="btn btn--blue card__add" data-add="${t.id}">+ Orçamento</button>
        </div>
      </div>
    </article>`).join("");

  // filtros
  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    $$(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    const f = chip.dataset.filter;
    $$(".card", grid).forEach((card) => { card.hidden = f !== "todos" && card.dataset.cat !== f; });
    cards3D.resize();
  }));

  grid.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    const add = e.target.closest("[data-add]");
    if (open) openModal(open.dataset.open);
    else if (add) toggleToy(add.dataset.add);
  });
  // clicar (sem arrastar) na imagem abre o visualizador
  grid.addEventListener("pointerup", (e) => {
    const view = e.target.closest(".card__view");
    if (!view || e.target.closest("button")) return;
    if ((view._dragDist || 0) < 6) openModal(view.closest(".card").dataset.id);
  });

  /* ---------------- Tabela de preços ---------------- */
  function priceItem(t) {
    return `<li><span class="pl-dot" style="--c:${t.cor}"></span><button class="pl-link" data-open="${t.id}">${t.nome}</button><span class="pl-fill"></span><span class="pl-val">${brl(t.preco)}</span></li>`;
  }
  const byPrice = (a, b) => a.preco - b.preco;
  $("#priceListClassic").innerHTML = TOYS.filter((t) => t.categoria !== "inflavel").sort(byPrice).map(priceItem).join("");
  $("#priceListInflatable").innerHTML = TOYS.filter((t) => t.categoria === "inflavel").sort(byPrice).map(priceItem).join("");
  $("#precos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) openModal(b.dataset.open);
  });

  /* =========================================================
     3D — cards (um único renderizador desenha todos os cards)
     ========================================================= */
  const cards3D = (function () {
    if (!has3D) return { resize() {} };
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(DPR);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    ArenaModels.setupScene(scene);
    const camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 100);

    const items = $$(".card", grid).filter((card) => $("canvas", card)).map((card, i) => {
      const toy = toyById[card.dataset.id];
      const model = ArenaModels.build(toy.modelo);
      model.visible = false;
      model.rotation.y = -0.6 + i * 0.4;
      scene.add(model);
      const view = $(".card__view", card);
      const canvas = $("canvas", view);
      const item = { card, view, canvas, ctx: canvas.getContext("2d"), model, visible: false, hover: false, drag: null, vel: 0, dirty: true };

      view.addEventListener("pointerenter", () => (item.hover = true));
      view.addEventListener("pointerleave", () => { item.hover = false; item.drag = null; });
      view.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button")) return;
        item.drag = { x: e.clientX, y: e.clientY };
        view._dragDist = 0;
      });
      view.addEventListener("pointermove", (e) => {
        if (!item.drag) return;
        const dx = e.clientX - item.drag.x;
        view._dragDist += Math.abs(dx) + Math.abs(e.clientY - item.drag.y);
        item.drag.x = e.clientX; item.drag.y = e.clientY;
        item.model.rotation.y += dx * 0.012;
        item.vel = dx * 0.0025;
      });
      window.addEventListener("pointerup", () => (item.drag = null));
      return item;
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { const it = items.find((i) => i.view === e.target); if (it) it.visible = e.isIntersecting; });
    }, { rootMargin: "100px" });
    items.forEach((it) => io.observe(it.view));

    let W = 0, H = 0;
    function resize() {
      const first = items.find((i) => !i.card.hidden);
      if (!first) return;
      const r = first.view.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      items.forEach((it) => {
        it.canvas.width = Math.round(W * DPR);
        it.canvas.height = Math.round(H * DPR);
        it.dirty = true;
      });
    }
    window.addEventListener("resize", resize);
    resize();

    let last = 0;
    function frame(t) {
      requestAnimationFrame(frame);
      if (t - last < 30) return; // ~30 fps é suficiente para os cards
      last = t;
      draw();
    }
    function draw() {
      for (const it of items) {
        if (!it.visible || it.card.hidden) continue;
        if (!it.drag) {
          it.vel *= 0.92;
          it.model.rotation.y += (it.hover ? 0.022 : 0.006) + it.vel;
        }
        const h = it.model.userData.height;
        camera.position.set(0, 3.3 + h * 0.25, 7.9);
        camera.lookAt(0, h * 0.4, 0);
        items.forEach((o) => (o.model.visible = o === it));
        renderer.render(scene, camera);
        it.ctx.clearRect(0, 0, it.canvas.width, it.canvas.height);
        it.ctx.drawImage(renderer.domElement, 0, 0, it.canvas.width, it.canvas.height);
      }
    }
    requestAnimationFrame(frame);
    return { resize };
  })();

  /* =========================================================
     3D — visualizador com controles (hero e modal)
     ========================================================= */
  function createViewer(canvas, opts = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(DPR);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    ArenaModels.setupScene(scene);
    const camera = new THREE.PerspectiveCamera(opts.fov || 34, 1, 0.1, 100);
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = opts.speed || 1.6;
    controls.minDistance = 4;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.enableZoom = opts.zoom !== false;

    let model = null, pop = 1, running = true;
    const cache = {};

    function frameModel(reset = true) {
      const h = model.userData.height;
      controls.target.set(0, h * 0.4, 0);
      if (reset) camera.position.set(4.4, 3.4 + h * 0.3, 6.4).multiplyScalar((opts.dist || 1) * (camera.aspect < 1.2 ? 1.3 : 1));
      controls.update();
    }
    function show(key) {
      if (model) scene.remove(model);
      model = cache[key] || (cache[key] = ArenaModels.build(key));
      model.rotation.y = 0;
      scene.add(model);
      pop = 0;
      frameModel(true);
    }
    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.fov = (opts.fov || 34) * (camera.aspect < 1 ? 1.25 : 1);
      camera.updateProjectionMatrix();
    }
    let popStart = 0;
    function loop() {
      requestAnimationFrame(loop);
      if (!running || !model) return;
      if (pop < 1) {
        if (pop === 0) popStart = performance.now();
        pop = Math.min(1, Math.max(0.001, (performance.now() - popStart) / 450));
        const e = 1 + 0.12 * Math.sin(pop * Math.PI); // pequeno "pulo"
        model.scale.setScalar(Math.max(0.01, pop * e));
      }
      controls.update();
      renderer.render(scene, camera);
    }
    window.addEventListener("resize", resize);
    resize();
    loop();
    return {
      show, resize, controls,
      reset: () => frameModel(true),
      setRunning: (v) => (running = v)
    };
  }

  /* ---------------- Hero ---------------- */
  if (has3D) {
    const featured = ["futebolSabao", "castelo", "toboga", "guerraCotonetes", "piscinaInflavel"];
    const names = Object.fromEntries(TOYS.map((t) => [t.modelo, t.nome]));
    const hero = createViewer($("#heroCanvas"), { speed: 1.3, zoom: false, dist: 1.02 });
    const dots = $("#heroDots");
    dots.innerHTML = featured.map((k, i) => `<button role="tab" aria-label="${names[k]}" data-i="${i}"></button>`).join("");
    let idx = 0, timer, userTouched = false;
    function go(i) {
      idx = (i + featured.length) % featured.length;
      hero.show(featured[idx]);
      $("#heroName").textContent = names[featured[idx]];
      $$("button", dots).forEach((b, j) => b.classList.toggle("is-active", j === idx));
    }
    function schedule() {
      clearInterval(timer);
      timer = setInterval(() => { if (!userTouched) go(idx + 1); }, 6500);
    }
    dots.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) { go(+b.dataset.i); schedule(); }
    });
    hero.controls.addEventListener("start", () => (userTouched = true));
    hero.controls.addEventListener("end", () => setTimeout(() => (userTouched = false), 5000));
    // pausa quando o hero sai da tela
    new IntersectionObserver(([e]) => hero.setRunning(e.isIntersecting)).observe($("#heroStage"));
    go(0);
    schedule();
  } else {
    $("#heroStage").innerHTML = '<p style="padding:40px;color:#0d2a6b;font-weight:800">Conecte-se à internet para ver os brinquedos em 3D.</p>';
  }

  /* ---------------- Modal ---------------- */
  const modal = $("#modal");
  let viewer = null, currentToy = null, lastFocus = null;

  function openModal(id) {
    const t = toyById[id];
    if (!t) return;
    currentToy = t;
    lastFocus = document.activeElement;
    $("#modalTitle").textContent = t.nome;
    $("#modalDesc").textContent = t.desc;
    $("#modalPrice").textContent = brl(t.preco);
    const tag = $("#modalTag");
    tag.textContent = t.categoria === "inflavel" ? "Inflável • 4h com monitor" : t.categoria === "pula" ? "Pula-pula" : "Clássico";
    tag.className = "tag" + (t.categoria === "inflavel" ? " tag--hot" : "");
    $("#modalFeats").innerHTML = t.itens.map((i) => `<li>${i}</li>`).join("");
    $("#modalWhats").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá, Arena FL Brinquedos! Tenho interesse no(a) *${t.nome}* (${brl(t.preco)}). Está disponível?`)}`;
    updateModalAdd();
    // foto real (se houver) + opção de ver em 3D
    const photo = $("#modalPhoto");
    photo.hidden = !t.foto;
    if (t.foto) { photo.src = t.foto; photo.alt = t.nome; }
    $("#vPhoto").hidden = !t.foto;
    $("#vPhoto").textContent = "🧊 Ver em 3D";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (has3D) {
      if (!viewer) viewer = createViewer($("#modalCanvas"), { speed: 1.4 });
      viewer.resize();
      viewer.show(t.modelo);
      viewer.controls.autoRotate = true;
      $("#vRotate").classList.add("is-on");
      viewer.setRunning(true);
    }
    $(".modal__close").focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (viewer) viewer.setRunning(false);
    if (lastFocus) lastFocus.focus();
  }
  function updateModalAdd() {
    if (!currentToy) return;
    const on = state.selected.has(currentToy.id);
    $("#modalAdd").textContent = on ? "✓ No orçamento (remover)" : "+ Adicionar ao orçamento";
  }
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  $("#modalAdd").addEventListener("click", () => toggleToy(currentToy.id));
  $("#vRotate").addEventListener("click", (e) => {
    viewer.controls.autoRotate = !viewer.controls.autoRotate;
    e.currentTarget.classList.toggle("is-on", viewer.controls.autoRotate);
  });
  $("#vReset").addEventListener("click", () => viewer && viewer.reset());
  $("#vPhoto").addEventListener("click", (e) => {
    const photo = $("#modalPhoto");
    photo.hidden = !photo.hidden;
    e.currentTarget.textContent = photo.hidden ? "📷 Ver foto" : "🧊 Ver em 3D";
  });

  /* =========================================================
     ORÇAMENTO
     ========================================================= */
  const quoteToys = $("#quoteToys");
  quoteToys.innerHTML = TOYS.map((t) => `
    <label class="qtoy">
      <input type="checkbox" value="${t.id}" />
      <span class="qtoy__box">
        <span class="qtoy__check">✓</span>
        <span class="qtoy__name">${t.nome}${t.categoria === "inflavel" ? "<small>4h • monitor incluso</small>" : ""}</span>
        <span class="qtoy__price">${brl(t.preco)}</span>
      </span>
    </label>`).join("");
  quoteToys.addEventListener("change", (e) => {
    const id = e.target.value;
    e.target.checked ? state.selected.add(id) : state.selected.delete(id);
    syncSelection();
  });

  function toggleToy(id) {
    const t = toyById[id];
    if (state.selected.has(id)) { state.selected.delete(id); toast(`${t.nome} removido do orçamento`); }
    else { state.selected.add(id); toast(`✓ ${t.nome} adicionado ao orçamento`); }
    syncSelection();
  }

  function syncSelection() {
    $$("input", quoteToys).forEach((i) => (i.checked = state.selected.has(i.value)));
    $$("[data-add]", grid).forEach((b) => {
      const on = state.selected.has(b.dataset.add);
      b.classList.toggle("is-added", on);
      b.textContent = on ? "✓ Adicionado" : "+ Orçamento";
    });
    updateModalAdd();
    updateSummary();
  }

  function updateSummary() {
    const list = TOYS.filter((t) => state.selected.has(t.id));
    $("#summaryList").innerHTML = list.length
      ? list.map((t) => `<li><span>${t.nome}</span><span>${brl(t.preco)}</span></li>`).join("")
      : '<li class="summary__empty">Nenhum brinquedo selecionado ainda.</li>';
    $("#sumTotal").textContent = brl(list.reduce((s, t) => s + t.preco, 0));
    $("#sumNote").hidden = !list.some((t) => t.categoria === "inflavel");
    $("#sumDate").textContent = state.date ? state.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) : "—";
    $("#sumTime").textContent = state.time || "—";
  }

  /* ---------------- Calendário ---------------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  const sameDay = (a, b) => a && b && a.getTime() === b.getTime();

  function renderCalendar() {
    $("#calTitle").textContent = view.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    $("#calPrev").disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
    const first = view.getDay();
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let html = "";
    for (let i = 0; i < first; i++) html += "<span></span>";
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const cls = [
        sameDay(date, today) && "is-today",
        sameDay(date, state.date) && "is-selected",
        (date.getDay() === 0 || date.getDay() === 6) && "is-weekend"
      ].filter(Boolean).join(" ");
      html += `<button type="button" class="${cls}" data-d="${d}" ${date < today ? "disabled" : ""} aria-label="${date.toLocaleDateString("pt-BR")}">${d}</button>`;
    }
    $("#calDays").innerHTML = html;
  }
  $("#calPrev").addEventListener("click", () => { view.setMonth(view.getMonth() - 1); renderCalendar(); });
  $("#calNext").addEventListener("click", () => { view.setMonth(view.getMonth() + 1); renderCalendar(); });
  $("#calDays").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (!b || b.disabled) return;
    state.date = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d);
    renderCalendar();
    updateSummary();
  });
  renderCalendar();

  /* ---------------- Horários ---------------- */
  const TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const timeGrid = $("#timeGrid");
  timeGrid.innerHTML = TIMES.map((t) => `<button type="button" data-t="${t}">${t}</button>`).join("");
  timeGrid.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.time = b.dataset.t;
    $$("button", timeGrid).forEach((x) => x.classList.toggle("is-selected", x === b));
    updateSummary();
  });

  /* ---------------- Enviar ---------------- */
  $("#quoteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#formError");
    const name = $("#fName").value.trim();
    const place = $("#fPlace").value.trim();
    $("#fName").parentElement.classList.toggle("is-invalid", !name);
    $("#fPlace").parentElement.classList.toggle("is-invalid", !place);

    const missing = [];
    if (!state.selected.size) missing.push("escolha ao menos um brinquedo");
    if (!state.date) missing.push("selecione a data");
    if (!state.time) missing.push("selecione o horário");
    if (!name) missing.push("informe seu nome");
    if (!place) missing.push("informe o local do evento");
    if (missing.length) {
      err.textContent = "Para continuar: " + missing.join(", ") + ".";
      err.hidden = false;
      return;
    }
    err.hidden = true;

    const list = TOYS.filter((t) => state.selected.has(t.id));
    const total = list.reduce((s, t) => s + t.preco, 0);
    const lines = [
      "Olá, Arena FL Brinquedos! 🎉",
      "Gostaria de solicitar um orçamento:",
      "",
      "*Brinquedos:*",
      ...list.map((t) => `• ${t.nome} — ${brl(t.preco)}`),
      "",
      `*Total estimado:* ${brl(total)}`,
      `*Data:* ${state.date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}`,
      `*Horário de início:* ${state.time}`,
      `*Evento:* ${$("#fType").value}`,
      `*Local:* ${place}`,
      `*Nome:* ${name}`
    ];
    const notes = $("#fNotes").value.trim();
    if (notes) lines.push(`*Observações:* ${notes}`);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  });

  updateSummary();
})();
