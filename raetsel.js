// Zentrale Konfiguration. Vor dem 1. Dezember developerEnabled auf false setzen.
window.MENDEL = {
  year: 2026,
  timeZone: "Europe/Vienna",
  developerEnabled: true,
  // Bibliografische Arbeitsdaten; nicht als zusätzliche Hinweise auf der Website anzeigen.
  libraryCard: {
    bookNumber: "1929-022", group: "E – Erzählungen",
    title: "Zweig, Stefan – Buchmendel",
    source: "Neue Freie Presse, 1.–3. XI. 1929", year: 1929,
    pages: "22 (S. 5–26)", subtitle: "Eine Erzählung", illustrations: "–",
    loans: [
      {reader: "0204", group: "I", due: "30.11.1929"},
      {reader: "0403", group: "II", due: "30.11.2026"},
      {reader: "0304", group: "III", due: "24.12.2026"}
    ]
  },
  // Später festlegen: abschließender Text. Bis dahin bleibt das Finale unsichtbar.
  finale: null,
  days: {
    1: {
      title: "Der erste Eintrag",
      page: "5",
      prompt: "Schlage Seite 5 auf und folge den handschriftlichen Spuren zwischen den Zeilen.",
      answer: "GLUCK",
      solution: "Gluck – der erste Name ist gefunden.",
      fragment: null
    }
    // Weitere Tage hier ergänzen. Beispielstruktur: title, page, prompt, answer, solution, fragment.
    // Optional: aliases: ["ANDERE SCHREIBWEISE"] (nur bei gleicher normalisierter Länge).
  }
};
