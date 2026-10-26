/* Muskelgruppen und die Filter, die die UI anbietet */
export const MUSCLES = [
  { id: "brust", name: "Brust" },
  { id: "lat", name: "Rücken" },
  { id: "unterer_ruecken", name: "Unterer Rücken" },
  { id: "schulter_v", name: "Schulter vorne" },
  { id: "schulter_s", name: "Schulter seitlich" },
  { id: "schulter_h", name: "Schulter hinten" },
  { id: "bizeps", name: "Bizeps" },
  { id: "trizeps", name: "Trizeps" },
  { id: "bauch", name: "Bauch" },
  { id: "quad", name: "Oberschenkel vorne" },
  { id: "beinbeuger", name: "Beinbeuger" },
  { id: "po", name: "Po" },
  { id: "waden", name: "Waden" }
];

export const MUSCLE_FILTERS = [
  { id: "brust", name: "Brust", muscles: ["brust"] },
  { id: "ruecken", name: "Rücken", muscles: ["lat"] },
  { id: "unterer_ruecken", name: "Unterer Rücken", muscles: ["unterer_ruecken"] },
  { id: "schulter", name: "Schulter", muscles: ["schulter_v", "schulter_s", "schulter_h"] },
  { id: "bizeps", name: "Bizeps", muscles: ["bizeps"] },
  { id: "trizeps", name: "Trizeps", muscles: ["trizeps"] },
  { id: "bauch", name: "Bauch", muscles: ["bauch"] },
  { id: "quad", name: "Beine vorne", muscles: ["quad"] },
  { id: "beinbeuger", name: "Beinbeuger", muscles: ["beinbeuger"] },
  { id: "po", name: "Po", muscles: ["po"] },
  { id: "waden", name: "Waden", muscles: ["waden"] }
];
