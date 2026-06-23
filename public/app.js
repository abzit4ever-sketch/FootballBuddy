/**
 * FootballBuddy - Client Application Logic (Scraped Real-Time Data & Keyless AI)
 */

// ==========================================================================
// API Client
// ==========================================================================
const API = {
  async fetchScrape(endpoint) {
    const url = `/api/scrape/${endpoint}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API Fetch Error (${endpoint}):`, err);
      throw err;
    }
  },

  async askPuter(message, context = null) {
    if (typeof puter === 'undefined') {
      return "⚠️ **Puter.js error**: The keyless AI client failed to load in the browser. Please verify your internet connection or reload the page.";
    }

    try {
      let prompt = `You are FootballBuddy's Senior AI Football Scout and Tactical Analyst. 
You write detailed, expert-level football reports using opta-style analytics terminology.

`;
      if (context) {
        prompt += `Tactical context (current view data):
${JSON.stringify(context)}

`;
      }
      prompt += `Analyze this and respond professionally: ${message}`;

      console.log("[Puter AI] Querying model...");
      const response = await puter.ai.chat(prompt, { model: 'openai/gpt-4o-mini' });
      return response.toString();
    } catch (err) {
      console.error('Puter AI Error:', err);
      return "❌ **AI Error**: Failed to get a reply from Puter AI. Please try sending your message again.";
    }
  }
};

// Real-time League IDs and Names Supported on FotMob
const LEAGUES = [
  { id: '47', name: 'Premier League', country: 'ENG', badge: 'https://images.fotmob.com/image_resources/logo/league/47.png' },
  { id: '87', name: 'LaLiga', country: 'ESP', badge: 'https://images.fotmob.com/image_resources/logo/league/87.png' },
  { id: '55', name: 'Serie A', country: 'ITA', badge: 'https://images.fotmob.com/image_resources/logo/league/55.png' },
  { id: '54', name: 'Bundesliga', country: 'GER', badge: 'https://images.fotmob.com/image_resources/logo/league/54.png' },
  { id: '42', name: 'UEFA Champions League', country: 'EUR', badge: 'https://images.fotmob.com/image_resources/logo/league/42.png' },
  { id: '77', name: 'World Cup', country: 'INT', badge: 'https://images.fotmob.com/image_resources/logo/league/77.png' },
  { id: '53', name: 'Ligue 1', country: 'FRA', badge: 'https://images.fotmob.com/image_resources/logo/league/53.png' },
  { id: '48', name: 'Championship', country: 'ENG', badge: 'https://images.fotmob.com/image_resources/logo/league/48.png' },
  { id: '130', name: 'MLS', country: 'USA', badge: 'https://images.fotmob.com/image_resources/logo/league/130.png' },
  { id: '904', name: 'Saudi Pro League', country: 'KSA', badge: 'https://images.fotmob.com/image_resources/logo/league/904.png' },
  { id: '71', name: 'Süper Lig', country: 'TUR', badge: 'https://images.fotmob.com/image_resources/logo/league/71.png' },
  { id: '57', name: 'Eredivisie', country: 'NED', badge: 'https://images.fotmob.com/image_resources/logo/league/57.png' },
  { id: '9345', name: 'Indian Super League', country: 'IND', badge: 'https://images.fotmob.com/image_resources/logo/league/9345.png' },
  { id: '64', name: 'Scottish Premiership', country: 'SCO', badge: 'https://images.fotmob.com/image_resources/logo/league/64.png' },
  { id: '268', name: 'Série A', country: 'BRA', badge: 'https://images.fotmob.com/image_resources/logo/league/268.png' },
  { id: '112', name: 'Primera División', country: 'ARG', badge: 'https://images.fotmob.com/image_resources/logo/league/112.png' }
];

const COMMON_CLUBS = [
  { id: '8455', name: 'Chelsea', league: 'Premier League', badge: 'https://images.fotmob.com/image_resources/logo/team/8455.png' },
  { id: '8456', name: 'Manchester City', league: 'Premier League', badge: 'https://images.fotmob.com/image_resources/logo/team/8456.png' },
  { id: '9825', name: 'Arsenal', league: 'Premier League', badge: 'https://images.fotmob.com/image_resources/logo/team/9825.png' },
  { id: '8650', name: 'Liverpool', league: 'Premier League', badge: 'https://images.fotmob.com/image_resources/logo/team/8650.png' },
  { id: '10260', name: 'Manchester United', league: 'Premier League', badge: 'https://images.fotmob.com/image_resources/logo/team/10260.png' },
  { id: '8634', name: 'Barcelona', league: 'LaLiga', badge: 'https://images.fotmob.com/image_resources/logo/team/8634.png' },
  { id: '8633', name: 'Real Madrid', league: 'LaLiga', badge: 'https://images.fotmob.com/image_resources/logo/team/8633.png' },
  { id: '9823', name: 'Bayern München', league: 'Bundesliga', badge: 'https://images.fotmob.com/image_resources/logo/team/9823.png' },
  { id: '8686', name: 'Inter', league: 'Serie A', badge: 'https://images.fotmob.com/image_resources/logo/team/8686.png' }
];

const LOGO_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
  '<rect fill="#1e2433" width="48" height="48" rx="6"/>' +
  '<circle cx="24" cy="24" r="10" fill="none" stroke="#4b5563" stroke-width="2"/>' +
  '</svg>'
);

// LogoCache holds fully-decoded <img> elements keyed by URL. Once a URL has
// been loaded once, every future render reuses the *same* decoded bitmap
// instead of asking the browser to fetch/decode a brand new <img>, which is
// what caused the flicker (innerHTML re-renders destroy and recreate <img>
// nodes, and even on an HTTP cache hit a freshly created <img> still pops
// in a frame or two late).
const LogoCache = {
  ready: new Map(),   // url -> decoded HTMLImageElement
  pending: new Map(), // url -> Promise (in-flight loads, de-duplicated)
  failed: new Set(),  // urls that errored, so we stop retrying them

  preload(url) {
    if (!url || url.startsWith('data:') || this.ready.has(url) || this.pending.has(url) || this.failed.has(url)) {
      return this.pending.get(url) || Promise.resolve();
    }
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        // Decode off the main render path so the cached element is fully
        // paint-ready before anything tries to clone it.
        const finish = () => {
          this.ready.set(url, img);
          this.pending.delete(url);
          resolve(img);
        };
        if (img.decode) img.decode().then(finish).catch(finish);
        else finish();
      };
      img.onerror = () => {
        this.failed.add(url);
        this.pending.delete(url);
        resolve(null);
      };
      img.src = url;
    });
    this.pending.set(url, promise);
    return promise;
  },
  preloadTeamIds(ids) {
    (ids || []).forEach(id => id && this.preload(teamLogoUrl(id)));
  },
  preloadLeagues() {
    LEAGUES.forEach(l => this.preload(l.badge));
    COMMON_CLUBS.forEach(t => this.preload(t.badge));
  },
  isReady(url) {
    return this.ready.has(url);
  },
  get(url) {
    return this.ready.get(url) || null;
  }
};

function teamLogoUrl(id) {
  return id ? `https://images.fotmob.com/image_resources/logo/team/${id}.png` : LOGO_PLACEHOLDER;
}

