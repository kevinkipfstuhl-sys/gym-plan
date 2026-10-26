/* Fertige Workouts. place: "gym" | "home" | "kh" (Kurzhanteln, Gym oder zuhause).
   Item: i(ex, sets, reps, rest) */
const i = (ex, sets, reps, rest) => ({ ex, sets, reps, rest });
const w = (id, name, place, tags, items) => ({ id, name, place, tags, items });

const WARM = i("laufband", 1, "5 min", 0);

export const WORKOUTS = [
  /* ---------- Die bisherigen drei Tage ---------- */
  w("gk_a", "Ganzkörper A · Push + Bauch", "gym", ["brust", "schulter", "trizeps", "quad", "bauch"], [
    WARM, i("kniebeuge_lh", 4, "8–10", 120), i("bankdruecken_lh", 4, "8–10", 120), i("rudern_kabel", 3, "10–12", 90),
    i("schulterdruecken_kh", 3, "10–12", 90), i("seitheben_kh", 3, "12–15", 60), i("trizeps_kabel", 3, "12–15", 60),
    i("knee_raises_haengend", 3, "12–15", 60), i("plank", 3, "45 s", 45), i("laufband", 1, "15 min", 0)]),
  w("gk_b", "Ganzkörper B · Pull + Bauch", "gym", ["ruecken", "bizeps", "beinbeuger", "bauch"], [
    WARM, i("rdl_lh", 4, "8–10", 120), i("latzug", 4, "8–10", 120), i("schraegbank_kh", 3, "10–12", 90),
    i("ausfallschritte_kh", 3, "10/Bein", 90), i("face_pulls", 3, "15", 60), i("curls_kh", 3, "10–12", 60),
    i("cable_crunch", 3, "12–15", 60), i("russian_twist", 3, "20", 45), i("laufband", 1, "15 min", 0)]),
  w("gk_c", "Ganzkörper C · Kraft + Definition", "gym", ["quad", "brust", "ruecken", "schulter", "bauch"], [
    WARM, i("beinpresse", 4, "10–12", 90), i("bankdruecken_kh", 3, "8–10", 90), i("latzug_eng", 3, "8–10", 90),
    i("arnold_press", 3, "10–12", 60), i("beinbeuger_liegend", 3, "12–15", 60), i("wadenheben_stehend", 3, "12–15", 45),
    i("curls_kabel", 3, "12", 60), i("trizeps_kabel", 3, "12", 60), i("beinheben_liegend", 3, "15", 45),
    i("mountain_climbers", 3, "30 s", 30), i("laufband", 1, "15 min", 0)]),

  /* ---------- Gym, vor allem Maschinen ---------- */
  w("push_maschine", "Push (Maschinen)", "gym", ["brust", "schulter", "trizeps"], [
    i("brustpresse", 4, "8–10", 120), i("brustpresse_schraeg", 3, "10–12", 90), i("schulterpresse", 3, "10–12", 90),
    i("butterfly", 3, "12–15", 60), i("seitheben_maschine", 3, "12–15", 60), i("trizepsmaschine", 3, "12–15", 60)]),
  w("pull_maschine", "Pull (Maschinen)", "gym", ["ruecken", "bizeps", "schulter"], [
    i("latzug", 4, "8–10", 120), i("rudermaschine", 4, "10–12", 90), i("latzug_eng", 3, "10–12", 90),
    i("reverse_butterfly", 3, "12–15", 60), i("bizepsmaschine", 3, "10–12", 60), i("hammer_curls_kabel", 3, "12", 60)]),
  w("beine_maschine", "Beine (Maschinen)", "gym", ["quad", "beinbeuger", "po", "waden"], [
    i("beinpresse", 4, "10–12", 120), i("hackenschmidt", 3, "10–12", 90), i("beinstrecker", 3, "12–15", 60),
    i("beinbeuger_liegend", 3, "12–15", 60), i("hip_thrust_maschine", 3, "10–12", 90), i("wadenmaschine", 4, "12–15", 45)]),
  w("brust_trizeps", "Brust + Trizeps", "gym", ["brust", "trizeps"], [
    i("brustpresse", 4, "8–10", 120), i("schraegbank_kh", 3, "10–12", 90), i("kabel_flys", 3, "12–15", 60),
    i("dips_maschine", 3, "10–12", 90), i("trizeps_seil", 3, "12–15", 60), i("overhead_trizeps_kabel", 3, "12", 60)]),
  w("ruecken_bizeps", "Rücken + Bizeps", "gym", ["ruecken", "bizeps"], [
    i("latzug", 4, "8–10", 120), i("rudern_kabel", 4, "10–12", 90), i("rudern_kh", 3, "10–12", 90),
    i("latzug_kabel_gestreckt", 3, "12–15", 60), i("curls_kabel", 3, "10–12", 60), i("hammer_curls_kh", 3, "12", 60)]),
  w("schulter_arme", "Schulter + Arme", "gym", ["schulter", "bizeps", "trizeps"], [
    i("schulterpresse", 4, "8–10", 120), i("seitheben_kabel", 3, "12–15", 60), i("face_pulls", 3, "15", 60),
    i("bizepsmaschine", 3, "10–12", 60), i("trizeps_kabel", 3, "10–12", 60), i("hammer_curls_kabel", 3, "12", 60),
    i("trizeps_seil", 3, "12–15", 60)]),
  w("oberkoerper", "Oberkörper", "gym", ["brust", "ruecken", "schulter", "bizeps", "trizeps"], [
    i("brustpresse", 4, "8–10", 120), i("latzug", 4, "8–10", 120), i("schulterpresse", 3, "10–12", 90),
    i("rudermaschine", 3, "10–12", 90), i("curls_kabel", 3, "12", 60), i("trizeps_kabel", 3, "12", 60)]),
  w("unterkoerper", "Unterkörper + Bauch", "gym", ["quad", "beinbeuger", "po", "waden", "bauch"], [
    i("beinpresse", 4, "8–10", 120), i("rdl_kh", 3, "10–12", 90), i("beinstrecker", 3, "12–15", 60),
    i("beinbeuger_sitzend", 3, "12–15", 60), i("wadenheben_presse", 3, "15", 45), i("bauchmaschine", 3, "12–15", 60)]),
  w("ganzkoerper_maschinen", "Ganzkörper Maschinen", "gym", ["brust", "ruecken", "quad", "schulter", "bauch"], [
    i("beinpresse", 3, "10–12", 90), i("brustpresse", 3, "10–12", 90), i("latzug", 3, "10–12", 90),
    i("schulterpresse", 3, "10–12", 90), i("beinbeuger_liegend", 3, "12–15", 60), i("bauchmaschine", 3, "12–15", 60)]),
  w("einsteiger", "Ganzkörper Einsteiger", "gym", ["brust", "ruecken", "quad", "bauch"], [
    i("ergometer", 1, "5 min", 0), i("beinpresse", 2, "12–15", 90), i("brustpresse", 2, "12–15", 90),
    i("rudermaschine", 2, "12–15", 90), i("beinbeuger_sitzend", 2, "12–15", 60), i("plank", 2, "30 s", 45)]),
  w("maschinen_zirkel", "Maschinen-Zirkel (Fettverbrennung)", "gym", ["brust", "ruecken", "quad", "schulter", "bauch"], [
    i("beinpresse", 3, "15", 30), i("brustpresse", 3, "15", 30), i("latzug", 3, "15", 30),
    i("beinstrecker", 3, "15", 30), i("schulterpresse", 3, "15", 30), i("bauchmaschine", 3, "15", 30),
    i("laufband", 1, "10 min", 0)]),
  w("po_beine", "Po + Beine", "gym", ["po", "beinbeuger", "quad"], [
    i("hip_thrust_maschine", 4, "8–10", 120), i("beinpresse", 3, "10–12", 90), i("glute_kickback_maschine", 3, "12/Bein", 60),
    i("abduktoren", 3, "15", 60), i("beinbeuger_liegend", 3, "12–15", 60), i("kickback_kabel", 2, "15/Bein", 45)]),
  w("ruecken_gesund", "Rücken stark & gesund", "gym", ["unterer_ruecken", "ruecken", "bauch", "schulter"], [
    i("rueckenstrecker", 3, "12–15", 60), i("rudermaschine", 3, "12", 90), i("face_pulls", 3, "15", 60),
    i("latzug", 3, "12", 90), i("bird_dog", 3, "10/Bein", 30), i("plank", 3, "40 s", 45)]),
  w("arme", "Arme kompakt", "gym", ["bizeps", "trizeps"], [
    i("bizepsmaschine", 3, "10–12", 60), i("trizepsmaschine", 3, "10–12", 60), i("hammer_curls_kabel", 3, "12", 60),
    i("trizeps_seil", 3, "12", 60), i("konzentrationscurls", 2, "12", 45), i("overhead_trizeps_kabel", 2, "12", 45)]),
  w("bauch_finisher", "Bauch-Finisher", "gym", ["bauch"], [
    i("cable_crunch", 3, "12–15", 45), i("knee_raises_station", 3, "12–15", 45), i("holzhacker_kabel", 3, "12/Bein", 45),
    i("plank", 3, "45 s", 30)]),
  w("cardio_core", "Cardio + Core", "gym", ["bauch", "quad"], [
    i("crosstrainer", 1, "15 min", 0), i("bauchmaschine", 3, "15", 45), i("rotationsmaschine", 3, "12/Bein", 45),
    i("seitstuetz", 3, "30 s", 30), i("laufband", 1, "10 min", 0)]),

  /* ---------- Zuhause ohne Geräte (plus Band) ---------- */
  w("home_ganzkoerper", "Zuhause Ganzkörper", "home", ["brust", "quad", "po", "bauch", "ruecken"], [
    i("kniebeuge_koerper", 3, "15", 60), i("liegestuetze", 3, "8–12", 60), i("inverted_row", 3, "8–12", 60),
    i("ausfallschritte_koerper", 3, "10/Bein", 60), i("glute_bridge", 3, "15", 45), i("plank", 3, "40 s", 45)]),
  w("home_oberkoerper", "Zuhause Oberkörper", "home", ["brust", "schulter", "trizeps", "ruecken"], [
    i("liegestuetze", 4, "8–12", 60), i("pike_pushups", 3, "8–10", 60), i("band_rudern", 3, "12–15", 60),
    i("bankdips", 3, "10–12", 60), i("band_pull_apart", 3, "15", 45), i("band_curls", 3, "12–15", 45)]),
  w("home_beine_po", "Zuhause Beine + Po", "home", ["quad", "po", "beinbeuger", "waden"], [
    i("kniebeuge_koerper", 4, "15–20", 60), i("step_ups", 3, "10/Bein", 60), i("glute_bridge", 3, "15", 45),
    i("einbeinige_bruecke", 3, "10/Bein", 45), i("band_abduktion", 3, "15", 45), i("wandsitzen", 3, "45 s", 45),
    i("wadenheben_koerper", 3, "20", 30)]),
  w("home_core", "Zuhause Core", "home", ["bauch", "unterer_ruecken"], [
    i("crunches", 3, "15–20", 30), i("reverse_crunch", 3, "12–15", 30), i("fahrrad_crunch", 3, "20", 30),
    i("plank", 3, "45 s", 30), i("seitstuetz", 2, "30 s", 30), i("dead_bug", 3, "10/Bein", 30), i("superman", 3, "12", 30)]),
  w("home_hiit", "20-min-HIIT", "home", ["quad", "bauch", "brust"], [
    i("hampelmaenner", 3, "40 s", 20), i("jump_squats", 3, "12", 20), i("mountain_climbers", 3, "40 s", 20),
    i("liegestuetze", 3, "10", 20), i("burpees", 3, "10", 30), i("plank", 2, "40 s", 20)]),
  w("home_band", "Zuhause mit Band", "home", ["brust", "ruecken", "schulter", "quad", "bizeps", "trizeps"], [
    i("band_kniebeuge", 3, "15", 60), i("band_brustpresse", 3, "12–15", 60), i("band_rudern", 3, "12–15", 60),
    i("band_seitheben", 3, "15", 45), i("band_curls", 3, "12–15", 45), i("band_trizeps", 3, "12–15", 45)]),

  /* ---------- Kurzhanteln ---------- */
  w("kh_ganzkoerper", "Kurzhanteln Ganzkörper", "kh", ["quad", "brust", "ruecken", "schulter"], [
    i("goblet_squat", 4, "10–12", 90), i("bankdruecken_kh", 3, "10–12", 90), i("rudern_kh", 3, "10–12", 90),
    i("rdl_kh", 3, "10–12", 90), i("schulterdruecken_kh", 3, "10–12", 60), i("plank", 3, "40 s", 45)]),
  w("kh_push", "Kurzhanteln Push", "kh", ["brust", "schulter", "trizeps"], [
    i("bankdruecken_kh", 4, "8–10", 90), i("schraegbank_kh", 3, "10–12", 90), i("schulterdruecken_kh", 3, "10–12", 90),
    i("seitheben_kh", 3, "12–15", 60), i("overhead_trizeps_kh", 3, "12", 60)]),
  w("kh_pull", "Kurzhanteln Pull", "kh", ["ruecken", "bizeps", "schulter", "beinbeuger"], [
    i("rudern_kh", 4, "10–12", 90), i("rdl_kh", 3, "10–12", 90), i("reverse_flys_kh", 3, "12–15", 60),
    i("curls_kh", 3, "10–12", 60), i("hammer_curls_kh", 3, "12", 60)])
];
