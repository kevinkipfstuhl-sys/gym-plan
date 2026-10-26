/* Alte Übungs-Ids (gymplan_v1) → neue Bibliotheks-Ids */
export const OLD_TO_NEW = {
  di_warm: "laufband", do_warm: "laufband", sa_warm: "laufband",
  di_run: "laufband", do_run: "laufband", sa_run: "laufband",
  di_squat: "kniebeuge_lh", di_bench: "bankdruecken_lh", di_row: "rudern_kabel", di_ohp: "schulterdruecken_kh",
  di_lat: "seitheben_kh", di_tri: "trizeps_kabel", di_abs1: "knee_raises_haengend", di_abs2: "plank",
  do_rdl: "rdl_lh", do_pull: "latzug", do_inc: "schraegbank_kh", do_lunge: "ausfallschritte_kh",
  do_face: "face_pulls", do_curl: "curls_kh", do_crunch: "cable_crunch", do_twist: "russian_twist",
  sa_press: "beinpresse", sa_bench: "bankdruecken_kh", sa_pull: "latzug_eng", sa_arnold: "arnold_press",
  sa_ham: "beinbeuger_liegend", sa_calf: "wadenheben_stehend", sa_curl: "curls_kabel", sa_tri: "trizeps_kabel",
  sa_abs1: "beinheben_liegend", sa_abs2: "mountain_climbers"
};

/* Alte Tage → fertige Workouts (data/workouts.js) */
export const LEGACY_DAY_TO_WORKOUT = { di: "gk_a", do: "gk_b", sa: "gk_c" };

/* Übungs-Ids der früheren v2-App (Profile, gymplan_v2) → neue Bibliotheks-Ids */
export const LIB_TO_NEW = {
  squat: "kniebeuge_lh", smith_squat: "kniebeuge_multi", goblet: "goblet_squat", legpress: "beinpresse", hack: "hackenschmidt",
  rdl: "rdl_lh", db_rdl: "rdl_kh", deadlift: "kreuzheben_lh", hipthrust: "hip_thrust_lh", backext: "hyperextension",
  db_lunge: "ausfallschritte_kh", bulgarian: "bulgarian_split_squat", stepup: "step_ups", walk_lunge: "ausfallschritte_kh",
  lying_curl: "beinbeuger_liegend", seated_curl: "beinbeuger_sitzend", leg_ext: "beinstrecker",
  calf_stand: "wadenheben_stehend", calf_press: "wadenheben_presse", calf_seated: "wadenmaschine",
  bench: "bankdruecken_lh", db_bench: "bankdruecken_kh", chest_press: "brustpresse", smith_bench: "bankdruecken_multi",
  pushup: "liegestuetze", db_incline: "schraegbank_kh", incline_bench: "schraegbank_lh", smith_incline: "schraegbank_multi",
  cable_fly: "kabel_flys", butterfly: "butterfly", db_ohp: "schulterdruecken_kh", shoulder_press: "schulterpresse",
  arnold: "arnold_press", ohp: "schulterdruecken_lh", db_lateral: "seitheben_kh", cable_lateral: "seitheben_kabel",
  machine_lateral: "seitheben_maschine", facepull: "face_pulls", reverse_fly: "reverse_flys_kh", rear_machine: "reverse_butterfly",
  cable_row: "rudern_kabel", machine_row: "rudermaschine", db_row: "rudern_kh", barbell_row: "rudern_lh",
  latpull: "latzug", latpull_close: "latzug_eng", pullup: "klimmzuege", assisted_pullup: "klimmzuege_assistiert",
  db_curl: "curls_kh", ez_curl: "sz_curls", cable_curl: "curls_kabel", hammer: "hammer_curls_kh",
  tri_push: "trizeps_kabel", rope_push: "trizeps_seil", overhead_tri: "overhead_trizeps_kabel", bench_dips: "bankdips",
  hanging_knee: "knee_raises_haengend", lying_leg: "beinheben_liegend", reverse_crunch: "reverse_crunch",
  cable_crunch: "cable_crunch", crunch: "crunches", ab_machine: "bauchmaschine", plank: "plank", plank_knees: "plank",
  side_plank: "seitstuetz", russian_twist: "russian_twist", woodchop: "holzhacker_kabel", mountain: "mountain_climbers",
  warm_tread: "laufband", warm_cross: "crosstrainer", warm_bike: "ergometer", tread: "laufband", cross: "crosstrainer",
  bike: "ergometer", rower: "rudergeraet", stairs: "crosstrainer"
};
