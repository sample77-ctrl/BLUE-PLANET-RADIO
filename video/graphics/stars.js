/* Slow parallax starfield, seeded so every render looks the same */
(function () {
  const c = document.querySelector('canvas.stars'); if (!c) return
  c.width = 1920; c.height = 1080
  const x = c.getContext('2d'); let s = 7
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  const stars = Array.from({ length: 260 }, () => ({ x: r() * 1920, y: r() * 1080, z: 0.2 + r() * 0.8, tw: r() * 6.28 }))
  const t0 = performance.now()
  function frame(now) {
    const t = window.__t != null ? window.__t : (now - t0) / 1000   // render-frames.mjs steps time itself
    x.clearRect(0, 0, 1920, 1080)
    for (const p of stars) {
      const px = (p.x - t * 14 * p.z + 1920) % 1920
      const a = 0.25 + 0.55 * p.z * (0.6 + 0.4 * Math.sin(t * 1.4 + p.tw))
      x.fillStyle = `rgba(210,235,255,${a})`
      x.beginPath(); x.arc(px, p.y, 0.6 + p.z * 1.3, 0, 6.283); x.fill()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
})()
