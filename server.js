const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Known FotMob League Slugs mapping
const leagueSlugs = {
  '47': 'premier-league',
  '54': 'bundesliga',
  '55': 'serie-a',
  '87': 'la-liga',
  '42': 'champions-league',
  '77': 'world-cup',
  '53': 'ligue-1',
  '48': 'championship',
  '130': 'mls',
  '904': 'saudi-professional-league',
  '71': 'super-lig',
  '57': 'eredivisie',
  '9345': 'indian-super-league',
  '64': 'premiership',
  '268': 'serie-a-brazil',
  '112': 'primera-division-argentina'
};

// Helper function to extract Next.js state data from HTML page
async function scrapeFotMobData(url) {
  try {
    console.log(`[Scraper] Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const html = response.data;
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    
    if (!nextDataMatch) {
      throw new Error("Failed to extract __NEXT_DATA__ block from HTML page");
    }

    const jsonData = JSON.parse(nextDataMatch[1]);
    const pageProps = jsonData.props?.pageProps;
    if (!pageProps) {
      throw new Error("No pageProps found inside extracted JSON state");
    }

    return pageProps;
  } catch (error) {
    console.error(`[Scraper Error] Fetching failed for ${url}:`, error.message);
    throw error;
  }
}

// 1. Scrape League Standings, Teams, & Fixtures
app.get('/api/scrape/league/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const season = req.query.season;
    const slug = leagueSlugs[id] || 'league';
    let url = `https://www.fotmob.com/leagues/${id}/overview/${slug}`;
    if (season) {
      url += `?season=${encodeURIComponent(season)}`;
    }
    const pageProps = await scrapeFotMobData(url);
    
    // Standings data is nested inside pageProps.table or fallback['league-' + id]
    const standingsData = pageProps.table || pageProps.fallback?.[`league-${id}`]?.table || pageProps;
    
    res.json({
      standings: standingsData,
      seasons: pageProps.seasons || [],
      allAvailableSeasons: pageProps.allAvailableSeasons || [],
      selectedSeason: pageProps.selectedSeason || pageProps.overview?.selectedSeason || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1b. Scrape League Stats (Player/Team leaders)
app.get('/api/scrape/league/:id/stats', async (req, res) => {
  try {
    const id = req.params.id;
    const season = req.query.season;
    const slug = leagueSlugs[id] || 'league';
    let url = `https://www.fotmob.com/leagues/${id}/stats/${slug}`;
    if (season) {
      url += `?season=${encodeURIComponent(season)}`;
    }
    const pageProps = await scrapeFotMobData(url);
    res.json({
      stats: pageProps.stats || {},
      seasons: pageProps.seasons || [],
      allAvailableSeasons: pageProps.allAvailableSeasons || [],
      selectedSeason: pageProps.selectedSeason || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1c. Scrape League Fixtures / Matches
app.get('/api/scrape/league/:id/fixtures', async (req, res) => {
  try {
    const id = req.params.id;
    const season = req.query.season;
    const slug = leagueSlugs[id] || 'league';
    let url = `https://www.fotmob.com/leagues/${id}/fixtures/${slug}`;
    if (season) {
      url += `?season=${encodeURIComponent(season)}`;
    }
    const pageProps = await scrapeFotMobData(url);
    res.json({
      fixtures: pageProps.fixtures || {},
      seasons: pageProps.seasons || [],
      allAvailableSeasons: pageProps.allAvailableSeasons || [],
      selectedSeason: pageProps.selectedSeason || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Scrape Team Profile & Squad Roster
app.get('/api/scrape/team/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const url = `https://www.fotmob.com/teams/${id}/overview/team-profile`;
    const pageProps = await scrapeFotMobData(url);
    
    // Team data is nested inside pageProps.fallback['team-' + id]
    const teamData = pageProps.fallback?.[`team-${id}`] || pageProps;
    res.json(teamData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Wikipedia Player Biography Scraper (Keyless & Clean)
app.get('/api/scrape/player-wiki/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    console.log(`[Proxy] Wikipedia Requesting: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'ApexPitchFootballPlatform/1.0 (contact@apexpitch.com) Node-https-client'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`[Error] Wikipedia proxy error for ${req.params.name}:`, error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// 4. Scrape Today's Matches & Live Scores (from Homepage)
app.get('/api/scrape/live-matches', async (req, res) => {
  try {
    const url = 'https://www.fotmob.com/';
    const pageProps = await scrapeFotMobData(url);
    
    // Find the key like 'notableMatches:en:USA'
    const fallback = pageProps.fallback || {};
    const matchesKey = Object.keys(fallback).find(k => k.includes('notableMatches') || k.includes('matches'));
    const matchesData = matchesKey ? fallback[matchesKey] : { matches: [] };
    
    res.json(matchesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback to serving index.html for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Scraper-based Live Football Platform Running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 Scraping: Real-time from FotMob & Wikipedia`);
  console.log(`==================================================`);
});
