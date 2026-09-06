// 🛡️ AuthentiGuard AI — Frontend Logic
const API_BASE = '/api';

const form = document.getElementById('verifyForm');
const scanBtn = document.getElementById('scanBtn');
const resultEmpty = document.getElementById('resultEmpty');
const resultContent = document.getElementById('resultContent');
const verdictBadge = document.getElementById('verdictBadge');
const verdictEmoji = document.getElementById('verdictEmoji');
const verdictText = document.getElementById('verdictText');
const ringFg = document.getElementById('ringFg');
const scoreValue = document.getElementById('scoreValue');
const signalsList = document.getElementById('signalsList');
const historyList = document.getElementById('historyList');
const backendStatus = document.getElementById('backendStatus');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const RING_CIRCUMFERENCE = 327; // 2 * PI * 52, matches CSS

// 🔌 Check backend health on load
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('down');
    backendStatus.textContent = '💚 backend connected';
    backendStatus.classList.add('online');
  } catch (err) {
    backendStatus.textContent = '🔴 backend offline — run the server!';
  }
}

// 🚀 Handle scan submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const brand = document.getElementById('brand').value.trim();
  const code = document.getElementById('code').value.trim();
  const imageHint = document.getElementById('imageHint').value.trim();

  scanBtn.disabled = true;
  scanBtn.textContent = '🧠 Analyzing…';

  try {
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, code, imageHint }),
    });

    if (!res.ok) throw new Error('Verification failed');
    const data = await res.json();
    renderResult(data);
    loadHistory();
  } catch (err) {
    alert('⚠️ Could not reach the backend. Make sure the server is running on port 3000.');
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = '🚀 Run AI Scan';
  }
});

// 🎨 Render the AI verdict
function renderResult(data) {
  resultEmpty.classList.add('hidden');
  resultContent.classList.remove('hidden');

  verdictBadge.className = 'verdict-badge';
  let cssClass = 'suspicious';
  if (data.verdict === 'Authentic') cssClass = 'authentic';
  if (data.verdict === 'Likely Counterfeit') cssClass = 'counterfeit';
  verdictBadge.classList.add(cssClass);

  verdictEmoji.textContent = data.verdictEmoji;
  verdictText.textContent = data.verdict;

  scoreValue.textContent = data.score;
  const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * data.score) / 100;
  ringFg.style.strokeDashoffset = offset;

  const ringColor = cssClass === 'authentic' ? '#B8860B' : cssClass === 'suspicious' ? '#C77700' : '#B00020';
  ringFg.style.stroke = ringColor;

  signalsList.innerHTML = '';
  data.signals.forEach((s) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${s.label}</span><span class="signal-weight">${s.weight}</span>`;
    signalsList.appendChild(li);
  });
}

// 📜 Load scan history
async function loadHistory() {
  try {
    const res = await fetch(`${API_BASE}/history`);
    const items = await res.json();

    if (!items.length) {
      historyList.innerHTML = '<p class="history-empty">No scans yet — your history will appear here 🌸</p>';
      return;
    }

    historyList.innerHTML = items
      .map((item) => {
        const time = new Date(item.timestamp).toLocaleTimeString();
        return `
          <div class="history-row">
            <span>${item.verdictEmoji}</span>
            <span>${item.brand} <span class="h-code">#${item.code}</span></span>
            <span class="h-score">${item.score}%</span>
            <span class="h-time">${time}</span>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    // silently ignore if backend not reachable
  }
}

// 🗑️ Clear history
clearHistoryBtn.addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    loadHistory();
  } catch (err) {
    alert('⚠️ Could not reach the backend.');
  }
});

// ⚡ Quick example chips
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.getElementById('brand').value = chip.dataset.brand;
    document.getElementById('code').value = chip.dataset.code;
    form.requestSubmit();
  });
});

checkBackend();
loadHistory();
