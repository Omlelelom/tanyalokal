// This is a bounded, deterministic prototype, not an LLM or live information service.
export function redact(value) {
  return String(value)
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/gi, "[email]")
    .replace(/\b\d{6}-?\d{2}-?\d{4}\b/g, "[IC]")
    .replace(/(?:\+?6?0)[\s-]?\d(?:[\s-]?\d){7,9}\b/g, "[phone]");
}

export function filterEntryIds(ids, retrieved) {
  const allowed = new Set(retrieved.map(entry => entry.id));
  return [...new Set(Array.isArray(ids) ? ids : [])].filter(id => allowed.has(id)).slice(0, 5);
}

const STOP = new Set("where can i get a an the in at of to for is are any me about please find show want need near nearby teluk intan di mana boleh saya nak yang dan untuk ada apa cari dekat tempat".split(" "));
const TOPICS = [
  ["health", /\b(hospital|clinic|klinik|health|kesihatan|doctor|doktor|pharmacy|farmasi|ubat|sakit)\b/],
  ["education", /\b(school|sekolah|college|kolej|university|universiti|education|pendidikan|study|belajar)\b/],
  ["food", /\b(food|makan|restaurant|restoran|cafe|kopi|coffee|breakfast|lunch|dinner|sarapan)\b/],
  ["money", /\b(bank|atm|money|duit|wang|finance|financial)\b/],
  ["shopping", /\b(shop|shopping|kedai|pasar|supermarket|groceries|beli|raya)\b/],
  ["stay", /\b(hotel|stay|accommodation|penginapan|menginap)\b/],
  ["worship", /\b(mosque|masjid|surau|temple|kuil|church|gereja|gurdwara)\b/],
  ["transport", /\b(bus|bas|transport|petrol|fuel|pengangkutan)\b/],
  ["leisure", /\b(visit|tourist|tourism|sight|park|taman|cinema|pawagam|tower|menara|leisure|riadah|interesting)\b/],
  ["government", /\b(government|kerajaan|office|pejabat|council|majlis|passport|pasport|immigration|imigresen|jpj|tax|cukai|post|pos)\b/],
  ["community", /\b(library|perpustakaan|hall|dewan|community|komuniti)\b/]
];

