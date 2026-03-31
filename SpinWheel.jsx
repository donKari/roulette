'use client'
// components/SpinWheel.jsx
// The full interactive wheel app. Receives `lang` prop from the server page.
// All logic is self-contained; language switching updates the URL via router.push().

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TRANSLATIONS, SUPPORTED_LANGS } from '@/lib/translations'

/* ─── Constants ─── */
const NEON = ['#00f3ff','#ff00ff','#39ff14','#ffd700','#b026ff','#ff3131','#1f51ff','#ff6b35','#00ff9f','#ff1493']
const CONTACT_EMAIL = 'donkari.contact@gmail.com'

const PRESETS = {
  yesno: {
    labelKey: 'preset_yesno',
    data: {
      fr: [{text:'OUI',color:NEON[2]},{text:'NON',color:NEON[5]},{text:'PEUT-ÊTRE',color:NEON[3]}],
      en: [{text:'YES',color:NEON[2]},{text:'NO',color:NEON[5]},{text:'MAYBE',color:NEON[3]}],
      es: [{text:'SÍ',color:NEON[2]},{text:'NO',color:NEON[5]},{text:'QUIZÁS',color:NEON[3]}],
    }
  },
  days: {
    labelKey: 'preset_days',
    data: {
      fr:['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],
      en:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      es:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
    }
  },
  nums: {
    labelKey: 'preset_nums',
    data: {
      fr: Array.from({length:10},(_,i)=>({text:`${i+1}`,color:NEON[i%NEON.length]})),
      en: Array.from({length:10},(_,i)=>({text:`${i+1}`,color:NEON[i%NEON.length]})),
      es: Array.from({length:10},(_,i)=>({text:`${i+1}`,color:NEON[i%NEON.length]})),
    }
  },
  food: {
    labelKey: 'preset_food',
    data: {
      fr:['🍕 Pizza','🍣 Sushi','🍔 Burger','🥗 Salade','🍜 Ramen','🌮 Tacos','🥘 Curry','🍝 Pâtes'],
      en:['🍕 Pizza','🍣 Sushi','🍔 Burger','🥗 Salad','🍜 Ramen','🌮 Tacos','🥘 Curry','🍝 Pasta'],
      es:['🍕 Pizza','🍣 Sushi','🍔 Hamburguesa','🥗 Ensalada','🍜 Ramen','🌮 Tacos','🥘 Curry','🍝 Pasta'],
    }
  },
  weekend: {
    labelKey: 'preset_weekend',
    data: {
      fr:['🎬 Cinéma','🏕️ Camping','🎮 Jeux vidéo','🏃 Sport','🍳 Cuisine','📚 Lecture','🎨 Créativité','🚶 Promenade'],
      en:['🎬 Cinema','🏕️ Camping','🎮 Gaming','🏃 Sport','🍳 Cooking','📚 Reading','🎨 Crafts','🚶 Walk'],
      es:['🎬 Cine','🏕️ Acampada','🎮 Videojuegos','🏃 Deporte','🍳 Cocinar','📚 Leer','🎨 Manualidades','🚶 Paseo'],
    }
  },
  names: {
    labelKey: 'preset_names',
    data: {
      fr:['Alice','Bob','Charlie','Diana','Étienne','Farah','Gaël','Hina'],
      en:['Alice','Bob','Charlie','Diana','Ethan','Fiona','George','Hannah'],
      es:['Alicia','Beto','Carlos','Diana','Emilio','Fátima','Guillermo','Helena'],
    }
  },
  duo: {
    labelKey: 'preset_duo',
    data: {
      fr:[{text:'👤 Personne 1',color:NEON[0]},{text:'👤 Personne 2',color:NEON[1]}],
      en:[{text:'👤 Person 1',color:NEON[0]},{text:'👤 Person 2',color:NEON[1]}],
      es:[{text:'👤 Persona 1',color:NEON[0]},{text:'👤 Persona 2',color:NEON[1]}],
    }
  },
  colors: {
    labelKey: 'preset_colors',
    data: {
      fr:[{text:'🔴 Rouge',color:'#ff3131'},{text:'🟠 Orange',color:'#ff6b35'},{text:'🟡 Jaune',color:'#ffd700'},{text:'🟢 Vert',color:'#39ff14'},{text:'🔵 Bleu',color:'#1f51ff'},{text:'🟣 Violet',color:'#b026ff'},{text:'⚫ Noir',color:'#888'},{text:'⚪ Blanc',color:'#fff'}],
      en:[{text:'🔴 Red',color:'#ff3131'},{text:'🟠 Orange',color:'#ff6b35'},{text:'🟡 Yellow',color:'#ffd700'},{text:'🟢 Green',color:'#39ff14'},{text:'🔵 Blue',color:'#1f51ff'},{text:'🟣 Purple',color:'#b026ff'},{text:'⚫ Black',color:'#888'},{text:'⚪ White',color:'#fff'}],
      es:[{text:'🔴 Rojo',color:'#ff3131'},{text:'🟠 Naranja',color:'#ff6b35'},{text:'🟡 Amarillo',color:'#ffd700'},{text:'🟢 Verde',color:'#39ff14'},{text:'🔵 Azul',color:'#1f51ff'},{text:'🟣 Morado',color:'#b026ff'},{text:'⚫ Negro',color:'#888'},{text:'⚪ Blanco',color:'#fff'}],
    }
  },
  planets: {
    labelKey: 'preset_planets',
    data: {
      fr:['☿ Mercure','♀ Vénus','🌍 Terre','♂ Mars','♃ Jupiter','♄ Saturne','♅ Uranus','♆ Neptune'],
      en:['☿ Mercury','♀ Venus','🌍 Earth','♂ Mars','♃ Jupiter','♄ Saturn','♅ Uranus','♆ Neptune'],
      es:['☿ Mercurio','♀ Venus','🌍 Tierra','♂ Marte','♃ Júpiter','♄ Saturno','♅ Urano','♆ Neptuno'],
    }
  },
  movies: {
    labelKey: 'preset_movies',
    data: {
      fr:['🎬 Action','😂 Comédie','😱 Horreur','💕 Romance','🔍 Thriller','🌌 SF','🧙 Fantaisie','📜 Drame'],
      en:['🎬 Action','😂 Comedy','😱 Horror','💕 Romance','🔍 Thriller','🌌 Sci-Fi','🧙 Fantasy','📜 Drama'],
      es:['🎬 Acción','😂 Comedia','😱 Terror','💕 Romance','🔍 Thriller','🌌 Ciencia Ficción','🧙 Fantasía','📜 Drama'],
    }
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5) }

/* ═══════════════════════════════════════════════════════════ */
export default function SpinWheel({ lang }) {
  const router = useRouter()
  const tr = useCallback((key) => (TRANSLATIONS[lang] ?? TRANSLATIONS.en)[key] ?? key, [lang])

  // ── State ──────────────────────────────────────────────────
  const [segments,       setSegments]       = useState([])
  const [stats,          setStats]          = useState({})
  const [history,        setHistory]        = useState([])
  const [isSpinning,     setIsSpinning]     = useState(false)
  const [weightsEnabled, setWeightsEnabled] = useState(false)
  const [removeWinner,   setRemoveWinner]   = useState(false)
  const [spinDuration,   setSpinDuration]   = useState(6)
  const [soundEnabled,   setSoundEnabled]   = useState(true)
  const [activeTab,      setActiveTab]      = useState('options')
  const [currentPreset,  setCurrentPreset]  = useState(null)
  const [toast,          setToast]          = useState(null)
  const [modal,          setModal]          = useState(null) // {text, color}
  const [addText,        setAddText]        = useState('')
  const [addColor,       setAddColor]       = useState(NEON[0])
  const [addWeight,      setAddWeight]      = useState(1)
  const [wheelTitle,     setWheelTitle]     = useState('')
  const [confetti,       setConfetti]       = useState([])

  const canvasRef      = useRef(null)
  const rotationRef    = useRef(0)
  const audioCtxRef    = useRef(null)
  const confCanvasRef  = useRef(null)
  const bgCanvasRef    = useRef(null)
  const bgParticlesRef = useRef([])
  const animFrameRef   = useRef(null)
  const confAnimRef    = useRef(null)
  const toastTimeRef   = useRef(null)

  // ── Translation shorthand ─────────────────────────────────
  const t = tr

  // ── Preset loader ─────────────────────────────────────────
  const loadPreset = useCallback((key) => {
    const preset = PRESETS[key]
    if (!preset) return
    const raw = preset.data[lang] ?? preset.data.en
    const segs = raw.map((item, i) =>
      typeof item === 'string'
        ? { text: item, color: NEON[i % NEON.length], weight: 1 }
        : { text: item.text, color: item.color ?? NEON[i % NEON.length], weight: item.weight ?? 1 }
    )
    setSegments(segs)
    setCurrentPreset(key)
    setStats({})
  }, [lang])

  // ── Persist / load ────────────────────────────────────────
  const saveData = useCallback((segs, hist, sts, dur, we, rw, title) => {
    try {
      localStorage.setItem('spinlux_v2', JSON.stringify({
        segments: segs, history: hist, stats: sts,
        lang, spinDuration: dur, weightsEnabled: we,
        removeWinner: rw, title,
      }))
    } catch {}
  }, [lang])

  useEffect(() => {
    // Load URL hash share
    if (typeof window !== 'undefined' && window.location.hash.length > 1) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(window.location.hash.slice(1)))))
        if (Array.isArray(decoded) && decoded.length) {
          setSegments(decoded)
          window.location.hash = ''
          showToast(t('msg_loaded'))
          return
        }
      } catch {}
    }
    try {
      const saved = JSON.parse(localStorage.getItem('spinlux_v2'))
      if (saved?.segments?.length) {
        setSegments(saved.segments)
        setHistory(saved.history ?? [])
        setStats(saved.stats ?? {})
        setSpinDuration(saved.spinDuration ?? 6)
        setWeightsEnabled(saved.weightsEnabled ?? false)
        setRemoveWinner(saved.removeWinner ?? false)
        setWheelTitle(saved.title ?? '')
        return
      }
    } catch {}
    loadPreset('yesno')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save when key state changes
  useEffect(() => {
    if (segments.length) saveData(segments, history, stats, spinDuration, weightsEnabled, removeWinner, wheelTitle)
  }, [segments, history, stats, spinDuration, weightsEnabled, removeWinner, wheelTitle, saveData])

  // ── Toast ─────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimeRef.current)
    toastTimeRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Audio ─────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
  }, [])

  const playTick = useCallback((speed = 1) => {
    if (!soundEnabled) return
    initAudio()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator(), g = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600 + speed * 200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.04)
    g.gain.setValueAtTime(0.25, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    osc.connect(g); g.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.04)
  }, [soundEnabled, initAudio])

  const playWin = useCallback(() => {
    if (!soundEnabled) return
    initAudio()
    const ctx = audioCtxRef.current
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.18, now + 0.1 + i * 0.06)
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.5)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(now); osc.stop(now + 2.5)
    })
  }, [soundEnabled, initAudio])

  // ── Draw wheel ────────────────────────────────────────────
  const drawWheel = useCallback((segs) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2, R = W / 2 - 12
    ctx.clearRect(0, 0, W, H)

    if (!segs?.length) {
      ctx.fillStyle = 'rgba(0,243,255,0.08)'
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.font = 'bold 36px Orbitron,sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('SPINLUX', cx, cy)
      return
    }

    const totalWeight = segs.reduce((s, seg) => s + (seg.weight || 1), 0)
    let startAngle = -Math.PI / 2

    segs.forEach((seg) => {
      const w = seg.weight || 1
      const sliceAngle = (w / totalWeight) * Math.PI * 2
      const endAngle = startAngle + sliceAngle
      const midAngle = startAngle + sliceAngle / 2

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, startAngle, endAngle)
      ctx.closePath()

      const r = parseInt(seg.color.slice(1,3),16)
      const g = parseInt(seg.color.slice(3,5),16)
      const b = parseInt(seg.color.slice(5,7),16)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      grad.addColorStop(0, `rgba(${r},${g},${b},0.15)`)
      grad.addColorStop(0.75, seg.color)
      grad.addColorStop(1, `rgba(${r},${g},${b},0.7)`)
      ctx.fillStyle = grad; ctx.fill()
      ctx.lineWidth = 3; ctx.strokeStyle = '#05050f'; ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy); ctx.rotate(midAngle)
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      const fs = Math.max(22, Math.min(44, 44 - segs.length * 1.4))
      ctx.font = `bold ${fs}px Orbitron,sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8
      let txt = seg.text
      const maxLen = segs.length > 12 ? 9 : segs.length > 6 ? 13 : 18
      if (txt.length > maxLen) txt = txt.slice(0, maxLen - 2) + '…'
      ctx.fillText(txt, R - 30, 0)
      ctx.restore()

      startAngle = endAngle
    })

    // Center cap
    ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2)
    ctx.fillStyle = '#030308'; ctx.fill()
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke()
  }, [])

  useEffect(() => { drawWheel(segments) }, [segments, drawWheel])

  // ── Spin logic ────────────────────────────────────────────
  const pickWeightedWinner = useCallback((segs) => {
    const total = segs.reduce((s, g) => s + (g.weight || 1), 0)
    let r = Math.random() * total
    for (const seg of segs) { r -= (seg.weight || 1); if (r <= 0) return seg }
    return segs[segs.length - 1]
  }, [])

  const spinWheel = useCallback(() => {
    if (isSpinning) return
    if (segments.length < 2) { showToast(t('msg_min2')); return }

    initAudio()
    setIsSpinning(true)

    const duration = spinDuration * 1000
    const extraSpins = 8 + Math.random() * 6
    const winner = pickWeightedWinner(segments)
    const winnerIndex = segments.indexOf(winner)

    const totalWeight = segments.reduce((s, seg) => s + (seg.weight || 1), 0)
    let angleToWinner = 0
    for (let i = 0; i < winnerIndex; i++) {
      angleToWinner += ((segments[i].weight || 1) / totalWeight) * 360
    }
    angleToWinner += ((winner.weight || 1) / totalWeight) * 360 / 2

    const normalized = rotationRef.current % 360
    const targetRemainder = (360 - angleToWinner) % 360
    let delta = targetRemainder - normalized
    if (delta < 0) delta += 360
    const targetRotation = rotationRef.current + extraSpins * 360 + delta
    const startRotation = rotationRef.current
    let startTime = null
    let lastIndex = -1

    function animate(ts) {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = easeOutQuint(progress)
      rotationRef.current = startRotation + eased * (targetRotation - startRotation)

      if (canvasRef.current) {
        canvasRef.current.style.transform = `rotate(${rotationRef.current}deg)`
      }

      // Tick sound
      const speed = 1 - progress
      const tw = segments.reduce((s, g) => s + (g.weight || 1), 0)
      let acc = 0, idx = -1
      const rot = ((rotationRef.current % 360) + 360) % 360
      for (let i = 0; i < segments.length; i++) {
        acc += (segments[i].weight || 1) / tw * 360
        if (rot < acc) { idx = i; break }
      }
      if (idx !== lastIndex && lastIndex !== -1) playTick(speed)
      lastIndex = idx

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Finish
        setIsSpinning(false)
        setStats(prev => ({ ...prev, [winner.text]: (prev[winner.text] || 0) + 1 }))
        setHistory(prev => {
          const next = [{ text: winner.text, color: winner.color, time: new Date() }, ...prev].slice(0, 20)
          return next
        })
        if (removeWinner && segments.length > 1) {
          setSegments(prev => prev.filter(s => s !== winner))
        }
        playWin()
        setModal({ text: winner.text, color: winner.color })
        fireConfettiEffect(winner.color)
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }, [isSpinning, segments, spinDuration, pickWeightedWinner, initAudio, playTick, playWin, removeWinner, showToast, t])

  // ── Confetti ──────────────────────────────────────────────
  const fireConfettiEffect = useCallback((color) => {
    const parts = Array.from({ length: 180 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 16
      return {
        x: window.innerWidth / 2, y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 9 + 4,
        rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 12,
        color: Math.random() > 0.4 ? color : '#fff',
        life: 1,
      }
    })

    const canvas = confCanvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      parts.forEach(c => {
        if (c.life > 0) {
          alive = true
          c.x += c.vx; c.y += c.vy; c.vy += 0.25; c.vx *= 0.97
          c.rot += c.rotV; c.life -= 0.006
          ctx.save()
          ctx.translate(c.x, c.y); ctx.rotate(c.rot * Math.PI / 180)
          ctx.globalAlpha = Math.max(0, c.life)
          ctx.fillStyle = c.color
          ctx.shadowBlur = 10; ctx.shadowColor = c.color
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size)
          ctx.restore()
        }
      })
      if (alive) confAnimRef.current = requestAnimationFrame(draw)
    }
    confAnimRef.current = requestAnimationFrame(draw)
  }, [])

  // ── Background particles ──────────────────────────────────
  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight

    const mkP = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.45 + 0.1),
      vx: (Math.random() - 0.5) * 0.35,
      a: Math.random() * 0.45 + 0.08,
      c: NEON[Math.floor(Math.random() * NEON.length)]
    })
    bgParticlesRef.current = Array.from({ length: 55 }, mkP)

    let rafId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      bgParticlesRef.current.forEach(p => {
        p.y += p.vy; p.x += p.vx
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.c; ctx.globalAlpha = p.a
        ctx.shadowBlur = 4; ctx.shadowColor = p.c; ctx.fill()
      })
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
      rafId = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize) }
  }, [])

  // ── Segment CRUD ──────────────────────────────────────────
  const addSeg = useCallback(() => {
    if (!addText.trim() || segments.length >= 50) return
    setSegments(prev => [...prev, { text: addText.trim(), color: addColor, weight: addWeight }])
    setAddText('')
    setAddColor(NEON[(segments.length + 1) % NEON.length])
    setAddWeight(1)
  }, [addText, addColor, addWeight, segments.length])

  const removeSeg = useCallback((idx) => {
    setSegments(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const updateWeight = useCallback((idx, val) => {
    setSegments(prev => prev.map((s, i) => i === idx ? { ...s, weight: Math.max(1, Math.min(100, parseInt(val) || 1)) } : s))
  }, [])

  const changeColor = useCallback((idx) => {
    const input = document.createElement('input')
    input.type = 'color'
    input.value = segments[idx].color
    input.addEventListener('input', e => {
      setSegments(prev => prev.map((s, i) => i === idx ? { ...s, color: e.target.value } : s))
    })
    input.click()
  }, [segments])

  // ── Share ─────────────────────────────────────────────────
  const shareWheel = useCallback(() => {
    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(segments))))
      const url = `${window.location.origin}/${lang}#${b64}`
      navigator.clipboard.writeText(url).catch(() => {
        const ta = document.createElement('textarea')
        ta.value = url; document.body.appendChild(ta); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      })
      showToast(t('msg_copied'))
    } catch {}
  }, [segments, lang, showToast, t])

  // ── Language switch → URL change ──────────────────────────
  const switchLang = useCallback((newLang) => {
    router.push(`/${newLang}`)
  }, [router])

  // ── Drag & drop ───────────────────────────────────────────
  const dragSrcRef = useRef(null)
  const onDragStart = (idx) => { dragSrcRef.current = idx }
  const onDrop = (toIdx) => {
    const fromIdx = dragSrcRef.current
    if (fromIdx === null || fromIdx === toIdx) return
    setSegments(prev => {
      const next = [...prev]
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return next
    })
  }

  /* ══════════ RENDER ══════════ */
  return (
    <>
      <style>{`
        :root {
          --neon-cyan: #00f3ff; --neon-magenta: #ff00ff;
          --neon-purple: #b026ff; --neon-green: #39ff14;
          --neon-gold: #ffd700; --bg-color: #030308;
          --wheel-size: 480px;
        }
        @media(max-width:768px){ :root { --wheel-size: 300px; } }
        @media(max-width:400px){ :root { --wheel-size: 260px; } }
        *,*::before,*::after { box-sizing: border-box; }
        body {
          background-color: var(--bg-color);
          background-image: radial-gradient(circle at 50% 50%, #0a0a1a 0%, #030308 100%);
          color: white; font-family: 'Rajdhani', sans-serif;
          overflow-x: hidden; overscroll-behavior: none; min-height: 100vh; margin:0;
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@500;600;700&display=swap');
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(0,243,255,0.3); border-radius: 3px; }

        .anti-gravity { animation: float 6s ease-in-out infinite; }
        .anti-gravity-slow { animation: float 8s ease-in-out infinite 1s; }
        .anti-gravity-fast { animation: float-s 4s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-14px) rotate(.8deg)} }
        @keyframes float-s { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

        .glass-panel {
          background: rgba(10,10,20,0.65); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          border-radius: 16px; transition: border-color .3s, box-shadow .3s;
        }
        .glass-panel:hover { border-color: rgba(0,243,255,0.2); box-shadow: 0 8px 32px rgba(0,243,255,0.08); }

        .neon-cyan { text-shadow: 0 0 6px var(--neon-cyan), 0 0 14px var(--neon-cyan); color:#fff; }
        .neon-gold { text-shadow: 0 0 10px var(--neon-gold), 0 0 22px var(--neon-gold), 0 0 46px var(--neon-gold); color:#fff; }

        #wheel-wrap {
          width: var(--wheel-size); height: var(--wheel-size); position: relative; border-radius: 50%;
          box-shadow: 0 0 30px rgba(0,243,255,.18), inset 0 0 40px rgba(255,0,255,.15), 0 0 90px rgba(0,243,255,.08);
          border: 3px solid rgba(255,255,255,0.08); cursor: pointer; z-index: 10;
        }
        #wheel-canvas { width:100%; height:100%; border-radius:50%; display:block; }
        .wheel-pointer {
          position:absolute; top:-18px; left:50%; transform:translateX(-50%); z-index:20;
          filter: drop-shadow(0 0 12px var(--neon-cyan));
        }
        .wheel-pointer::after {
          content:''; display:block; width:0; height:0;
          border-left:18px solid transparent; border-right:18px solid transparent;
          border-top:36px solid #fff;
        }

        .neon-btn {
          background: transparent; color: white; border: 1px solid var(--neon-magenta);
          box-shadow: 0 0 8px rgba(255,0,255,.18), inset 0 0 8px rgba(255,0,255,.12);
          text-transform: uppercase; font-family: 'Orbitron', sans-serif;
          letter-spacing: 2px; transition: all .28s ease; position: relative;
          overflow: hidden; cursor: pointer;
        }
        .neon-btn:hover { background:rgba(255,0,255,.08); box-shadow:0 0 18px var(--neon-magenta); transform:translateY(-2px) scale(1.03); }
        .neon-btn:active { transform:scale(.96); }
        .neon-btn-cyan { border-color: var(--neon-cyan); box-shadow: 0 0 8px rgba(0,243,255,.18), inset 0 0 8px rgba(0,243,255,.12); }
        .neon-btn-cyan:hover { background:rgba(0,243,255,.08); box-shadow:0 0 18px var(--neon-cyan); }

        .seg-item {
          display:flex; align-items:center; gap:8px; padding:8px 10px;
          background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.06);
          border-radius:8px; transition: all .18s ease; cursor:default;
        }
        .seg-item:hover { background:rgba(255,255,255,.04); border-color:rgba(0,243,255,.2); }

        .tab-btn { border-bottom:2px solid transparent; transition:all .25s ease; opacity:.55; background:none; cursor:pointer; }
        .tab-btn:hover { opacity:.85; }
        .tab-btn.active { opacity:1; border-bottom-color:var(--neon-cyan); color:var(--neon-cyan); text-shadow:0 0 8px rgba(0,243,255,.5); }

        #result-modal {
          position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
          background:rgba(3,3,8,.82); backdrop-filter:blur(18px);
          opacity:0; pointer-events:none; transition:opacity .35s; z-index:200;
        }
        #result-modal.active { opacity:1; pointer-events:all; }
        .result-content { transform:scale(.8) translateY(40px); transition:transform .55s cubic-bezier(.175,.885,.32,1.275); }
        #result-modal.active .result-content { transform:scale(1) translateY(0); }

        .stat-bar-fill {
          height:100%; border-radius:3px;
          box-shadow:0 0 6px var(--c1,var(--neon-cyan));
          transition:width .6s ease;
        }

        #toast {
          position:fixed; bottom:22px; left:50%; transform:translateX(-50%) translateY(10px);
          background:rgba(10,10,20,.9); border:1px solid rgba(255,255,255,.15);
          color:#fff; padding:10px 24px; border-radius:40px;
          box-shadow:0 4px 20px rgba(0,0,0,.5);
          opacity:0; pointer-events:none; transition:opacity .3s, transform .3s; z-index:300;
          font-family:'Rajdhani',sans-serif; font-weight:600; font-size:15px;
        }
        #toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

        .lang-flag {
          cursor:pointer; filter:grayscale(1) opacity(.45); transition:all .25s ease;
          font-size:1.4rem; line-height:1; background:none; border:none;
        }
        .lang-flag:hover { filter:grayscale(0) opacity(1); transform:scale(1.15); }
        .lang-flag.active { filter:grayscale(0) opacity(1) drop-shadow(0 0 8px var(--neon-cyan)); }

        .preset-card {
          display:flex; justify-content:space-between; align-items:center;
          padding:10px 14px; border-radius:10px;
          background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.06);
          cursor:pointer; transition:all .2s ease;
        }
        .preset-card:hover { background:rgba(0,243,255,.06); border-color:rgba(0,243,255,.3); }

        input[type="text"],input[type="number"],input[type="range"],select {
          background: rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.1);
          color: white; transition: all .25s ease;
        }
        input[type="text"]:focus,input[type="number"]:focus { outline:none; border-color:var(--neon-cyan); box-shadow:0 0 8px rgba(0,243,255,.3); }
        input[type="range"] { -webkit-appearance:none; appearance:none; background:rgba(255,255,255,.1); border:none; height:4px; border-radius:2px; cursor:pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; background:var(--neon-cyan); border-radius:50%; box-shadow:0 0 6px var(--neon-cyan); }

        .hub-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        #conf-canvas { position:fixed; inset:0; pointer-events:none; z-index:190; }
        #bg-canvas   { position:fixed; inset:0; pointer-events:none; z-index:0; }
      `}</style>

      {/* Background layers */}
      <canvas ref={bgCanvasRef} id="bg-canvas" />
      <canvas ref={confCanvasRef} id="conf-canvas" />

      {/* ══ HEADER ══ */}
      <header
        style={{ position:'relative', zIndex:50 }}
        className="glass-panel"
        style={{
          position:'relative', zIndex:50,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'16px 20px', borderRadius:0, borderTop:0, borderLeft:0, borderRight:0,
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div
            className="anti-gravity-fast"
            style={{ fontFamily:'Orbitron,sans-serif', fontWeight:900, fontSize:'1.5rem', letterSpacing:'0.15em', cursor:'pointer', userSelect:'none' }}
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
          >
            <span className="neon-cyan">SPIN</span><span style={{ color:'white' }}>LUX</span>
          </div>
        </div>

        {/* Desktop wheel title */}
        <input
          type="text" maxLength={40} value={wheelTitle}
          onChange={e => setWheelTitle(e.target.value)}
          style={{
            display:'none', textAlign:'center', fontFamily:'Orbitron,sans-serif',
            fontSize:'0.875rem', letterSpacing:'0.1em', borderRadius:8,
            padding:'8px 16px', width:224, background:'transparent',
            border:'1px solid transparent', color:'rgba(255,255,255,.7)',
          }}
          className="md-show"
        />

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {/* Contact icon */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            title={CONTACT_EMAIL}
            style={{ color:'rgba(156,163,175,1)', transition:'color .25s', fontSize:'1.125rem', textDecoration:'none' }}
            onMouseEnter={e => e.currentTarget.style.color='white'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(156,163,175,1)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </a>
          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(v => !v)}
            title="Son"
            style={{ background:'none', border:'none', color: soundEnabled ? 'rgba(156,163,175,1)' : '#444', cursor:'pointer', fontSize:'1.125rem', transition:'color .25s' }}
          >
            {soundEnabled
              ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            }
          </button>
          {/* Lang flags */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {SUPPORTED_LANGS.map(l => (
              <button key={l} className={`lang-flag ${lang === l ? 'active' : ''}`} onClick={() => switchLang(l)}>
                {l === 'fr' ? '🇫🇷' : l === 'en' ? '🇬🇧' : '🇪🇸'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main style={{
        display:'flex', flexDirection:'column', gap:24, padding:'16px 24px',
        position:'relative', zIndex:10, maxWidth:'1536px', margin:'0 auto', width:'100%',
      }}>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>

          {/* ─── LEFT PANEL ─── */}
          <aside style={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', gap:16 }} className="anti-gravity-slow">
            <div className="glass-panel" style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,.1)', fontFamily:'Orbitron,sans-serif', fontSize:'0.75rem' }}>
                {(['options','presets','settings']).map(tab => (
                  <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    style={{ flex:1, paddingBottom:8, border:'none', background:'none', color:'white', textTransform:'uppercase', letterSpacing:'0.1em' }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'options' ? t('tab_options') : tab === 'presets' ? t('tab_presets') : t('tab_settings')}
                  </button>
                ))}
              </div>

              {/* OPTIONS */}
              {activeTab === 'options' && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.75rem', color:'rgba(156,163,175,1)', fontFamily:'Orbitron,sans-serif' }}>{segments.length}/50</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        onClick={() => setWeightsEnabled(v => !v)}
                        style={{
                          fontSize:11, padding:'2px 7px', borderRadius:20,
                          background:'rgba(176,38,255,.2)', border:'1px solid rgba(176,38,255,.4)',
                          color:'rgba(176,38,255,.9)', fontFamily:'Orbitron,sans-serif', cursor:'pointer',
                        }}
                      >
                        {weightsEnabled ? t('weights_on') : t('weights_off')}
                      </button>
                      <button
                        onClick={() => setSegments(prev => [...prev].sort(() => Math.random() - 0.5))}
                        style={{ fontSize:'0.75rem', padding:'4px 12px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,0,255,.6)', color:'white', cursor:'pointer' }}
                      >🔀</button>
                      <button
                        onClick={() => { setSegments([]); setCurrentPreset(null); showToast(t('msg_cleared')) }}
                        style={{ fontSize:'0.75rem', padding:'4px 12px', borderRadius:8, background:'transparent', border:'1px solid rgba(239,68,68,.6)', color:'rgba(248,113,113,1)', cursor:'pointer' }}
                      >🗑</button>
                    </div>
                  </div>

                  {/* Segment list */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, overflowY:'auto', maxHeight:208, paddingRight:4 }}>
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="seg-item"
                        draggable
                        onDragStart={() => onDragStart(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => onDrop(idx)}
                      >
                        <span style={{ color:'rgba(75,85,99,1)', fontSize:'0.75rem', cursor:'grab', marginRight:4 }}>⠿</span>
                        <div
                          onClick={() => changeColor(idx)}
                          style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, cursor:'pointer', background:seg.color, boxShadow:`0 0 8px ${seg.color}` }}
                        />
                        <span style={{ flexGrow:1, fontSize:'0.875rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{seg.text}</span>
                        {weightsEnabled && (
                          <input
                            type="number" min="1" max="100" value={seg.weight || 1}
                            onChange={e => updateWeight(idx, e.target.value)}
                            style={{ width:48, textAlign:'center', fontSize:'0.75rem', borderRadius:4, padding:'2px 4px', fontFamily:'Orbitron,sans-serif', background:'rgba(176,38,255,.15)', border:'1px solid rgba(176,38,255,.4)', color:'rgba(176,38,255,.9)' }}
                          />
                        )}
                        <button
                          onClick={() => removeSeg(idx)}
                          style={{ background:'none', border:'none', color:'rgba(75,85,99,1)', cursor:'pointer', fontSize:'0.75rem', marginLeft:4, transition:'color .2s' }}
                          onMouseEnter={e => e.currentTarget.style.color='rgba(248,113,113,1)'}
                          onMouseLeave={e => e.currentTarget.style.color='rgba(75,85,99,1)'}
                        >✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Add form */}
                  <form
                    onSubmit={e => { e.preventDefault(); addSeg() }}
                    style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.08)' }}
                  >
                    <input type="color" value={addColor} onChange={e => setAddColor(e.target.value)}
                      style={{ width:36, height:36, borderRadius:8, cursor:'pointer', background:'transparent', border:'1px solid rgba(255,255,255,.1)', padding:2, flexShrink:0 }}
                    />
                    <input
                      type="text" value={addText} onChange={e => setAddText(e.target.value)}
                      placeholder={t('ph_add')}
                      style={{ flexGrow:1, borderRadius:8, padding:'8px 12px', fontSize:'0.875rem' }}
                    />
                    {weightsEnabled && (
                      <input type="number" min="1" max="100" value={addWeight} onChange={e => setAddWeight(parseInt(e.target.value)||1)}
                        style={{ width:56, borderRadius:8, padding:'8px 8px', fontSize:'0.875rem', textAlign:'center' }}
                      />
                    )}
                    <button type="submit" className="neon-btn neon-btn-cyan" style={{ padding:'8px 16px', borderRadius:8, fontSize:'0.875rem' }}>+</button>
                  </form>
                </div>
              )}

              {/* PRESETS */}
              {activeTab === 'presets' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <p style={{ fontSize:'0.75rem', color:'rgba(156,163,175,1)', marginBottom:4 }}>{t('presets_desc')}</p>
                  {Object.keys(PRESETS).map(key => (
                    <div key={key} className="preset-card" onClick={() => loadPreset(key)}>
                      <span style={{ fontSize:'0.875rem', fontWeight:600, color: currentPreset === key ? 'var(--neon-cyan)' : 'rgba(229,231,235,1)' }}>
                        {t(PRESETS[key].labelKey)}
                      </span>
                      <span style={{ fontSize:'0.75rem', color: currentPreset === key ? 'var(--neon-cyan)' : 'rgba(75,85,99,1)' }}>→</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SETTINGS */}
              {activeTab === 'settings' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div>
                    <label style={{ fontSize:'0.75rem', color:'rgba(156,163,175,1)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'Orbitron,sans-serif', display:'block', marginBottom:8 }}>
                      {t('lbl_duration')}
                    </label>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input type="range" min="2" max="12" step="1" value={spinDuration}
                        onChange={e => setSpinDuration(parseInt(e.target.value))}
                        style={{ flex:1 }}
                      />
                      <span style={{ color:'var(--neon-cyan)', fontFamily:'Orbitron,sans-serif', fontSize:'0.875rem', width:40, textAlign:'right' }}>{spinDuration}s</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'rgba(75,85,99,1)', marginTop:4 }}>
                      <span>{t('dur_fast')}</span><span>{t('dur_dramatic')}</span>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.875rem', color:'rgba(209,213,219,1)' }}>{t('lbl_remove')}</span>
                    <button
                      onClick={() => setRemoveWinner(v => !v)}
                      style={{
                        width:44, height:24, borderRadius:9999, border:'1px solid rgba(255,255,255,.2)',
                        position:'relative', cursor:'pointer', transition:'all .25s',
                        background: removeWinner ? 'rgba(0,243,255,.25)' : 'rgba(255,255,255,.08)',
                        borderColor: removeWinner ? 'rgba(0,243,255,.5)' : 'rgba(255,255,255,.2)',
                      }}
                    >
                      <span style={{
                        position:'absolute', top:2, left:2, width:20, height:20,
                        background:'white', borderRadius:'50%', transition:'transform .25s', display:'block',
                        transform: removeWinner ? 'translateX(20px)' : 'translateX(0)',
                      }} />
                    </button>
                  </div>

                  <button className="neon-btn neon-btn-cyan" style={{ padding:'8px 16px', borderRadius:8, fontSize:'0.875rem', width:'100%' }} onClick={shareWheel}>
                    📤 {t('btn_share')}
                  </button>
                  <button
                    onClick={() => { setStats({}); showToast(t('msg_stats_reset')) }}
                    style={{ padding:'8px 16px', borderRadius:8, fontSize:'0.875rem', width:'100%', background:'transparent', border:'1px solid rgba(239,68,68,.5)', color:'rgba(248,113,113,1)', cursor:'pointer', fontFamily:'Orbitron,sans-serif', transition:'all .2s' }}
                  >
                    📊 {t('btn_reset_stats')}
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            <div className="glass-panel" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', color:'var(--neon-cyan)' }}>{t('lbl_history')}</span>
                <button onClick={() => setHistory([])} style={{ background:'none', border:'none', fontSize:'0.75rem', color:'rgba(248,113,113,1)', cursor:'pointer' }}>🗑</button>
              </div>
              <ul style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:144, overflowY:'auto', paddingRight:4, margin:0, padding:0, listStyle:'none' }}>
                {!history.length
                  ? <li style={{ color:'rgba(107,114,128,1)', fontSize:'0.875rem', fontStyle:'italic', textAlign:'center', padding:'12px 0' }}>{t('history_empty')}</li>
                  : history.slice(0, 10).map((item, i) => (
                    <li key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.875rem', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, display:'inline-block', background:item.color, boxShadow:`0 0 5px ${item.color}` }} />
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexGrow:1, fontWeight:600 }}>{item.text}</span>
                      <span style={{ color:'rgba(75,85,99,1)', fontSize:'0.75rem', flexShrink:0 }}>#{i+1}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </aside>

          {/* ─── CENTER: WHEEL ─── */}
          <section style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, padding:'16px 0', position:'relative' }}>
            <div className="anti-gravity" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:32 }}>
              <div id="wheel-wrap" onClick={spinWheel}>
                <div className="wheel-pointer" />
                <canvas ref={canvasRef} id="wheel-canvas" width={960} height={960} />
                {/* Center hub */}
                <div style={{
                  position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                  width:56, height:56, background:'#030308', borderRadius:'50%',
                  border:'4px solid white', zIndex:20, boxShadow:'0 0 18px #fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <div className="hub-pulse" style={{ width:20, height:20, borderRadius:'50%', background:'black', border:'1px solid var(--neon-cyan)', boxShadow:'0 0 8px var(--neon-cyan)' }} />
                </div>
              </div>

              <button
                id="btn-spin"
                className="neon-btn"
                style={{ padding:'16px 40px', borderRadius:9999, fontSize:'1.25rem', fontWeight:700, width:240, opacity: isSpinning ? 0.5 : 1 }}
                onClick={spinWheel}
                disabled={isSpinning}
              >
                {t('btn_spin')}
              </button>
            </div>
          </section>

          {/* ─── RIGHT PANEL ─── */}
          <aside style={{ width:'100%', maxWidth:340, display:'flex', flexDirection:'column', gap:16 }} className="anti-gravity">
            <div className="glass-panel" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', color:'var(--neon-cyan)' }}>{t('lbl_stats')}</span>
              <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:320, overflowY:'auto', paddingRight:4 }}>
                {!Object.keys(stats).length
                  ? <p style={{ color:'rgba(107,114,128,1)', fontSize:'0.875rem', fontStyle:'italic', textAlign:'center', padding:'12px 0' }}>{t('stats_empty')}</p>
                  : (() => {
                    const total = Object.values(stats).reduce((a,b) => a+b, 0)
                    return Object.keys(stats)
                      .sort((a,b) => stats[b] - stats[a])
                      .map(key => {
                        const count = stats[key]
                        const pct = Math.round(count / total * 100)
                        const seg = segments.find(s => s.text === key)
                        const color = seg ? seg.color : 'var(--neon-cyan)'
                        return (
                          <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.75rem' }}>
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600, color:'rgba(229,231,235,1)', maxWidth:'65%' }}>{key}</span>
                              <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.75rem', color }}>{count} {t('lbl_times')} · {pct}%</span>
                            </div>
                            <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,.05)', overflow:'hidden' }}>
                              <div className="stat-bar-fill" style={{ width:`${pct}%`, '--c1':color, '--c2':`${color}aa`, background:`linear-gradient(90deg,${color},${color}aa)` }} />
                            </div>
                          </div>
                        )
                      })
                  })()
                }
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ══ RESULT MODAL ══ */}
      <div id="result-modal" className={modal ? 'active' : ''}>
        <div className="result-content anti-gravity" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'0 24px' }}>
          <div style={{ fontSize:'3rem' }}>🎯</div>
          <h2 style={{ fontFamily:'Orbitron,sans-serif', color:'rgba(209,213,219,1)', fontSize:'1.25rem', letterSpacing:'0.1em', margin:0 }}>{t('winner_title')}</h2>
          <div
            className="neon-gold"
            style={{
              fontFamily:'Orbitron,sans-serif', fontWeight:900, textAlign:'center',
              fontSize:'clamp(2rem,8vw,4.5rem)', wordBreak:'break-word', maxWidth:560, padding:'0 16px',
              textShadow: modal ? `0 0 10px ${modal.color},0 0 22px ${modal.color},0 0 46px ${modal.color}` : undefined,
            }}
          >
            {modal?.text ?? '—'}
          </div>
          <div style={{ color:'rgba(156,163,175,1)', fontSize:'0.875rem', fontFamily:'Orbitron,sans-serif' }}>
            {modal ? `${stats[modal.text] || 0} ${t('lbl_times')} au total` : ''}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:16 }}>
            <button
              className="neon-btn neon-btn-cyan"
              style={{ padding:'12px 24px', borderRadius:9999, fontSize:'1rem' }}
              onClick={() => { setModal(null); setTimeout(spinWheel, 400) }}
            >
              🔁 {t('btn_again')}
            </button>
            <button
              onClick={() => setModal(null)}
              style={{
                padding:'12px 24px', borderRadius:9999,
                border:'1px solid rgba(255,255,255,.2)', color:'white',
                background:'transparent', fontFamily:'Orbitron,sans-serif',
                fontSize:'1rem', letterSpacing:'0.05em', cursor:'pointer',
                transition:'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.1)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {t('btn_close')}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div id="toast" className={toast ? 'show' : ''}>{toast}</div>
    </>
  )
}
