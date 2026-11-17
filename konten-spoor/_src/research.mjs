// The "Field Notes" research series: one card + one post each.
// k = series title, h/s = card headline and subline, c = source, n = neuron classes lit on the card, x = post text.
// Facts carried over from the original paper series; wording rewritten for Spoor.
export default [
{ k: "THE PITCH", c: "Sydney Brenner · letter to Max Perutz · 1963", n: [], h: "A nervous system small enough to understand.", s: "Brenner asked for one animal simple enough to know completely.",
  x: `In 1963 Sydney Brenner wrote a letter asking for something new: an animal simple enough that we could understand its whole nervous system.

Soon after, he settled on a transparent nematode, 1 mm long: C. elegans.

60 years later, Spoor feeds that nematode's wiring a market.` },
{ k: "THE MAP", c: "White, Southgate, Thomson & Brenner · Phil. Trans. R. Soc. B · 1986", n: [], h: "The first complete wiring diagram of an animal.", s: "Thousands of electron microscope slices, traced by hand.",
  x: `1986: White, Southgate, Thomson and Brenner publish a 340-page paper.

Thousands of electron microscope slices, traced by hand, became the first complete wiring diagram of an animal's nervous system.

The subtitle called it the animal's mind.` },
{ k: "THE COUNT", c: "White et al. · 1986", n: [], h: "86 billion. 140,000. 302.", s: "A human, a fruit fly, and C. elegans.",
  x: `Your brain: ~86 billion neurons.
A fruit fly: ~140,000.
C. elegans: 302.

Small enough to simulate every single one on a laptop.

That's what Spoor does every minute.` },
{ k: "THE LINEAGE", c: "Sulston et al. · Developmental Biology · 1983", n: [], h: "959 cells. The same family tree in every animal.", s: "Sulston traced every cell division under the microscope.",
  x: `John Sulston watched C. elegans embryos under a microscope for hours, cell by cell, until he had the full family tree.

959 cells in the adult. The same tree in every animal.

This is why C. elegans is the most mapped animal on Earth.` },
{ k: "THE NOBEL", c: "Nobel Prize in Physiology or Medicine · 2002", n: [], h: "One tiny nematode. Three Nobel laureates.", s: "Brenner, Horvitz and Sulston, 2002.",
  x: `2002 Nobel Prize in Physiology or Medicine: Brenner, Horvitz and Sulston.

All three built on the same tiny nematode.

Spoor runs on that nematode's wiring.` },
{ k: "CELL DEATH", c: "Ellis & Horvitz · Cell · 1986", n: [], h: "131 cells die on schedule. Always the same ones.", s: "The genes for programmed cell death, found in a nematode, also run in us.",
  x: `As a C. elegans hermaphrodite develops, 131 cells die on schedule. Every time, the same ones.

Studying them, Robert Horvitz found the genes for programmed cell death, which also run in us.

Good traders cut what doesn't work. So does Spoor.` },
{ k: "THE GENOME", c: "C. elegans Sequencing Consortium · Science · 1998", n: [], h: "The first animal genome ever read.", s: "About 20,000 genes, roughly as many as you have.",
  x: `1998: C. elegans became the first multicellular animal to have its whole genome read.

About 20,000 genes, roughly as many as you have.

A brain that's tiny, but not simple.` },
{ k: "RNA INTERFERENCE", c: "Fire, Mello et al. · Nature · 1998", n: [], h: "Switching genes off, one at a time.", s: "Double-stranded RNA, injected into nematodes. Nobel Prize, 2006.",
  x: `In 1998 Andrew Fire and Craig Mello injected nematodes with double-stranded RNA and switched specific genes off.

RNA interference. Nobel Prize, 2006.

C. elegans keeps giving science its tools.` },
{ k: "GLOW", c: "Chalfie et al. · Science · 1994 · Nobel Prize 2008", n: ["ALM", "PLM", "AVM"], h: "The first neurons to glow green.", s: "A jellyfish gene, put into a nematode's touch neurons.",
  x: `1994: Martin Chalfie put a jellyfish gene for green fluorescent protein into C. elegans. Its touch neurons glowed.

Nobel Prize in Chemistry, 2008.

Green still marks the forward side of the brain in Spoor.` },
{ k: "THE SMELL", c: "Bargmann, Hartwieg & Horvitz · Cell · 1993", n: ["AWA", "AWC"], h: "No nose. A handful of neurons that smell.", s: "Kill AWA with a laser and the animal stops answering its odours.",
  x: `C. elegans has no nose. A handful of sensory neurons, AWA and AWC among them, pick up a long list of odours.

Kill one with a laser and the animal stops responding to its smells.

In Spoor, the market's scent goes into exactly these neurons.` },
{ k: "THE HUNT", c: "Pierce-Shimomura, Morse & Lockery · J. Neurosci. · 1999", n: ["AIY", "AIB"], h: "Smell weaker, turn more. Smell stronger, keep going.", s: "The pirouette strategy: food found with no map and no plan.",
  x: `How does a nematode find food with no map and no plan?

When the smell gets weaker, it turns more often. When it gets stronger, it keeps going.

Pierce-Shimomura et al., 1999. The "pirouette" strategy.

Spoor crawls across 11 markets the same way.` },
{ k: "THE STEER", c: "Iino & Yoshida · J. Neurosci. · 2009", n: ["ASE"], h: "It also curves toward the smell, like a weathervane.", s: "A second steering strategy from the same 302 cells.",
  x: `Nematodes don't only pirouette. They also curve slowly toward a stronger smell as they crawl, like a weathervane.

Iino & Yoshida, 2009.

Two strategies, no brain bigger than 302 cells.` },
{ k: "FORWARD / BACK", c: "Chalfie et al. · J. Neurosci. · 1985", n: ["AVA", "AVB", "AVD", "PVC"], h: "Two neurons decide: forward or reverse.", s: "Ablate AVB and PVC: forward fails. Ablate AVA and AVD: backing fails.",
  x: `Touch a nematode's nose, it backs up. Touch its tail, it goes forward.

Chalfie et al. (1985) killed neurons one by one with a laser and found the command cells: AVA for reverse, AVB for forward.

In Spoor, AVA against AVB is literally strike or step back.` },
{ k: "THE CIRCUIT", c: "Gray, Hill & Bargmann · PNAS · 2005", n: ["AIY", "AIB", "AIZ", "RIM"], h: "AIY keeps it going. AIB and AIZ make it turn.", s: "RIM shapes the reversals. The navigation circuit, mapped.",
  x: `Gray, Hill & Bargmann (2005) mapped the navigation circuit:
AIY pushes the animal to keep going.
AIB and AIZ push it to turn.
RIM shapes the reversals.

Every one of these is live in the Spoor lab. Watch them light up.` },
{ k: "THE SIGN", c: "Chalasani et al. · Nature · 2007", n: ["AWC", "AIY"], h: "A wiring diagram doesn't say excite or inhibit.", s: "AWC inhibits AIY with glutamate. Some signs have to come from the literature.",
  x: `A wiring diagram tells you who's connected. Not whether a connection excites or inhibits.

Chalasani et al. (2007) showed AWC inhibits AIY with glutamate.

We hand-set that sign and others from the literature. Without them, the simulated brain either seized or went silent.` },
{ k: "LEARNING", c: "Zhang, Lu & Bargmann · Nature · 2005", n: ["AIY", "AIB"], h: "Make it sick once, it avoids the smell later.", s: "Learning, with 302 neurons.",
  x: `Feed a nematode bacteria that make it sick. Later it avoids their smell.

Zhang, Lu & Bargmann, Nature 2005. Learning, with 302 neurons.

Spoor gets sugar when a buy goes up and a shock when it goes down, and that changes how it smells that market next time.` },
{ k: "HABITUATION", c: "Rankin, Beck & Chiba · Behav. Brain Res. · 1990", n: ["AVA"], h: "Tap, tap, tap. It stops caring.", s: "Nematodes habituate, and can remember it for 24 hours.",
  x: `Tap a nematode's dish and it backs up. Tap it again and again, and it stops caring.

Catharine Rankin's lab showed nematodes habituate, and can remember it for 24 hours.

Spoor forgets faster: its market memory halves every 6 hours.` },
{ k: "LONGEVITY", c: "Kenyon et al. · Nature · 1993", n: [], h: "One gene changed. Twice the lifespan.", s: "daf-2, and the start of the modern science of ageing.",
  x: `Cynthia Kenyon changed one gene, daf-2, and the animals lived twice as long.

1993. It started the modern science of ageing.

Spoor is aiming for something smaller: surviving the market without blowing up the book.` },
{ k: "SLEEP", c: "Raizen et al. · Nature · 2008", n: ["RIS"], h: "Even 302 neurons need sleep.", s: "Before each molt, the animal goes quiet: lethargus.",
  x: `Before each molt, C. elegans goes quiet in a sleep-like state called lethargus.

Raizen et al., 2008: even 302 neurons need sleep.

Spoor doesn't. It sniffs every 60 seconds, 24/7.` },
{ k: "SPACE", c: "NASA · 2003", n: [], h: "They survived the Columbia breakup.", s: "Canisters of nematodes, found alive in the debris weeks later.",
  x: `In 2003 the space shuttle Columbia broke up on re-entry. Canisters of C. elegans on board were found in the debris weeks later.

The nematodes were alive.

Tough animal. Good brain to build on.` },
{ k: "WHOLE-BRAIN", c: "Schrödel et al. · Nature Methods · 2013 · Kato et al. · Cell · 2015", n: ["AVA", "AVB", "RIB"], h: "Forward, turn, reverse. The whole brain at once.", s: "Nearly every neuron in a living nematode's head, imaged together.",
  x: `2013-2015: researchers imaged nearly every neuron in a living nematode's head at the same time.

Kato et al. (2015) found the whole brain moving through a few shared patterns: forward, turn, reverse.

That's the same three-way choice Spoor makes each minute.` },
{ k: "THE SPIKE", c: "Liu et al. · Cell · 2018", n: ["AWA"], h: "Most C. elegans neurons don't spike. AWA does.", s: "Honest note: we run a spiking model for all 302.",
  x: `Honest science post: most C. elegans neurons don't fire classic spikes. They use graded voltages.

Liu et al. (2018) found an exception: AWA, a smell neuron, fires real action potentials.

Spoor uses a spiking model for all 302. It's a model, not an animal.` },
{ k: "THE REMAP", c: "Cook et al. · Nature · 2019", n: [], h: "Every synapse, both sexes, end to end.", s: "Hermaphrodite: 302 neurons. Male: 385. This is the dataset Spoor loads.",
  x: `Cook et al. (2019) re-mapped C. elegans from end to end, both sexes, every chemical synapse and gap junction, with their sizes.

Hermaphrodite: 302 neurons. Male: 385.

This is the exact dataset Spoor loads (hermaphrodite, July 2020 corrected).` },
{ k: "GROWING UP", c: "Witvliet et al. · Nature · 2021", n: [], h: "The layout stays. The wiring keeps changing.", s: "Eight brains mapped from birth to adult.",
  x: `Witvliet et al. (2021) mapped the brains of 8 nematodes at different ages, birth to adult.

The core layout stays. The connections keep growing and changing.

A brain is a moving target. So is a market.` },
{ k: "THE WIRELESS LAYER", c: "Ripoll-Sánchez et al. · Neuron · 2023", n: [], h: "Signals between neurons that never touch.", s: "A neuropeptide network the wiring diagram doesn't show. We don't model it yet.",
  x: `The wiring diagram isn't the whole story.

Ripoll-Sánchez et al. (2023) mapped a "wireless" network: neuropeptides passing signals between neurons that never touch.

Spoor doesn't model it yet. Saying so up front.` },
{ k: "THE ATLAS", c: "Randi, Sharma, Dvali & Leifer · Nature · 2023", n: [], h: "Poke one neuron. See who answers.", s: "Plenty of signals didn't follow the wiring diagram.",
  x: `Randi et al. (2023) poked C. elegans neurons one at a time and recorded what responded.

Plenty of signals didn't follow the wiring diagram.

So no, Spoor isn't a digital nematode. It's what you get from the map alone. The four books show how far that goes.` },
{ k: "THE ROBOT", c: "OpenWorm community · Timothy Busbice · 2014", n: ["ASH", "AVA"], h: "A connectome drove a Lego robot.", s: "Sonar into the nose neurons, motor neurons to the wheels.",
  x: `2014: Timothy Busbice loaded the C. elegans connectome into a Lego robot. A sonar fed the "nose" neurons, motor neurons drove the wheels.

It wandered and backed away from walls, with no rules written for either.

Spoor swapped the sonar for a market.` },
{ k: "THE FLY", c: "Dorkenwald et al. (FlyWire) · Nature · 2024", n: [], h: "139,255 neurons. 38 years after C. elegans.", s: "The full adult fruit fly brain, 2024.",
  x: `2024: FlyWire published the full wiring diagram of an adult fruit fly brain. 139,255 neurons.

It took the field 38 years to go from C. elegans to the fly.

Spoor started with C. elegans on purpose: small enough to watch every neuron.` },
{ k: "THE METHOD", c: "Shiu et al. · Nature · 2024", n: [], h: "Real wiring, simple neurons, see what comes out.", s: "A spiking model built straight from a connectome predicted behaviour.",
  x: `Shiu et al. (2024) built a leaky integrate-and-fire model straight from the fly connectome, and it predicted which neurons drive feeding.

Same idea as ours: real wiring, simple spiking neurons, see what comes out.

Spoor = that method, 302 neurons, a market for food.` },
{ k: "THE QUESTION", c: "Spoor · paper trading on Robinhood Chain", n: ["AVA", "AVB"], h: "Can 302 neurons beat a coin flip?", s: "We don't know. Nobody does. The scoreboard is public.",
  x: `Can 302 neurons beat a coin flip in a real market?

We don't know. Nobody does.

So Spoor trades next to a blind copy, a random book and buy-and-hold. Same rules, same $10,000 paper.

Results update live. [SITE]` },
];
