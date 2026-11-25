# Mendelkalender 2026

Ein statischer Adventkalender zu Stefan Zweigs Buchmendel. Keine Abhängigkeiten, kein Build und kein Backend.

## Website
GitHub Pages: im Repository unter Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save. Die Projektseite liegt anschließend unter https://troglodytus.github.io/Adventkalender2026/.

## Bearbeitung
- index.html: Oberfläche.
- style.css: Gestaltung.
- app.js: Datumssperre, Eingabe, Fortschritt und Anzeige.
- raetsel.js: alle Rätsel, Entlehnungskarte, optionale Fundstücke und Finale.
- Entwicklerbetrieb: developerEnabled: true öffnet alle Türchen und bietet einen Schalter zum Testen der Datumssperre. Für die Veröffentlichung auf false setzen. Testfortschritt ist vom echten Fortschritt getrennt.
- Datumssperre: 00:00 Uhr Europe/Vienna am jeweiligen Dezembertag 2026. Frühere Tage bleiben auch nach Weihnachten offen.
- Fortschritt bleibt im lokalen Browser gespeichert; kein geräteübergreifender Sync.
- Die Einträge 2–24 sind absichtlich leer. Pro Eintrag können title, page, prompt, answer, solution und fragment definiert werden. Akzeptierte Varianten optional über aliases (gleiche normalisierte Länge). Umlaute werden als AE/OE/UE behandelt, Leer- und Sonderzeichen ignoriert; Zahlen sind möglich.
- Für das Finale: optionale Fragmente pro Tag eintragen; finale erst festlegen, wenn die Rätselkette feststeht. Ein konfigurierte Abschlussbotschaft wird erst nach 24 richtigen Antworten angezeigt.
- Die Entlehnungskarte ist ein veränderbarer Datensatz und kein zusätzlicher digitaler Hinweis. Bibliografische Angaben sind Arbeitsdaten des Projekts.

Hinweis: Bei einer statischen öffentlichen Website sind die Lösungscodes und die Datumssperre technisch einsehbar bzw. umgehbar. Keine vertraulichen Informationen eintragen.
