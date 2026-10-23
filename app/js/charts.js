// charts.js: funções puras que retornam strings SVG para charts (B4.3, B6.0)
// Ring, donut, line, bars, gauge. Usam variáveis CSS do tema.

// ---------------------------------------------------------------------
// Ring: progresso circular (ex: kcal consumed/target)
// ---------------------------------------------------------------------

export function ring(value, max, { size = 120, strokeWidth = 8, label = '', sublabel = '' } = {}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - progress);
  const center = size / 2;
  
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="chart-ring">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--border)" stroke-width="${strokeWidth}"/>
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--accent)" stroke-width="${strokeWidth}" 
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" 
        transform="rotate(-90 ${center} ${center})" style="transition: stroke-dashoffset 400ms ease-out"/>
      ${label ? `<text x="${center}" y="${center - 8}" text-anchor="middle" font-size="24" font-weight="700" fill="var(--text)">${label}</text>` : ''}
      ${sublabel ? `<text x="${center}" y="${center + 16}" text-anchor="middle" font-size="14" fill="var(--muted)">${sublabel}</text>` : ''}
    </svg>
  `;
}

// ---------------------------------------------------------------------
// Donut: composição (ex: macros prot/carb/gord)
// ---------------------------------------------------------------------

export function donut(segments, { size = 140, strokeWidth = 20, centerLabel = '' } = {}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    // Donut vazio
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--border)" stroke-width="${strokeWidth}"/>
        ${centerLabel ? `<text x="${center}" y="${center + 5}" text-anchor="middle" font-size="14" fill="var(--muted)">${centerLabel}</text>` : ''}
      </svg>
    `;
  }
  
  let offset = 0;
  const arcs = segments.map((seg) => {
    const segPct = seg.value / total;
    const segLength = circumference * segPct;
    const segOffset = offset;
    offset += segLength;
    
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="${strokeWidth}" 
      stroke-dasharray="${segLength} ${circumference}" stroke-dashoffset="${-segOffset}" 
      transform="rotate(-90 ${center} ${center})" style="transition: stroke-dasharray 400ms ease-out, stroke-dashoffset 400ms ease-out"/>`;
  }).join('');
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${arcs}
      ${centerLabel ? `<text x="${center}" y="${center + 5}" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text)">${centerLabel}</text>` : ''}
    </svg>
  `;
}

// ---------------------------------------------------------------------
// Line: gráfico de linha (ex: peso ao longo do tempo)
// ---------------------------------------------------------------------

export function line(points, { width = 300, height = 180, xLabels = [], yMin, yMax, yUnit = '', goalLine } = {}) {
  if (points.length === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="${width/2}" y="${height/2}" text-anchor="middle" fill="var(--muted)" font-size="14">Sem dados</text></svg>`;
  }
  
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const values = points.map(p => p.y);
  const minY = yMin !== undefined ? yMin : Math.min(...values);
  const maxY = yMax !== undefined ? yMax : Math.max(...values);
  const rangeY = maxY - minY || 1;
  
  const xStep = chartWidth / Math.max(1, points.length - 1);
  
  const pathData = points.map((p, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - ((p.y - minY) / rangeY) * chartHeight;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  
  // Pontos
  const dots = points.map((p, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - ((p.y - minY) / rangeY) * chartHeight;
    return `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"/>`;
  }).join('');
  
  // Goal line (opcional)
  let goalLineEl = '';
  if (goalLine !== undefined && goalLine >= minY && goalLine <= maxY) {
    const goalY = padding.top + chartHeight - ((goalLine - minY) / rangeY) * chartHeight;
    goalLineEl = `<line x1="${padding.left}" y1="${goalY}" x2="${width - padding.right}" y2="${goalY}" stroke="var(--gold)" stroke-width="2" stroke-dasharray="4 4"/>`;
  }
  
  // Eixo Y (3 labels)
  const yTicks = [minY, (minY + maxY) / 2, maxY].map((val) => {
    const y = padding.top + chartHeight - ((val - minY) / rangeY) * chartHeight;
    return `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${val.toFixed(0)}${yUnit}</text>`;
  }).join('');
  
  // Eixo X labels (se fornecidos)
  let xTicksEl = '';
  if (xLabels.length > 0) {
    const step = Math.ceil(xLabels.length / 7); // max 7 labels
    xTicksEl = xLabels.map((label, i) => {
      if (i % step !== 0 && i !== xLabels.length - 1) return '';
      const x = padding.left + i * xStep;
      return `<text x="${x}" y="${height - 5}" text-anchor="middle" font-size="12" fill="var(--muted)">${label}</text>`;
    }).join('');
  }
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-line">
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="var(--border)" stroke-width="1"/>
      ${goalLineEl}
      <path d="${pathData}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
      ${yTicks}
      ${xTicksEl}
    </svg>
  `;
}

// ---------------------------------------------------------------------
// Bars: gráfico de barras (ex: macros do dia, hábitos da semana)
// ---------------------------------------------------------------------

export function bars(items, { width = 300, height = 180, max, goalLine } = {}) {
  if (items.length === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="${width/2}" y="${height/2}" text-anchor="middle" fill="var(--muted)" font-size="14">Sem dados</text></svg>`;
  }
  
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const values = items.map(it => it.value);
  const maxVal = max !== undefined ? max : Math.max(...values, 1);
  
  const barWidth = chartWidth / items.length - 8;
  const barGap = 8;
  
  const barsEl = items.map((item, i) => {
    const barHeight = (item.value / maxVal) * chartHeight;
    const x = padding.left + i * (barWidth + barGap);
    const y = padding.top + chartHeight - barHeight;
    const color = item.color || 'var(--accent)';
    
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
      <text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="var(--muted)">${item.label}</text>
    `;
  }).join('');
  
  // Goal line (opcional)
  let goalLineEl = '';
  if (goalLine !== undefined && goalLine > 0 && goalLine <= maxVal) {
    const goalY = padding.top + chartHeight - (goalLine / maxVal) * chartHeight;
    goalLineEl = `<line x1="${padding.left}" y1="${goalY}" x2="${width - padding.right}" y2="${goalY}" stroke="var(--gold)" stroke-width="2" stroke-dasharray="4 4"/>`;
  }
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-bars">
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="var(--border)" stroke-width="1"/>
      ${goalLineEl}
      ${barsEl}
    </svg>
  `;
}

// ---------------------------------------------------------------------
// Gauge: medidor semicircular (ex: IMC 15–40, 6 faixas OMS, agulha)
// ---------------------------------------------------------------------

export function gauge(value, { size = 200, min = 15, max = 40, bands = [], needle = true } = {}) {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // semicírculo
  const center = size / 2;
  const startAngle = -90;
  const endAngle = 90;
  const angleRange = endAngle - startAngle;
  
  // Bands (faixas coloridas)
  let offset = 0;
  const bandsEl = bands.map((band) => {
    const bandStart = Math.max(min, band.min);
    const bandEnd = Math.min(max, band.max);
    const bandPct = (bandEnd - bandStart) / (max - min);
    const segLength = circumference * bandPct;
    const segOffset = offset;
    offset += segLength;
    
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${band.color}" stroke-width="${strokeWidth}" 
      stroke-dasharray="${segLength} ${circumference * 2}" stroke-dashoffset="${-segOffset}" 
      transform="rotate(180 ${center} ${center})"/>`;
  }).join('');
  
  // Needle (agulha)
  let needleEl = '';
  if (needle && value >= min && value <= max) {
    const valuePct = (value - min) / (max - min);
    const angle = startAngle + angleRange * valuePct;
    const angleRad = (angle * Math.PI) / 180;
    const needleLength = radius - strokeWidth / 2;
    const needleX = center + needleLength * Math.cos(angleRad);
    const needleY = center + needleLength * Math.sin(angleRad);
    
    needleEl = `
      <line x1="${center}" y1="${center}" x2="${needleX}" y2="${needleY}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${center}" cy="${center}" r="6" fill="var(--text)"/>
    `;
  }
  
  // Labels min/max
  const labelsEl = `
    <text x="${padding}" y="${center + 5}" text-anchor="start" font-size="12" fill="var(--muted)">${min}</text>
    <text x="${size - padding}" y="${center + 5}" text-anchor="end" font-size="12" fill="var(--muted)">${max}</text>
  `;
  
  const padding = 10;
  
  return `
    <svg width="${size}" height="${size * 0.6}" viewBox="0 0 ${size} ${size * 0.6}" class="chart-gauge">
      ${bandsEl}
      ${needleEl}
      ${labelsEl}
    </svg>
  `;
}
