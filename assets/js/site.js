(function () {
  "use strict";
  var loadT = Date.now();
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var mb = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  if (mb && nav) {
    var close = function () { nav.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); };
    mb.addEventListener("click", function () { var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o ? "true" : "false"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { close(); mb.focus(); } });
    document.addEventListener("click", function (e) { if (nav.classList.contains("open") && !e.target.closest(".top")) close(); });
  }

  function dest(el) {
    try {
      return atob(el.getAttribute("data-a")) + String.fromCharCode(64) + atob(el.getAttribute("data-b")) + atob(el.getAttribute("data-c"));
    } catch (e) { return ""; }
  }

  document.querySelectorAll("a.mail").forEach(function (a) {
    var to = dest(a);
    if (!to) return;
    a.href = "mailto:" + to + "?subject=" + encodeURIComponent("EARTH refund");
    a.textContent = to;
  });

  var form = document.getElementById("join");
  if (form) {
    var touched = false;
    var mark = function () { touched = true; };
    form.addEventListener("keydown", mark);
    form.addEventListener("pointerdown", mark);
    var status = form.querySelector(".status");
    var btn = form.querySelector("button[type=submit]");
    var say = function (s, msg) { status.setAttribute("data-s", s); status.textContent = msg; };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.querySelector("[name=_honey]").value) { say("bad", "That didn't go through. Please try again."); return; }
      if (!touched || Date.now() - loadT < 3000) { say("warn", "Give it a second, then press the button again."); return; }
      var to = dest(form);
      if (!to) { say("bad", "Sending failed on our end. Please try again later."); return; }
      var picks = [];
      form.querySelectorAll("input[name=interest]:checked").forEach(function (c) { picks.push(c.value); });
      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        excited_about: picks.length ? picks.join(", ") : "Not specified",
        page: location.href,
        _subject: form.elements._subject.value,
        _template: "table",
        _captcha: "false",
        _honey: ""
      };
      btn.disabled = true;
      say("warn", "Sending...");
      fetch("https://formsubmit.co/ajax/" + to, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        var okv = res.j && (res.j.success === true || res.j.success === "true");
        if (res.ok && okv) {
          say("ok", "You're on the list. We'll email you when there's news.");
          form.reset();
        } else {
          say("warn", "We couldn't confirm your signup went through. Please try again in a little while.");
        }
      }).catch(function () {
        say("bad", "Sending failed. Check your connection and try again.");
      }).then(function () { btn.disabled = false; });
    });
  }

  var icons = {
    play: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor"/></svg>'
  };

  var gv = document.getElementById("glimpse-video"), gb = document.getElementById("glimpse-btn");
  if (gv && gb) {
    var setG = function () {
      var playing = !gv.paused;
      gb.innerHTML = (playing ? icons.pause : icons.play) + "<span>" + (playing ? "Pause title" : "Play title") + "</span>";
      gb.setAttribute("aria-pressed", playing ? "true" : "false");
    };
    var userPaused = false;
    gb.addEventListener("click", function () {
      if (gv.paused) { userPaused = false; gv.play().catch(function () {}); }
      else { userPaused = true; gv.pause(); }
    });
    gv.addEventListener("play", setG);
    gv.addEventListener("pause", setG);
    setG();
    var saveData = navigator.connection && navigator.connection.saveData;
    if (!reduced && !saveData && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!userPaused && gv.paused) gv.play().catch(function () {}); }
        else if (!gv.paused) gv.pause();
      }, { threshold: 0.4 }).observe(gv);
    }
  }

  var sv = document.getElementById("sting-video"), sb = document.getElementById("sting-btn");
  if (sv && sb) {
    var setS = function () {
      var playing = !sv.paused && !sv.ended;
      sb.innerHTML = (playing ? icons.pause : icons.play) + "<span>" + (playing ? "Pause" : "Play the logo") + "</span>";
    };
    sb.addEventListener("click", function () {
      if (sv.paused || sv.ended) { sv.play().catch(function () {}); }
      else sv.pause();
    });
    sv.addEventListener("play", setS);
    sv.addEventListener("pause", setS);
    sv.addEventListener("ended", setS);
    setS();
  }

  document.querySelectorAll("[data-focus-join]").forEach(function (a) {
    a.addEventListener("click", function () {
      var f = document.getElementById("wl-name");
      if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, reduced ? 0 : 450);
    });
  });
})();
