/* SRGS — script del sito (JavaScript semplice, nessuna libreria) */
(function () {
  "use strict";

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Voce di menu attiva durante lo scorrimento ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  if ("IntersectionObserver" in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (a) { a.classList.remove("active"); });
          byId[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) obs.observe(s);
    });
  }

  /* ---------- Immagine con segnaposto se il file non esiste ancora ---------- */
  function makePlaceholder(src) {
    var d = document.createElement("div");
    d.className = "placeholder";
    d.textContent = src;
    return d;
  }
  function makeImage(src, alt) {
    var img = document.createElement("img");
    img.alt = alt || "";
    img.loading = "lazy";
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.replaceChild(makePlaceholder(src), img);
    });
    img.src = src;
    return img;
  }
  // Immagini singole (es. scheda ArboLens): <div class="js-img" data-src="..." data-alt="...">
  document.querySelectorAll(".js-img").forEach(function (box) {
    box.parentNode.replaceChild(makeImage(box.getAttribute("data-src"), box.getAttribute("data-alt")), box);
  });

  /* ---------- Lightbox condiviso ---------- */
  var lb = document.getElementById("lightbox");
  var lbMedia = lb.querySelector(".lb-media");
  var lbCaption = lb.querySelector(".lb-caption");
  var lbState = { items: [], index: 0, onChange: null, lastFocus: null };

  function lbRender() {
    var it = lbState.items[lbState.index];
    lbMedia.innerHTML = "";
    lbMedia.appendChild(makeImage(it.src, it.caption));
    lbCaption.textContent = it.caption + " — " + (lbState.index + 1) + " / " + lbState.items.length;
  }
  function lbOpen(items, index, onChange) {
    lbState.items = items; lbState.index = index; lbState.onChange = onChange;
    lbState.lastFocus = document.activeElement;
    lbRender();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }
  function lbClose() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lbState.lastFocus) lbState.lastFocus.focus();
  }
  function lbGo(step) {
    var n = lbState.items.length;
    lbState.index = (lbState.index + step + n) % n;
    lbRender();
    if (lbState.onChange) lbState.onChange(lbState.index);
  }
  lb.querySelector(".lb-close").addEventListener("click", lbClose);
  lb.querySelector(".lb-prev").addEventListener("click", function () { lbGo(-1); });
  lb.querySelector(".lb-next").addEventListener("click", function () { lbGo(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbGo(-1);
    else if (e.key === "ArrowRight") lbGo(1);
    else if (e.key === "Tab") { // mantiene il focus dentro il visualizzatore
      var f = lb.querySelectorAll("button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Gallerie indipendenti ---------- */
  document.querySelectorAll(".gallery").forEach(function (gallery) {
    var items = Array.prototype.map.call(gallery.querySelectorAll(".gallery-source li"), function (li) {
      return { src: li.getAttribute("data-src"), caption: li.textContent.trim() };
    });
    if (!items.length) return;
    var index = 0;

    var stage = document.createElement("div");
    stage.className = "g-stage";
    stage.setAttribute("role", "button");
    stage.setAttribute("tabindex", "0");
    stage.setAttribute("aria-label", "Apri l'immagine a schermo intero");

    var caption = document.createElement("div");
    caption.className = "g-caption";
    var capText = document.createElement("span");
    var capCount = document.createElement("span");
    capCount.className = "mono";
    caption.appendChild(capText); caption.appendChild(capCount);

    var controls = document.createElement("div");
    controls.className = "g-controls";
    var prev = document.createElement("button");
    prev.type = "button"; prev.className = "g-btn"; prev.textContent = "←";
    prev.setAttribute("aria-label", "Immagine precedente");
    var next = document.createElement("button");
    next.type = "button"; next.className = "g-btn"; next.textContent = "→";
    next.setAttribute("aria-label", "Immagine successiva");
    var thumbs = document.createElement("div");
    thumbs.className = "g-thumbs";

    var thumbBtns = items.map(function (it, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "g-thumb";
      b.setAttribute("aria-label", "Mostra immagine " + (i + 1) + ": " + it.caption);
      b.appendChild(makeImage(it.src, ""));
      b.addEventListener("click", function () { show(i); });
      thumbs.appendChild(b);
      return b;
    });

    controls.appendChild(prev); controls.appendChild(thumbs); controls.appendChild(next);
    gallery.appendChild(stage); gallery.appendChild(caption); gallery.appendChild(controls);

    function show(i) {
      index = (i + items.length) % items.length;
      stage.innerHTML = "";
      stage.appendChild(makeImage(items[index].src, items[index].caption));
      capText.textContent = items[index].caption;
      capCount.textContent = (index + 1) + " / " + items.length;
      thumbBtns.forEach(function (b, j) { b.setAttribute("aria-current", j === index ? "true" : "false"); });
      var t = thumbBtns[index];
      thumbs.scrollLeft = t.offsetLeft - thumbs.clientWidth / 2 + t.clientWidth / 2;
    }
    prev.addEventListener("click", function () { show(index - 1); });
    next.addEventListener("click", function () { show(index + 1); });
    function open() { lbOpen(items, index, show); }
    stage.addEventListener("click", open);
    stage.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
    });

    // scorrimento con il dito su smartphone
    var x0 = null;
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    show(0);
  });

  /* ---------- Modulo contatti ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
        var wrap = el.closest(".field, .check");
        var valid = el.type === "checkbox" ? el.checked : el.checkValidity() && el.value.trim() !== "";
        if (wrap) wrap.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.textContent = "Compila i campi obbligatori e accetta l'informativa sulla privacy.";
        status.classList.add("err");
        return;
      }
      var action = form.getAttribute("action");
      if (!action || action.indexOf("INSERIRE") === 0) {
        status.textContent = "Il modulo non è ancora collegato: inserire l'indirizzo del servizio in index.html.";
        status.classList.add("err");
        return;
      }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      status.textContent = "Invio in corso…";
      fetch(action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          status.textContent = "Grazie, il messaggio è stato inviato. Vi risponderemo al più presto.";
          status.classList.add("ok");
        })
        .catch(function () {
          status.textContent = "Si è verificato un problema. Riprova oppure scrivici via email.";
          status.classList.add("err");
        })
        .then(function () { btn.disabled = false; });
    });
    form.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        var wrap = el.closest(".field, .check");
        if (wrap) wrap.classList.remove("invalid");
      });
    });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
