(async function loadSharedMapboxToken() {
  if (localStorage.getItem("roadbook.mapboxToken")) return;

  try {
    const response = await fetch("https://ariesxueax.github.io/ariesspaintravelh5/app.js", { cache: "force-cache" });
    const source = await response.text();
    const match = source.match(/pk\.[A-Za-z0-9._-]+/);
    if (!match) return;

    localStorage.setItem("roadbook.mapboxToken", match[0]);
    window.dispatchEvent(new Event("roadbook:mapbox-token"));
  } catch {
    // The static route overview remains available if the shared token cannot load.
  }
})();
