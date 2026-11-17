// One name on every surface: the brain is SPOOR. The engine keeps its internal keys ("worm", "blind", ...),
// but everything a reader sees goes through here: book labels, and text written before the rename
// (log lines, lab notes, post drafts) shown with the old word swapped out. Credits such as OpenWorm stay as they are.
export const label = (k) => ({ worm: "Spoor", blind: "Blind", random: "Random", hold: "Buy and hold" })[k] ?? k;
export const who = (k) => (k === "worm" ? "spoor" : k); // how a book is named inside a sentence

export function clean(s) {
  if (typeof s !== "string" || !/worm/i.test(s)) return s;
  return s
    .replace(/OpenWorm/g, "\u0001")                                   // keep the credit intact
    .replace(/\b[Tt]he (?:trader )?worm's\b/g, "Spoor's")
    .replace(/\b[Tt]he (?:trader )?worm\b/g, "Spoor")
    .replace(/\bblind worm\b/gi, "blind brain")
    .replace(/\bscout worms\b/gi, "scout brains").replace(/\bscout worm\b/gi, "scout brain")
    .replace(/\bworms\b/gi, "brains")
    .replace(/\bworm's\b/gi, "Spoor's")
    .replace(/\bWorm\b/g, "Spoor").replace(/\bWORM\b/g, "SPOOR").replace(/\bworm\b/g, "spoor")
    .replace(/\u0001/g, "OpenWorm");
}
