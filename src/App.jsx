/**
 * Hopfield Associative Memory — Interactive Explainer
 * DataForge 2026 | Pathway Track | Topic: Memory & State
 *
 * Claim: "A fixed-size weight matrix stores binary patterns via Hebbian learning
 * and retrieves them from corrupted inputs, but storing more than ~13.8% of
 * neuron count causes destructive interference that corrupts retrieval."
 *
 * No external ML libraries — all Hopfield math in plain JavaScript.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const G   = 5                        // grid size (5×5)
const N   = G * G                    // total neurons = 25
const CAP = Math.floor(0.138 * N)    // theoretical capacity ≈ 3

// ─── Preset Patterns (5×5, values ∈ {-1, +1}) ────────────────────────────────
export const PATTERNS = {
  T: [ 1, 1, 1, 1, 1,  -1,-1, 1,-1,-1,  -1,-1, 1,-1,-1,  -1,-1, 1,-1,-1,  -1,-1, 1,-1,-1],
  O: [-1, 1, 1, 1,-1,   1,-1,-1,-1, 1,   1,-1,-1,-1, 1,   1,-1,-1,-1, 1,  -1, 1, 1, 1,-1],
  X: [ 1,-1,-1,-1, 1,  -1, 1,-1, 1,-1,  -1,-1, 1,-1,-1,  -1, 1,-1, 1,-1,   1,-1,-1,-1, 1],
  L: [ 1,-1,-1,-1,-1,   1,-1,-1,-1,-1,   1,-1,-1,-1,-1,   1,-1,-1,-1,-1,   1, 1, 1, 1, 1],
  H: [ 1,-1,-1,-1, 1,   1,-1,-1,-1, 1,   1, 1, 1, 1, 1,   1,-1,-1,-1, 1,   1,-1,-1,-1, 1],
}

// ─── Hopfield Network Operations ─────────────────────────────────────────────

/** Create an empty N×N weight matrix (all zeros) */
export const makeWeights = () => Array.from({ length: N }, () => new Array(N).fill(0))

/**
 * Hebbian learning rule: W_ij += x_i * x_j / N  (diagonal stays 0)
 */
export const storePattern = (W, p) =>
  W.map((row, i) => row.map((v, j) => i === j ? 0 : v + (p[i] * p[j]) / N))

/**
 * Synchronous update: s_i(t+1) = sign( sum_j W_ij * s_j(t) )
 */
export const updateState = (W, s) =>
  s.map((_, i) => s.reduce((a, v, j) => a + W[i][j] * v, 0) >= 0 ? 1 : -1)

/**
 * Run synchronous updates until convergence or maxSteps.
 * Returns all intermediate states for animation playback.
 */
export const converge = (W, s0, max = 20) => {
  let s = [...s0]
  const frames = [[...s]]
  for (let t = 0; t < max; t++) {
    const ns = updateState(W, s)
    if (ns.every((v, i) => v === s[i])) break
    s = ns
    frames.push([...s])
  }
  return frames
}

/** Randomly flip each neuron with probability `rate` */
export const addNoise = (p, rate) => p.map(v => Math.random() < rate ? -v : v)

/** Percentage of matching bits */
export const matchPct = (a, b) =>
  Math.round(a.filter((v, i) => v === b[i]).length / N * 100)

/**
 * One-shot "modern Hopfield / attention" retrieval (Ramsauer et al., 2021;
 * Millidge et al., 2022): treat every stored pattern as both a key and a
 * value, score the query against each via a dot product, softmax the
 * scores, and return the weighted average of the patterns. This is a real,
 * live computation (not scripted) — it is the same similarity-softmax-
 * weighted-sum operation used in Transformer self-attention, applied here
 * to the identical stored patterns and query the classical (iterative,
 * ±1-thresholded) Hopfield retrieval above uses. beta is the softmax
 * inverse-temperature: higher beta -> sharper, more winner-take-all recall.
 */
export const attentionRetrieve = (storedVecs, query, beta = 2) => {
  if (!storedVecs.length) return { weights: [], out: new Array(N).fill(0) }
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)
  const scores = storedVecs.map(p => beta * dot(p, query) / N)
  const m = Math.max(...scores)
  const exps = scores.map(s => Math.exp(s - m))
  const sumExp = exps.reduce((a, b) => a + b, 0)
  const weights = exps.map(e => e / sumExp)
  const out = new Array(N).fill(0)
  storedVecs.forEach((p, k) => p.forEach((v, i) => { out[i] += weights[k] * v }))
  return { weights, out }
}

// ─── BDH Synapse Demo — nodes, edges, walkthrough, quiz ──────────────────────
// Ported from the standalone bdh-synapse-demo (vanilla JS/HTML) into this
// React app as its own tab, so the whole explainer lives in one place and
// one framework. Node positions are percentages (0-100), so the SVG edges
// use a 0-100 viewBox and never need pixel measurement or a resize listener.
const SYN_NODES = [
  { id: 0, x: 20, y: 50, label: 'A' },
  { id: 1, x: 50, y: 20, label: 'B' },
  { id: 2, x: 80, y: 50, label: 'C' },
  { id: 3, x: 50, y: 80, label: 'D' },
]
const SYN_EDGE_KEYS = (() => {
  const keys = []
  for (let i = 0; i < SYN_NODES.length; i++)
    for (let j = i + 1; j < SYN_NODES.length; j++) keys.push(`${i}-${j}`)
  return keys
})()
const SYN_INITIAL_WEIGHTS = { ...Object.fromEntries(SYN_EDGE_KEYS.map(k => [k, 0])), '0-1': 0.9, '1-2': 0.6 }

const SYN_WALK_STEPS = [
  { title: 'Step 1 of 4 — This is the memory', body: 'The lines between nodes are synapses. Their thickness is the only memory this network has — there is no separate storage.' },
  { title: 'Step 2 of 4 — Click to fire, fire to grow', body: 'In Train mode, click nodes in a sequence. Each click strengthens the synapse between the previously-fired node and this one.' },
  { title: 'Step 3 of 4 — Test what it remembers', body: 'Switch to Test Recall, predict what will happen, then click a node from your trained sequence to see if the signal chains automatically.' },
  { title: 'Step 4 of 4 — Now try to break it', body: 'Try Interference (train a conflicting sequence) or Compare to Transformer (see the same click represented two ways). Then explore freely.' },
]

const SYN_QUIZ_OPTIONS = [
  { id: 'a', text: 'Nothing — the old sequence stays exactly as strong as before.' },
  { id: 'b', text: 'The shared synapses get pulled toward the new sequence, and the old one decays or gets overwritten.', correct: true },
  { id: 'c', text: 'The network stops working entirely and needs a reset.' },
]

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#06090f', srf: '#0c1120', srf2: '#111827', bdr: '#1c2640',
  acc: '#8b5cf6', acl: '#a78bfa', txt: '#e2e8f0',
  mut: '#64748b', dim: '#2d3748',
  grn: '#10b981', amb: '#f59e0b', rse: '#f43f5e', blu: '#3b82f6',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** 5×5 grid: purple = active (+1), dark = inactive (-1) */
function PatternGrid({ pattern, cellSize = 30, dimmed = false }) {
  if (!pattern) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${G}, ${cellSize}px)`, gap: 2 }}>
      {pattern.map((v, i) => (
        <div key={i} style={{
          width: cellSize, height: cellSize, borderRadius: 3,
          background: v === 1 ? (dimmed ? '#5b21b6' : C.acl) : '#0d1525',
          border: `1px solid ${C.bdr}`, transition: 'background 0.12s ease',
        }} />
      ))}
    </div>
  )
}

/** Like PatternGrid, but for continuous (non-thresholded) values in [-1, 1] —
 * used for the attention-weighted output, which is a soft blend of stored
 * patterns rather than a clean ±1 pattern, so a binary grid would misrepresent it. */
function ContinuousGrid({ values, cellSize = 30 }) {
  if (!values) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${G}, ${cellSize}px)`, gap: 2 }}>
      {values.map((v, i) => {
        const t = Math.max(0, Math.min(1, (v + 1) / 2)) // map [-1,1] -> [0,1]
        const lightness = Math.round(10 + t * 55)
        return (
          <div key={i} style={{
            width: cellSize, height: cellSize, borderRadius: 3,
            background: `hsl(258, 70%, ${lightness}%)`,
            border: `1px solid ${C.bdr}`,
          }} />
        )
      })}
    </div>
  )
}

/** 25×25 heatmap of weight matrix. Purple=positive, Blue=negative */
function WeightHeatmap({ weights }) {
  const maxAbs = useMemo(
    () => Math.max(...weights.flat().map(Math.abs), 0.001),
    [weights]
  )
  return (
    <div style={{
      display: 'inline-grid', gridTemplateColumns: `repeat(${N}, 10px)`,
      gap: 1, background: '#060912', borderRadius: 8, padding: 8,
    }}>
      {weights.map((row, i) => row.map((v, j) => {
        const n = v / maxAbs
        return (
          <div key={`${i}-${j}`} style={{
            width: 10, height: 10, borderRadius: 1,
            background:
              n > 0 ? `rgba(167,139,250,${(n * 0.9 + 0.05).toFixed(2)})`
              : n < 0 ? `rgba(96,165,250,${(-n * 0.9 + 0.05).toFixed(2)})`
              : '#1a2035',
          }} />
        )
      }))}
    </div>
  )
}

/** 5×5 clickable grid — learner paints their own pattern cell by cell */
function DrawableGrid({ pattern, onToggle, cellSize = 30 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${G}, ${cellSize}px)`, gap: 2 }}>
      {pattern.map((v, i) => (
        <div key={i} onClick={() => onToggle(i)}
          role="button" aria-label={`Cell ${i + 1}, currently ${v === 1 ? 'on' : 'off'} — click to toggle`}
          style={{
            width: cellSize, height: cellSize, borderRadius: 3,
            background: v === 1 ? C.acl : '#0d1525',
            border: `1px solid ${v === 1 ? C.acc : C.bdr}`,
            cursor: 'pointer', transition: 'background 0.1s ease',
            userSelect: 'none',
          }} />
      ))}
    </div>
  )
}

/** Animated capacity progress bar */
function CapacityMeter({ stored, max }) {
  const pct = stored / max
  const col = stored > max ? C.rse : pct > 0.67 ? C.amb : C.grn
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: C.mut }}>Memory capacity</span>
        <span style={{ color: col, fontWeight: 700 }}>{stored} / {max}</span>
      </div>
      <div style={{ height: 5, background: C.dim, borderRadius: 3 }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${Math.min(pct * 100, 100)}%`,
          background: col, transition: 'all 0.35s ease',
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#374151', marginTop: 3 }}>
        0.138 x {N} neurons = {max} pattern limit
      </div>
    </div>
  )
}

// ─── Feature 9: guided walkthrough steps ──────────────────────────────────
// Each step names the real panel it points at ('store' | 'retrieve' | 'output')
// so the highlight ring in the JSX below always lands on a live element,
// never a screenshot.
const WALKTHROUGH_STEPS = [
  { target: 'store',    title: 'This is the memory',
    body: "This W matrix is the network's only memory. Click \u201cStore\u201d to add a pattern — each store adds W += x\u1D40x / N. Nothing is saved anywhere else." },
  { target: 'retrieve',  title: 'Corrupt it, then ask for it back',
    body: 'Drag the noise slider, then click Retrieve. The network starts from a corrupted pattern and lets the weight matrix pull it back toward whatever it stored.' },
  { target: 'output',    title: 'Watch it converge',
    body: 'Each frame here is a real synchronous update, computed live — not an animation. It stops once the state stops changing.' },
  { target: 'store',     title: 'Now try to break it',
    body: 'Store all 5 patterns (T, O, X, L, H) and retrieve one. The capacity meter turns red once you pass ~3 — that\u2019s the claim this demo is built to test.' },
]