function leagueLogoUrl(id) {
  const league = LEAGUES.find(l => l.id === String(id));
  return league?.badge ?? (id ? `https://images.fotmob.com/image_resources/logo/league/${id}.png` : LOGO_PLACEHOLDER);
}

function logoImg(url, className, alt = '', extraStyle = '') {
  const src = url || LOGO_PLACEHOLDER;
  if (!src.startsWith('data:')) LogoCache.preload(src);
  const safeAlt = String(alt).replace(/"/g, '&quot;');
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : '';
  const classAttr = className ? ` class="${className} logo-img"` : ' class="logo-img"';
  // data-src is the stable lookup key hydrateLogos() uses to find a cached,
  // already-decoded image — kept separate from `src` so the markup is still
  // valid, inert HTML even before JS runs.
  return `<img src="${src}" data-src="${src}"${classAttr} alt="${safeAlt}" decoding="async" loading="eager" onerror="this.onerror=null;this.src='${LOGO_PLACEHOLDER}'"${styleAttr}>`;
}

function teamLogoImg(id, className, alt = '', extraStyle = '') {
  return logoImg(teamLogoUrl(id), className, alt, extraStyle);
}

// Universal post-render hydration: call this after ANY innerHTML write that
// might contain logo <img> tags. For every logo whose URL is already fully
// decoded in LogoCache, it swaps the freshly-created (blank) <img> for a
// clone of the cached, ready-to-paint one — so the browser never re-fetches
// or re-decodes and there's no flash. For logos not yet cached, it kicks off
// preloading so the *next* render of that logo will be instant.
function hydrateLogos(container) {
  if (!container) return;
  const imgs = container.querySelectorAll('img.logo-img[data-src]');
  imgs.forEach(img => {
    const url = img.getAttribute('data-src');
    if (!url || url.startsWith('data:')) return;
    const cached = LogoCache.get(url);
    if (cached) {
      if (img.src !== cached.src || !img.complete || img.naturalWidth === 0) {
        const clone = cached.cloneNode(true);
        clone.className = img.className;
        clone.alt = img.alt;
        clone.setAttribute('data-src', url);
        if (img.style.cssText) clone.style.cssText = img.style.cssText;
        img.replaceWith(clone);
      }
    } else {
      // Not cached yet — load it, then hydrate just this node in place once
      // ready (covers the first-ever view of a logo, e.g. a club nobody's
      // visited before).
      LogoCache.preload(url).then((loadedImg) => {
        if (!loadedImg || !img.isConnected) return;
        if (img.naturalWidth > 0) return; // already painted fine on its own
        img.src = loadedImg.src;
      });
    }
  });
}

function swapStandingsTable(tbody, standings) {
  if (!tbody) return;
  tbody.innerHTML = renderTableRowsHelper(standings);
  hydrateLogos(tbody);
}

function swapTeamsList(container, standings) {
  if (!container) return;
  container.innerHTML = renderTeamsListHelper(standings);
  hydrateLogos(container);
}

function preloadStandingsLogos(standings) {
  LogoCache.preloadTeamIds((standings || []).map(t => t.id));
}

function preloadAllGroupLogos(tables) {
  (tables || []).forEach(group => preloadStandingsLogos(group.table?.all));
}

// ==========================================================================
// Router & State Management
// ==========================================================================
const State = {
  currentView: 'dashboard',
  currentContext: null, // Stores currently active page details for the AI Analyst
  selectedSeasons: {}, // Stores selected season for each leagueId
  aiChatHistory: [
    { role: 'assistant', content: '👋 Welcome to **FootballBuddy AI Tactical Hub**. Ask me for scout reports, formation analyses, or team comparisons! I am connected to your active view context (e.g. current team roster or standings table) and run completely keyless via Puter.' }
  ]
};

function showLoader() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoader() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

let isInitialRoute = true;

// Router trigger on Hash Change
async function handleRouting() {
  const hash = window.location.hash || '#dashboard';
  const useOverlay = isInitialRoute;
  if (useOverlay) showLoader();

  // Clear suggestions and inputs on navigation
  document.getElementById('search-suggestions').classList.add('hidden');
  document.getElementById('global-search').value = '';
  document.getElementById('clear-search').classList.add('hidden');

  // Update active sidebar nav
  const links = document.querySelectorAll('.nav-link');
  links.forEach(l => l.classList.remove('active'));

  try {
    if (hash === '#dashboard') {
      document.getElementById('nav-dashboard').classList.add('active');
      await renderDashboard();
    } else if (hash === '#leagues') {
      document.getElementById('nav-leagues').classList.add('active');
      await renderLeaguesList();
    } else if (hash.startsWith('#league/')) {
      const id = hash.split('/')[1];
      await renderLeagueDetails(id);
    } else if (hash.startsWith('#team/')) {
      const id = hash.split('/')[1];
      await renderTeamDetails(id);
    } else if (hash.startsWith('#player/')) {
      // hash format: #player/id/name/position
      const parts = hash.split('/');
      const id = parts[1];
      const name = decodeURIComponent(parts[2]);
      const position = parts[3] ? decodeURIComponent(parts[3]) : 'Player';
      await renderPlayerDetails(id, name, position);
    } else if (hash === '#ai-analyst') {
      document.getElementById('nav-ai-analyst').classList.add('active');
      renderAIAnalyst();
    } else if (hash === '#live') {
      document.getElementById('nav-live').classList.add('active');
      await renderLiveScores();
    } else {
      await renderDashboard();
    }
    // Single chokepoint: every view render funnels through here, so this one
    // call is what keeps logos from flickering across the whole app instead
    // of having to patch each render function individually.
    hydrateLogos(document.getElementById('view-content'));
  } catch (err) {
    document.getElementById('view-content').innerHTML = `
      <div class="error-container">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Failed to Scrape Live Data</h3>
        <p>There was a connection issue loading this page from the live server. Please reload the app.</p>
        <button onclick="window.location.reload()" class="suggestion-chip" style="margin-top: 16px;">Reload App</button>
      </div>
    `;
  } finally {
    if (useOverlay) {
      hideLoader();
      isInitialRoute = false;
    }
  }
}

// ==========================================================================
// View Renderers
// ==========================================================================

// 1. Dashboard View
async function renderDashboard() {
  const content = document.getElementById('view-content');
  
  // Fetch real EPL Standings scraped from FotMob
  const eplStandings = await API.fetchScrape('league/47');
  let rawEplData = eplStandings;
  if (Array.isArray(eplStandings) && eplStandings.length > 0) {
    rawEplData = eplStandings[0].data || eplStandings[0];
  } else if (eplStandings.data) {
    rawEplData = eplStandings.data;
  }
  const standings = rawEplData.table?.all || rawEplData.all || [];
  preloadStandingsLogos(standings.slice(0, 5));
  
  // Update AI context
  State.currentContext = { league: 'Premier League', standings: standings.slice(0, 5) };

  let standingsHTML = '';
  if (standings.length > 0) {
    standingsHTML = standings.slice(0, 5).map(t => `
      <tr>
        <td class="cell-rank">${t.idx}</td>
        <td class="cell-team">
          ${teamLogoImg(t.id, 'mini-badge', t.name)}
          <span style="cursor:pointer;" onclick="window.location.hash='#team/${t.id}'">${t.name}</span>
        </td>
        <td class="cell-points">${t.pts}</td>
      </tr>
    `).join('');
  } else {
    standingsHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No standings data available.</td></tr>`;
  }

  // Fetch live matches
  let matchesHTML = '';
  try {
    const liveMatches = await API.fetchScrape('live-matches');
    const matches = liveMatches.matches || [];
    LogoCache.preloadTeamIds(matches.slice(0, 3).flatMap(m => [m.home?.id, m.away?.id]));
    if (matches.length > 0) {
      matchesHTML = matches.slice(0, 3).map(m => `
        <div class="featured-match-card" style="margin-bottom:16px;">
          <span class="match-status-badge ${m.status?.live ? 'live' : 'finished'}">${m.status?.live ? 'LIVE' : 'Score'}</span>
          <div class="match-teams-score">
            <div class="match-team" onclick="window.location.hash='#team/${m.home?.id}'">
              ${teamLogoImg(m.home?.id, 'match-team-crest', m.home?.name, 'width:40px;height:40px;')}
              <span class="match-team-name">${m.home?.name}</span>
            </div>
            <div class="match-score-center">
              <div class="match-score-numbers">${m.home?.score ?? 0} - ${m.away?.score ?? 0}</div>
              <div class="match-time">${m.status?.liveTime ?? 'FT'}</div>
            </div>
            <div class="match-team" onclick="window.location.hash='#team/${m.away?.id}'">
              ${teamLogoImg(m.away?.id, 'match-team-crest', m.away?.name, 'width:40px;height:40px;')}
              <span class="match-team-name">${m.away?.name}</span>
            </div>
          </div>
          <div class="match-meta-info">
            <div class="match-meta-item"><i class="fa-solid fa-trophy"></i> ${m.leagueName || 'League'}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error fetching live matches for dashboard:', e);
  }

  if (!matchesHTML) {
    matchesHTML = `
      <div class="featured-match-card">
        <span class="match-status-badge upcoming">No Live Match</span>
        <p style="text-align:center;color:var(--text-muted);padding:16px 0;">No active live matches found on scoreboard right now.</p>
      </div>
    `;
  }

  content.innerHTML = `
    <h1 class="view-title">Live Scouting Dashboard</h1>
    
    <div class="dashboard-grid">
      <div class="dashboard-main">
        <!-- Live Scores/Matches -->
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-satellite-dish"></i> Live Scoreboard Results</h2>
            <a href="#live" class="section-link">View Scores</a>
          </div>
          ${matchesHTML}
        </div>

        <!-- Competitions Grid -->
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title"><i class="fa-solid fa-globe"></i> Scraped Competitions</h2>
          </div>
          <div class="leagues-grid">
            ${LEAGUES.map(l => `
              <div class="league-card" onclick="window.location.hash='#league/${l.id}'">
                ${logoImg(l.badge, 'league-card-badge', l.name)}
                <div class="league-card-name">${l.name}</div>
                <div class="league-card-country">${l.country}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="dashboard-sidebar">
        <!-- Live Top Table Standings -->
        <div class="standings-widget">
          <div class="section-header" style="margin-bottom: 8px;">
            <h3 class="section-title" style="font-size: 15px;"><i class="fa-solid fa-list-ol"></i> Premier League Standings</h3>
            <a href="#league/47" class="section-link">Full Table</a>
          </div>
          <table class="mini-table">
            <thead>
              <tr>
                <th style="width:24px;">#</th>
                <th>Club</th>
                <th style="text-align:right;">PTS</th>
              </tr>
            </thead>
            <tbody>
              ${standingsHTML}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 2. Leagues List View
async function renderLeaguesList() {
  const content = document.getElementById('view-content');
  content.innerHTML = `
    <h1 class="view-title">Scraped Competitions</h1>
    <div class="leagues-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      ${LEAGUES.map(l => `
        <div class="league-card" onclick="window.location.hash='#league/${l.id}'" style="padding: 32px 24px;">
          ${logoImg(l.badge, 'league-card-badge', l.name, 'width:72px;height:72px;margin-bottom:8px;')}
          <div class="league-card-name" style="font-size:16px;">${l.name}</div>
          <div class="league-card-country">${l.country}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Global helpers for rendering league standings and switching groups (e.g. World Cup)
window.currentLeagueTables = [];

window.switchGroup = function(idx) {
  // Update active tab button style
  const btns = document.querySelectorAll('.group-tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.group-tab-btn[data-idx="${idx}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const group = window.currentLeagueTables[idx];
  if (!group) return;

  // Render the table rows for the group
  const tbody = document.querySelector('.standings-table tbody');
  swapStandingsTable(tbody, group.table?.all || []);

  const teamsScroll = document.querySelector('.teams-list-scroll');
  swapTeamsList(teamsScroll, group.table?.all || []);
};

function renderTableRowsHelper(standings) {
  if (!standings || standings.length === 0) {
    return `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:32px;">No standings table is currently available.</td></tr>`;
  }
  return standings.map(t => {
    // Form circles
    const form = t.form || [];
    const formDots = form.map(f => {
      let cls = 'draw';
      if (f.result === 'W' || f.result === 3) cls = 'win';
      if (f.result === 'L' || f.result === 0) cls = 'loss';
      return `<span class="form-dot ${cls}">${f.result === 'W' || f.result === 3 ? 'W' : f.result === 'L' || f.result === 0 ? 'L' : 'D'}</span>`;
    }).join('');

    return `
      <tr onclick="window.location.hash='#team/${t.id}'" style="cursor:pointer;">
        <td class="cell-rank">${t.idx}</td>
        <td class="cell-team">
          ${teamLogoImg(t.id, 'team-badge-small', t.name)}
          <span class="cell-bold">${t.name}</span>
        </td>
        <td>${t.played}</td>
        <td>${t.wins}</td>
        <td>${t.draws}</td>
        <td>${t.losses}</td>
        <td>${t.scoresStr || '0-0'}</td>
        <td class="cell-bold">${t.goalConDiff}</td>
        <td class="cell-pts">${t.pts}</td>
        <td>
          <div class="form-indicators">${formDots}</div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTeamsListHelper(standings) {
  if (!standings || standings.length === 0) {
    return `<p style="text-align:center;color:var(--text-muted);padding:24px;">No active clubs listed.</p>`;
  }
  return standings.map(t => `
    <div class="team-list-row" onclick="window.location.hash='#team/${t.id}'">
      ${teamLogoImg(t.id, 'team-list-badge', t.name)}
      <span class="team-list-name">${t.name}</span>
    </div>
  `).join('');
}

// Global season change handler
window.changeLeagueSeason = function(leagueId, season) {
  State.selectedSeasons[leagueId] = season;
  renderLeagueDetails(leagueId, season);
};

// Standings-based predictions engine
function computePrediction(homeTeamId, awayTeamId, standings) {
  const home = standings.find(t => String(t.id) === String(homeTeamId));
  const away = standings.find(t => String(t.id) === String(awayTeamId));
  
  if (!home || !away) {
    return { homeWin: 40, draw: 30, awayWin: 30, xg: 2.5 };
  }
  
  // Calculate standings ELO probability
  const homeRank = Number(home.idx);
  const awayRank = Number(away.idx);
  
  const rankDiff = awayRank - homeRank; // Positive = Home is better ranked
  
  // Base win probabilities
  let homeWin = 38 + (rankDiff * 1.5);
  let awayWin = 38 - (rankDiff * 1.5);
  
  // Home advantage weighting (+5% to Home, -5% from Away)
  homeWin += 5;
  awayWin -= 5;
  
  // Bounds checking
  if (homeWin < 10) homeWin = 10;
  if (homeWin > 80) homeWin = 80;
  if (awayWin < 10) awayWin = 10;
  if (awayWin > 80) awayWin = 80;
  
  const draw = Math.max(10, 100 - homeWin - awayWin);
  
  // Recalculate to sum to 100
  const total = homeWin + draw + awayWin;
  const homeWinPct = Math.round((homeWin / total) * 100);
  const awayWinPct = Math.round((awayWin / total) * 100);
  const drawPct = 100 - homeWinPct - awayWinPct;
  
  // Expected goals based on recent average scoring rate and GD
  const homeGD = Number(home.goalConDiff || 0);
  const awayGD = Number(away.goalConDiff || 0);
  const xg = Math.max(0.5, (2.4 + (homeGD + awayGD) / 50)).toFixed(1);
  
  return { homeWin: homeWinPct, draw: drawPct, awayWin: awayWinPct, xg };
}

// AI Scout match preview report handler
window.getMatchAIPreview = async function(matchId, homeName, awayName) {
  const modal = document.createElement('div');
  modal.className = 'ai-match-modal';
  modal.innerHTML = `
    <div class="ai-match-modal-content">
      <div class="ai-match-modal-header">
        <h3>🔮 Puter AI Tactical Preview</h3>
        <button onclick="this.closest('.ai-match-modal').remove()" class="ai-modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="ai-match-modal-body">
        <div style="display:flex; justify-content:center; align-items:center; padding:32px 0; gap:12px;">
          <span class="loader" style="width:24px; height:24px; border-width:3px; display:inline-block;"></span>
          <span style="color:var(--text-secondary);">AI scout analyzing tactics for ${homeName} vs ${awayName}...</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const prompt = `Perform an expert Opta-style football scout tactical match preview for this upcoming fixture: ${homeName} vs ${awayName}.
Describe:
1. Tactical systems, shapes, strengths and key weaknesses of both teams.
2. Major player-on-player matchups that will decide the outcome.
3. Your final projected score and tactical reasoning.`;
    
    const report = await API.askPuter(prompt, State.currentContext);
    const body = modal.querySelector('.ai-match-modal-body');
    if (body) {
      body.innerHTML = `<div class="ai-report-text">${formatMarkdown(report)}</div>`;
    }
  } catch (err) {
    const body = modal.querySelector('.ai-match-modal-body');
    if (body) {
      body.innerHTML = `<p style="color:var(--accent-red); font-size:14px; text-align:center;">Failed to load tactical report. Please verify connection and try again.</p>`;
    }
  }
};

// 3. League Details View
async function renderLeagueDetails(leagueId, selectedSeason = null) {
  const content = document.getElementById('view-content');
  const leagueInfo = LEAGUES.find(l => l.id === leagueId) || { name: 'Competition Details', country: 'Europe', badge: '' };

  // Read active season from state if not passed explicitly
  if (!selectedSeason && State.selectedSeasons[leagueId]) {
    selectedSeason = State.selectedSeasons[leagueId];
  }

  // Fetch League data via scraper
  let url = `league/${leagueId}`;
  if (selectedSeason) {
    url += `?season=${encodeURIComponent(selectedSeason)}`;
  }
  const leagueData = await API.fetchScrape(url);
  
  // Extract tables or standings robustly
  let tables = [];
  let standings = [];
  let isMultiGroup = false;
  let seasonsList = leagueData.allAvailableSeasons || leagueData.seasons || [];
  let activeSeason = leagueData.selectedSeason || selectedSeason || '';

  let standingsSource = leagueData.standings || leagueData;
  let rawData = standingsSource;
  if (Array.isArray(standingsSource) && standingsSource.length > 0) {
    rawData = standingsSource[0].data || standingsSource[0];
  } else if (standingsSource.data) {
    rawData = standingsSource.data;
  }

  if (rawData.tables && Array.isArray(rawData.tables)) {
    tables = rawData.tables;
    isMultiGroup = true;
  } else if (rawData.table) {
    standings = rawData.table.all || [];
  } else if (rawData.all) {
    standings = rawData.all;
  }

  // Save selected season in state
  if (activeSeason) {
    State.selectedSeasons[leagueId] = activeSeason;
  }

  // Update AI context
  if (isMultiGroup) {
    State.currentContext = { 
      league: leagueInfo.name, 
      groups: tables.map(t => ({ group: t.leagueName, standings: t.table?.all || [] })) 
    };
    window.currentLeagueTables = tables;
  } else {
    State.currentContext = { league: leagueInfo.name, standings: standings };
    window.currentLeagueTables = [];
  }

  if (isMultiGroup) {
    preloadAllGroupLogos(tables);
  } else {
    preloadStandingsLogos(standings);
  }

  let tableHeaderHTML = `
    <tr>
      <th style="width:32px;">#</th>
      <th>Club</th>
      <th>PL</th>
      <th>W</th>
      <th>D</th>
      <th>L</th>
      <th>GD</th>
      <th>Diff</th>
      <th>PTS</th>
      <th>Form</th>
    </tr>
  `;

  let tabSelectorHTML = '';
  let initialTableRows = '';
  let initialActiveClubsHTML = '';

  if (isMultiGroup && tables.length > 0) {
    tabSelectorHTML = `
      <div class="group-tabs-container">
        ${tables.map((t, idx) => `
          <button class="group-tab-btn ${idx === 0 ? 'active' : ''}" data-idx="${idx}" onclick="switchGroup(${idx})">
            ${t.leagueName}
          </button>
        `).join('')}
      </div>
    `;
    initialTableRows = renderTableRowsHelper(tables[0].table?.all || []);
    initialActiveClubsHTML = renderTeamsListHelper(tables[0].table?.all || []);
  } else {
    initialTableRows = renderTableRowsHelper(standings);
    initialActiveClubsHTML = renderTeamsListHelper(standings);
  }

  // Fetch upcoming fixtures & load ELO predictions
  let upcomingMatchesHTML = '';
  try {
    let fixUrl = `league/${leagueId}/fixtures`;
    if (activeSeason) {
      fixUrl += `?season=${encodeURIComponent(activeSeason)}`;
    }
    const fixturesData = await API.fetchScrape(fixUrl);
    const allMatches = fixturesData.fixtures?.allMatches || [];
    
    // Filter future matches (started = false, finished = false)
    const upcoming = allMatches.filter(m => !m.status?.started && !m.status?.finished).slice(0, 5);
    
    if (upcoming.length > 0) {
      upcomingMatchesHTML = upcoming.map(m => {
        const pred = computePrediction(m.home?.id, m.away?.id, isMultiGroup ? (tables[0]?.table?.all || []) : standings);
        return `
          <div class="upcoming-match-card-leaguedetails">
            <div class="match-card-header">
              <span class="match-time-label"><i class="fa-regular fa-clock"></i> ${new Date(m.status?.utcTime).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
              <button onclick="getMatchAIPreview('${m.id}', '${m.home?.name}', '${m.away?.name}')" class="ai-preview-btn-small"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Scout Report</button>
            </div>
            
            <div class="match-card-versus">
              <div class="match-card-team">
                ${teamLogoImg(m.home?.id, 'mini-badge', m.home?.name)}
                <span class="team-name">${m.home?.name}</span>
              </div>
              <span class="vs-text">vs</span>
              <div class="match-card-team away">
                ${teamLogoImg(m.away?.id, 'mini-badge', m.away?.name)}
                <span class="team-name">${m.away?.name}</span>
              </div>
            </div>
            
            <div class="probability-label-row">
              <span>Home: ${pred.homeWin}%</span>
              <span>Draw: ${pred.draw}%</span>
              <span>Away: ${pred.awayWin}%</span>
            </div>
            <div class="probability-bar-container">
              <div class="prob-bar home" style="width: ${pred.homeWin}%" title="Home Win: ${pred.homeWin}%"></div>
              <div class="prob-bar draw" style="width: ${pred.draw}%" title="Draw: ${pred.draw}%"></div>
              <div class="prob-bar away" style="width: ${pred.awayWin}%" title="Away Win: ${pred.awayWin}%"></div>
            </div>
            <div class="match-card-goals-predict">
              <span>📊 Est. Goals: <strong>${pred.xg}</strong></span>
              <span>Over 2.5: <strong>${Number(pred.xg) > 2.5 ? 'YES' : 'NO'}</strong></span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      upcomingMatchesHTML = '<p style="color:var(--text-muted); font-size:12px; padding:16px; text-align:center;">No upcoming fixtures scheduled for this season.</p>';
    }
  } catch (err) {
    console.error('Error loading fixtures for predictions:', err);
    upcomingMatchesHTML = '<p style="color:var(--text-muted); font-size:12px; padding:16px; text-align:center;">Failed to load upcoming fixtures preview.</p>';
  }

  // Load World Cup (ID 77) Tournament Stats Leaders
  let statsHTML = '';
  if (leagueId === '77') {
    try {
      let statsUrl = `league/${leagueId}/stats`;
      if (activeSeason) {
        statsUrl += `?season=${encodeURIComponent(activeSeason)}`;
      }
      const statsData = await API.fetchScrape(statsUrl);
      const playersStats = statsData.stats?.players || [];
      const topScorers = playersStats.find(c => c.header === 'Top scorer' || c.name === 'goals');
      const topAssists = playersStats.find(c => c.header === 'Assists' || c.name === 'assists' || c.name === 'goal_assist');

      let scorersListHTML = '';
      if (topScorers && topScorers.topThree) {
        scorersListHTML = topScorers.topThree.map(p => `
          <div class="stat-leader-row" onclick="window.location.hash='#player/${p.id}/${encodeURIComponent(p.name)}/Forward'">
            <img src="https://images.fotmob.com/image_resources/playerimages/${p.id}.png" class="stat-leader-img" onerror="this.src='https://www.thesportsdb.com/images/media/player/thumb/tiny'">
            <div class="stat-leader-info">
              <span class="stat-leader-name">${p.name}</span>
              <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                ${teamLogoImg(p.teamId, '', p.teamName, 'width:14px; height:14px; object-fit:contain;')}
                <span class="stat-leader-team" style="font-size:11px; color:var(--text-muted);">${p.teamName}</span>
              </div>
            </div>
            <span class="stat-leader-val">${p.value} <small>goals</small></span>
          </div>
        `).join('');
      } else {
        scorersListHTML = '<p style="color:var(--text-muted);font-size:12px;padding:12px;">No goalscorer stats available for this season.</p>';
      }

      let assistsListHTML = '';
      if (topAssists && topAssists.topThree) {
        assistsListHTML = topAssists.topThree.map(p => `
          <div class="stat-leader-row" onclick="window.location.hash='#player/${p.id}/${encodeURIComponent(p.name)}/Midfielder'">
            <img src="https://images.fotmob.com/image_resources/playerimages/${p.id}.png" class="stat-leader-img" onerror="this.src='https://www.thesportsdb.com/images/media/player/thumb/tiny'">
            <div class="stat-leader-info">
              <span class="stat-leader-name">${p.name}</span>
              <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                ${teamLogoImg(p.teamId, '', p.teamName, 'width:14px; height:14px; object-fit:contain;')}
                <span class="stat-leader-team" style="font-size:11px; color:var(--text-muted);">${p.teamName}</span>
              </div>
            </div>
            <span class="stat-leader-val">${p.value} <small>assists</small></span>
          </div>
        `).join('');
      } else {
        assistsListHTML = '<p style="color:var(--text-muted);font-size:12px;padding:12px;">No assist stats available for this season.</p>';
      }

      statsHTML = `
        <div class="tournament-stats-grid">
          <div class="table-card">
            <h3 class="section-title" style="margin-bottom:16px;"><i class="fa-solid fa-fire" style="color:#ffd700;"></i> Tournament Golden Boot</h3>
            ${scorersListHTML}
          </div>
          <div class="table-card">
            <h3 class="section-title" style="margin-bottom:16px;"><i class="fa-solid fa-wand-magic" style="color:var(--accent-color);"></i> Tournament Assist Leaders</h3>
            ${assistsListHTML}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error loading World Cup stats:', err);
    }
  }

  // Draw season select options if any exist
  let seasonSelectorHTML = '';
  if (seasonsList.length > 0) {
    seasonSelectorHTML = `
      <div class="season-selector-container">
        <label for="season-select" class="season-label">Season:</label>
        <select id="season-select" onchange="changeLeagueSeason('${leagueId}', this.value)" class="premium-select">
          ${seasonsList.map(s => `<option value="${s}" ${s === activeSeason ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="league-header">
      ${leagueInfo.badge ? logoImg(leagueInfo.badge, 'league-logo-large', leagueInfo.name) : ''}
      <div class="league-header-details">
        <h1 class="league-header-title">${leagueInfo.name}</h1>
        <div class="league-meta-row">
          <span>Country: <strong>${leagueInfo.country}</strong></span>
          <span>League ID: <strong>${leagueId}</strong></span>
          <span>Active Clubs: <strong>${isMultiGroup ? tables.reduce((acc, t) => acc + (t.table?.all?.length || 0), 0) : standings.length}</strong></span>
        </div>
      </div>
      ${seasonSelectorHTML}
    </div>

    <div class="league-content-grid">
      <div class="table-card">
        <div class="section-header" style="margin-bottom: 16px; flex-direction: column; align-items: flex-start; gap: 12px;">
          <h2 class="section-title"><i class="fa-solid fa-list-ol"></i> Standings Table</h2>
          ${tabSelectorHTML}
        </div>
        <table class="standings-table">
          <thead>
            ${tableHeaderHTML}
          </thead>
          <tbody>
            ${initialTableRows}
          </tbody>
        </table>
      </div>

      <div class="teams-list-card" style="display:flex; flex-direction:column; gap:24px;">
        <div>
          <h3 class="section-title" style="margin-bottom:16px;"><i class="fa-solid fa-shield-halved"></i> Active Clubs</h3>
          <div class="teams-list-scroll">
            ${initialActiveClubsHTML}
          </div>
        </div>

        <div>
          <h3 class="section-title" style="margin-bottom:16px;"><i class="fa-solid fa-clock-rotate-left"></i> ELO Predictions Engine</h3>
          <div class="upcoming-fixtures-list">
            ${upcomingMatchesHTML}
          </div>
        </div>
      </div>

      ${statsHTML}
    </div>
  `;
}

// 4. Team Details View
async function renderTeamDetails(teamId) {
  const content = document.getElementById('view-content');

  // Fetch Team via scraper
  const teamData = await API.fetchScrape(`team/${teamId}`);
  const details = teamData.details || {};
  const squad = teamData.squad?.squad || [];

  if (!details.name) {
    content.innerHTML = `<div class="error-container"><h3>Club record not found</h3><p>Could not retrieve detailed file for team ID: ${teamId}</p></div>`;
    return;
  }

  // Update AI context
  State.currentContext = { team: details.name, squad: squad, stadium: details.stadium };

  let squadHTML = '';
  if (squad.length > 0) {
    squad.forEach(roleGroup => {
      squadHTML += `
        <div class="position-group">
          <h4 class="position-group-title">${roleGroup.title}</h4>
          <div class="players-list-grid">
            ${roleGroup.members.map(p => `
              <div class="player-list-card" onclick="window.location.hash='#player/${p.id}/${encodeURIComponent(p.name)}/${encodeURIComponent(roleGroup.title)}'">
                <img src="https://images.fotmob.com/image_resources/playerimages/${p.id}.png" class="player-list-img" alt="${p.name}" onerror="this.src='https://www.thesportsdb.com/images/media/player/thumb/tiny'">
                <div class="player-list-details">
                  <span class="player-list-name">${p.name}</span>
                  <span class="player-list-sub">${roleGroup.title}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  } else {
    squadHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px;">No players registered in the roster database.</p>`;
  }

  // Render match fixtures list
  let fixturesHTML = '';
  const fixtures = teamData.fixtures?.allFixtures?.fixtures || [];
  if (fixtures.length > 0) {
    fixturesHTML = fixtures.slice(0, 5).map(f => `
      <div class="info-card-row" style="font-size: 12px;">
        <span class="info-card-label">${f.opponent?.name || 'Opponent'}</span>
        <span class="info-card-value">${f.result?.scoresStr || 'Fixture'} (${f.status?.startDate || ''})</span>
      </div>
    `).join('');
  } else {
    fixturesHTML = '<p style="color:var(--text-muted); font-size:12px;">No matches listed.</p>';
  }

  const badgeUrl = teamLogoUrl(teamId);
  const stadium = details.stadium || { name: 'Local Stadium', capacity: 0, city: 'City' };

  content.innerHTML = `
    <div class="team-banner" style="background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));">
      <div class="team-banner-overlay">
        <div class="team-header-content">
          ${logoImg(badgeUrl, 'team-badge-large', details.name)}
          <div class="team-identity">
            <h1 class="team-name-large">${details.name}</h1>
            <div class="team-stadium-desc">
              <i class="fa-solid fa-location-dot"></i> ${stadium.name} (Cap: ${Number(stadium.capacity || 0).toLocaleString()}) - ${stadium.city}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="team-grid-layout">
      <div class="team-sidebar-panel">
        <div class="info-cards-stack">
          <h3 class="section-title" style="margin-bottom: 16px;"><i class="fa-solid fa-circle-info"></i> Club Profile</h3>
          <div class="info-card-row">
            <span class="info-card-label">Stadium</span>
            <span class="info-card-value">${stadium.name}</span>
          </div>
          <div class="info-card-row">
            <span class="info-card-label">City</span>
            <span class="info-card-value">${stadium.city}</span>
          </div>
          <div class="info-card-row">
            <span class="info-card-label">Capacity</span>
            <span class="info-card-value">${Number(stadium.capacity || 0).toLocaleString()}</span>
          </div>
        </div>

        <div class="info-cards-stack">
          <h3 class="section-title" style="margin-bottom: 16px;"><i class="fa-regular fa-calendar"></i> Fixtures / Results</h3>
          ${fixturesHTML}
        </div>
      </div>

      <div class="squad-roster-card">
        <h3 class="section-title" style="margin-bottom: 24px;"><i class="fa-solid fa-users"></i> Real Squad Roster</h3>
        ${squadHTML}
      </div>
    </div>
  `;
}

// 5. Player Details View
async function renderPlayerDetails(playerId, playerName, position) {
  const content = document.getElementById('view-content');

  // Fetch Wikipedia Page summary for biography
  let wikiDetails = { title: playerName, description: 'Footballer Profile', extract: 'Biography details unavailable.' };
  let wikiImg = `https://images.fotmob.com/image_resources/playerimages/${playerId}.png`;
  
  try {
    const wikiData = await API.fetchScrape(`player-wiki/${encodeURIComponent(playerName)}`);
    if (wikiData.title) {
      wikiDetails = wikiData;
      if (wikiData.thumbnail?.source) {
        wikiImg = wikiData.thumbnail.source;
      }
    }
  } catch (err) {
    console.error('Error fetching player wiki details:', err);
  }

  // Update AI context
  State.currentContext = { player: playerName, wikiBiography: wikiDetails.extract, position: position };

  // Calculate tactical attributes based on position
  const pos = position.toLowerCase();
  let stats = { pace: 70, shooting: 65, passing: 65, dribbling: 70, defending: 50, physical: 65 };

  if (pos.includes('striker') || pos.includes('forward') || pos.includes('attack')) {
    stats = { pace: 90, shooting: 88, passing: 74, dribbling: 85, defending: 30, physical: 76 };
  } else if (pos.includes('midfield')) {
    stats = { pace: 76, shooting: 78, passing: 90, dribbling: 87, defending: 65, physical: 74 };
  } else if (pos.includes('defender') || pos.includes('keeper') || pos.includes('back')) {
    stats = { pace: 78, shooting: 40, passing: 72, dribbling: 68, defending: 90, physical: 88 };
  }

  content.innerHTML = `
    <div class="player-profile-header">
      <img src="${wikiImg}" class="player-avatar-large" alt="${playerName}" onerror="this.src='https://images.fotmob.com/image_resources/playerimages/${playerId}.png'">
      <div class="player-details-main">
        <div class="player-meta-badges">
          <span class="p-badge position">${position}</span>
          <span class="p-badge team">Real Profile</span>
        </div>
        <h1 class="player-name-large">${playerName}</h1>
        <div class="player-bio-snippet">
          ${wikiDetails.description}
        </div>
      </div>
    </div>

    <div class="player-content-grid">
      <div class="player-biography-card">
        <h3 class="section-title"><i class="fa-solid fa-book"></i> Biography</h3>
        <div class="bio-paragraph" style="max-height: 480px; overflow-y: auto; padding-right: 6px;">
          ${wikiDetails.extract}
        </div>
      </div>

      <div class="player-stats-radar-card">
        <h3 class="section-title" style="margin-bottom: 24px;"><i class="fa-solid fa-chart-pie"></i> Tactician Radar Profile</h3>
        <div id="radar-container" style="width: 100%; display: flex; justify-content: center;">
          <!-- SVG Radar gets injected here -->
        </div>
      </div>
    </div>
  `;

  // Draw the SVG Radar
  drawRadar('radar-container', stats);
}

// 6. AI Analyst View
function renderAIAnalyst() {
  const content = document.getElementById('view-content');
  
  content.innerHTML = `
    <h1 class="view-title">AI Tactical Analyst Hub</h1>

    <div class="ai-analyst-container">
      <div class="ai-sidebar">
        <div class="ai-sidebar-title">
          <i class="fa-solid fa-brain" style="color:var(--accent-color);"></i>
          <span>Scout Prompting</span>
        </div>
        <p class="ai-sidebar-desc">
          Query the AI analyst regarding squad weaknesses, formations, player statistics, or team comparisons.
        </p>
        <div class="suggestions-chips-container">
          <button class="suggestion-chip" onclick="sendSuggestion('Tactical report of this player')">Analyze Selected Player</button>
          <button class="suggestion-chip" onclick="sendSuggestion('Breakdown this team and tactical system')">Team Tactical Breakdown</button>
          <button class="suggestion-chip" onclick="sendSuggestion('Draft a scout analysis based on the standings')">Standings Analysis</button>
        </div>
      </div>

      <div class="ai-chat-panel">
        <div class="chat-history" id="chat-history">
          ${State.aiChatHistory.map(m => `
            <div class="chat-bubble ${m.role === 'assistant' ? 'ai' : 'user'}">
              ${formatMarkdown(m.content)}
            </div>
          `).join('')}
        </div>
        <div class="chat-input-bar">
          <input type="text" id="chat-input" class="chat-input-field" placeholder="Ask your AI analyst a question..." autocomplete="off">
          <button id="chat-send" class="chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  `;

  const hist = document.getElementById('chat-history');
  hist.scrollTop = hist.scrollHeight;

  const input = document.getElementById('chat-input');
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserChatMessage();
  });
  document.getElementById('chat-send').addEventListener('click', handleUserChatMessage);
}

// 7. Live Scores View
async function renderLiveScores() {
  const content = document.getElementById('view-content');

  try {
    const fetchPromises = LEAGUES.map(async (l) => {
      try {
        const fixturesData = await API.fetchScrape(`league/${l.id}/fixtures`);
        const allMatches = fixturesData.fixtures?.allMatches || [];
        
        // Grab recent 2 finished matches and next 3 upcoming matches to populate the board beautifully
        const unplayed = allMatches.filter(m => !m.status?.started && !m.status?.finished);
        const played = allMatches.filter(m => m.status?.finished || m.status?.started);
        
        const selectedMatches = [
          ...played.slice(-2),
          ...unplayed.slice(0, 3)
        ];
        
        return {
          league: l,
          matches: selectedMatches
        };
      } catch (err) {
        console.error(`Failed to load fixtures for league ${l.name}:`, err);
        return { league: l, matches: [] };
      }
    });
    
    const leaguesMatches = await Promise.all(fetchPromises);

    leaguesMatches.forEach(({ league, matches }) => {
      LogoCache.preload(league.badge);
      matches.forEach(m => LogoCache.preloadTeamIds([m.home?.id, m.away?.id]));
    });
    
    let html = '';
    let totalMatchesRendered = 0;
    
    leaguesMatches.forEach(({ league, matches }) => {
      if (matches.length === 0) return;
      
      totalMatchesRendered += matches.length;
      
      const matchRows = matches.map(m => {
        const isUnplayed = !m.status?.started && !m.status?.finished;
        let predictionHTML = '';
        let scoreHTML = `vs`;
        let statusClass = 'upcoming';
        let statusLabel = 'Upcoming';
        let scoreBoxClass = '';
        
        if (m.status?.finished) {
          statusClass = 'finished';
          statusLabel = 'FT';
          scoreHTML = `${m.home?.score ?? 0} - ${m.away?.score ?? 0}`;
        } else if (m.status?.started) {
          statusClass = 'live';
          statusLabel = m.status?.liveTime || 'LIVE';
          scoreHTML = `${m.home?.score ?? 0} - ${m.away?.score ?? 0}`;
          scoreBoxClass = 'live';
        } else {
          // Unplayed match -> calculate prediction!
          const homeHash = m.home?.name ? [...m.home.name].reduce((acc, char) => acc + char.charCodeAt(0), 0) : 10;
          const awayHash = m.away?.name ? [...m.away.name].reduce((acc, char) => acc + char.charCodeAt(0), 0) : 10;
          const diff = (homeHash % 20) - (awayHash % 20); // range [-20, 20]
          
          let homeWin = 38 + (diff * 1.5);
          let awayWin = 38 - (diff * 1.5);
          homeWin += 5; awayWin -= 5; // home advantage weighting
          
          if (homeWin < 15) homeWin = 15; if (homeWin > 75) homeWin = 75;
          if (awayWin < 15) awayWin = 15; if (awayWin > 75) awayWin = 75;
          const draw = 100 - homeWin - awayWin;
          
          const xg = Math.max(1.1, (2.2 + (diff / 30))).toFixed(1);
          
          predictionHTML = `
            <div style="display:flex; flex-direction:column; gap:4px; width:100%;">
              <div class="probability-bar-container" style="height:6px; margin:0;">
                <div class="prob-bar home" style="width: ${homeWin}%" title="Home: ${homeWin}%"></div>
                <div class="prob-bar draw" style="width: ${draw}%" title="Draw: ${draw}%"></div>
                <div class="prob-bar away" style="width: ${awayWin}%" title="Away: ${awayWin}%"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); font-weight:700;">
                <span>H: ${homeWin}%</span>
                <span>A: ${awayWin}%</span>
              </div>
            </div>
          `;
          
          const matchDate = new Date(m.status?.utcTime);
          statusLabel = matchDate.toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
        }
        
        return `
          <div class="aiscore-match-row">
            <div class="aiscore-match-time ${statusClass === 'live' ? 'live' : statusClass === 'upcoming' ? 'upcoming' : ''}">
              <span style="font-size: 11px; font-weight: 800;">${statusLabel}</span>
              ${statusClass === 'live' ? '<span class="status-indicator online" style="width:6px; height:6px;"></span>' : ''}
            </div>
            
            <div class="aiscore-teams-score-container">
              <div class="aiscore-team-item home" onclick="window.location.hash='#team/${m.home?.id}'" style="cursor:pointer;">
                <span class="aiscore-team-name">${m.home?.name}</span>
                ${teamLogoImg(m.home?.id, 'aiscore-team-logo', m.home?.name)}
              </div>
              
              <div class="aiscore-score-box ${scoreBoxClass}">
                ${scoreHTML}
              </div>
              
              <div class="aiscore-team-item away" onclick="window.location.hash='#team/${m.away?.id}'" style="cursor:pointer;">
                ${teamLogoImg(m.away?.id, 'aiscore-team-logo', m.away?.name)}
                <span class="aiscore-team-name">${m.away?.name}</span>
              </div>
            </div>
            
            <div class="aiscore-match-meta">
              ${predictionHTML ? predictionHTML : `<span style="font-size:10px; color:var(--text-muted);">HT: ${m.home?.score ?? 0}-${m.away?.score ?? 0}</span>`}
            </div>
            
            <div class="aiscore-match-actions">
              <button onclick="getMatchAIPreview('${m.id}', '${m.home?.name}', '${m.away?.name}')" class="ai-preview-btn-small" style="font-size: 10px; padding: 4px 10px; display:flex; align-items:center; gap:4px;">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Preview
              </button>
            </div>
          </div>
        `;
      }).join('');
      
      html += `
        <div class="aiscore-league-container">
          <div class="aiscore-league-header">
            ${logoImg(league.badge, 'aiscore-league-badge', league.name)}
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span class="aiscore-league-title">${league.name}</span>
              <span class="aiscore-league-country">${league.country}</span>
            </div>
          </div>
          <div class="aiscore-matches-list">
            ${matchRows}
          </div>
        </div>
      `;
    });
    
    if (totalMatchesRendered === 0) {
      content.innerHTML = `
        <h1 class="view-title">Live Match Scoreboard</h1>
        <div class="error-container" style="padding: 64px 32px;">
          <i class="fa-solid fa-satellite-dish" style="font-size:48px; color:var(--accent-color); margin-bottom:16px;"></i>
          <h3>Scoreboard is Clear</h3>
          <p style="max-width: 480px; margin: 0 auto; color:var(--text-muted);">
            No matches could be found for any leagues right now. Please check back later.
          </p>
        </div>
      `;
    } else {
      content.innerHTML = `
        <h1 class="view-title">Global Match Scoreboard</h1>
        <div style="max-width: 1000px; margin: 0 auto; display:flex; flex-direction:column; gap:8px;">
          ${html}
        </div>
      `;
    }
  } catch (e) {
    console.error('Error fetching live matches:', e);
    content.innerHTML = `
      <div class="error-container">
        <h3>Connection failure</h3>
        <p>Failed to retrieve the global match scoreboard from the scraper network.</p>
      </div>
    `;
  }
}

// ==========================================================================
// Scouting Radar Drawer (SVG)
// ==========================================================================
function drawRadar(containerId, stats) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = 340;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const rMax = 100;
  const axes = [
    { name: 'PAC (Pace)', value: stats.pace },
    { name: 'SHO (Shooting)', value: stats.shooting },
    { name: 'PAS (Passing)', value: stats.passing },
    { name: 'DRI (Dribbling)', value: stats.dribbling },
    { name: 'DEF (Defense)', value: stats.defending },
    { name: 'PHY (Physical)', value: stats.physical }
  ];

  const totalAxes = axes.length;
  
  let gridPaths = '';
  for (let ring = 1; ring <= 5; ring++) {
    const r = (ring / 5) * rMax;
    const points = [];
    for (let i = 0; i < totalAxes; i++) {
      const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    gridPaths += `<polygon points="${points.join(' ')}" class="radar-grid-line" fill="none" />`;
  }

  let axesLines = '';
  let labels = '';
  for (let i = 0; i < totalAxes; i++) {
    const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const xMax = cx + rMax * Math.cos(angle);
    const yMax = cy + rMax * Math.sin(angle);
    axesLines += `<line x1="${cx}" y1="${cy}" x2="${xMax}" y2="${yMax}" class="radar-axis-line" />`;

    const labelDist = rMax + 20;
    const xLabel = cx + labelDist * Math.cos(angle);
    const yLabel = cy + labelDist * Math.sin(angle);
    
    let anchor = 'middle';
    if (Math.cos(angle) > 0.1) anchor = 'start';
    if (Math.cos(angle) < -0.1) anchor = 'end';

    labels += `<text x="${xLabel}" y="${yLabel + 4}" class="radar-label" text-anchor="${anchor}">${axes[i].name}</text>`;
  }

  const dataPoints = [];
  axes.forEach((axis, i) => {
    const r = (axis.value / 100) * rMax;
    const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    dataPoints.push(`${x},${y}`);
  });

  const dataPolygon = `<polygon points="${dataPoints.join(' ')}" class="radar-data-polygon" />`;
  
  let dataDots = '';
  axes.forEach((axis, i) => {
    const r = (axis.value / 100) * rMax;
    const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    dataDots += `<circle cx="${x}" cy="${y}" r="4" class="radar-data-point" />`;
  });

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="radar-chart-svg">
      <g>
        ${gridPaths}
        ${axesLines}
        ${dataPolygon}
        ${dataDots}
        ${labels}
      </g>
    </svg>
  `;

  container.innerHTML = svg;
}

// ==========================================================================
// Global Search Logic (Using public lookup parameters)
// ==========================================================================
let searchDebounceTimer;
const searchInput = document.getElementById('global-search');
const searchSuggestions = document.getElementById('search-suggestions');
const clearSearchBtn = document.getElementById('clear-search');

searchInput.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  if (val) {
    clearSearchBtn.classList.remove('hidden');
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => executeSearch(val), 250);
  } else {
    clearSearchBtn.classList.add('hidden');
    searchSuggestions.classList.add('hidden');
  }
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  searchSuggestions.classList.add('hidden');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchSuggestions.classList.add('hidden');
  }
});

// Real-time lookup of common clubs in search index — see COMMON_CLUBS near LEAGUES

async function executeSearch(query) {
  const matchQuery = query.toLowerCase();
  
  // Filter teams locally for search performance
  const matchedTeams = COMMON_CLUBS.filter(t => t.name.toLowerCase().includes(matchQuery));

  if (matchedTeams.length === 0) {
    searchSuggestions.innerHTML = `<div class="suggestions-empty">No results found for "${query}". Try 'Chelsea', 'Arsenal', 'Manchester City'...</div>`;
    searchSuggestions.classList.remove('hidden');
    return;
  }

  let html = `<div class="suggestion-group-title">Clubs</div>`;
  matchedTeams.forEach(t => {
    html += `
      <div class="suggestion-item" onclick="window.location.hash='#team/${t.id}'">
        ${logoImg(t.badge, 'suggestion-badge', t.name)}
        <div class="suggestion-info">
          <span class="suggestion-name">${t.name}</span>
          <span class="suggestion-meta">${t.league}</span>
        </div>
      </div>
    `;
  });

  searchSuggestions.innerHTML = html;
  hydrateLogos(searchSuggestions);
  searchSuggestions.classList.remove('hidden');
}

// ==========================================================================
// AI Assistant Functionality (Keyless Puter.js integration)
// ==========================================================================
async function handleUserChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  
  State.aiChatHistory.push({ role: 'user', content: message });
  renderAIAnalyst();

  const historyDiv = document.getElementById('chat-history');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-bubble ai typing-indicator-bubble';
  typingDiv.innerHTML = `<span class="loader" style="width:16px; height:16px; border-width:2px; display:inline-block; margin-right:8px;"></span> Tactical hub generating report...`;
  historyDiv.appendChild(typingDiv);
  historyDiv.scrollTop = historyDiv.scrollHeight;

  try {
    const aiReply = await API.askPuter(message, State.currentContext);
    historyDiv.removeChild(typingDiv);
    State.aiChatHistory.push({ role: 'assistant', content: aiReply });
  } catch (err) {
    if (historyDiv.contains(typingDiv)) historyDiv.removeChild(typingDiv);
    State.aiChatHistory.push({ role: 'assistant', content: '❌ **Error**: Connection to the Puter AI node failed. Please check your internet connection.' });
  }

  renderAIAnalyst();
}

function sendSuggestion(text) {
  document.getElementById('chat-input').value = text;
  handleUserChatMessage();
}

function formatMarkdown(text) {
  let html = text;
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\*\s(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

// ==========================================================================
// Theme Toggler
// ==========================================================================
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  
  const icon = themeToggle.querySelector('i');
  if (nextTheme === 'dark') {
    icon.className = 'fa-solid fa-moon';
  } else {
    icon.className = 'fa-solid fa-sun';
  }
});

// ==========================================================================
// App Initialization
// ==========================================================================
LogoCache.preloadLeagues();
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
