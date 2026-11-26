window.MENDEL = {
  year: 2026,
  timeZone: "Europe/Vienna",
  developerEnabled: true,

  libraryCard: {
    bookNumber: "1929-022",
    group: "E – Erzählungen",
    title: "Zweig, Stefan – Buchmendel",
    source: "Neue Freie Presse, 1.–3. XI. 1929",
    year: 1929,
    pages: "22 (S. 5–26)",
    subtitle: "Eine Erzählung",
    illustrations: "–",
    loans: [
      { reader: "0204", group: "I", due: "30.11.1929" },
      { reader: "0403", group: "II", due: "30.11.2026" },
      { reader: "0304", group: "III", due: "24.12.2026" }
    ]
  },

  finale: null,

  days: {
    1: {
      title: "Der erste Eintrag",
      page: "5",
      answer: "GLUCK",
      solution: "Gluck – der erste Name ist gefunden.",
      fragment: null
    },

    2: {
      title: "Das zweite Fragment",
      page: "6",
      image: "./Day02.jpg",
      imageAlt: "Das Ossuarium von Sedlec",
      answer: "SEDLEC",
      solution: "Sedlec – das Ossuarium ist erkannt.",
      fragment: null
    },
    3: {
      title: "Die Partie der Professoren",
      page: "7",
      answer: "G3",
      solution: "Die Zugfolge ist gefunden.",
      fragment: null,
      chess: {
        fen: "r5k1/pR3pbp/2p2np1/3p4/P1PP4/B3rp2/3N1P2/1R1QKN1q w - - 0 1",
        line: ["f2e3","h1h4","f1g3","h4g3"],
        player: "b"
      }
    },
    4: {
      title: "Das Magnetkabinett",
      page: "8",
      answer: "MESMER",
      solution: "Die Nadeln haben das Geheimnis des Magnetiseurs enthüllt.",
      fragment: null,
      magnet: true
    },
    5: {
      title: "Mendels Antiquariatskatalog",
      page: "9",
      answer: "ANTIQUAR",
      solution: "Der Katalog ist vollständig.",
      fragment: null,
      catalog: {
        "books": [
          {
            "title": "Malleus Maleficarum",
            "year": 1487,
            "author": 0,
            "letter": "A"
          },
          {
            "title": "Nützlicher Unterricht wider den Teufel zu streiten",
            "year": 1774,
            "author": 1,
            "letter": "N"
          },
          {
            "title": "Rapport des commissaires… du magnétisme animal",
            "year": 1784,
            "author": 2,
            "letter": "T"
          },
          {
            "title": "Recherches… sur le somnambulisme naturel",
            "year": 1811,
            "author": 3,
            "letter": "I"
          },
          {
            "title": "Neurypnology",
            "year": 1843,
            "author": 4,
            "letter": "Q"
          },
          {
            "title": "A Treatise on Electricity and Magnetism",
            "year": 1873,
            "author": 5,
            "letter": "U"
          },
          {
            "title": "Science and Health",
            "year": 1875,
            "author": 6,
            "letter": "A"
          },
          {
            "title": "Isis Unveiled",
            "year": 1877,
            "author": 7,
            "letter": "R"
          }
        ],
        "authors": [
          "Heinrich Kramer",
          "Johann Joseph Gaßner",
          "Jean-Sylvain Bailly u. a.",
          "Marquis de Puységur",
          "James Braid",
          "James Clerk Maxwell",
          "Mary Baker Eddy",
          "Helena P. Blavatsky"
        ],
        "order": [
          5,
          3,
          7,
          0,
          6,
          2,
          4,
          1
        ]
      }
    },
    6: {
      title: "Ein ungewöhnlicher Name",
      page: "10",
      answer: "EREN",
      solution: "Ein Name aus einer anderen Welt.",
      fragment: null
    },
    7: {
      title: "„Ich zeig dich an!“ – Mendel",
      page: "11",
      answer: "NEUE FREIE PRESSE",
      solution: "AUTISM",
      fragment: null
    },
    8: {
      title: "Nur einer ist er schuldig…",
      page: "12",
      answer: "TODSÜNDEN",
      solution: "TODSÜNDEN",
      fragment: null
    },
    9: {
      title: "Finde Princeton University",
      page: "13",
      answer: "PRINCETON",
      solution: "Princeton University",
      fragment: null,
      geography: {
        latitude: 40.34285,
        longitude: -74.65682,
        radiusKm: 100
      }
    },
    10: {
      title: "Eine Welt über unserer Welt",
      page: "14",
      image: "./assets/day10-brille.svg",
      imageAlt: "Antike Brille mit winzigen Lettern. Non omnia oculis patent.",
      answer: "4348",
      solution: "MENDEL",
      fragment: null
    },
    11: {
      title: "Die verlorenen Spuren",
      page: "15",
      answer: "SPUREN",
      solution: "Nicht jede Spur verweht.",
      fragment: null,
      crossword: {
        "width": 9,
        "height": 14,
        "words": [
          {
            "number": 1,
            "dir": "down",
            "x": 5,
            "y": 0,
            "answer": "SCHOKOLADEFRAU",
            "clue": "Sporschil vulgo …?"
          },
          {
            "number": 2,
            "dir": "down",
            "x": 8,
            "y": 0,
            "answer": "FLORIANIGASSE",
            "clue": "In welcher Gasse befindet sich das Kurzwarengeschäft?"
          },
          {
            "number": 3,
            "dir": "across",
            "x": 0,
            "y": 1,
            "answer": "SPORSCHIL",
            "clue": "Wer erinnert sich letztendlich an Mendel?"
          },
          {
            "number": 3,
            "dir": "down",
            "x": 0,
            "y": 1,
            "answer": "STANDHARTNER",
            "clue": "Wie hieß der ehemalige Besitzer des Cafés?"
          },
          {
            "number": 4,
            "dir": "across",
            "x": 2,
            "y": 8,
            "answer": "MANDL",
            "clue": "Mit wem verwechselt der Oberkellner Mendel?"
          },
          {
            "number": 5,
            "dir": "across",
            "x": 4,
            "y": 11,
            "answer": "KREMS",
            "clue": "In der Nähe welcher Stadt lebt der ehemalige Oberkellner?"
          }
        ],
        "extract": [
          [
            0,
            1
          ],
          [
            1,
            1
          ],
          [
            5,
            13
          ],
          [
            8,
            3
          ],
          [
            6,
            11
          ],
          [
            4,
            8
          ]
        ]
      }
    },
    12: {
      title: "Ein Kopf ohne Welt",
      page: "16",
      answer: "BLENDUNG",
      solution: "BLENDUNG",
      fragment: null
    },
    13: {
      title: "Eine Postkarte nach Paris",
      page: "17",
      answer: "LABOURDAIRE",
      solution: "LABOURDAIRE",
      fragment: null
    },
    14: {
      title: "Finde Aldridge",
      page: "18",
      answer: "ALDRIDGE",
      solution: "ALDRIDGE",
      fragment: null,
      geography: {
        latitude: 52.60542,
        longitude: -1.91722,
        radiusKm: 100,
        hint: "Tipp: GeoWizard wohnt dort.",
        targetLabel: "Aldridge"
      }
    }

    // Weitere Tage hier ergänzen.
    // Beispiel:
    // 3: {
    //   title: "Titel",
    //   page: "7",
    //   answer: "WORT",
    //   solution: "Kurzer Lösungstext.",
    //   fragment: "X"
    // }
  }
};