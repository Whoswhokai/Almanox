(function(){
  const stateMsg = document.getElementById('stateMsg');
  const panel = document.getElementById('panel');
  const form = document.getElementById('searchForm');
  const input = document.getElementById('cityInput');
  const recentWrap = document.getElementById('recentWrap');
  const unitToggle = document.getElementById('unitToggle');

  let currentUnit = 'c';
  let lastData = null; // { tempC, feelsC, ... } cache for unit switching

  const RECENT_KEY = 'station_recent_cities';

  function getRecent(){
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch(e){ return []; }
  }
  function saveRecent(name){
    let list = getRecent().filter(c => c.toLowerCase() !== name.toLowerCase());
    list.unshift(name);
    list = list.slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    renderRecent();
  }
  function removeRecent(name){
    const list = getRecent().filter(c => c.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    renderRecent();
  }
  function clearRecent(){
    localStorage.removeItem(RECENT_KEY);
    renderRecent();
  }
  function renderRecent(){
    const list = getRecent();
    recentWrap.innerHTML = '';
    list.forEach(name => {
      const chip = document.createElement('span');
      chip.className = 'flex items-center gap-1 border border-line text-inksoft hover:border-ink hover:text-ink transition-colors';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'font-mono text-[11px] bg-transparent border-none px-2.5 py-1 cursor-pointer text-inherit';
      btn.textContent = name;
      btn.addEventListener('click', () => { input.value = name; lookup(name); });

      const del = document.createElement('button');
      del.type = 'button';
      del.setAttribute('aria-label', `Remove ${name} from recent searches`);
      del.className = 'font-mono text-[11px] bg-transparent border-none pr-2 pl-0 cursor-pointer text-inksoft hover:text-coral';
      del.textContent = '×';
      del.addEventListener('click', (e) => { e.stopPropagation(); removeRecent(name); });

      chip.appendChild(btn);
      chip.appendChild(del);
      recentWrap.appendChild(chip);
    });

    if(list.length > 1){
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'font-mono text-[11px] bg-transparent border-none px-1 py-1 cursor-pointer text-inksoft underline hover:text-coral';
      clearBtn.textContent = 'Clear all';
      clearBtn.addEventListener('click', clearRecent);
      recentWrap.appendChild(clearBtn);
    }
  }

  const WMO = {
    0:  { label: 'Clear sky',        icon: 'sun' },
    1:  { label: 'Mostly clear',     icon: 'sun-cloud' },
    2:  { label: 'Partly cloudy',    icon: 'sun-cloud' },
    3:  { label: 'Overcast',         icon: 'cloud' },
    45: { label: 'Fog',              icon: 'fog' },
    48: { label: 'Rime fog',         icon: 'fog' },
    51: { label: 'Light drizzle',    icon: 'rain' },
    53: { label: 'Drizzle',          icon: 'rain' },
    55: { label: 'Dense drizzle',    icon: 'rain' },
    61: { label: 'Light rain',       icon: 'rain' },
    63: { label: 'Rain',             icon: 'rain' },
    65: { label: 'Heavy rain',       icon: 'rain' },
    71: { label: 'Light snow',       icon: 'snow' },
    73: { label: 'Snow',             icon: 'snow' },
    75: { label: 'Heavy snow',       icon: 'snow' },
    80: { label: 'Rain showers',     icon: 'rain' },
    81: { label: 'Rain showers',     icon: 'rain' },
    82: { label: 'Violent showers',  icon: 'rain' },
    95: { label: 'Thunderstorm',     icon: 'storm' },
    96: { label: 'Thunderstorm w/ hail', icon: 'storm' },
    99: { label: 'Thunderstorm w/ hail', icon: 'storm' }
  };

  function iconSvg(kind){
    const stroke = '#242220';
    const cls = 'w-[26px] h-[26px] mb-1.5 mx-auto';
    switch(kind){
      case 'sun': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" stroke-linecap="round"/></svg>`;
      case 'sun-cloud': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><circle cx="8" cy="9" r="3.2"/><path d="M8 3.5v1.4M13.7 6.7l-1 1M3.3 6.7l1 1" stroke-linecap="round"/><path d="M6 20h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6-1.6A4 4 0 0 0 6 20Z"/></svg>`;
      case 'cloud': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><path d="M6 18h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6-1.6A4 4 0 0 0 6 18Z"/></svg>`;
      case 'rain': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><path d="M6 14h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6-1.6A4 4 0 0 0 6 14Z"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" stroke-linecap="round"/></svg>`;
      case 'snow': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><path d="M6 13h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6-1.6A4 4 0 0 0 6 13Z"/><path d="M8 18v3M6.5 19.5h3M12 18v3M10.5 19.5h3M16 18v3M14.5 19.5h3" stroke-linecap="round"/></svg>`;
      case 'fog': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><path d="M4 9h13M4 13h16M4 17h11" stroke-linecap="round"/></svg>`;
      case 'storm': return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><path d="M6 12h11a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6-1.6A4 4 0 0 0 6 12Z"/><path d="M13 14l-3 4h3l-2 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      default: return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5"><circle cx="12" cy="12" r="8"/></svg>`;
    }
  }

  function setState(msg, isError){
    stateMsg.textContent = msg;
    stateMsg.classList.remove('hidden');
    stateMsg.classList.remove('text-inksoft', 'border-line', 'text-coral', 'border-coral');
    if(isError){
      stateMsg.classList.add('text-coral', 'border-coral');
    } else {
      stateMsg.classList.add('text-inksoft', 'border-line');
    }
    panel.classList.add('hidden');
  }

  function fmtTime(iso){
    if(!iso) return '—';
    const d = new Date(iso);
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if(h === 0) h = 12;
    return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
  }

  function cToF(c){ return c * 9/5 + 32; }

  function renderTemps(){
    if(!lastData) return;
    const t = currentUnit === 'c' ? Math.round(lastData.tempC) : Math.round(cToF(lastData.tempC));
    const f = currentUnit === 'c' ? Math.round(lastData.feelsC) : Math.round(cToF(lastData.feelsC));
    document.getElementById('tempReading').textContent = `${t}°`;
    document.getElementById('feelsLike').textContent = `Feels like ${f}°${currentUnit === 'c' ? 'C' : 'F'}`;

    document.querySelectorAll('#forecastWrap .hi').forEach((el,i) => {
      const c = lastData.daily[i].hiC;
      el.textContent = `${Math.round(currentUnit === 'c' ? c : cToF(c))}°`;
    });
    document.querySelectorAll('#forecastWrap .lo').forEach((el,i) => {
      const c = lastData.daily[i].loC;
      el.textContent = `${Math.round(currentUnit === 'c' ? c : cToF(c))}°`;
    });
  }

  unitToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    currentUnit = btn.dataset.unit;
    unitToggle.querySelectorAll('button').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('bg-ink', isActive);
      b.classList.toggle('text-paper', isActive);
      b.classList.toggle('text-inksoft', !isActive);
      b.classList.toggle('bg-transparent', !isActive);
    });
    renderTemps();
  });

  async function lookup(query){
    if(!query || !query.trim()) return;
    setState('Locating station…', false);
    try{
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if(!geoData.results || geoData.results.length === 0){
        setState(`No station found matching "${query}". Try a different spelling.`, true);
        return;
      }
      const place = geoData.results[0];
      setState('Taking reading…', false);

      const params = new URLSearchParams({
        latitude: place.latitude,
        longitude: place.longitude,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover,precipitation',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
        timezone: 'auto',
        forecast_days: '7'
      });
      const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      const wx = await wxRes.json();

      if(!wx.current){
        setState('Reading failed. The instrument may be offline — try again.', true);
        return;
      }

      const cur = wx.current;
      const wmo = WMO[cur.weather_code] || { label: 'Unknown', icon: 'cloud' };

      const regionBits = [place.admin1, place.country].filter(Boolean);
      document.getElementById('placeName').textContent = `${place.name}${regionBits.length ? ', ' + regionBits.join(', ') : ''}`;
      document.getElementById('conditionText').textContent = wmo.label;

      document.getElementById('vHumidity').innerHTML = `${Math.round(cur.relative_humidity_2m)}<span>%</span>`;
      document.getElementById('vPressure').innerHTML = `${Math.round(cur.pressure_msl)}<span>hPa</span>`;
      document.getElementById('vUv').textContent = wx.daily.uv_index_max[0] != null ? wx.daily.uv_index_max[0].toFixed(1) : '—';
      document.getElementById('vVisibility').innerHTML = `—<span>km</span>`;
      document.getElementById('vSunrise').textContent = fmtTime(wx.daily.sunrise[0]);
      document.getElementById('vSunset').textContent = fmtTime(wx.daily.sunset[0]);
      document.getElementById('vPrecip').innerHTML = `${cur.precipitation != null ? cur.precipitation.toFixed(1) : '0.0'}<span>mm</span>`;
      document.getElementById('vCloud').innerHTML = `${Math.round(cur.cloud_cover)}<span>%</span>`;

      const dial = document.getElementById('dialNeedle');
      dial.style.transform = `rotate(${cur.wind_direction_10m}deg)`;
      document.getElementById('dialSpeed').textContent = `${Math.round(cur.wind_speed_10m)} km/h`;

      const forecastWrap = document.getElementById('forecastWrap');
      forecastWrap.innerHTML = '';
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const daily = [];
      wx.daily.time.forEach((dateStr, i) => {
        const d = new Date(dateStr + 'T12:00:00');
        const dayLabel = i === 0 ? 'Today' : dayNames[d.getDay()];
        const dCode = wx.daily.weather_code[i];
        const dWmo = WMO[dCode] || { label: 'Unknown', icon: 'cloud' };
        daily.push({ hiC: wx.daily.temperature_2m_max[i], loC: wx.daily.temperature_2m_min[i] });
        const cell = document.createElement('div');
        cell.className = 'bg-paperraised py-3.5 px-2 text-center';
        cell.innerHTML = `
          <div class="d font-mono text-[10px] tracking-wide uppercase text-inksoft mb-2">${dayLabel}</div>
          ${iconSvg(dWmo.icon)}
          <div class="hi font-mono text-sm font-semibold">${Math.round(wx.daily.temperature_2m_max[i])}°</div>
          <div class="lo font-mono text-xs text-inksoft">${Math.round(wx.daily.temperature_2m_min[i])}°</div>
        `;
        forecastWrap.appendChild(cell);
      });

      lastData = { tempC: cur.temperature_2m, feelsC: cur.apparent_temperature, daily };
      renderTemps();

      stateMsg.classList.add('hidden');
      panel.classList.remove('hidden');
      saveRecent(place.name);

    } catch(err){
      console.error(err);
      setState('Could not reach the weather instrument. Check your connection and try again.', true);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    lookup(input.value);
  });

  renderRecent();
})();