// Boot screen inside the Capacitor WebView: waits for the embedded engine, then hands over to its own pages.
import { NodeJS } from "capacitor-nodejs";

const msg = document.getElementById("msg"), err = document.getElementById("err");
let gone = false;
const go = (url) => { if (gone) return; gone = true; msg.textContent = "Opening…"; location.replace(url); };

NodeJS.addListener("engine-ready", (e) => go(e.args[0]));
NodeJS.addListener("engine-error", (e) => { msg.textContent = "The engine could not start."; err.hidden = false; err.textContent = e.args[0]; });

const steps = ["Waking 302 neurons…", "Loading the connectome…", "Sniffing the first patch…"];
let k = 0; const tick = setInterval(() => { if (!gone && err.hidden) msg.textContent = steps[++k % steps.length]; }, 2500);

try {
  await NodeJS.whenReady();
  // if the engine was already up before this page listened, ask again
  NodeJS.send({ eventName: "where", args: [] });
} catch (e) { msg.textContent = "Node.js runtime unavailable."; err.hidden = false; err.textContent = String(e?.message || e); clearInterval(tick); }

setTimeout(() => { if (!gone && err.hidden) { msg.textContent = "Still starting — the first launch unpacks the engine."; NodeJS.send({ eventName: "where", args: [] }); } }, 20000);