// ─── Feature 10: comprehension check (10 questions) ───────────────────────
const QUIZ_QUESTIONS = [
  // Q1 — capacity overflow (unchanged, correct)
  {
    q: 'You\u2019ve stored 5 patterns in a 25-neuron network (capacity \u2248 3). What happens when you try to retrieve one?',
    options: [
      { id: 'a', text: 'It retrieves perfectly \u2014 more patterns just means more memory used.' },
      { id: 'b', text: 'Output is a garbled superposition \u2014 the shared weights interfere with each other.', correct: true },
      { id: 'c', text: 'The network refuses to run and shows an error.' },
    ],
    explain: 'The weight matrix has no separate slot per pattern \u2014 every stored pattern adds into the same N\u00d7N matrix. Past ~13.8% of N, the summed contributions interfere destructively and retrieval degrades. This is the capacity-overflow failure you can reproduce in the Demo tab.',
  },
  // Q2 — FIXED: BDH uses Hebbian (not gradient descent) during inference
  {
    q: 'Per the primary source (arXiv:2509.26507 \u00a72.5), how does BDH\u2019s working memory get updated during inference?',
    options: [
      { id: 'a', text: 'Via Hebbian synaptic plasticity using spiking neurons \u2014 the same general rule family this demo uses.', correct: true },
      { id: 'b', text: 'Only via gradient descent \u2014 it re-trains on every new input.' },
      { id: 'c', text: 'It doesn\u2019t update during inference \u2014 all memory is fixed at training time.' },
    ],
    explain: 'The BDH paper states its working memory during inference \u201centirely relies on synaptic plasticity with Hebbian learning using spiking neurons.\u201d Gradient descent is used only to train the fixed backbone parameters M \u2014 NOT to write the fast-weight state \u03c3 at inference time. The real distinction is BDH has two pieces: fixed trained params + a separately Hebbian-updated fast-weight layer. Our demo has one piece: the W matrix, updated by a hand-picked Hebbian rule.',
  },
  // Q3 — diagonal of W
  {
    q: 'Why is the diagonal of the weight matrix W (i.e., W[i][i]) kept at zero in the classical Hopfield rule?',
    options: [
      { id: 'a', text: 'To save computation \u2014 diagonal entries don\u2019t affect the output.' },
      { id: 'b', text: 'To prevent a neuron from directly exciting itself, which would bias it toward its own current state regardless of the stored patterns.', correct: true },
      { id: 'c', text: 'Because the patterns don\u2019t use the diagonal positions anyway.' },
    ],
    explain: 'If W[i][i] \u2260 0, neuron i\u2019s own activation feeds back into itself directly during the update s_i = sign(\u03a3_j W[i][j] \u00b7 s_j). That self-loop biases it toward staying in its current state, decoupled from the stored correlations \u2014 which corrupts convergence. Setting the diagonal to 0 is a deliberate design choice, not a simplification.',
  },
  // Q4 — spurious attractors
  {
    q: 'What is a \u201cspurious attractor\u201d in a Hopfield network?',
    options: [
      { id: 'a', text: 'A stored pattern that was retrieved incorrectly due to too much noise.' },
      { id: 'b', text: 'A stable energy minimum that was never explicitly stored \u2014 often a linear superposition or negation of real patterns.', correct: true },
      { id: 'c', text: 'A bug in the Hebbian rule that causes the network to loop forever.' },
    ],
    explain: 'The energy landscape the network minimizes can have stable states beyond the explicitly stored patterns. These \u201cghosts\u201d arise structurally from the Hopfield energy function \u2014 they\u2019re not bugs. A corrupted input can converge to one even when capacity hasn\u2019t been exceeded. This is listed as Limitation 2 in the Failure Cases tab.',
  },
  // Q5 — falsifiability
  {
    q: 'What experimental result would directly falsify the demo\u2019s main claim about destructive interference?',
    options: [
      { id: 'a', text: 'Retrieval failing when only 1 pattern is stored (well below capacity).' },
      { id: 'b', text: 'All 5 patterns (T, O, X, L, H) being retrieved cleanly even after storing all 5 in a 25-neuron network (capacity \u2248 3).', correct: true },
      { id: 'c', text: 'Any negative values appearing in the W matrix after storing 2 patterns.' },
    ],
    explain: 'The claim says exceeding ~13.8% of neuron count causes destructive interference. Storing 5 patterns in a 25-neuron network is ~20% \u2014 well above the limit. If retrieval stayed perfect anyway, the interference half of the claim would be falsified. You can test this directly in the Demo tab by storing all 5 patterns and watching the capacity meter turn red.',
  },
  // Q6 — BDH vs BDH CQ
  {
    q: 'What is the key difference between BDH and BDH CQ?',
    options: [
      { id: 'a', text: 'BDH CQ replaces Hebbian learning with gradient descent during inference.' },
      { id: 'b', text: 'BDH CQ adds in-context learning from demonstrations and a latent reasoning workspace; it is a later, distinct system built on BDH ideas.', correct: true },
      { id: 'c', text: 'BDH CQ is just a smaller, faster version of the same BDH architecture.' },
    ],
    explain: 'BDH CQ (arXiv:2608.09888) introduces two things BDH doesn\u2019t have: (1) in-context adaptation from demonstrations at inference time without gradient steps, and (2) a separate latent reasoning workspace H that iterates without producing a written chain of thought. Its 150M-parameter model achieves 29.5% pass@2 on ARC-AGI-1 (reported in the paper, \u00a75).',
  },
  // Q7 — beta / softmax sharpness
  {
    q: 'In the \u201cvs. Attention\u201d tab, what does a higher \u03b2 (beta) value do to the retrieval output?',
    options: [
      { id: 'a', text: 'Stores more patterns in the memory matrix.' },
      { id: 'b', text: 'Makes the softmax sharper \u2014 concentrating weight on the best-matching stored pattern (\u201cwinner-take-all\u201d recall).', correct: true },
      { id: 'c', text: 'Increases the noise applied to the query before retrieval.' },
    ],
    explain: 'The modern Hopfield update is: scores = \u03b2 \u00b7 dot(pattern_k, query) / N, then softmax(\u2026). When \u03b2 is small, the softmax is nearly uniform \u2014 the output is a soft blend of all stored patterns. As \u03b2 grows, the gap between scores widens, and the output locks onto the single closest pattern. At the limit (\u03b2 \u2192 \u221e) this converges to standard nearest-neighbor lookup.',
  },
  // Q8 — why you can't read BDH's state
  {
    q: 'You can visually inspect this demo\u2019s memory by looking at the W heatmap. Why can\u2019t you do the same for BDH\u2019s fast-weight state \u03c3?',
    options: [
      { id: 'a', text: 'BDH\u2019s weights are stored in a proprietary binary format.' },
      { id: 'b', text: '\u03c3 accumulates Hebbian correlations over a large, distributed, learned internal representation \u2014 its meaning can only be probed experimentally, not decoded from the numbers directly.', correct: true },
      { id: 'c', text: '\u03c3 is too large to display \u2014 BDH has millions more neurons than this demo.' },
    ],
    explain: 'Our demo\u2019s W encodes correlations over 4 hand-labeled letters (T, O, X, L, H) on a 5\u00d75 grid \u2014 you know exactly which dimension maps to which visual feature. BDH\u2019s \u03c3 encodes correlations over a large, trained internal representation where the dimensions don\u2019t map to human-interpretable features. That\u2019s a gain in expressivity and a loss in interpretability \u2014 the tradeoff named in the BDH tab.',
  },
  // Q9 — classical vs modern tradeoff
  {
    q: 'Classical Hopfield retrieval is iterative and sign-thresholded; modern Hopfield (attention) gives a one-shot soft output. What is the core tradeoff?',
    options: [
      { id: 'a', text: 'Classical always retrieves the correct pattern; attention retrieval always fails.' },
      { id: 'b', text: 'Classical guarantees convergence to a stable state (possibly a spurious one); attention returns a soft blend in one step, which can mix stored patterns rather than commit to one.', correct: true },
      { id: 'c', text: 'Attention uses more memory than classical, so it has a higher capacity limit.' },
    ],
    explain: 'Classical Hopfield provably decreases the energy function at each synchronous update step, so it always converges to a local minimum (a stored pattern or a spurious attractor). Modern Hopfield / attention is a one-shot softmax-weighted sum \u2014 it doesn\u2019t iterate to convergence, so the output can be a continuous blend of stored patterns. You can see both on the same query in the \u201cvs. Attention\u201d tab.',
  },
  // Q10 — capacity formula
  {
    q: 'The demo\u2019s capacity is ~3 patterns for 25 neurons. Where does the \u201c0.138\u201d constant come from?',
    options: [
      { id: 'a', text: 'It\u2019s chosen arbitrarily so the demo fails at a predictable point for clarity.' },
      { id: 'b', text: 'It is the theoretical critical load \u03b1_c \u2248 0.138 for the classical Hebbian-Hopfield model, derived analytically in the statistical physics literature (Stojnic 2024, arXiv:2403.01907).', correct: true },
      { id: 'c', text: 'It is the ratio of neurons to edges in a fully connected graph.' },
    ],
    explain: '\u03b1_c \u2248 0.138 is not a tunable parameter \u2014 it is the analytically derived threshold above which the fraction of misretrieved bits diverges in the thermodynamic limit (N \u2192 \u221e, patterns \u2192 \u221e, ratio fixed). For a small network like this 25-neuron demo, it is a rough guide \u2014 the exact onset of interference depends on the specific patterns and their overlaps \u2014 but it is the right order-of-magnitude prediction, as you can observe in the Demo tab.',
  },
]

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [weights, setWeights]     = useState(makeWeights)
  const [stored, setStored]       = useState([])
  const [selected, setSelected]   = useState('O')
  const [noiseRate, setNoiseRate] = useState(0.25)
  const [noisyPat, setNoisyPat]   = useState(null)
  const [frames, setFrames]       = useState([])
  const [frameIdx, setFrameIdx]   = useState(0)
  const [busy, setBusy]           = useState(false)
  const [log, setLog]             = useState('Loading...')
  const [tab, setTab]             = useState('demo')
  const ivRef = useRef(null)

  // Feature 9 — guided walkthrough: on by default for a first-time load,
  // dismissible, hands full control to the learner once finished/skipped.
  const [walkStep, setWalkStep]   = useState(0)
  const [walkOpen, setWalkOpen]   = useState(true)

  // Feature 1 — BDH module interactive checkpoint: toggle between "what
  // changes in our demo" and "what changes in BDH" on the same diagram.
  const [bdhToggle, setBdhToggle] = useState('ours')

  // Feature 3 — modern-Hopfield/attention comparison mode: real softmax
  // inverse-temperature, a genuine control mapped to one real variable.
  const [beta, setBeta] = useState(2)

  // Feature 10 — comprehension check: unlocks after the learner has used
  // at least two real actions (a store and a retrieve), never forced open.
  const [actionsUsed, setActionsUsed] = useState(new Set())
  const [quizOpen, setQuizOpen]       = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [explainText, setExplainText] = useState('')
  const quizUnlocked = actionsUsed.has('store') && actionsUsed.has('retrieve')

  // Feature 3 — "vs. Attention" comparison tab: independent state so it
  // doesn't interfere with the main Demo tab's retrieval state.
  const [cmpQuery, setCmpQuery]         = useState(null)
  const [cmpClassical, setCmpClassical] = useState(null)
  const [cmpAttn, setCmpAttn]           = useState(null)

  // Feature 4 — "predict what will happen" before the first Retrieve, and
  // truth-beside-estimate once the learner is over capacity.
  const [prediction, setPrediction]   = useState(null)   // 'clean' | 'partial' | 'fail' | null
  const [lastPredictionResult, setLastPredictionResult] = useState(null)

  // ─── BDH Synapse Demo tab state ──────────────────────────────────────────
  const [synWeights, setSynWeights]       = useState(SYN_INITIAL_WEIGHTS)
  const [synMode, setSynMode]             = useState('train') // train | test | interfere | compare
  const [synFiringSeq, setSynFiringSeq]   = useState([1, 2])
  const [synKv, setSynKv]                 = useState([])
  const [synFireCount, setSynFireCount]   = useState(0)
  const [synFiringNode, setSynFiringNode] = useState(null)   // node id currently mid-flash
  const [synTestPrediction, setSynTestPrediction] = useState(null) // 'chain' | 'isolated' | null
  const [synPrompt, setSynPrompt]         = useState(null)   // describes what to render in the prompt box
  const [synUsedModes, setSynUsedModes]   = useState(() => new Set(['train']))
  const [synQuizOpen, setSynQuizOpen]     = useState(false)
  const [synQuizPicked, setSynQuizPicked] = useState(null)
  const [synExplainText, setSynExplainText] = useState('')
  const [synWalkOpen, setSynWalkOpen]     = useState(true)
  const [synWalkStep, setSynWalkStep]     = useState(0)
  const [synSubTab, setSynSubTab]         = useState('info') // info | bdh

  // Draw-your-own pattern and plain-language mode
  const [drawMode, setDrawMode]           = useState(false)
  const [customPattern, setCustomPattern] = useState(() => new Array(N).fill(-1))
  const [storedCustomPats, setStoredCustomPats] = useState({}) // key → pattern data
  const [showSimpleMode, setShowSimpleMode] = useState(false)

  const synQuizUnlocked = synUsedModes.size >= 2

  // Decay: every second, while in Train mode, every positive weight decays 5%
  // (floor at 0 below 0.1) — the "memory decays with disuse" half of the claim.
  useEffect(() => {
    if (synMode !== 'train') return
    const iv = setInterval(() => {
      setSynWeights(prev => {
        let changed = false
        const nw = { ...prev }
        for (const k in nw) {
          if (nw[k] > 0) {
            nw[k] = nw[k] * 0.95
            if (nw[k] < 0.1) nw[k] = 0
            changed = true
          }
        }
        return changed ? nw : prev
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [synMode])

  const synSetMode = (mode) => {
    setSynMode(mode)
    setSynUsedModes(prev => new Set(prev).add(mode))
    setSynFiringSeq(mode === 'test' ? synFiringSeq : [])
    setSynTestPrediction(null)
    if (mode === 'test') setSynPrompt({ kind: 'predict' })
    else if (mode === 'interfere') setSynPrompt({ kind: 'interfere-start' })
    else setSynPrompt(null)
  }

  const synFireNode = (id) => {
    setSynFireCount(c => c + 1)
    setSynFiringNode(id)
    setTimeout(() => setSynFiringNode(n => (n === id ? null : n)), 300)

    if (synMode === 'train') {
      if (synFiringSeq.length > 0) {
        const prevId = synFiringSeq[synFiringSeq.length - 1]
        if (prevId !== id) {
          const key = [prevId, id].sort().join('-')
          setSynWeights(w => ({ ...w, [key]: Math.min((w[key] || 0) + 0.3, 1.5) }))
        }
      }
      setSynFiringSeq(prev => [...prev, id].slice(-2))
    } else if (synMode === 'test') {
      if (synTestPrediction === null) { setSynPrompt({ kind: 'predict', nudge: true }); return }
      setTimeout(() => {
        let maxW = 0.4, nextId = -1
        for (let i = 0; i < SYN_NODES.length; i++) {
          if (i !== id) {
            const key = [id, i].sort().join('-')
            if ((synWeights[key] || 0) > maxW) { maxW = synWeights[key]; nextId = i }
          }
        }
        const actual = nextId !== -1 ? 'chain' : 'isolated'
        setSynPrompt({ kind: 'test-result', predicted: synTestPrediction, actual, nextLabel: nextId !== -1 ? SYN_NODES[nextId].label : null })
        if (nextId !== -1) synFireNode(nextId)
      }, 400)
    } else if (synMode === 'interfere') {
      if (synFiringSeq.length > 0) {
        const prevId = synFiringSeq[synFiringSeq.length - 1]
        if (prevId !== id) {
          const key = [prevId, id].sort().join('-')
          setSynWeights(w => {
            const nw = {}
            for (const k in w) {
              if (k === key) continue
              let v = w[k] * 0.5
              if (v < 0.1) v = 0
              nw[k] = v
            }
            nw[key] = (w[key] || 0) + 0.5
            return nw
          })
        }
      }
      setSynFiringSeq(prev => [...prev, id])
      setSynPrompt({ kind: 'interfere-active' })
    } else if (synMode === 'compare') {
      if (synFiringSeq.length > 0) {
        const prevId = synFiringSeq[synFiringSeq.length - 1]
        if (prevId !== id) {
          const key = [prevId, id].sort().join('-')
          setSynWeights(w => ({ ...w, [key]: Math.min((w[key] || 0) + 0.3, 1.5) }))
        }
      }
      setSynFiringSeq(prev => [...prev, id].slice(-2))
      setSynKv(prev => [...prev, `Key: ${SYN_NODES[id].label}_pos, Value: ${SYN_NODES[id].label}_rep`].slice(-6))
    }
  }

  const synReset = () => {
    setSynWeights(SYN_INITIAL_WEIGHTS); setSynMode('train'); setSynFiringSeq([1, 2])
    setSynKv([]); setSynFireCount(0); setSynTestPrediction(null); setSynPrompt(null)
  }

  let synStrongest = null, synStrongestW = 0
  for (const k of SYN_EDGE_KEYS) { if (synWeights[k] > synStrongestW) { synStrongestW = synWeights[k]; synStrongest = k } }

  // Pre-load T & O, auto-retrieve O at 25% noise to open with demo running
  useEffect(() => {
    let w = makeWeights()
    w = storePattern(w, PATTERNS.T)
    w = storePattern(w, PATTERNS.O)
    setWeights(w)
    setStored(['T', 'O'])
    const noisy = addNoise(PATTERNS.O, 0.25)
    setNoisyPat(noisy)
    const fr = converge(w, noisy)
    setFrames(fr)
    setFrameIdx(fr.length - 1)
    setLog(`Pre-loaded: T & O stored. "O" retrieved from 25% noise → ${matchPct(fr[fr.length - 1], PATTERNS.O)}% match.`)
    return () => { if (ivRef.current) clearInterval(ivRef.current) }
  }, [])

  const handleStore = () => {
    setActionsUsed(prev => new Set(prev).add('store'))
    const key = drawMode ? 'DRAW' : selected
    const pat = drawMode ? customPattern : PATTERNS[selected]
    if (stored.includes(key)) {
      setLog(drawMode ? '"DRAW" already stored — Reset to draw a different pattern.' : `"${key}" already stored.`)
      return
    }
    if (drawMode) setStoredCustomPats(prev => ({ ...prev, [key]: [...pat] }))
    const nw = storePattern(weights, pat)
    setWeights(nw)
    const ns = [...stored, key]
    setStored(ns)
    setLog(`Stored "${key}". Capacity: ${ns.length}/${CAP}.${ns.length > CAP ? ' WARNING: over limit — expect interference!' : ''}`)
  }

  const handleRetrieve = useCallback(() => {
    setActionsUsed(prev => new Set(prev).add('retrieve'))
    if (!stored.length) { setLog('Store a pattern first.'); return }
    if (ivRef.current) clearInterval(ivRef.current)
    const pat = drawMode ? customPattern : PATTERNS[selected]
    const noisy = addNoise(pat, noiseRate)
    setNoisyPat(noisy)
    const fr = converge(weights, noisy)
    setFrames(fr); setFrameIdx(0); setBusy(true)
    const predictedAtClick = prediction
    let i = 0
    ivRef.current = setInterval(() => {
      i++; setFrameIdx(i)
      if (i >= fr.length - 1) {
        clearInterval(ivRef.current); setBusy(false)
        const final = fr[fr.length - 1]
        const scores = stored.map(n => ({ n, a: matchPct(final, storedCustomPats[n] || PATTERNS[n] || pat) }))
        const best = scores.reduce((a, b) => a.a > b.a ? a : b)
        const bucket = best.a >= 85 ? 'clean' : best.a >= 40 ? 'partial' : 'fail'
        if (predictedAtClick) {
          setLastPredictionResult({ predicted: predictedAtClick, actual: bucket, actualPct: best.a })
        }
        setLog(`Converged in ${fr.length - 1} steps. ${scores.map(s => `${s.n}:${s.a}%`).join(' | ')} — Best: "${best.n}" (${best.a}%)`)
      }
    }, 250)
  }, [weights, stored, selected, noiseRate, prediction, drawMode, customPattern, storedCustomPats])

  const handleReset = () => {
    if (ivRef.current) clearInterval(ivRef.current)
    setWeights(makeWeights()); setStored([])
    setNoisyPat(null); setFrames([]); setFrameIdx(0); setBusy(false)
    setPrediction(null); setLastPredictionResult(null)
    setStoredCustomPats({})
    setLog('Network cleared. Store patterns to begin.')
  }

  // Feature 3 — run both retrieval mechanisms on the identical noisy query,
  // so the comparison is apples-to-apples: same stored patterns, same query.
  const handleCompare = () => {
    if (!stored.length) return
    const pat = drawMode ? customPattern : PATTERNS[selected]
    const query = addNoise(pat, noiseRate)
    setCmpQuery(query)
    const frs = converge(weights, query)
    setCmpClassical(frs[frs.length - 1])
    const storedVecs = stored.map(n => storedCustomPats[n] || PATTERNS[n] || pat)
    setCmpAttn(attentionRetrieve(storedVecs, query, beta))
  }

  // Resolve any stored pattern — preset or custom-drawn
  const getPatternByKey = (k) => storedCustomPats[k] || PATTERNS[k] || new Array(N).fill(-1)

  const curFrame = frames.length > 0 ? frames[Math.min(frameIdx, frames.length - 1)] : null

  // Shared style objects
  const card = { background: C.srf, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: 18, marginBottom: 12 }
  const slbl = { fontSize: 10, fontWeight: 700, color: C.mut, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, display: 'block' }
  const codeBlk = { background: '#050810', border: `1px solid ${C.bdr}`, borderRadius: 8, padding: 14, margin: '12px 0', fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.9 }
  const badge = { display: 'inline-block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 5, verticalAlign: 'middle' }

  const mkBtn = (variant, dis) => ({
    padding: variant === 'sm' ? '5px 12px' : '9px 16px',
    borderRadius: 8, border: variant === 'ghost' ? `1px solid ${C.bdr}` : 'none',
    cursor: dis ? 'not-allowed' : 'pointer', fontWeight: 700,
    fontSize: variant === 'sm' ? 11 : 13, fontFamily: 'system-ui',
    width: variant !== 'sm' ? '100%' : undefined,
    marginTop: variant === 'sm' ? 8 : 0, opacity: dis ? 0.55 : 1, transition: 'opacity .15s',
    background: dis ? C.srf2 : variant === 'blue' ? '#1d4ed8' : variant === 'ghost' ? 'transparent' : C.acc,
    color: dis ? C.dim : '#fff',
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: 'system-ui,-apple-system,sans-serif', padding: '12px 14px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ ...card, borderLeft: `3px solid ${C.acc}`, marginBottom: 16 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.acl, margin: '0 0 6px' }}>
            Associative Memory — Hopfield Networks
          </h1>
          <p style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 14px' }}>
            "A fixed-size weight matrix stores binary patterns via Hebbian learning and retrieves
            them from corrupted inputs, but storing more than ~13.8% of neuron count
            (here, {N} neurons \u2192 ~{CAP} patterns) causes destructive interference that corrupts retrieval."
          </p>
          <div className="tab-row" role="tablist" aria-label="Explainer sections" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['demo','Explore Demo'],['bdh','BDH Connection'],['attention','vs. Attention'],['limits','Failure Cases'],['analogies','Real-Life Analogies'],['synapse','BDH Synapse Demo']].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`}
                style={{
                padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                fontFamily: 'system-ui', cursor: 'pointer',
                background: tab === t ? C.acc : C.srf2,
                border: `1px solid ${tab === t ? C.acc : C.bdr}`,
                color: tab === t ? '#fff' : C.mut,
              }}>{l}</button>
            ))}
            <button onClick={() => setShowSimpleMode(s => !s)}
              aria-pressed={showSimpleMode}
              style={{
                padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                fontFamily: 'system-ui', cursor: 'pointer',
                background: showSimpleMode ? '#172554' : C.srf2,
                border: `1px solid ${showSimpleMode ? C.blu : C.bdr}`,
                color: showSimpleMode ? '#93c5fd' : C.mut,
              }}>
              💡 Explain Simply
            </button>
            {quizUnlocked && (
              <button onClick={() => setQuizOpen(true)} aria-haspopup="dialog"
                style={{
                  padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  fontFamily: 'system-ui', cursor: 'pointer',
                  background: C.srf2, border: `1px solid ${C.grn}`, color: C.grn,
                  animation: 'none',
                }}>
                Check your understanding
              </button>
            )}
          </div>
        </div>

        {/* ═══════════ PLAIN-LANGUAGE "EXPLAIN SIMPLY" PANEL ═══════════ */}
        {showSimpleMode && (
          <div style={{ ...card, borderLeft: `3px solid ${C.blu}`, background: '#04070f', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                💡 Plain-Language Explainer
              </span>
              <button onClick={() => setShowSimpleMode(false)} aria-label="Dismiss plain-language panel"
                style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.acl, display: 'block', marginBottom: 8 }}>
                  Hopfield network, in plain terms:
                </span>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.85, margin: 0 }}>
                  Imagine a group of friends who've shared a room for years. Each time two of them do something
                  together, they get a little more likely to think of each other. Over time, remembering "Alice"
                  makes you also think of "Bob" because they're always paired up. That web of who-reminds-you-of-whom
                  is basically the weight matrix. If you try to cram in memories of 20 different friend groups,
                  the connections start crossing wires — thinking of "Alice" now also drags in someone from a
                  totally different group. That's the capacity overflow this demo shows.
                </p>
              </div>
              <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.grn, display: 'block', marginBottom: 8 }}>
                  BDH, in plain terms:
                </span>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.85, margin: 0 }}>
                  Picture a brain where most connections between neurons are fixed after years of schooling
                  (the trained backbone) — but a smaller set of connections can still strengthen during a single
                  conversation, the way you get quicker at a new colleague's name the more you use it that day.
                  That short-term strengthening is the "Hebbian fast-weight" part. It fades if unused, same as
                  forgetting a name from a party you went to once.
                </p>
              </div>
              <p style={{ fontSize: 11, color: C.mut, margin: 0, lineHeight: 1.6, borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
                These are intuitions, not definitions. For the precise mechanisms, see the{' '}
                <button onClick={() => setTab('bdh')} style={{ background: 'none', border: 'none', color: C.acl, cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}>BDH Connection</button>
                {' '}and{' '}
                <button onClick={() => setTab('analogies')} style={{ background: 'none', border: 'none', color: C.acl, cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline' }}>Real-Life Analogies</button>
                {' '}tabs.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════ FEATURE 9: GUIDED WALKTHROUGH ═══════════ */}
        {walkOpen && tab === 'demo' && (
          <div role="dialog" aria-label="Guided walkthrough" style={{
            ...card, borderLeft: `3px solid ${C.acl}`, background: '#0f0a1f',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.acl, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Step {walkStep + 1} of {WALKTHROUGH_STEPS.length} — {WALKTHROUGH_STEPS[walkStep].title}
                </span>
                <p style={{ fontSize: 13, color: '#cbd5e1', margin: '6px 0 0', lineHeight: 1.6 }}>
                  {WALKTHROUGH_STEPS[walkStep].body}
                </p>
              </div>
              <button onClick={() => setWalkOpen(false)} aria-label="Dismiss walkthrough"
                style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setWalkOpen(false)}
                style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                {"Skip \u2014 I\u2019ll explore on my own"}
              </button>
              <button
                onClick={() => walkStep < WALKTHROUGH_STEPS.length - 1 ? setWalkStep(s => s + 1) : setWalkOpen(false)}
                style={{ ...mkBtn('acc', false), padding: '6px 16px', width: 'auto' }}>
                {walkStep < WALKTHROUGH_STEPS.length - 1 ? 'Next' : 'Start exploring'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ DEMO TAB ═══════════ */}
        {tab === 'demo' && (
          <div id="panel-demo" role="tabpanel" aria-label="Explore demo">
            <div className="demo-two-col" style={{ marginBottom: 12 }}>

              {/* Store panel */}
              <div style={{ ...card, ...(walkOpen && WALKTHROUGH_STEPS[walkStep].target === 'store' ? { boxShadow: '0 0 0 2px #a78bfa, 0 0 24px rgba(167,139,250,0.35)' } : {}) }}>
                <span style={slbl}>Store Patterns</span>

                {/* Mode toggle: preset vs draw-your-own */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <button onClick={() => setDrawMode(false)} aria-pressed={!drawMode}
                    style={{ padding: '4px 10px', borderRadius: 7, fontWeight: 700, fontSize: 11,
                      fontFamily: 'system-ui', cursor: 'pointer',
                      background: !drawMode ? C.acc : C.srf2,
                      border: `1px solid ${!drawMode ? C.acc : C.bdr}`,
                      color: !drawMode ? '#fff' : C.mut }}>
                    Use preset
                  </button>
                  <button onClick={() => setDrawMode(true)} aria-pressed={drawMode}
                    style={{ padding: '4px 10px', borderRadius: 7, fontWeight: 700, fontSize: 11,
                      fontFamily: 'system-ui', cursor: 'pointer',
                      background: drawMode ? C.acc : C.srf2,
                      border: `1px solid ${drawMode ? C.acc : C.bdr}`,
                      color: drawMode ? '#fff' : C.mut }}>
                    \u270f\ufe0f Draw your own
                  </button>
                </div>

                {/* Preset pattern picker */}
                {!drawMode && (<>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }} role="group" aria-label="Pattern selector">
                    {Object.keys(PATTERNS).map(n => (
                      <button key={n} onClick={() => setSelected(n)}
                        aria-pressed={selected === n}
                        aria-label={`Select pattern ${n}${stored.includes(n) ? ' (already stored)' : ''}`}
                        style={{
                        padding: '4px 10px', borderRadius: 7, fontWeight: 700, fontSize: 12,
                        fontFamily: 'system-ui', cursor: 'pointer',
                        background: selected === n ? C.acc : C.srf2,
                        border: `1px solid ${stored.includes(n) ? '#064e3b' : selected === n ? C.acc : C.bdr}`,
                        color: selected === n ? '#fff' : stored.includes(n) ? C.grn : C.mut,
                      }}>{n}{stored.includes(n) ? ' \u2713' : ''}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    <PatternGrid pattern={PATTERNS[selected]} cellSize={24} />
                  </div>
                  <button onClick={handleStore} disabled={stored.includes(selected)}
                    style={mkBtn('acc', stored.includes(selected))}>
                    {stored.includes(selected) ? 'Already stored \u2713' : `Store "${selected}"`}
                  </button>
                </>)}

                {/* Draw-your-own mode */}
                {drawMode && (<>
                  <p style={{ fontSize: 11, color: C.mut, margin: '0 0 8px', lineHeight: 1.5 }}>
                    Click cells to toggle on/off, then store your pattern and retrieve it with noise.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <DrawableGrid
                      pattern={customPattern}
                      onToggle={(i) => setCustomPattern(p => { const n = [...p]; n[i] = n[i] === 1 ? -1 : 1; return n })}
                      cellSize={24}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <button onClick={() => setCustomPattern(new Array(N).fill(-1))}
                      style={{ background: C.srf2, border: `1px solid ${C.bdr}`, color: C.mut, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                      Clear
                    </button>
                    <button onClick={() => setCustomPattern(new Array(N).fill(1))}
                      style={{ background: C.srf2, border: `1px solid ${C.bdr}`, color: C.mut, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                      Fill all
                    </button>
                  </div>
                  <button onClick={handleStore} disabled={stored.includes('DRAW')}
                    style={mkBtn('acc', stored.includes('DRAW'))}>
                    {stored.includes('DRAW') ? 'Already stored \u2713  (Reset to draw again)' : 'Store my pattern'}
                  </button>
                </>)}

                <CapacityMeter stored={stored.length} max={CAP} />
              </div>

              {/* Retrieve panel */}
              <div style={{ ...card, ...(walkOpen && WALKTHROUGH_STEPS[walkStep].target === 'retrieve' ? { boxShadow: '0 0 0 2px #a78bfa, 0 0 24px rgba(167,139,250,0.35)' } : {}) }}>
                <span style={slbl}>Retrieve from Noise</span>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.mut, marginBottom: 4 }}>
                    <label htmlFor="noise-slider">Noise level</label>
                    <span style={{ color: C.acl, fontWeight: 700 }}>{Math.round(noiseRate * 100)}%</span>
                  </div>
                  <input id="noise-slider" type="range" min={0} max={0.5} step={0.05} value={noiseRate}
                    onChange={e => setNoiseRate(+e.target.value)}
                    aria-label="Noise level" aria-valuetext={`${Math.round(noiseRate * 100)} percent`}
                    style={{ width: '100%', accentColor: C.acc }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim }}>
                    <span>0% clean</span><span>50% flipped</span>
                  </div>
                </div>
                {/* Feature 4: predict-what-will-happen, shown once before the first Retrieve */}
                {!actionsUsed.has('retrieve') && stored.length > 0 && (
                  <div role="group" aria-label="Predict what will happen"
                    style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#0a0818', border: '1px solid #2e1065' }}>
                    <span style={{ fontSize: 11, color: C.acl, fontWeight: 700 }}>Predict what will happen:</span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {[['clean', 'Clean match'], ['partial', 'Partial match'], ['fail', 'Fails badly']].map(([id, label]) => (
                        <button key={id} onClick={() => setPrediction(id)} aria-pressed={prediction === id}
                          style={{
                            padding: '4px 10px', borderRadius: 7, fontSize: 11, fontFamily: 'system-ui', cursor: 'pointer',
                            background: prediction === id ? C.acc : C.srf2,
                            border: `1px solid ${prediction === id ? C.acc : C.bdr}`,
                            color: prediction === id ? '#fff' : C.mut,
                          }}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={handleRetrieve}
                  disabled={busy || !stored.length || (!actionsUsed.has('retrieve') && !prediction)}
                  style={mkBtn('blue', busy || !stored.length || (!actionsUsed.has('retrieve') && !prediction))}>
                  {busy ? 'Converging...' : drawMode ? 'Retrieve my pattern' : `Retrieve "${selected}"`}
                </button>
                <button onClick={handleReset} style={mkBtn('sm', false)}>
                  Reset network
                </button>
                {lastPredictionResult && (
                  <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
                    background: '#04060e', border: `1px solid ${C.bdr}`, color: '#94a3b8' }}>
                    You predicted <strong style={{ color: C.acl }}>{lastPredictionResult.predicted}</strong> {'\u2014'}
                    actual result was <strong style={{ color: lastPredictionResult.predicted === lastPredictionResult.actual ? C.grn : C.amb }}>
                      {lastPredictionResult.actual}</strong> ({lastPredictionResult.actualPct}% match).
                  </div>
                )}
                {noisyPat && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.mut, letterSpacing: '0.1em' }}>CORRUPTED INPUT</span>
                    <PatternGrid pattern={noisyPat} cellSize={22} dimmed />
                  </div>
                )}
              </div>
            </div>

            {/* Output */}
            <div style={{ ...card, ...(walkOpen && WALKTHROUGH_STEPS[walkStep].target === 'output' ? { boxShadow: '0 0 0 2px #a78bfa, 0 0 24px rgba(167,139,250,0.35)' } : {}) }}>
              <span style={slbl}>Convergence Output</span>
              {stored.length > CAP && (
                <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
                  background: '#2e0a12', border: `1px solid ${C.rse}`, color: '#fca5a5' }}>
                  <strong>Truth beside estimate</strong> {'\u2014'} Expected (per capacity theory, {stored.length}/{CAP} patterns):
                  degraded/garbled retrieval. Compare against the actual match % shown below once converged.
                </div>
              )}
              {curFrame ? (
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <PatternGrid pattern={curFrame} cellSize={32} />
                    <span style={{ fontSize: 11, color: busy ? C.amb : C.grn }}>
                      {busy ? `Step ${frameIdx} / ${frames.length - 1}` : 'Converged \u2713'}
                    </span>
                  </div>
                  {!busy && stored.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: C.mut, marginBottom: 8 }}>Match accuracy vs. stored:</div>
                      {stored.map(n => {
                        const storedPat = getPatternByKey(n)
                        const a = matchPct(frames[frames.length - 1], storedPat)
                        return (
                          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <PatternGrid pattern={storedPat} cellSize={20} />
                            <div>
                              <div style={{ fontSize: 10, color: C.mut }}>{n}</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: a > 80 ? C.grn : a > 60 ? C.amb : C.rse }}>{a}%</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: C.dim, fontSize: 13, padding: '12px 0' }}>Run retrieval to see the network converge</div>
              )}
            </div>

            {/* Log */}
            <div style={{ background: '#04060e', border: `1px solid ${C.bdr}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#6b7fa0', fontFamily: "'Courier New',monospace", marginBottom: 12 }}>
              {log}
            </div>

            {/* Weight heatmap */}
            <div style={card}>
              <span style={slbl}>Memory Matrix W — {N}x{N} = {N * N} weights</span>
              <p style={{ fontSize: 12, color: C.mut, lineHeight: 1.7, marginTop: 0, marginBottom: 12 }}>
                This matrix IS the memory. Each store operation adds W += x^T x / N. Patterns are
                encoded as connection strengths, not explicit records.
                <span style={{ color: C.acl }}> Purple</span> = co-activate.
                <span style={{ color: '#60a5fa' }}> Blue</span> = oppose.
              </p>
              <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                <WeightHeatmap weights={weights} />
              </div>
              <p style={{ fontSize: 11, color: C.dim, marginTop: 8, marginBottom: 0 }}>
                Store 4+ patterns and watch the matrix become noisy — destructive interference building up.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════ BDH TAB (Feature 1 — rewritten against primary sources) ═══════════ */}
        {tab === 'bdh' && (
          <div id="panel-bdh" role="tabpanel" aria-label="BDH connection" style={card}>
            <span style={slbl}>Dragon Hatchling — Associative Memory as a Design Pattern</span>
            <p style={{ fontSize: 11, color: C.dim, marginTop: -6, marginBottom: 14 }}>
              Learning objective: after this section, you should be able to say exactly which quantity is
              called "memory" in BDH vs. in BDH CQ vs. in this demo, and explain why the analogy holds for
              some of it and breaks for the rest.
            </p>

            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.85 }}>

              <p style={{ marginTop: 0 }}>
                <span style={{ ...badge, background: '#052e1a', color: C.grn, marginRight: 6 }}>LIVE</span>
                In this demo, the N×N matrix <strong>W</strong> is the entire memory. It is written by a fixed
                Hebbian rule (<code>W += pᵀp / N</code>) and never changes except when you click Store or Reset.
              </p>

              <p>
                <span style={{ ...badge, background: '#1e1b4b', color: '#a5b4fc', marginRight: 6 }}>SIMPLIFIED</span>
                <strong style={{ color: C.acl }}>BDH — two separate pieces, not one.</strong> Per the primary
                source (Kosowski et al., "The Dragon Hatchling," arXiv:2509.26507, Section&nbsp;1.2 and
                Section&nbsp;1.4), BDH has (a) a set of trained parameters, fixed after training via gradient
                descent, and (b) a separate "fast weight" state that is written <em>during inference itself</em> by
                a Hebbian-style rule between pre- and post-synaptic neuron activity — the paper's own Eq.&nbsp;(2),
                <code> Y(i), X(j) → σ(i,j)</code>. The paper states this plainly in Section&nbsp;2.5: the model's
                working memory during inference "entirely relies on synaptic plasticity with Hebbian learning
                using spiking neurons." The paper also notes (Section&nbsp;1.2) that this fast-weight state is
                O(n²) in size — the same order as the parameter count — which is the same order of growth as
                this demo's N×N matrix.
              </p>

              <div style={codeBlk}>
                <div style={{ color: C.mut, marginBottom: 3 }}>Our demo (the whole memory):</div>
                <div style={{ color: C.acl }}>W += pᵀp / N        — fixed Hebbian rule, hand-picked, never trained</div>
                <div style={{ color: C.acl }}>x* = sign(W · x_noisy) — energy minimization, iterative</div>
                <br />
                <div style={{ color: C.mut, marginBottom: 3 }}>BDH — fast-weight state (arXiv:2509.26507, §1.2 Eq.2, §1.4):</div>
                <div style={{ color: '#63b3ed' }}>Y(i), X(j) → σ(i,j)         — Hebbian update between neuron activities</div>
                <div style={{ color: '#63b3ed' }}>σ(t+1) = A(M, σ(t), a_t)   — M = fixed trained params, σ = evolving fast weights</div>
              </div>

              <p>
                <strong style={{ color: C.acl }}>Where the analogy holds:</strong> both systems write correlations
                between co-active units into an O(n²) matrix-shaped store using an outer-product-style Hebbian
                rule, and both trade capacity for how much can be held without interference.
              </p>
              <p>
                <strong style={{ color: C.acl }}>Where it breaks:</strong> our W is hand-designed and is the
                <em>only</em> learning signal in the system. BDH's Hebbian fast weights sit on top of a
                separately-trained backbone (learned by gradient descent over a large corpus) that shapes what
                the Hebbian dynamics respond to — the rule governing what gets written is itself learned, ours
                isn't. BDH's fast-weight memory is also explicitly scoped to a working-memory timescale — the
                paper describes potentiation "at scales of minutes for the brain (up to hundreds of tokens)"
                (Section&nbsp;2.5) — not the indefinite, session-long storage this demo uses.
              </p>

              <p>
                <span style={{ ...badge, background: '#1e1b4b', color: '#a5b4fc', marginRight: 6 }}>SIMPLIFIED</span>
                <strong style={{ color: C.acl }}>BDH CQ — a distinct, later system.</strong> Per "BDH-CQ:
                In-Context Learning with Recurrent Latent Reasoning" (arXiv:2608.09888, Section&nbsp;3.2 Eq.&nbsp;1),
                BDH CQ maintains a recurrent memory update <code>Sₜ = U_θ(Sₜ₋₁, Dₜ)</code> — a single, trained
                update function (linear attention is named as one special case). It also runs a separate latent
                reasoning workspace, iterated as <code>H_{'{r+1}'} = F_θ(H_r, S_K)</code> (Section&nbsp;3.3), which is how it
                reasons without producing a written chain of thought. Critically, the paper states θ is <em>not</em>
                updated at inference time — adaptation happens purely through the evolving state S, under one
                fixed, trained function. Reported result (Section&nbsp;5): a 150M-parameter model reaching 29.5%
                pass@2 on ARC-AGI-1 — a real number from the paper, not something this demo measures or reproduces.
              </p>

              {/* ── Side-by-side memory diagram ── */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.mut, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  One glance: what's fixed vs. what updates, and on what timescale
                </span>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg viewBox="0 0 360 130" width="100%" style={{ maxWidth: 360, borderRadius: 10, background: '#060912' }}>
                    {/* This Demo box */}
                    <rect x="10" y="12" width="150" height="106" rx="7" fill="#0f0a1f" stroke="#8b5cf6" strokeWidth="1.5"/>
                    <text x="85" y="32" fill="#a78bfa" fontSize="11.5" textAnchor="middle" fontWeight="bold">This Demo</text>
                    <rect x="22" y="40" width="126" height="34" rx="4" fill="#1c1040" stroke="#8b5cf6" strokeWidth="1"/>
                    <text x="85" y="61" fill="#a78bfa" fontSize="10.5" textAnchor="middle" fontWeight="bold">W matrix</text>
                    <text x="85" y="83" fill="#64748b" fontSize="9" textAnchor="middle">hand-picked Hebbian rule</text>
                    <text x="85" y="95" fill="#64748b" fontSize="9" textAnchor="middle">updates on Store click</text>
                    <text x="85" y="108" fill="#94a3b8" fontSize="8.5" textAnchor="middle">timescale: whole session</text>
                    {/* Arrow */}
                    <text x="174" y="75" fill="#4b5563" fontSize="22">→</text>
                    {/* BDH box */}
                    <rect x="196" y="12" width="152" height="106" rx="7" fill="#062b1a" stroke="#10b981" strokeWidth="1.5"/>
                    <text x="272" y="32" fill="#10b981" fontSize="11.5" textAnchor="middle" fontWeight="bold">BDH</text>
                    {/* M box */}
                    <rect x="206" y="40" width="62" height="34" rx="4" fill="#031a10" stroke="#10b981" strokeWidth="1"/>
                    <text x="237" y="55" fill="#10b981" fontSize="9.5" textAnchor="middle" fontWeight="bold">M (fixed)</text>
                    <text x="237" y="68" fill="#64748b" fontSize="8" textAnchor="middle">gradient descent</text>
                    {/* Arrow M → σ */}
                    <line x1="268" y1="57" x2="279" y2="57" stroke="#64748b" strokeWidth="1"/>
                    <polygon points="278,54 281,57 278,60" fill="#64748b"/>
                    {/* σ box */}
                    <rect x="281" y="40" width="60" height="34" rx="4" fill="#0f0a1f" stroke="#a78bfa" strokeWidth="1"/>
                    <text x="311" y="55" fill="#a78bfa" fontSize="9.5" textAnchor="middle" fontWeight="bold">σ (Hebbian)</text>
                    <text x="311" y="68" fill="#64748b" fontSize="8" textAnchor="middle">at inference</text>
                    <text x="272" y="95" fill="#64748b" fontSize="8.5" textAnchor="middle">M shapes what σ learns</text>
                    <text x="272" y="108" fill="#94a3b8" fontSize="8.5" textAnchor="middle">timescale: working memory</text>
                  </svg>
                </div>
                <p style={{ fontSize: 11, color: C.dim, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                  The arrow between M and σ is the key insight: BDH's trained backbone shapes the dynamics of its
                  Hebbian fast weights. Our demo's rule is independent of any backbone — it's hand-designed.
                </p>
              </div>

              {/* Feature 1, requirement 5: interactive checkpoint — a real toggle over a real diagram,
                  not a second simulation. Content is static/authored; the toggle itself is live React state. */}
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: '#0a0818', border: '1px solid #2e1065' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.acl, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Interactive checkpoint — what does "remembering" mean here?
                </span>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 12, flexWrap: 'wrap' }} role="group" aria-label="Choose a system to inspect">
                  {[['ours', 'Our demo'], ['bdh', 'BDH'], ['bdhcq', 'BDH CQ']].map(([id, label]) => (
                    <button key={id} onClick={() => setBdhToggle(id)} aria-pressed={bdhToggle === id}
                      style={{
                        padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, fontFamily: 'system-ui', cursor: 'pointer',
                        background: bdhToggle === id ? C.acc : C.srf2,
                        border: `1px solid ${bdhToggle === id ? C.acc : C.bdr}`,
                        color: bdhToggle === id ? '#fff' : C.mut,
                      }}>{label}</button>
                  ))}
                </div>
                {bdhToggle === 'ours' && (
                  <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }}>
                    <strong>What changes:</strong> the N×N matrix W — every entry is updated by <code>W += pᵀp/N</code> on Store.<br />
                    <strong>Who decides the rule:</strong> the demo author (hand-picked, fixed formula).<br />
                    <strong>Timescale:</strong> persists for the whole session, across every pattern stored.<br />
                    <strong>Can you read it?</strong> Yes — that's the heatmap in the Demo tab.
                  </div>
                )}
                {bdhToggle === 'bdh' && (
                  <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }}>
                    <strong>What changes:</strong> a fast-weight state σ, via a Hebbian rule between active units (arXiv:2509.26507, §1.2).<br />
                    <strong>Who decides the rule:</strong> partly fixed (Hebbian form), partly shaped by separately-trained parameters M.<br />
                    <strong>Timescale:</strong> working-memory scale — "minutes... up to hundreds of tokens" (§2.5), not indefinite.<br />
                    <strong>Can you read it?</strong> Only by probing — it's distributed across a large learned representation, not a small hand-designed grid.
                  </div>
                )}
                {bdhToggle === 'bdhcq' && (
                  <div style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }}>
                    <strong>What changes:</strong> a single recurrent state Sₜ, via <code>Sₜ = U_θ(Sₜ₋₁, Dₜ)</code> (arXiv:2608.09888, §3.2).<br />
                    <strong>Who decides the rule:</strong> U_θ is fully trained; θ itself is frozen at inference (no gradient steps).<br />
                    <strong>Timescale:</strong> scoped to the current context window being processed.<br />
                    <strong>Can you read it?</strong> No — S is a learned latent vector, not a human-interpretable structure.
                  </div>
                )}
              </div>

              <div style={{ background: '#0a0818', border: '1px solid #2e1065', borderRadius: 8, padding: 12, marginTop: 14, fontSize: 11, color: C.mut }}>
                <strong style={{ color: C.acl }}>Primary sources cited above:</strong><br />
                Kosowski, Uznański, Chorowski, Stamirowska, Bartoszkiewicz, "The Dragon Hatchling: The Missing
                Link between the Transformer and Models of the Brain," arXiv:2509.26507 — Sections 1.2, 1.4, 2.5.<br />
                "BDH-CQ: In-Context Learning with Recurrent Latent Reasoning," arXiv:2608.09888 — Sections 3.2, 3.3, 5.<br />
                Ramsauer et al., "Hopfield Networks is All You Need," ICLR 2021, arXiv:2008.02217 (background only, pre-2022).<br />
                Gu and Dao, "Mamba: Linear-Time Sequence Modeling with Selective State Spaces," arXiv:2312.00752 (2023).
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ VS. ATTENTION TAB (Feature 3) ═══════════ */}
        {tab === 'attention' && (
          <div id="panel-attention" role="tabpanel" aria-label="Compare to attention" style={card}>
            <span style={slbl}>Classical Hopfield vs. Modern Hopfield / Attention</span>
            <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.7, marginTop: 0 }}>
              <span style={{ ...badge, background: '#052e1a', color: C.grn, marginRight: 6 }}>LIVE</span>
              Both outputs below are computed for real from your stored patterns and one shared noisy query —
              nothing here is precomputed or scripted. The <strong>classical</strong> side is the same
              iterative, sign-thresholded update used in the Demo tab. The <strong>attention</strong> side is
              a one-shot softmax-weighted average over the same stored patterns — the same similarity →
              softmax → weighted-sum operation used in Transformer self-attention, applied here to pattern
              retrieval instead of tokens (Ramsauer et al., 2021; Millidge et al., 2022, arXiv:2202.04557).
            </p>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.mut, marginBottom: 4 }}>
                <label htmlFor="beta-slider">Softmax sharpness ({'\u03B2'})</label>
                <span style={{ color: C.acl, fontWeight: 700 }}>{beta.toFixed(1)}</span>
              </div>
              <input id="beta-slider" type="range" min={0.5} max={6} step={0.5} value={beta}
                onChange={e => setBeta(+e.target.value)}
                aria-label="Softmax sharpness beta" aria-valuetext={beta.toFixed(1)}
                style={{ width: '100%', accentColor: C.acc }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim }}>
                <span>0.5 = soft blend of all patterns</span><span>6 = near winner-take-all</span>
              </div>
            </div>

            <button onClick={handleCompare} disabled={!stored.length} style={mkBtn('acc', !stored.length)}>
              {stored.length ? `Compare on "${selected}" (${Math.round(noiseRate * 100)}% noise)` : 'Store a pattern first'}
            </button>

            {cmpQuery && (
              <div className="demo-two-col" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.mut, letterSpacing: '0.1em' }}>NOISY QUERY (shared input)</span>
                  <PatternGrid pattern={cmpQuery} cellSize={22} dimmed />
                </div>
                <div />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.mut, letterSpacing: '0.1em' }}>CLASSICAL (iterative, thresholded)</span>
                  <PatternGrid pattern={cmpClassical} cellSize={24} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Best match: {stored.length && cmpClassical
                      ? (() => { const s = stored.map(n => ({ n, a: matchPct(cmpClassical, PATTERNS[n]) })); const b = s.reduce((x, y) => x.a > y.a ? x : y); return `${b.n} (${b.a}%)` })()
                      : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.mut, letterSpacing: '0.1em' }}>ATTENTION (one-shot, soft blend)</span>
                  <ContinuousGrid values={cmpAttn?.out} cellSize={24} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Continuous output — not thresholded to ±1</span>
                </div>
              </div>
            )}

            {cmpAttn && cmpAttn.weights.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 10, color: C.mut, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                  ATTENTION WEIGHTS (real softmax output, sums to 1)
                </span>
                {stored.map((n, i) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 20, fontSize: 12, color: C.acl, fontWeight: 700 }}>{n}</span>
                    <div style={{ flex: 1, height: 8, background: '#0d1525', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(cmpAttn.weights[i] * 100).toFixed(1)}%`, height: '100%', background: C.acc }} />
                    </div>
                    <span style={{ width: 44, fontSize: 11, color: C.mut, textAlign: 'right' }}>{(cmpAttn.weights[i] * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#0a0818', border: '1px solid #2e1065', borderRadius: 8, padding: 12, marginTop: 16, fontSize: 11.5, color: C.mut, lineHeight: 1.7 }}>
              <strong style={{ color: C.acl }}>What this does and doesn't show:</strong> the attention side here
              demonstrates the core similarity→softmax→weighted-sum mechanism shared by modern (continuous)
              Hopfield networks and Transformer self-attention. It does <em>not</em> implement the full modern-Hopfield
              energy function or its convergence guarantees (Ramsauer et al., 2021; Hu et al., 2023,
              arXiv:2309.12673) — it's a one-step illustration of the mechanism, not a complete reimplementation.
              The classical side's ~13.8%-of-N capacity ceiling is specific to the dense, binary, iterative
              rule — it does not directly apply to the attention-style computation shown alongside it.
            </div>
          </div>
        )}

        {/* ═══════════ LIMITS TAB ═══════════ */}
        {tab === 'limits' && (
          <div id="panel-limits" role="tabpanel" aria-label="Failure cases">

            {/* Failure 1 — Capacity Overflow */}
            <div style={{ ...card, borderLeft: `3px solid ${C.rse}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.rse, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Failure 1 — Capacity Overflow (try it now)
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.75, marginTop: 0 }}>
                {`For ${N} neurons, 0.138 × ${N} gives ~${CAP} patterns max. Store all 5 (T,O,X,L,H) in the Demo tab and retrieve any one — output becomes a garbled superposition. Not a bug; the fundamental physics of the architecture.`}
              </p>
              <div style={{ background: '#1a0a0a', borderRadius: 8, padding: '10px 12px', border: `1px solid #3b0f0f` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6b2020', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Loose real-world intuition (not a technical equivalence)
                </span>
                <p style={{ fontSize: 12, color: '#6b3b3b', margin: '5px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
                  Old-school image codecs compress by storing shared patterns across an image block. Pack too many
                  distinct textures into one block and you get the blocky artifacts you see in low-quality JPEGs —
                  a different mechanism, but the same capacity-vs-fidelity tradeoff: past a threshold, quality
                  degrades continuously rather than failing cleanly.
                </p>
              </div>
            </div>

            {/* Failure 2 — Spurious Attractors */}
            <div style={{ ...card, borderLeft: `3px solid ${C.amb}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.amb, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Failure 2 — Spurious Attractors (false memories)
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.75, marginTop: 0 }}>
                The energy landscape contains stable states never explicitly stored — linear superpositions of real
                patterns. When a noisy input lands equidistant between two attractors, the network converges to a
                false memory that matches nothing stored well.
              </p>
              {/* Energy landscape SVG */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 12px' }}>
                <svg viewBox="0 0 340 105" width="100%" style={{ maxWidth: 340, borderRadius: 8, background: '#060912' }}>
                  {/* Wavy energy landscape */}
                  <path d="M 10 28 C 30 28 40 78 65 78 C 90 78 100 18 115 18 C 130 18 140 68 160 68 C 180 68 190 18 210 18 C 230 18 240 68 255 68 C 270 68 280 22 295 22 C 310 22 320 28 330 28"
                    fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Stored pattern balls in valleys */}
                  <circle cx="65" cy="78" r="8" fill="#10b981" stroke="#0d1525" strokeWidth="1.5"/>
                  <text x="65" y="96" fill="#10b981" fontSize="9" textAnchor="middle">Stored T</text>
                  <circle cx="255" cy="68" r="8" fill="#10b981" stroke="#0d1525" strokeWidth="1.5"/>
                  <text x="255" y="86" fill="#10b981" fontSize="9" textAnchor="middle">Stored O</text>
                  {/* Spurious attractor in middle valley */}
                  <circle cx="160" cy="68" r="8" fill="#f59e0b" stroke="#0d1525" strokeWidth="1.5"/>
                  <text x="160" y="86" fill="#f59e0b" fontSize="9" textAnchor="middle">Spurious!</text>
                  {/* Ball rolling down arrow */}
                  <circle cx="115" cy="18" r="5" fill="#f43f5e" stroke="#0d1525" strokeWidth="1"/>
                  <text x="115" y="12" fill="#f43f5e" fontSize="8" textAnchor="middle">noisy input</text>
                  <path d="M 125 22 Q 145 50 155 64" fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="3,2"/>
                  <polygon points="152,67 157,63 160,68" fill="#f43f5e"/>
                  {/* Labels */}
                  <text x="10" y="10" fill="#374151" fontSize="8">High energy</text>
                  <text x="10" y="105" fill="#374151" fontSize="8">Low energy</text>
                </svg>
              </div>
              <div style={{ background: '#1a1400', borderRadius: 8, padding: '10px 12px', border: `1px solid #3b2f00` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6b5400', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Loose real-world intuition (not a technical equivalence)
                </span>
                <p style={{ fontSize: 12, color: '#6b5c2a', margin: '5px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
                  Autocorrect sometimes "corrects" a word you didn't mistype — it latched onto a plausible real word
                  that wasn't your target. Your partial input was equidistant between two completions, so the system
                  committed to one spuriously — a confident wrong answer, not an error or a blank.
                </p>
              </div>
            </div>

            {/* Limitation — Binary Patterns Only */}
            <div style={{ ...card, borderLeft: `3px solid ${C.blu}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.blu, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Limitation — Binary Patterns Only (this demo)
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.75, marginTop: 0 }}>
                Classical Hopfield uses ±1 binary values. Modern Hopfield networks (Ramsauer et al., 2021) extend
                to continuous inputs via a softmax energy function whose update step is closely related to Transformer
                self-attention (see the "vs. Attention" tab for a live, worked comparison of the underlying mechanism).
                Bridge: Hopfield → Attention → Post-Transformer → BDH.
              </p>
              <div style={{ background: '#080f1a', borderRadius: 8, padding: '10px 12px', border: `1px solid #0f2040` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e3a5f', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Loose real-world intuition (not a technical equivalence)
                </span>
                <p style={{ fontSize: 12, color: '#2a4060', margin: '5px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
                  Early fax machines encoded documents as pure black-or-white pixels — exactly the binary ±1 world
                  this demo uses. Modern image formats use continuous values (256 grey levels, or 16 million colors),
                  corresponding to what modern Hopfield networks support by replacing the sign-threshold with a
                  continuous softmax energy function.
                </p>
              </div>
            </div>

            {/* What BDH Does Differently */}
            <div style={{ ...card, borderLeft: `3px solid ${C.grn}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.grn, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                What BDH Does Differently
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.75, marginTop: 0 }}>
                {`BDH keeps the Hebbian rule for its fast-weight state σ (written during inference), but adds a separately trained backbone M that shapes the dynamics — sidestepping the ${CAP}-pattern ceiling by expanding the representational space. The tradeoff: you cannot read σ the way we read the W heatmap, because σ encodes correlations over a large learned representation, not a small hand-designed grid. Interpretability of learned recurrent states in Post-Transformer systems remains an active open problem.`}
              </p>
              <div style={{ background: '#060f09', borderRadius: 8, padding: '10px 12px', border: `1px solid #0d2c14` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1a4028', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Loose real-world intuition (not a technical equivalence)
                </span>
                <p style={{ fontSize: 12, color: '#2a5040', margin: '5px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
                  A new employee brings general professional training fixed after years of schooling (BDH's M),
                  plus a mental scratchpad they update throughout the workday (BDH's σ). The training shapes
                  what goes into the scratchpad — they notice different things than a novice would. This demo's W
                  is just the scratchpad with no professional training behind it.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════ REAL-LIFE ANALOGIES TAB ═══════════ */}
        {tab === 'analogies' && (
          <div id="panel-analogies" role="tabpanel" aria-label="Real-life analogies" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ ...card, borderLeft: `3px solid ${C.acc}` }}>
              <span style={slbl}>Why Analogies?</span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, margin: 0 }}>
                The math is precise — but these everyday stories capture the same intuition. Each analogy names <em>exactly where it breaks</em> so it never misleads.
              </p>
            </div>

            {/* ── Analogy 1: Face Recognition (Hopfield retrieval) ── */}
            <div style={{ ...card, borderLeft: `3px solid ${C.acl}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.acl, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Analogy 1 — Hopfield Retrieval: Recognising a Friend in a Crowd
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                Imagine you spot your friend across a crowded mall. They have a different haircut, sunglasses, and a new jacket — roughly 25% of their appearance has changed. Yet your brain fills in the rest and recognises them instantly.
              </p>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                That's exactly what this demo does. The W matrix stores <strong style={{ color: C.acl }}>"which features go together"</strong> for each face you memorised. When you see a corrupted version (the noisy input), the network runs small corrections — like your brain adjusting from "sunglasses + new hair" back to "oh, that's definitely Priya" — until it reaches the remembered pattern.
              </p>
              {/* SVG diagram: corrupted input → convergence → stored pattern */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 8px' }}>
                <svg viewBox="0 0 340 90" width="100%" style={{ maxWidth: 340, borderRadius: 8 }}>
                  <rect width="340" height="90" fill="#060912" rx="8"/>
                  {/* Noisy face grid */}
                  {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => {
                    const noisy = [[1,0,1,1,1],[0,1,0,1,0],[1,0,0,0,1],[0,1,0,1,0],[1,1,0,1,1]]
                    const on = noisy[r][c]
                    return <rect key={`n${r}${c}`} x={10+c*13} y={10+r*13} width={11} height={11} rx={2} fill={on ? '#5b21b6' : '#0d1525'}/>
                  }))}
                  <text x="76" y="42" fill="#64748b" fontSize="10" textAnchor="middle">Noisy Input</text>
                  {/* Arrow */}
                  <text x="116" y="48" fill="#8b5cf6" fontSize="20">→</text>
                  {/* Step label */}
                  <text x="138" y="42" fill="#64748b" fontSize="9" textAnchor="middle">iterate…</text>
                  <text x="138" y="56" fill="#64748b" fontSize="9" textAnchor="middle">sign(W·s)</text>
                  {/* Arrow */}
                  <text x="168" y="48" fill="#8b5cf6" fontSize="20">→</text>
                  {/* Stored face grid (clean T shape) */}
                  {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => {
                    const clean = [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]]
                    const on = clean[r][c]
                    return <rect key={`c${r}${c}`} x={192+c*13} y={10+r*13} width={11} height={11} rx={2} fill={on ? '#10b981' : '#0d1525'}/>
                  }))}
                  <text x="258" y="42" fill="#10b981" fontSize="10" textAnchor="middle">Recalled ✓</text>
                </svg>
              </div>
              <div style={{ background: '#0a0818', borderRadius: 8, padding: 10, border: `1px solid #2e1065`, marginTop: 4 }}>
                <strong style={{ color: C.rse, fontSize: 11 }}>Where the analogy breaks:</strong>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.6 }}>
                  Your brain has billions of neurons with rich temporal dynamics. This demo has exactly 25 neurons, a static W matrix, and a hard capacity of ~3 faces. Try storing more than 3 — the analogy breaks just like the network does.
                </p>
              </div>
            </div>

            {/* ── Analogy 2: Cluttered Pinboard (capacity limit) ── */}
            <div style={{ ...card, borderLeft: `3px solid ${C.rse}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.rse, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Analogy 2 — Capacity Limit: The Overloaded Pinboard
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                Picture a small pinboard in your room. You can pin 3 notes neatly — one in each corner, one in the middle. Now try pinning 8 notes on the same board. They overlap, cover each other, and you can barely read any of them.
              </p>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                That's the 13.8% capacity limit. The W matrix is the pinboard. Every stored pattern scribbles its mark onto <em>every entry</em> of the same shared board. Past ~3 patterns, the marks from different memories start covering each other — "destructive interference."
              </p>
              {/* SVG: 3 patterns clean vs 5 patterns messy */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 8px' }}>
                <svg viewBox="0 0 320 80" width="100%" style={{ maxWidth: 320, borderRadius: 8 }}>
                  <rect width="320" height="80" fill="#060912" rx="8"/>
                  {/* 3 clean entries */}
                  {[0,1,2].map(i => (
                    <g key={i}>
                      <rect x={14 + i*46} y={12} width={36} height={36} rx={4} fill="#052e1a" stroke="#10b981" strokeWidth="1"/>
                      <text x={32 + i*46} y={34} fill="#10b981" fontSize="14" textAnchor="middle" fontWeight="bold">{'TOX'[i]}</text>
                    </g>
                  ))}
                  <text x="80" y="64" fill="#10b981" fontSize="10" textAnchor="middle">3 patterns — clean ✓</text>
                  {/* Separator */}
                  <line x1="164" y1="8" x2="164" y2="72" stroke="#1c2640" strokeWidth="1"/>
                  {/* 5 overlapping */}
                  {[0,1,2,3,4].map(i => {
                    const offsets = [[168,14],[200,10],[180,26],[214,22],[196,38]]
                    return (
                      <g key={i}>
                        <rect x={offsets[i][0]} y={offsets[i][1]} width={34} height={34} rx={4} fill="rgba(244,63,94,0.15)" stroke="#f43f5e" strokeWidth="1" opacity="0.7"/>
                        <text x={offsets[i][0]+17} y={offsets[i][1]+22} fill="#f43f5e" fontSize="12" textAnchor="middle" fontWeight="bold" opacity="0.8">{'TOLHX'[i]}</text>
                      </g>
                    )
                  })}
                  <text x="240" y="64" fill="#f43f5e" fontSize="10" textAnchor="middle">5 patterns — interference!</text>
                </svg>
              </div>
              <div style={{ background: '#0a0818', borderRadius: 8, padding: 10, border: `1px solid #2e1065`, marginTop: 4 }}>
                <strong style={{ color: C.rse, fontSize: 11 }}>Where the analogy breaks:</strong>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.6 }}>
                  With a real pinboard you could just get a bigger board. With this network, "bigger board" means more neurons — and capacity only grows as 0.138 × N, so doubling neurons just doubles the limit. The 13.8% ceiling is a structural property, not a hardware limitation.
                </p>
              </div>
            </div>

            {/* ── Analogy 3: School + Class Notes (BDH two-component memory) ── */}
            <div style={{ ...card, borderLeft: `3px solid ${C.grn}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.grn, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Analogy 3 — BDH's Two-Part Memory: General Education + Today's Notes
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                Imagine a student sitting in a lecture. They bring two things to class:
              </p>
              <div style={{ margin: '4px 0 12px', paddingLeft: 14 }}>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, margin: '4px 0' }}>
                  📚 <strong style={{ color: C.grn }}>General education (years of schooling)</strong> — this is BDH's trained parameters M. Fixed, learned over a long time before the lecture. Shapes how the student thinks and what they notice.
                </p>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, margin: '4px 0' }}>
                  📝 <strong style={{ color: C.acl }}>Today's class notes</strong> — this is BDH's fast-weight state σ. Written during the lecture itself, using Hebbian connections between what the student just heard. It's short-term working memory.
                </p>
              </div>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8 }}>
                This demo is the student who <em>has no general education at all</em> — just today's scratch pad (W), filled using a rule printed on the board (the fixed Hebbian formula). BDH's general education (M) teaches its Hebbian notes-rule; our demo's rule was hand-picked by the author.
              </p>
              {/* SVG: two-component diagram */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 8px' }}>
                <svg viewBox="0 0 320 100" width="100%" style={{ maxWidth: 320, borderRadius: 8 }}>
                  <rect width="320" height="100" fill="#060912" rx="8"/>
                  {/* Backbone M box */}
                  <rect x="16" y="14" width="100" height="72" rx="6" fill="#052e1a" stroke="#10b981" strokeWidth="1.5"/>
                  <text x="66" y="38" fill="#10b981" fontSize="11" textAnchor="middle" fontWeight="bold">Trained Params M</text>
                  <text x="66" y="52" fill="#64748b" fontSize="9" textAnchor="middle">(gradient descent,</text>
                  <text x="66" y="63" fill="#64748b" fontSize="9" textAnchor="middle">fixed at inference)</text>
                  <text x="66" y="76" fill="#10b981" fontSize="9" textAnchor="middle">= General Education</text>
                  {/* Arrow */}
                  <text x="142" y="54" fill="#8b5cf6" fontSize="18">→</text>
                  {/* Fast-weight σ box */}
                  <rect x="162" y="14" width="100" height="72" rx="6" fill="#0f0a1f" stroke="#a78bfa" strokeWidth="1.5"/>
                  <text x="212" y="38" fill="#a78bfa" fontSize="11" textAnchor="middle" fontWeight="bold">Fast-weight σ</text>
                  <text x="212" y="52" fill="#64748b" fontSize="9" textAnchor="middle">(Hebbian update,</text>
                  <text x="212" y="63" fill="#64748b" fontSize="9" textAnchor="middle">written at inference)</text>
                  <text x="212" y="76" fill="#a78bfa" fontSize="9" textAnchor="middle">= Today's Notes</text>
                  {/* Our demo label */}
                  <rect x="276" y="30" width="36" height="40" rx="4" fill="#2e0a12" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4,2"/>
                  <text x="294" y="48" fill="#f43f5e" fontSize="9" textAnchor="middle">Our</text>
                  <text x="294" y="60" fill="#f43f5e" fontSize="9" textAnchor="middle">Demo</text>
                  <text x="294" y="72" fill="#f43f5e" fontSize="8" textAnchor="middle">(W only)</text>
                </svg>
              </div>
              <div style={{ background: '#0a0818', borderRadius: 8, padding: 10, border: `1px solid #2e1065`, marginTop: 4 }}>
                <strong style={{ color: C.rse, fontSize: 11 }}>Where the analogy breaks:</strong>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.6 }}>
                  A student's notes persist beyond the lecture; BDH's fast-weight state σ is scoped to a working-memory timescale — the paper says "minutes... up to hundreds of tokens." Also, BDH's internal representation isn't a grid of letters — it's a high-dimensional learned space the student analogy completely hides.
                </p>
              </div>
            </div>

            {/* ── Analogy 4: Mandela Effect (spurious attractors) ── */}
            <div style={{ ...card, borderLeft: `3px solid ${C.amb}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.amb, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Analogy 4 — Spurious Attractors: The Mandela Effect
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                Many people confidently "remember" that the Monopoly man wears a monocle — he doesn't. This kind of false but confident memory is called the Mandela Effect. The brain's memory system created a stable, plausible reconstruction that was never actually stored — it filled in a detail that felt right.
              </p>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                Hopfield networks do the same thing. A spurious attractor is a stable energy minimum that was never stored — often a mixture of two real patterns or the exact negative of one. A noisy input can converge to one even when the network is nowhere near its capacity limit. The network "confidently remembers" something it never learned.
              </p>
              <div style={{ background: '#0a0818', borderRadius: 8, padding: 10, border: `1px solid #2e1065`, marginTop: 4 }}>
                <strong style={{ color: C.rse, fontSize: 11 }}>Where the analogy breaks:</strong>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.6 }}>
                  The Mandela Effect involves complex social and cultural factors; Hopfield spurious attractors arise purely from the mathematical structure of the energy function — they are predictable and can be enumerated. You can't enumerate human false memories the same way.
                </p>
              </div>
            </div>

            {/* ── Real-life example challenge ── */}
            <div style={{ ...card, borderLeft: `3px solid ${C.blu}`, background: '#04060e' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.blu, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Try It Yourself — Real-World Scenario
              </span>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.8, marginTop: 0 }}>
                <strong style={{ color: C.acl }}>Scenario:</strong> You're building a system to autocomplete a partially typed word. The system has "memorised" 3 common words: <strong>HELLO</strong>, <strong>WORLD</strong>, <strong>HELP</strong>. A user types <code style={{ background: '#0a0818', padding: '1px 5px', borderRadius: 3 }}>HEL?O</code> (one letter corrupted).
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                Which Hopfield behaviour do you predict? Go to the <strong style={{ color: C.acl }}>Demo tab</strong>, store patterns T, O, and one more, add 25% noise, and retrieve — then map what you see to this scenario. Are you within capacity? Do you expect a clean match or interference?
              </p>
              <p style={{ fontSize: 12, color: C.mut, lineHeight: 1.6, fontStyle: 'italic' }}>
                (HELLO and HELP share 3 of 5 characters — that's 60% overlap. A Hopfield network stores them using the same N×N weight entries, so they will interfere even at low pattern count. This is why real autocomplete systems don't use classical Hopfield — they use modern Hopfield / attention, which handles overlapping patterns far better.)
              </p>
            </div>
          </div>
        )}

        {/* ═══════════ BDH SYNAPSE DEMO TAB ═══════════ */}
        {tab === 'synapse' && (
          <div id="panel-synapse" role="tabpanel" aria-label="BDH synapse demo">
            <div style={{ ...card, borderLeft: `3px solid ${C.grn}`, marginBottom: 12 }}>
              <p style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                "A network whose only memory is synaptic weight strengthening can recall a learned firing
                sequence after repeated exposure — but that memory decays with disuse and can be overwritten
                by a conflicting new sequence."
              </p>
            </div>

            {/* mode controls */}
            <div role="tablist" aria-label="Demo mode" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[['train','Train'],['test','Test Recall'],['interfere','Interference'],['compare','Compare to Transformer']].map(([m, l]) => (
                <button key={m} onClick={() => synSetMode(m)} role="tab" aria-selected={synMode === m}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                    fontFamily: 'system-ui', cursor: 'pointer',
                    background: synMode === m ? C.grn : C.srf2,
                    border: `1px solid ${synMode === m ? C.grn : C.bdr}`,
                    color: synMode === m ? '#04140c' : C.mut,
                  }}>{l}</button>
              ))}
              {synQuizUnlocked && (
                <button onClick={() => setSynQuizOpen(true)} aria-haspopup="dialog"
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                    fontFamily: 'system-ui', cursor: 'pointer',
                    background: C.srf2, border: `1px solid ${C.grn}`, color: C.grn,
                  }}>Check your understanding</button>
              )}
            </div>

            {/* walkthrough */}
            {synWalkOpen && (
              <div role="dialog" aria-label="Guided walkthrough" style={{
                ...card, borderLeft: `3px solid ${C.grn}`, background: '#07160f',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.grn, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {SYN_WALK_STEPS[synWalkStep].title}
                    </span>
                    <p style={{ fontSize: 13, color: '#cbd5e1', margin: '6px 0 0', lineHeight: 1.6 }}>
                      {SYN_WALK_STEPS[synWalkStep].body}
                    </p>
                  </div>
                  <button onClick={() => setSynWalkOpen(false)} aria-label="Dismiss walkthrough"
                    style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => setSynWalkOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                    {"Skip \u2014 I\u2019ll explore on my own"}
                  </button>
                  <button
                    onClick={() => synWalkStep < SYN_WALK_STEPS.length - 1 ? setSynWalkStep(s => s + 1) : setSynWalkOpen(false)}
                    style={{ background: C.grn, color: '#04140c', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {synWalkStep < SYN_WALK_STEPS.length - 1 ? 'Next' : 'Start exploring'}
                  </button>
                </div>
              </div>
            )}

            {/* prompt box */}
            {synPrompt && (
              <div aria-live="polite" style={{ ...card, background: '#07131f', border: '1px solid #1d3a5c', fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }}>
                {synPrompt.kind === 'predict' && (
                  <>
                    {synPrompt.nudge
                      ? <strong style={{ color: C.rse }}>Choose a prediction first — then click a node:</strong>
                      : <strong>Predict what will happen:</strong>}
                    {!synPrompt.nudge && ' click a node from your trained sequence. Will it chain to the next node, or stay isolated?'}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => { setSynTestPrediction('chain'); setSynPrompt({ kind: 'predict-locked', choice: 'chain' }) }}
                        style={{ background: C.blu, color: '#fff', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                        Chain reaction
                      </button>
                      <button onClick={() => { setSynTestPrediction('isolated'); setSynPrompt({ kind: 'predict-locked', choice: 'isolated' }) }}
                        style={{ background: C.srf2, color: C.txt, padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, border: `1px solid ${C.bdr}`, cursor: 'pointer' }}>
                        Stays isolated
                      </button>
                    </div>
                  </>
                )}
                {synPrompt.kind === 'predict-locked' && (
                  <>
                    <strong>Prediction locked in:</strong> {synPrompt.choice === 'chain' ? 'Chain reaction' : 'Stays isolated'}.
                    Now click a node from your trained sequence to test it.
                  </>
                )}
                {synPrompt.kind === 'test-result' && (
                  <>
                    <strong>You predicted:</strong> {synPrompt.predicted === 'chain' ? 'Chain reaction' : 'Stays isolated'}<br />
                    <strong>Actual result:</strong> {synPrompt.actual === 'chain' ? `Chain reaction to ${synPrompt.nextLabel}` : 'Stayed isolated (no connection strong enough to trigger the next node)'}<br />
                    <strong style={{ color: synPrompt.predicted === synPrompt.actual ? C.grn : C.rse }}>
                      {synPrompt.predicted === synPrompt.actual ? '\u2713 Your prediction matched!' : '\u2717 Prediction did not match \u2014 try another node.'}
                    </strong>
                  </>
                )}
                {synPrompt.kind === 'interfere-start' && (
                  <><strong>Interference:</strong> Start clicking a completely different sequence. Watch the weights.</>
                )}
                {synPrompt.kind === 'interfere-active' && (
                  <>
                    <strong>What SHOULD happen:</strong> The old learned sequence is overwritten by this new one.<br />
                    <strong>What DOES happen:</strong> Notice the old connections fading (decay) while the new path thickens instantly.
                  </>
                )}
              </div>
            )}

            {/* network + kv panels */}
            <div className="demo-two-col">
              <div style={{ ...card, minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#07090f' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  {SYN_EDGE_KEYS.map(key => {
                    const [i, j] = key.split('-').map(Number)
                    const w = synWeights[key] || 0
                    return (
                      <line key={key}
                        x1={SYN_NODES[i].x} y1={SYN_NODES[i].y} x2={SYN_NODES[j].x} y2={SYN_NODES[j].y}
                        stroke={w > 0.1 ? C.grn : C.bdr}
                        strokeWidth={w > 0.1 ? Math.min(w * 1.4, 1.2) : 0.3}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />
                    )
                  })}
                </svg>
                {SYN_NODES.map(n => (
                  <button key={n.id} onClick={() => synFireNode(n.id)} aria-label={`Node ${n.label}`}
                    style={{
                      position: 'absolute', left: `calc(${n.x}% - 22px)`, top: `calc(${n.y}% - 22px)`,
                      width: 44, height: 44, borderRadius: '50%', zIndex: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'system-ui',
                      background: synFiringNode === n.id ? C.rse : C.srf2,
                      color: synFiringNode === n.id ? '#fff' : C.txt,
                      border: `2px solid ${synFiringNode === n.id ? C.rse : C.bdr}`,
                      transition: 'background 0.1s, border-color 0.1s',
                    }}>{n.label}</button>
                ))}
              </div>

              {synMode === 'compare' && (
                <div style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={slbl}>Key-Value Cache</span>
                    <span style={{ ...badge, background: '#3f2d0a', color: C.amb }}>SIMPLIFIED (not LIVE)</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.mut, lineHeight: 1.6, marginTop: 0 }}>
                    Capacity capped at 6 entries. Oldest entries are dropped.
                    <br /><em>Ref: Jelassi et al., "Repeat After Me: Transformers are Better than State Space Models at Copying" (arXiv:2402.01032)</em>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-live="polite">
                    {synKv.length === 0 && <span style={{ fontSize: 11, color: C.dim }}>(empty — click a node)</span>}
                    {synKv.map((entry, i) => (
                      <div key={i} style={{ background: C.srf2, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: '8px 10px', fontFamily: "'Courier New', monospace", fontSize: 11.5, color: '#cbd5e1' }}>
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* state readout */}
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: C.mut, marginTop: 12 }} aria-live="polite">
              <span>Total fires: <strong style={{ color: C.txt }}>{synFireCount}</strong></span>
              <span>Strongest synapse: <strong style={{ color: C.txt }}>
                {synStrongest ? `${SYN_NODES[Number(synStrongest.split('-')[0])].label}-${SYN_NODES[Number(synStrongest.split('-')[1])].label} (${synStrongestW.toFixed(2)})` : '\u2014'}
              </strong></span>
              <span>Decay per tick: <strong style={{ color: C.txt }}>5%</strong></span>
              <span>KV cache: <strong style={{ color: C.txt }}>{synKv.length} / 6</strong></span>
              <button onClick={synReset} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${C.bdr}`, color: C.mut, borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                Reset network
              </button>
            </div>

            {/* sub-tabs: demo info / BDH connection */}
            <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: `1px solid ${C.bdr}` }}>
              {[['info','Demo Info'],['bdh','How this connects to BDH']].map(([t, l]) => (
                <button key={t} onClick={() => setSynSubTab(t)}
                  style={{
                    padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 12.5, fontWeight: synSubTab === t ? 800 : 500, fontFamily: 'system-ui',
                    color: synSubTab === t ? C.grn : C.mut,
                    borderBottom: synSubTab === t ? `2px solid ${C.grn}` : '2px solid transparent',
                  }}>{l}</button>
              ))}
            </div>
            <div style={{ ...card, borderTopLeftRadius: 0, marginTop: 0, fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.75 }}>
              {synSubTab === 'info' && (
                <p style={{ margin: 0 }}>
                  Use the modes above to interact with the network. Click nodes in <strong>Train</strong> mode to build
                  synaptic weights between consecutively-clicked nodes (max 1.5, +0.3 per co-fire). Leave it idle and
                  every positive weight decays 5% per second. Switch to <strong>Test Recall</strong> to predict, then
                  check, whether a trained edge is strong enough to auto-chain to the next node. <strong>Interference</strong>{' '}
                  trains a new sequence while halving every other synapse's weight each click — the direct, reproducible
                  version of the claim at the top of this tab. <strong>Compare to Transformer</strong> drives both this
                  network's edge weights <em>and</em> a simplified key-value cache from the same click, so you can see
                  the same signal represented two different ways.
                </p>
              )}
              {synSubTab === 'bdh' && (
                <div>
                  <p style={{ marginTop: 0 }}>
                    A common shortcut is to say "our demo uses Hebbian learning, BDH uses gradient descent — completely
                    different mechanisms." That's not accurate. Per the primary source (arXiv:2509.26507, Section 2.5),
                    BDH's own paper describes its working memory during inference as relying entirely on synaptic
                    plasticity with Hebbian learning — the same general family of update rule this demo uses, not a
                    different one.
                  </p>
                  <p>
                    The real distinction is that BDH has <strong>two separate pieces</strong>: (1) trained parameters,
                    fixed after training via gradient descent — analogous to the architecture itself, not a per-session
                    memory; and (2) a Hebbian-updated fast-weight state <code>σ</code>, written during inference via{' '}
                    <code>σ(t+1) = A(M, σ(t), a_t)</code> (§1.4), scoped to a working-memory timescale ("minutes... up
                    to hundreds of tokens," §2.5) — not the indefinite, session-long storage this demo uses.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    Where the analogy holds: both write correlations between co-active units into a Hebbian-updated,
                    matrix-shaped store, and both trade capacity for what can be held without interference. See the{' '}
                    <strong style={{ color: C.acl }}>BDH Connection</strong> tab above for the fuller breakdown, including
                    BDH CQ and primary-source citations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ BDH SYNAPSE DEMO: COMPREHENSION CHECK ═══════════ */}
        {synQuizOpen && (
          <div role="dialog" aria-label="Check your understanding" style={{
            position: 'fixed', inset: 0, background: 'rgba(4,6,14,0.82)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px 14px', overflowY: 'auto', zIndex: 50,
          }}>
            <div style={{ ...card, maxWidth: 560, width: '100%', marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={slbl}>Check your understanding</span>
                <button onClick={() => setSynQuizOpen(false)} aria-label="Close comprehension check"
                  style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>
              <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, marginTop: 0, marginBottom: 10 }}>
                If you keep firing a NEW sequence for a while, what happens to the OLD one?
              </p>
              <div role="radiogroup" aria-label="Quiz options" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SYN_QUIZ_OPTIONS.map(o => (
                  <button key={o.id} role="radio" aria-checked={synQuizPicked === o.id}
                    onClick={() => setSynQuizPicked(o.id)}
                    style={{
                      textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 12.5,
                      fontFamily: 'system-ui', cursor: 'pointer', lineHeight: 1.5,
                      background: synQuizPicked === o.id ? (o.correct ? '#052e1a' : '#2e0a12') : C.srf2,
                      border: `1px solid ${synQuizPicked === o.id ? (o.correct ? C.grn : C.rse) : C.bdr}`,
                      color: synQuizPicked === o.id ? '#e2e8f0' : C.mut,
                    }}>{o.text}</button>
                ))}
              </div>
              {synQuizPicked && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, background: '#04060e', border: `1px solid ${C.bdr}`, color: '#94a3b8', lineHeight: 1.6 }}>
                  <strong style={{ color: SYN_QUIZ_OPTIONS.find(o => o.id === synQuizPicked)?.correct ? C.grn : C.rse }}>
                    {SYN_QUIZ_OPTIONS.find(o => o.id === synQuizPicked)?.correct ? 'Correct. ' : 'Not quite. '}
                  </strong>
                  The weight matrix has no separate slot per sequence — training a new sequence updates the same
                  shared synapses the old one used. This is the interference you can reproduce in Interference mode.
                </div>
              )}
              <label htmlFor="syn-explain-back" style={{ fontSize: 11, color: C.mut, display: 'block', marginTop: 14, marginBottom: 6 }}>
                Explain in your own words what makes this network "forget" (optional, not graded):
              </label>
              <textarea id="syn-explain-back" value={synExplainText} onChange={e => setSynExplainText(e.target.value)}
                rows={3} placeholder="e.g. Because the old and new patterns share the same weight matrix..."
                style={{ width: '100%', borderRadius: 8, padding: 10, fontSize: 12.5, fontFamily: 'system-ui', background: '#04060e', border: `1px solid ${C.bdr}`, color: '#e2e8f0', resize: 'vertical' }} />
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: '#0a0818', border: '1px solid #2e1065' }}>
                <strong style={{ color: C.grn, fontSize: 12 }}>Common misconception:</strong>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.6 }}>
                  It's easy to assume once a network "remembers" something, that memory is permanent. This demo shows
                  that's false: without reinforcement, or with a conflicting new pattern, the old memory decays or gets
                  overwritten — there is no separate "storage" independent of the weights currently in use.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ FEATURE 10: COMPREHENSION CHECK ═══════════ */}
        {quizOpen && (
          <div role="dialog" aria-label="Check your understanding" style={{
            position: 'fixed', inset: 0, background: 'rgba(4,6,14,0.82)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px 14px', overflowY: 'auto', zIndex: 50,
          }}>
            <div style={{ ...card, maxWidth: 640, width: '100%', marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={slbl}>Check your understanding</span>
                <button onClick={() => setQuizOpen(false)} aria-label="Close comprehension check"
                  style={{ background: 'transparent', border: 'none', color: C.mut, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
                  ✕
                </button>
              </div>

              {QUIZ_QUESTIONS.map((qq, qi) => {
                const picked = quizAnswers[qi]
                const opt = qq.options.find(o => o.id === picked)
                return (
                  <div key={qi} style={{ marginBottom: 18, paddingBottom: 16, borderBottom: qi < QUIZ_QUESTIONS.length - 1 ? `1px solid ${C.bdr}` : 'none' }}>
                    <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, marginTop: 0, marginBottom: 10 }}>{qq.q}</p>
                    <div role="radiogroup" aria-label={`Question ${qi + 1} options`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {qq.options.map(o => (
                        <button key={o.id} role="radio" aria-checked={picked === o.id}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: o.id }))}
                          style={{
                            textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 12.5,
                            fontFamily: 'system-ui', cursor: 'pointer', lineHeight: 1.5,
                            background: picked === o.id ? (o.correct ? '#052e1a' : '#2e0a12') : C.srf2,
                            border: `1px solid ${picked === o.id ? (o.correct ? C.grn : C.rse) : C.bdr}`,
                            color: picked === o.id ? '#e2e8f0' : C.mut,
                          }}>
                          {o.text}
                        </button>
                      ))}
                    </div>
                    {picked && (
                      <div style={{
                        marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                        background: '#04060e', border: `1px solid ${C.bdr}`, color: '#94a3b8', lineHeight: 1.6,
                      }}>
                        <strong style={{ color: opt?.correct ? C.grn : C.rse }}>
                          {opt?.correct ? 'Correct. ' : 'Not quite. '}
                        </strong>
                        {qq.explain}
                      </div>
                    )}
                  </div>
                )
              })}

              <label htmlFor="explain-back" style={{ fontSize: 11, color: C.mut, display: 'block', marginBottom: 6 }}>
                Explain the capacity limit in your own words (optional — not graded, just a self-check):
              </label>
              <textarea id="explain-back" value={explainText} onChange={e => setExplainText(e.target.value)}
                rows={3} placeholder="e.g. Storing more patterns than the network has room for makes them interfere with each other..."
                style={{
                  width: '100%', borderRadius: 8, padding: 10, fontSize: 12.5, fontFamily: 'system-ui',
                  background: '#04060e', border: `1px solid ${C.bdr}`, color: '#e2e8f0', resize: 'vertical',
                }} />

              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: '#0a0818', border: '1px solid #2e1065' }}>
                <strong style={{ color: C.acl, fontSize: 12 }}>Common misconception this demo surfaces:</strong>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.6 }}>
                  It's easy to assume a network either "knows" a pattern or doesn't, like a saved file. This demo
                  shows that's false: retrieval quality is continuous and degrades as shared weight capacity is
                  exceeded — there is no clean line between "remembered" and "forgotten," only a
                  capacity-vs-fidelity tradeoff.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ FOOTER — TEAM CREDITS ═══════════ */}
        <div style={{
          marginTop: 24, padding: '14px 18px', borderRadius: 14,
          background: C.srf, border: `1px solid ${C.bdr}`,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.acc, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                DataForge 2026 — Team Submission
              </span>
              <p style={{ fontSize: 12.5, color: '#e2e8f0', fontWeight: 700, margin: '0 0 2px' }}>
                Pune Vidyarthi Griha&apos;s College of Engineering, Technology &amp; Management, Pune
              </p>
              <p style={{ fontSize: 11, color: C.mut, margin: 0, fontStyle: 'italic' }}>
                Pathway Track · Topic: Memory &amp; State
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: 2 }}>
              {['Aniket Anand Khot','Devansh Dheeraj Agrawal','Deep Vaibhav Lokhande','Yash Manoj Dhatrak'].map(name => (
                <span key={name} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  background: '#0f0a1f', border: `1px solid ${C.acc}`, color: C.acl,
                  fontWeight: 600, whiteSpace: 'nowrap',
                }}>{name}</span>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 10.5, color: '#374151', margin: 0, lineHeight: 1.6 }}>
            All Hopfield math computed in plain JavaScript — no ML libraries. See <code>AI_DISCLOSURE.md</code> for the full AI-assistance log and <code>PAPERS.md</code> for primary source citations.
          </p>
        </div>

      </div>
    </div>
  )
}
