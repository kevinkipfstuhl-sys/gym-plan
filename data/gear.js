/* Gerätetypen (für Filter und "Maschinen zuerst") und konkrete Geräte fürs Profil */
export const EQUIP_TYPES = [
  { id: "maschine", name: "Maschine" },
  { id: "kabel", name: "Kabelzug" },
  { id: "multipresse", name: "Multipresse" },
  { id: "kh", name: "Kurzhantel" },
  { id: "lh", name: "Langhantel" },
  { id: "koerper", name: "Körpergewicht" },
  { id: "band", name: "Band" },
  { id: "cardio", name: "Cardio" }
];

export const EQUIP_PRIORITY = { maschine: 0, kabel: 1, multipresse: 2, kh: 3, lh: 4, koerper: 5, band: 6, cardio: 7 };

export const GEAR = [
  { id: "brustpresse", name: "Brustpresse", equip: "maschine" },
  { id: "schraegbrustpresse", name: "Schrägbank-Brustpresse", equip: "maschine" },
  { id: "butterfly", name: "Butterfly / Reverse Butterfly", equip: "maschine" },
  { id: "dip_maschine", name: "Dip-Maschine", equip: "maschine" },
  { id: "latzug", name: "Latzug", equip: "maschine" },
  { id: "rudermaschine", name: "Rudermaschine", equip: "maschine" },
  { id: "klimmzug_maschine", name: "Assistierte Klimmzug-/Dip-Maschine", equip: "maschine" },
  { id: "pullover_maschine", name: "Pullover-Maschine", equip: "maschine" },
  { id: "rueckenstrecker", name: "Rückenstrecker-Maschine", equip: "maschine" },
  { id: "schulterpresse", name: "Schulterpresse", equip: "maschine" },
  { id: "seitheben_maschine", name: "Seitheben-Maschine", equip: "maschine" },
  { id: "bizepsmaschine", name: "Bizeps-Maschine", equip: "maschine" },
  { id: "trizepsmaschine", name: "Trizeps-Maschine", equip: "maschine" },
  { id: "bauchmaschine", name: "Bauchmaschine", equip: "maschine" },
  { id: "rotationsmaschine", name: "Rotationsmaschine", equip: "maschine" },
  { id: "beinheben_station", name: "Beinheben-Station", equip: "maschine" },
  { id: "beinpresse", name: "Beinpresse", equip: "maschine" },
  { id: "beinstrecker", name: "Beinstrecker", equip: "maschine" },
  { id: "hackenschmidt", name: "Hackenschmidt", equip: "maschine" },
  { id: "beinbeuger_liegend", name: "Beinbeuger liegend", equip: "maschine" },
  { id: "beinbeuger_sitzend", name: "Beinbeuger sitzend", equip: "maschine" },
  { id: "glute_maschine", name: "Glute-/Hip-Thrust-Maschine", equip: "maschine" },
  { id: "abduktoren", name: "Abduktoren-Maschine", equip: "maschine" },
  { id: "adduktoren", name: "Adduktoren-Maschine", equip: "maschine" },
  { id: "wadenmaschine", name: "Wadenmaschine", equip: "maschine" },
  { id: "kabelzug", name: "Kabelzug", equip: "kabel" },
  { id: "multipresse", name: "Multipresse", equip: "multipresse" },
  { id: "kurzhanteln", name: "Kurzhanteln", equip: "kh" },
  { id: "langhantel", name: "Langhantel + Bank/Rack", equip: "lh" },
  { id: "sz_stange", name: "SZ-Stange", equip: "lh" },
  { id: "klimmzugstange", name: "Klimmzugstange", equip: "koerper" },
  { id: "dipbarren", name: "Dip-Barren", equip: "koerper" },
  { id: "hyperextension", name: "Hyperextension-Bank", equip: "koerper" },
  { id: "band", name: "Widerstandsband", equip: "band" },
  { id: "laufband", name: "Laufband", equip: "cardio" },
  { id: "crosstrainer", name: "Crosstrainer", equip: "cardio" },
  { id: "ergometer", name: "Fahrrad-Ergometer", equip: "cardio" },
  { id: "rudergeraet", name: "Rudergerät", equip: "cardio" }
];

/* Zuhause ist immer Körpergewicht + Band; optional dazu: */
export const HOME_BASE = ["band"];
export const HOME_EXTRA = ["kurzhanteln", "klimmzugstange"];
