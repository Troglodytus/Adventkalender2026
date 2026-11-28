(() => {
  "use strict";

  const config = window.MENDEL;

  const $ = (id) => document.getElementById(id);

  const calendar = $("calendar");
  const dialog = $("day-dialog");
  const letters = $("letters");

  const pad = (n) => String(n).padStart(2, "0");

  const normalize = (s) =>
    String(s)
      .toUpperCase()
      .replace(/Ä/g, "AE")
      .replace(/Ö/g, "OE")
      .replace(/Ü/g, "UE")
      .replace(/[^A-Z0-9]/g, "");

  const dateKey = (date = new Date()) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: config.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
        .formatToParts(date)
        .map((p) => [p.type, p.value])
    );

    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  const dayKey = (day) => `${config.year}-12-${pad(day)}`;

  let dev = Boolean(config.developerEnabled);
  let active = null;
  let lastButton = null;
  let stopInteractive = null;

  const fallbackMemory = {};

  const storageKey = () =>
    `mendel-${config.year}-${dev ? "test" : "progress"}-v2`;

  function readProgress() {
    try {
      const raw = localStorage.getItem(storageKey()) || "{}";
      const data = JSON.parse(raw);
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
      return fallbackMemory[storageKey()] || {};
    }
  }

  let progress = readProgress();

  function saveProgress() {
    fallbackMemory[storageKey()] = progress;
    try {
      localStorage.setItem(storageKey(), JSON.stringify(progress));
    } catch {}
  }

  function solved(day) {
    const puzzle = config.days[day];
    return Boolean(puzzle?.answer && progress[day] === normalize(puzzle.answer));
  }

  function isOpen(day) {
    return dev || dateKey() >= dayKey(day);
  }

  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  const badgeIcons = {
    locked:
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>',
    solved:
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>'
  };

  function render() {
    const today = dateKey();
    const restoreDay = document.activeElement?.dataset?.day;

    calendar.replaceChildren();

    let count = 0;
    const cabinet = el("div", "cabinet");
    const shelves = [el("div", "shelf-row"), el("div", "shelf-row")];
    shelves.forEach(shelf => cabinet.append(shelf));
    calendar.append(cabinet);
    const spineSizes = [[0.88,0.91],[1.16,0.99],[0.72,0.84],[1.05,0.94],[0.83,0.79],[1.32,1],[0.92,0.89],[1.14,0.96],[0.76,0.82],[1.2,0.92],[0.87,0.86],[1.08,0.97],[1.22,0.98],[0.81,0.86],[1.02,0.92],[0.74,0.78],[1.16,0.96],[0.87,0.88],[1.27,1],[0.75,0.85],[1.07,0.94],[0.91,0.82],[1.19,0.97],[0.99,0.9]];

    for (let day = 1; day <= 24; day++) {
      const open = isOpen(day);
      const done = open && solved(day);

      if (done) count++;

      const button = el("button", "door");
      const [width, height] = spineSizes[day - 1];
      button.style.setProperty("--spine-width", width);
      button.style.setProperty("--spine-height", (height * 100) + "%");
      button.style.setProperty("--spine-image", 'url("./assets/spines/' + pad(day) + '.svg")');
      button.type = "button";
      button.dataset.day = day;
      button.disabled = !open;

      if (done) button.classList.add("solved");
      if (today === dayKey(day)) button.classList.add("today");

      const number = el("span", "number", pad(day));
      button.append(number);

      if (!open || done) {
        const badge = el("span", "badge");
        badge.innerHTML = done ? badgeIcons.solved : badgeIcons.locked;
        button.append(badge);
      }

      button.setAttribute(
        "aria-label",
        `${day}. Dezember${done ? ", gelöst" : open ? ", geöffnet" : ", gesperrt"}`
      );

      button.addEventListener("click", () => {
        lastButton = button;
        openDay(day);
      });

      shelves[Math.floor((day - 1) / 12)].append(button);
    }

    if (restoreDay && !dialog.open) {
      calendar.querySelector(`[data-day="${restoreDay}"]`)?.focus();
    }

    $("count").textContent = `${count} / 24 gelöst`;
    $("progress").style.width = `${(count / 24) * 100}%`;
    $("progress").parentElement.setAttribute("aria-valuenow", count);

    $("calendar-note").textContent = dev
      ? "Testmodus · Alle 24 Bände sind geöffnet."
      : today < dayKey(1)
        ? "Der erste Band öffnet sich am 1. Dezember."
        : today > dayKey(24)
          ? "Alle Bände stehen dir offen."
          : "Jeden Tag öffnet sich ein weiterer Band.";

    const fragments = Array.from({ length: 24 }, (_, i) => i + 1)
      .filter((d) => isOpen(d) && solved(d) && config.days[d]?.fragment)
      .map((d) => config.days[d].fragment);

    const finalReady = count === 24 && Boolean(config.finale);

    $("register").hidden = !fragments.length && !finalReady;
    $("fragments").replaceChildren(...fragments.map((f) => el("span", "", f)));
    $("finale").hidden = !finalReady;
    $("finale").textContent = finalReady ? config.finale : "";

    $("reset").hidden = !dev;
  }

  function openDay(day) {
    if (!isOpen(day)) return;

    active = day;
    const puzzle = config.days[day];

    $("day-date").textContent = `${pad(day)}. Dezember ${config.year}`;
    $("day-title").textContent = puzzle?.title || `Eintrag ${pad(day)}`;
    $("day-page").textContent = puzzle?.page ? `Seite ${puzzle.page}` : "";

    const mediaWrap = $("day-media");
    const image = $("day-image");

    if (puzzle?.image) {
      image.src = puzzle.image;
      image.alt = puzzle.imageAlt || puzzle.title || `Bild zu Tag ${day}`;
      mediaWrap.hidden = false;
    } else {
      image.removeAttribute("src");
      image.alt = "";
      mediaWrap.hidden = true;
    }

    if (stopInteractive) { stopInteractive(); stopInteractive = null; }
    $("chess-puzzle").hidden = !puzzle?.chess;
    $("magnet-puzzle").hidden = !puzzle?.magnet;
    $("catalog-puzzle").hidden = !puzzle?.catalog;
    $("geography-puzzle").hidden = !puzzle?.geography;
    $("crossword-puzzle").hidden = !puzzle?.crossword;
    $("protocol-puzzle").hidden = !puzzle?.protocol;
    $("correspondence-puzzle").hidden = !puzzle?.correspondence;
    $("glasses-puzzle").hidden = !puzzle?.glasses;
    $("piano-puzzle").hidden = !puzzle?.piano;
    $("slider-puzzle").hidden = !puzzle?.slider;
    $("differences-puzzle").hidden = !puzzle?.differences;
    $("answer-form").hidden = !puzzle?.answer || !!puzzle?.chess || !!puzzle?.magnet || !!puzzle?.catalog || !!puzzle?.geography || !!puzzle?.crossword || !!puzzle?.protocol || !!puzzle?.correspondence || !!puzzle?.glasses || !!puzzle?.piano || !!puzzle?.slider || !!puzzle?.differences;
    $("solution").hidden = true;
    $("solution-fragment").hidden = true;
    $("feedback").textContent = "";
    $("feedback").classList.remove("success");

    letters.className = "letters";
    letters.replaceChildren();

    if (puzzle?.chess || puzzle?.magnet || puzzle?.catalog || puzzle?.geography || puzzle?.crossword || puzzle?.protocol || puzzle?.correspondence || puzzle?.glasses || puzzle?.piano || puzzle?.slider || puzzle?.differences) {
      const options = {
        completed: solved(day),
        onSolved: () => {
          if (active !== day) return;
          progress[day] = normalize(puzzle.answer);
          saveProgress();
          if (puzzle.magnet || puzzle.catalog || puzzle.geography || puzzle.crossword || puzzle.protocol || puzzle.correspondence || puzzle.glasses || puzzle.piano || puzzle.slider || puzzle.differences) { render(); return; }
          $("solution-word").textContent = puzzle.answer;
          $("solution-text").textContent = puzzle.solution;
          $("solution-fragment").hidden = !puzzle.fragment;
          $("solution-fragment").textContent = puzzle.fragment ? "Fundstück: " + puzzle.fragment : "";
          $("solution").hidden = false;
          render();
        }
      };
      stopInteractive = puzzle.chess
        ? window.MendelChess.mount($("chess-puzzle"), puzzle.chess, options)
        : puzzle.magnet
          ? window.MendelMagnet.mount($("magnet-puzzle"), options)
          : puzzle.catalog
            ? window.MendelCatalog.mount($("catalog-puzzle"), puzzle.catalog, options)
            : puzzle.geography
              ? window.MendelGeography.mount($("geography-puzzle"), puzzle.geography, options)
              : puzzle.crossword
                ? window.MendelCrossword.mount($("crossword-puzzle"), puzzle.crossword, options)
                : puzzle.protocol
                  ? window.MendelProtocol.mount($("protocol-puzzle"), puzzle.protocol, options)
                  : puzzle.correspondence
                    ? window.MendelCorrespondence.mount($("correspondence-puzzle"), puzzle.correspondence, options)
                    : puzzle.glasses
                      ? window.MendelGlasses.mount($("glasses-puzzle"), puzzle.glasses, options)
                      : puzzle.piano
                        ? window.MendelPiano.mount($("piano-puzzle"), puzzle.piano, options)
                        : puzzle.slider
                          ? window.MendelSlider.mount($("slider-puzzle"), puzzle.slider, options)
                          : window.MendelDifferences.mount($("differences-puzzle"), puzzle.differences, options);
    } else if (puzzle?.answer) {
      const answer = normalize(puzzle.answer);
      const wordParts = String(puzzle.answer).trim().split(/\s+/).map(normalize).filter(Boolean);
      const grouped = wordParts.length > 1 && wordParts.join("") === answer;
      const boxes = [];
      const wordParents = [];
      if (grouped) {
        letters.classList.add("word-groups");
        for (const word of wordParts) {
          const group = el("div", "letter-word");
          group.style.setProperty("--word-length", word.length);
          letters.append(group);
          for (let j = 0; j < word.length; j++) wordParents.push(group);
        }
      }

      function check() {
        const values = boxes.map((b) => b.value);
        const guess = values.join("");
        const complete = values.every(Boolean);
        const aliases = (puzzle.aliases || []).map(normalize);
        const correct = complete && [answer, ...aliases].includes(guess);

        letters.classList.toggle("wrong", complete && !correct);
        letters.classList.toggle("correct", correct);
        $("feedback").classList.toggle("success", correct);

        $("feedback").textContent = correct
          ? "Richtig."
          : complete
            ? "Noch nicht ganz."
            : "";

        if (correct) {
          progress[day] = answer;
          saveProgress();

          boxes.forEach((b) => {
            b.readOnly = true;
          });

          $("solution-word").textContent = puzzle.answer;
          $("solution-text").textContent =
            puzzle.solution || "Ein weiterer Eintrag ist gefunden.";

          $("solution-fragment").hidden = !puzzle.fragment;
          $("solution-fragment").textContent = puzzle.fragment
            ? `Fundstück: ${puzzle.fragment}`
            : "";

          $("solution").hidden = false;
          render();
        }
      }

      function assign(start, rawValue) {
        const chars = normalize(rawValue).split("");

        if (!chars.length) {
          boxes[start].value = "";
          check();
          return;
        }

        chars.slice(0, boxes.length - start).forEach((ch, i) => {
          boxes[start + i].value = ch;
        });

        const nextIndex = Math.min(start + chars.length, boxes.length - 1);

        if (start + chars.length < boxes.length) {
          boxes[nextIndex].focus();
        } else {
          boxes[boxes.length - 1].focus();
        }

        check();
      }

      for (let i = 0; i < answer.length; i++) {
        const box = el("input", "letter");
        box.type = "text";
        box.inputMode = /^[0-9]+$/.test(answer) ? "numeric" : "text";
        box.autocomplete = "off";
        box.autocapitalize = "characters";
        box.spellcheck = false;
        box.maxLength = 4;
        box.setAttribute("aria-label", `Zeichen ${i + 1} von ${answer.length}`);

        box.addEventListener("focus", () => box.select());

        box.addEventListener("input", () => {
          if (!box.readOnly) assign(i, box.value);
        });

        box.addEventListener("paste", (e) => {
          if (box.readOnly) return;
          e.preventDefault();
          assign(i, e.clipboardData.getData("text"));
        });

        box.addEventListener("keydown", (e) => {
          if (grouped && e.key === " ") {
            e.preventDefault();
            return;
          }
          if (e.key === "ArrowLeft" && i > 0) {
            e.preventDefault();
            boxes[i - 1].focus();
          }

          if (e.key === "ArrowRight" && i < boxes.length - 1) {
            e.preventDefault();
            boxes[i + 1].focus();
          }

          if (e.key === "Backspace" && !box.value && i > 0 && !box.readOnly) {
            e.preventDefault();
            boxes[i - 1].value = "";
            boxes[i - 1].focus();
            check();
          }

          if (e.key === "Enter") {
            e.preventDefault();
            check();
          }
        });

        boxes.push(box);
        (wordParents[i] || letters).append(box);
      }

      if (solved(day)) {
        boxes.forEach((b, i) => {
          b.value = answer[i];
          b.readOnly = true;
        });
        check();
      }
    }

    if (!dialog.open) dialog.showModal();
    $("close").focus();
  }

  $("answer-form").addEventListener("submit", (e) => e.preventDefault());

  $("close").addEventListener("click", () => dialog.close());
  $("back").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    if (stopInteractive) { stopInteractive(); stopInteractive = null; }
    const button = calendar.querySelector(`[data-day="${active}"]`) || lastButton;
    button?.focus();
    active = null;
  });

  $("dev-control").hidden = !config.developerEnabled;
  $("dev-toggle").checked = dev;

  $("dev-toggle").addEventListener("change", (e) => {
    dev = Boolean(config.developerEnabled && e.target.checked);
    progress = readProgress();
    render();
  });

  $("reset").addEventListener("click", () => {
    if (!dev || !confirm("Nur den Testfortschritt löschen?")) return;
    progress = {};
    saveProgress();
    render();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === storageKey()) {
      progress = readProgress();
      if (!dialog.open) render();
    }
  });

  let lastDate = dateKey();

  function refreshDate() {
    const next = dateKey();
    if (next !== lastDate) {
      lastDate = next;
      if (dialog.open && !isOpen(active)) dialog.close();
      render();
    }
  }

  setInterval(refreshDate, 15000);
  document.addEventListener("visibilitychange", refreshDate);

  render();
})();