export function getReply(question, { entries, guides = [], lang = "en" }) {
  const q = question.trim().slice(0, 600).toLowerCase();
  const malay = /\b(di mana|mana|saya|nak|boleh|macam|tolong|urut|gigi|berlubang|biasiswa|adu|surat|makan)\b/.test(q) || lang === "ms";
  const pick = (en, ms) => malay ? ms : en;
  const unverified = pick("These listings have not been checked. Call or confirm before you go; missing details are not known.", "Senarai ini belum disemak. Telefon atau sahkan dahulu sebelum pergi; butiran yang tiada belum diketahui.");
  const caveat = pick("This guide is an unverified draft. Confirm current dates and requirements on the official site.", "Panduan ini ialah draf yang belum disahkan. Sahkan tarikh dan syarat terkini di laman rasmi.");
  const answer = (body, matches = [], category = "other", answered = "partial", issue = null) => ({
    body,
    meta: { ids: filterEntryIds(matches.map(entry => entry.id), entries), category, answered, issue }
  });
  const kinds = (...wanted) => entries.filter(entry => wanted.includes(entry.kind));
  const names = list => list.map(entry => entry.name).join(", ");
  const named = pattern => entries.filter(entry => pattern.test(entry.name));
  const missing = () => answer(pick(
    "I don’t have a matching listing in the Teluk Intan directory yet. This demo uses a limited set of directory keywords and draft guides, so I can’t confirm a place or service for that question. Try a topic or search the Directory.",
    "Belum ada padanan dalam direktori Teluk Intan untuk soalan ini. Demo ini menggunakan kata kunci direktori dan panduan draf yang terhad, jadi saya tidak dapat mengesahkan tempat atau perkhidmatan itu. Cuba topik atau cari dalam Direktori."
  ), [], "other", "no");

  // No external knowledge is used to invent businesses, treatments, costs or hours.
  if (/\b(massage|reflexology|urut|refleksologi)\b/.test(q)) return missing();

  if (/\b(emergency|kecemasan|life.threatening|nyawa|heart attack|serangan jantung|can.?t breathe|sukar bernafas|fire|kebakaran)\b/.test(q)) {
    const hospitals = kinds("hospital").filter(entry => /government hospital.*emergency/i.test(entry.note));
    return answer(pick(
      "For an emergency, call 999 now. " + (hospitals.length ? names(hospitals) + " has an emergency department in the supplied directory. " : "") + "This prototype cannot assess symptoms or send emergency help.",
      "Untuk kecemasan, hubungi 999 sekarang. " + (hospitals.length ? names(hospitals) + " mempunyai jabatan kecemasan dalam direktori yang dibekalkan. " : "") + "Prototaip ini tidak boleh menilai gejala atau menghantar bantuan kecemasan."
    ), hospitals, "health");
  }

  if (/\b(dentist|dental|root canal|gigi|pergigian|akar gigi)\b/.test(q)) {
    const matches = kinds("dentist", "dental office");
    if (!matches.length) return missing();
    return answer(pick(
      "The directory lists " + names(matches) + ". It does not say which treatments they offer, including root canals, or what they cost. Ask the clinic whether it can provide the treatment you need. " + unverified,
      "Direktori menyenaraikan " + names(matches) + ". Rawatan yang ditawarkan, termasuk rawatan akar gigi, dan harganya tidak direkodkan. Tanya klinik sama ada rawatan yang anda perlukan tersedia. " + unverified
    ), matches, "health");
  }

  if (/\b(pothole|berlubang|flood|flooding|banjir|rubbish|sampah|streetlight|lampu jalan|drain|longkang|adu|complain|fault|gangguan|bekalan)\b/.test(q)) {
    const electricity = /\b(electricity|electric|elektrik|tnb)\b/.test(q);
    const water = /\b(water supply|bekalan air|paip)\b/.test(q);
    const matches = electricity ? named(/TNB/) : water ? named(/Lembaga Air Perak/) : kinds("council");
    if (!matches.length) return missing();
    const issue = /pothole|berlubang/.test(q) ? "Pothole" : /flood|banjir/.test(q) ? "Flooding" : /rubbish|sampah/.test(q) ? "Rubbish collection" : /streetlight|lampu jalan/.test(q) ? "Streetlight problem" : electricity ? "Electricity fault" : water ? "Water supply problem" : "Local maintenance problem";
    return answer(pick(
      "The supplied draft guide points to " + names(matches) + " for this kind of problem. Note the exact location and take a photo if it is safe, then contact the office through its official channel. This chat has not submitted a report. " + caveat,
      "Panduan draf yang dibekalkan merujuk kepada " + names(matches) + " untuk masalah seperti ini. Catat lokasi tepat dan ambil gambar jika selamat, kemudian hubungi pejabat melalui saluran rasminya. Sembang ini tidak menghantar aduan. " + caveat
    ), matches, "government", "partial", issue);
  }

  if (/\b(scholarship|biasiswa|school aid|study loan|ptptn|bantuan sekolah)\b/.test(q)) {
    const matches = named(/Pejabat Pendidikan Daerah|Pejabat Kebajikan Masyarakat/);
    return answer(pick(
      "Start with your school office or counsellor for school aid. The supplied guide names JPA, MARA, PTPTN and Yayasan Perak for further-study funding; eligibility and deadlines vary. " + (matches.length ? "Local offices you can check with include " + names(matches) + ". " : "") + caveat,
      "Untuk bantuan sekolah, mulakan dengan pejabat sekolah atau kaunselor. Panduan yang dibekalkan menyenaraikan JPA, MARA, PTPTN dan Yayasan Perak untuk pembiayaan pengajian lanjutan; syarat dan tarikh tutup berbeza. " + (matches.length ? "Pejabat tempatan untuk dihubungi termasuk " + names(matches) + ". " : "") + caveat
    ), matches, "education");
  }

  if (/\b(letter|surat)\b/.test(q) && /\b(university|universiti|application|permohonan)\b/.test(q)) {
    return answer(pick(
      "Here is a template you can adapt. Fill in the placeholders yourself; you do not need to enter personal details in this demo.\n\nDear Admissions Officer,\n\nI would like to apply for [programme] at [university] for [intake]. I hold [qualification] and am interested in this programme because [reason]. I would appreciate guidance on the application process, required documents and entry requirements.\n\nThank you for considering my application.\n\nYours faithfully,\n[Your name]\n\n" + caveat,
      "Ini templat untuk diubah suai. Isi tempat kosong sendiri; anda tidak perlu memasukkan butiran peribadi dalam demo ini.\n\nTuan/Puan Pegawai Kemasukan,\n\nSaya ingin memohon program [nama program] di [universiti] bagi pengambilan [sesi]. Saya mempunyai [kelayakan] dan berminat dengan program ini kerana [sebab]. Saya memohon panduan tentang proses permohonan, dokumen dan syarat kemasukan.\n\nTerima kasih atas pertimbangan pihak tuan/puan.\n\nYang benar,\n[Nama anda]\n\n" + caveat
    ), [], "education", "yes");
  }

  if (/\b(upu|university application|apply.*university|mohon.*universiti)\b/.test(q)) {
    const matches = kinds("university", "college").slice(0, 4);
    return answer(pick(
      "The supplied guide describes UPUOnline as the central application route for public universities, polytechnics and community colleges. Private institutions take applications directly. " + caveat + " " + unverified,
      "Panduan yang dibekalkan menerangkan UPUOnline sebagai saluran permohonan universiti awam, politeknik dan kolej komuniti. Institusi swasta menerima permohonan terus. " + caveat + " " + unverified
    ), matches, "education");
  }

  if (/\b(about|history|sejarah|tentang)\b/.test(q) && /teluk intan/.test(q)) {
    const guide = guides.find(item => item.id === "g5");
    if (guide && !malay) return answer(guide.body + " " + caveat, [], "other");
    if (guide) return answer("Panduan draf menerangkan Teluk Intan sebagai ibu daerah Hilir Perak di tebing Sungai Perak. Bandar ini terkenal dengan Menara Condong. " + caveat, [], "other");
  }

  // Prefer a specific kind/name over a broad category when the user mentions one.
  const aliases = [
    [/\b(clinic|klinik|doctor|doktor)\b/, ["clinic"]],
    [/\b(hospital)\b/, ["hospital"]],
    [/\b(pharmacy|farmasi|ubat)\b/, ["pharmacy"]],
    [/\b(restaurant|restoran)\b/, ["restaurant", "food court"]],
    [/\b(cafe|coffee|kopi)\b/, ["cafe"]],
    [/\b(bank|atm)\b/, ["bank"]],
    [/\b(hotel|accommodation|penginapan)\b/, ["hotel"]],
    [/\b(mosque|masjid)\b/, ["mosque"]],
    [/\b(bus|bas)\b/, ["bus station"]],
    [/\b(library|perpustakaan)\b/, ["library"]]
  ];
  const topic = TOPICS.find(([, pattern]) => pattern.test(q));
  const alias = aliases.find(([pattern]) => pattern.test(q));
  const tokens = q.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(word => word.length > 2 && !STOP.has(word));
  const ranked = entries.map(entry => {
    const title = entry.name.toLowerCase();
    const hay = [entry.name, entry.kind, entry.address, entry.note].join(" ").toLowerCase();
    const score = tokens.reduce((sum, word) => sum + (title.includes(word) ? 4 : hay.includes(word) ? 1 : 0), 0);
    return { entry, score };
  }).filter(item => item.score > 0).sort((a,b) => b.score-a.score);
  let matches;
  if (alias) matches = kinds(...alias[1]);
  else if (topic) matches = entries.filter(entry => entry.category === topic[0]);
  else matches = ranked.filter(item => item.score >= 4).map(item => item.entry);
  // Within a kind/category, relevant names still lead.
  const scores = new Map(ranked.map(item => [item.entry.id, item.score]));
  matches = matches.sort((a,b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0)).slice(0, 5);
  if (!matches.length) return missing();
  const category = topic?.[0] || matches[0].category;
  return answer(pick(
    "Here are directory matches you can check: " + names(matches) + ". " + unverified + " This demo cannot confirm availability, specific services or current prices.",
    "Berikut padanan direktori untuk disemak: " + names(matches) + ". " + unverified + " Demo ini tidak dapat mengesahkan ketersediaan, perkhidmatan khusus atau harga terkini."
  ), matches, category);
}
