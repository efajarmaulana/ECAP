import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ─── DEMO DATA ─────────────────────────────────────────────────────────────
const DEMO_PROVIDERS = [
  { id: '1', name: 'OpenAI', provider_type: 'openai', is_enabled: true, is_default: true, health_status: 'healthy',
    models: [
      { model_id: 'gpt-4o', display_name: 'GPT-4o', is_enabled: true },
      { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', is_enabled: true },
      { model_id: 'o3-mini', display_name: 'o3 Mini', is_enabled: true },
    ],
    usage_today: { calls: 245, tokens: 184000, cost_usd: 1.84 }
  },
  { id: '2', name: 'Google Gemini', provider_type: 'gemini', is_enabled: true, is_default: false, health_status: 'healthy',
    models: [
      { model_id: 'gemini-2.5-pro', display_name: 'Gemini 2.5 Pro', is_enabled: true },
      { model_id: 'gemini-2.5-flash', display_name: 'Gemini 2.5 Flash', is_enabled: true },
    ],
    usage_today: { calls: 89, tokens: 340000, cost_usd: 0.43 }
  },
  { id: '3', name: 'Anthropic Claude', provider_type: 'claude', is_enabled: false, is_default: false, health_status: 'unknown',
    models: [
      { model_id: 'claude-opus-4-5', display_name: 'Claude Opus 4.5', is_enabled: true },
      { model_id: 'claude-sonnet-4-5', display_name: 'Claude Sonnet 4.5', is_enabled: true },
    ],
    usage_today: { calls: 0, tokens: 0, cost_usd: 0 }
  },
  { id: '4', name: 'Local Ollama', provider_type: 'ollama', is_enabled: true, is_default: false, health_status: 'degraded',
    models: [
      { model_id: 'llama3.2', display_name: 'LLaMA 3.2', is_enabled: true },
      { model_id: 'mistral', display_name: 'Mistral 7B', is_enabled: true },
    ],
    usage_today: { calls: 12, tokens: 24000, cost_usd: 0 }
  },
]

const DEMO_DATASETS = [
  { id: 'ds1', name: 'Sales Q1 2026', description: 'Data penjualan kuartal pertama', file_type: 'xlsx',
    row_count: 45320, column_count: 12, file_size_bytes: 2097152, status: 'ready',
    tags: ['sales', 'q1', '2026'], classification: 'internal',
    owner: { full_name: 'Budi Santoso' }, created_at: '2026-01-15T10:00:00Z',
    columns: [
      { column_name: 'tanggal', display_name: 'Tanggal', data_type: 'date', semantic_type: 'date', stats: { min: '2026-01-01', max: '2026-03-31', null_pct: 0 } },
      { column_name: 'produk', display_name: 'Produk', data_type: 'string', semantic_type: 'category', stats: { unique_count: 48, null_pct: 0.01 } },
      { column_name: 'cabang', display_name: 'Cabang', data_type: 'string', semantic_type: 'category', stats: { unique_count: 15, null_pct: 0 } },
      { column_name: 'revenue', display_name: 'Revenue', data_type: 'float', semantic_type: 'currency', stats: { min: 50000, max: 9850000, mean: 425000, null_pct: 0.02 } },
      { column_name: 'quantity', display_name: 'Quantity', data_type: 'integer', semantic_type: 'number', stats: { min: 1, max: 500, mean: 24, null_pct: 0 } },
      { column_name: 'kategori', display_name: 'Kategori', data_type: 'string', semantic_type: 'category', stats: { unique_count: 6, null_pct: 0 } },
    ]
  },
  { id: 'ds2', name: 'Customer Analytics 2025', description: 'Analisis pelanggan tahunan', file_type: 'csv',
    row_count: 128500, column_count: 18, file_size_bytes: 8388608, status: 'ready',
    tags: ['customer', 'analytics', '2025'], classification: 'confidential',
    owner: { full_name: 'Siti Rahayu' }, created_at: '2026-02-01T08:30:00Z',
    columns: [
      { column_name: 'customer_id', display_name: 'Customer ID', data_type: 'string', semantic_type: 'id', stats: { unique_count: 128500, null_pct: 0 } },
      { column_name: 'segment', display_name: 'Segmen', data_type: 'string', semantic_type: 'category', stats: { unique_count: 5, null_pct: 0 } },
      { column_name: 'clv', display_name: 'Customer Lifetime Value', data_type: 'float', semantic_type: 'currency', stats: { min: 0, max: 50000000, mean: 2450000, null_pct: 0.05 } },
    ]
  },
  { id: 'ds3', name: 'Inventory Stock 2026', description: 'Data stok gudang 2026', file_type: 'parquet',
    row_count: 8900, column_count: 9, file_size_bytes: 524288, status: 'processing',
    tags: ['inventory', 'warehouse'], classification: 'internal',
    owner: { full_name: 'Ahmad Fauzi' }, created_at: '2026-06-18T14:00:00Z',
    columns: []
  },
]

const DEMO_MESSAGES: Record<string, Array<{id: string, role: string, content: string, attachments?: any, intent?: string, created_at: string}>> = {
  'sess1': [
    { id: 'm1', role: 'user', content: 'Tampilkan top 5 produk berdasarkan revenue bulan Januari', created_at: '2026-06-01T10:00:00Z' },
    { id: 'm2', role: 'assistant', content: 'Berikut adalah top 5 produk berdasarkan revenue di bulan Januari 2026:', intent: 'QUERY+CHART',
      attachments: {
        sql: 'SELECT produk, SUM(revenue) as total_revenue FROM sales_q1 WHERE MONTH(tanggal) = 1 GROUP BY produk ORDER BY total_revenue DESC LIMIT 5',
        data: { columns: ['Produk', 'Revenue'], rows: [['Laptop Pro X1', 9850000], ['Monitor 4K Ultra', 7230000], ['SSD NVMe 2TB', 5640000], ['Keyboard Mech RGB', 4120000], ['Mouse Wireless Pro', 3890000]] },
        chart: {
          type: 'bar',
          option: {
            title: { text: 'Top 5 Produk by Revenue - Januari 2026', left: 'center' },
            tooltip: { trigger: 'axis', formatter: '{b}: Rp {c}' },
            xAxis: { type: 'category', data: ['Laptop Pro X1', 'Monitor 4K', 'SSD NVMe', 'Keyboard', 'Mouse Pro'], axisLabel: { rotate: 20 } },
            yAxis: { type: 'value', name: 'Revenue (Rp)', axisLabel: { formatter: (v: number) => `${v/1000000}M` } },
            series: [{ type: 'bar', data: [9850000, 7230000, 5640000, 4120000, 3890000], itemStyle: { color: '#5470c6' } }],
            grid: { bottom: 80 }
          }
        },
        insight: 'Laptop Pro X1 mendominasi revenue dengan Rp 9.85 Juta (28.6% dari total top 5). Secara keseluruhan, kategori hardware komputer menyumbang 85% dari total revenue.'
      },
      created_at: '2026-06-01T10:01:00Z'
    },
    { id: 'm3', role: 'user', content: 'Buat pivot table cabang vs kategori produk', created_at: '2026-06-01T10:05:00Z' },
    { id: 'm4', role: 'assistant', content: 'Berikut pivot table Revenue per Cabang vs Kategori Produk:', intent: 'PIVOT',
      attachments: {
        sql: 'PIVOT (SELECT cabang, kategori, SUM(revenue) as revenue FROM sales_q1 GROUP BY cabang, kategori) ON kategori USING SUM(revenue)',
        pivot_data: {
          rows: ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar'],
          columns: ['Laptop', 'Monitor', 'Storage', 'Peripheral', 'Network'],
          values: [
            [8500000, 6200000, 4800000, 3200000, 1900000],
            [5200000, 3800000, 2900000, 2100000, 1400000],
            [6800000, 4900000, 3700000, 2800000, 1600000],
            [3200000, 2400000, 1800000, 1300000, 800000],
            [2100000, 1600000, 1200000, 900000, 600000],
          ],
          row_totals: [24600000, 15400000, 19800000, 9500000, 6400000],
          column_totals: [25800000, 18900000, 14400000, 10300000, 6300000],
          grand_total: 75700000
        }
      },
      created_at: '2026-06-01T10:06:00Z'
    },
  ]
}

// ─── API ROUTES ─────────────────────────────────────────────────────────────

// Auth
app.post('/api/v1/auth/login', async (c) => {
  const body = await c.req.json()
  if (body.email && body.password) {
    return c.json({
      success: true,
      data: {
        access_token: 'demo_jwt_token_' + Date.now(),
        refresh_token: 'demo_refresh_token',
        token_type: 'bearer',
        expires_in: 900,
        user: {
          id: 'user1',
          email: body.email,
          full_name: 'Demo User - Enterprise',
          avatar_url: null,
          tenant_id: 'tenant1',
          roles: ['analyst'],
          permissions: ['dataset.read', 'chat.*', 'analytics.*', 'dashboard.*', 'report.*']
        }
      }
    })
  }
  return c.json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' } }, 401)
})

app.get('/api/v1/auth/me', (c) => {
  return c.json({
    success: true,
    data: {
      id: 'user1',
      email: 'demo@ecap.com',
      full_name: 'Demo User',
      tenant: { id: 'tenant1', name: 'PT Demo Enterprise', plan: 'enterprise' },
      roles: ['analyst'],
      permissions: ['dataset.read', 'chat.*', 'analytics.*']
    }
  })
})

// Datasets
app.get('/api/v1/datasets', (c) => {
  return c.json({
    success: true,
    data: DEMO_DATASETS.map(({ columns: _, ...d }) => d),
    meta: { page: 1, per_page: 20, total: DEMO_DATASETS.length }
  })
})

app.get('/api/v1/datasets/:id', (c) => {
  const ds = DEMO_DATASETS.find(d => d.id === c.req.param('id'))
  if (!ds) return c.json({ success: false, error: { code: 'DATASET_NOT_FOUND' } }, 404)
  return c.json({ success: true, data: ds })
})

app.post('/api/v1/datasets/upload', async (c) => {
  await new Promise(r => setTimeout(r, 500))
  const newId = 'ds' + Date.now()
  return c.json({
    success: true,
    data: {
      dataset_id: newId,
      status: 'processing',
      task_id: 'task_' + newId,
      estimated_seconds: 15
    }
  }, 202)
})

app.get('/api/v1/datasets/:id/preview', (c) => {
  return c.json({
    success: true,
    data: {
      columns: ['tanggal', 'produk', 'cabang', 'revenue', 'quantity', 'kategori'],
      rows: [
        ['2026-01-15', 'Laptop Pro X1', 'Jakarta', 9850000, 2, 'Laptop'],
        ['2026-01-16', 'Monitor 4K Ultra', 'Bandung', 7230000, 3, 'Monitor'],
        ['2026-01-17', 'SSD NVMe 2TB', 'Surabaya', 5640000, 10, 'Storage'],
        ['2026-01-18', 'Keyboard Mech RGB', 'Jakarta', 4120000, 8, 'Peripheral'],
        ['2026-01-19', 'Mouse Wireless Pro', 'Medan', 3890000, 15, 'Peripheral'],
      ]
    }
  })
})

// Chat Sessions
app.post('/api/v1/chat/sessions', async (c) => {
  const body = await c.req.json()
  return c.json({
    success: true,
    data: {
      session_id: 'sess_' + Date.now(),
      title: body.title || 'Sesi Analisis Baru',
      dataset_ids: body.dataset_ids || [],
      model_id: body.model_id || 'gpt-4o',
      created_at: new Date().toISOString()
    }
  }, 201)
})

app.get('/api/v1/chat/sessions', (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'sess1', title: 'Analisis Penjualan Q1 2026', dataset_ids: ['ds1'], model_id: 'gpt-4o', message_count: 4, created_at: '2026-06-01T10:00:00Z', last_message_at: '2026-06-01T10:06:00Z' },
      { id: 'sess2', title: 'Customer Segmentation Analysis', dataset_ids: ['ds2'], model_id: 'gemini-2.5-pro', message_count: 6, created_at: '2026-05-28T14:00:00Z', last_message_at: '2026-05-28T15:20:00Z' },
    ]
  })
})

app.get('/api/v1/chat/sessions/:id/messages', (c) => {
  const msgs = DEMO_MESSAGES[c.req.param('id')] || []
  return c.json({ success: true, data: msgs })
})

// Analytics
app.post('/api/v1/analytics/query', async (c) => {
  const body = await c.req.json()
  await new Promise(r => setTimeout(r, 800))
  return c.json({
    success: true,
    data: {
      sql: `SELECT produk, SUM(revenue) as total FROM sales WHERE cabang = 'Jakarta' GROUP BY produk ORDER BY total DESC LIMIT 10`,
      result: {
        columns: ['Produk', 'Total Revenue'],
        rows: [
          ['Laptop Pro X1', 9850000], ['Monitor 4K Ultra', 7230000],
          ['SSD NVMe 2TB', 5640000], ['Keyboard Mech RGB', 4120000],
        ],
        row_count: 4,
        execution_ms: 124
      },
      insight: `Berdasarkan pertanyaan "${body.question}", data menunjukkan bahwa Laptop Pro X1 mendominasi dengan kontribusi 34.6% dari total revenue. Tren menunjukkan peningkatan 18% dibanding periode sebelumnya.`,
      chart: {
        type: 'bar',
        option: {
          title: { text: body.question || 'Analytics Result', left: 'center', textStyle: { fontSize: 13 } },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: ['Laptop Pro X1', 'Monitor 4K', 'SSD NVMe', 'Keyboard'], axisLabel: { rotate: 15 } },
          yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v/1000000).toFixed(1)}M` } },
          series: [{ type: 'bar', data: [9850000, 7230000, 5640000, 4120000], itemStyle: { color: '#5470c6' } }]
        }
      }
    }
  })
})

app.post('/api/v1/analytics/pivot', async (c) => {
  const body = await c.req.json()
  await new Promise(r => setTimeout(r, 600))
  return c.json({
    success: true,
    data: {
      pivot_data: {
        rows: ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar'],
        columns: ['Laptop', 'Monitor', 'Storage', 'Peripheral', 'Network'],
        values: [
          [8500000, 6200000, 4800000, 3200000, 1900000],
          [5200000, 3800000, 2900000, 2100000, 1400000],
          [6800000, 4900000, 3700000, 2800000, 1600000],
          [3200000, 2400000, 1800000, 1300000, 800000],
          [2100000, 1600000, 1200000, 900000, 600000],
        ],
        row_totals: [24600000, 15400000, 19800000, 9500000, 6400000],
        column_totals: [25800000, 18900000, 14400000, 10300000, 6300000],
        grand_total: 75700000
      },
      sql: `PIVOT (SELECT ${body.rows?.[0] || 'cabang'}, ${body.columns?.[0] || 'kategori'}, SUM(${body.values?.[0] || 'revenue'}) FROM dataset GROUP BY 1,2) ON ${body.columns?.[0] || 'kategori'}`,
      execution_ms: 89
    }
  })
})

app.post('/api/v1/analytics/chart', async (c) => {
  const body = await c.req.json()
  await new Promise(r => setTimeout(r, 700))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const values = [4200000, 3800000, 5100000, 4700000, 6200000, 5800000]
  return c.json({
    success: true,
    data: {
      chart_type: body.chart_type_hint || 'line',
      sql: `SELECT DATE_TRUNC('month', tanggal) as bulan, SUM(revenue) as total FROM dataset GROUP BY 1 ORDER BY 1`,
      data: { columns: ['Bulan', 'Revenue'], rows: months.map((m, i) => [m, values[i]]) },
      echarts_option: {
        title: { text: body.question || 'Trend Revenue Bulanan', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: months },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v/1000000).toFixed(1)}M` } },
        series: [{
          type: body.chart_type_hint || 'line',
          data: values,
          smooth: true,
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#5470c6' }
        }]
      },
      title: 'Trend Revenue per Bulan 2026'
    }
  })
})

app.post('/api/v1/analytics/forecast', async (c) => {
  const body = await c.req.json()
  await new Promise(r => setTimeout(r, 1200))
  return c.json({
    success: true,
    data: {
      method_used: 'prophet',
      historical: [
        { period: '2026-01', value: 4200000 }, { period: '2026-02', value: 3800000 },
        { period: '2026-03', value: 5100000 }, { period: '2026-04', value: 4700000 },
        { period: '2026-05', value: 6200000 }, { period: '2026-06', value: 5800000 },
      ],
      forecast: [
        { period: '2026-07', value: 6500000, lower: 5800000, upper: 7200000 },
        { period: '2026-08', value: 7100000, lower: 6300000, upper: 7900000 },
        { period: '2026-09', value: 6800000, lower: 6000000, upper: 7600000 },
      ],
      accuracy_metrics: { mape: 4.2, rmse: 124000 },
      chart: {
        option: {
          title: { text: `Forecast ${body.metric_column || 'Revenue'} - ${body.periods || 3} Bulan Ke Depan`, left: 'center' },
          tooltip: { trigger: 'axis' },
          legend: { data: ['Historis', 'Forecast', 'Confidence Band'], bottom: 0 },
          xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'] },
          yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v/1000000).toFixed(1)}M` } },
          series: [
            { name: 'Historis', type: 'line', data: [4200000, 3800000, 5100000, 4700000, 6200000, 5800000, null, null, null], itemStyle: { color: '#5470c6' } },
            { name: 'Forecast', type: 'line', data: [null, null, null, null, null, 5800000, 6500000, 7100000, 6800000], itemStyle: { color: '#fac858' }, lineStyle: { type: 'dashed' } },
          ]
        }
      }
    }
  })
})

// AI Runtime
app.get('/api/v1/ai-runtime/providers', (c) => {
  return c.json({ success: true, data: DEMO_PROVIDERS })
})

app.post('/api/v1/ai-runtime/providers', async (c) => {
  const body = await c.req.json()
  return c.json({
    success: true,
    data: { id: 'prov_' + Date.now(), ...body, health_status: 'unknown', is_default: false, models: [] }
  }, 201)
})

app.patch('/api/v1/ai-runtime/providers/:id', async (c) => {
  const body = await c.req.json()
  return c.json({ success: true, data: { id: c.req.param('id'), ...body } })
})

app.post('/api/v1/ai-runtime/providers/:id/health-check', async (c) => {
  await new Promise(r => setTimeout(r, 1000))
  return c.json({
    success: true,
    data: { status: 'healthy', latency_ms: 234, models_available: ['gpt-4o', 'gpt-4o-mini'] }
  })
})

app.get('/api/v1/ai-runtime/usage', (c) => {
  return c.json({
    success: true,
    data: {
      summary: { total_calls: 1234, total_tokens: 4500000, total_cost_usd: 45.23 },
      by_date: [
        { date: '2026-06-13', calls: 156, cost: 5.23 },
        { date: '2026-06-14', calls: 189, cost: 6.87 },
        { date: '2026-06-15', calls: 201, cost: 7.44 },
        { date: '2026-06-16', calls: 178, cost: 6.12 },
        { date: '2026-06-17', calls: 234, cost: 8.90 },
        { date: '2026-06-18', calls: 276, cost: 10.67 },
      ],
      by_model: [
        { model_id: 'gpt-4o', calls: 456, tokens: 2100000, cost: 21.00 },
        { model_id: 'gpt-4o-mini', calls: 623, tokens: 1800000, cost: 1.08 },
        { model_id: 'gemini-2.5-pro', calls: 155, tokens: 600000, cost: 0.75 },
      ]
    }
  })
})

// Reports
app.post('/api/v1/reports/generate', async (c) => {
  return c.json({
    success: true,
    data: { report_id: 'rpt_' + Date.now(), task_id: 'task_rpt_' + Date.now(), status: 'pending' }
  }, 202)
})

app.get('/api/v1/reports', (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'rpt1', title: 'Executive Summary Juni 2026', report_type: 'executive_summary', format: 'pdf', status: 'ready', created_at: '2026-06-15T10:00:00Z', file_size_bytes: 2048000 },
      { id: 'rpt2', title: 'Sales Analysis Q1 2026', report_type: 'data_report', format: 'xlsx', status: 'ready', created_at: '2026-06-10T14:30:00Z', file_size_bytes: 1024000 },
    ]
  })
})

// Health
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    services: { database: 'healthy', redis: 'healthy', minio: 'healthy' },
    version: '3.0.0',
    uptime_seconds: 86400
  })
})

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Main HTML app
app.get('/', (c) => {
  return c.html(getAppHTML())
})

app.get('*', (c) => {
  return c.html(getAppHTML())
})

function getAppHTML(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECAP — Enterprise Conversational Analytics Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <link rel="stylesheet" href="/static/style.css">
  <style>
    :root {
      --primary: #6366f1; --primary-dark: #4f46e5; --secondary: #8b5cf6;
      --accent: #06b6d4; --success: #10b981; --warning: #f59e0b;
      --danger: #ef4444; --bg-dark: #0f172a; --bg-card: #1e293b;
      --bg-card2: #243447; --border: #334155; --text: #e2e8f0; --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body { margin:0; font-family: 'Inter', system-ui, sans-serif; background: var(--bg-dark); color: var(--text); overflow: hidden; height:100vh; }
    
    /* SCROLLBARS */
    ::-webkit-scrollbar { width:6px; height:6px; }
    ::-webkit-scrollbar-track { background: var(--bg-dark); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius:3px; }
    
    /* LAYOUT */
    #app { display: flex; height: 100vh; }
    #sidebar { width: 260px; min-width: 260px; background: var(--bg-card); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: all 0.3s; }
    #sidebar.collapsed { width: 64px; min-width: 64px; }
    #main { flex:1; display: flex; flex-direction: column; overflow: hidden; }
    #topbar { height: 60px; background: var(--bg-card); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0; }
    #content { flex:1; overflow-y: auto; padding: 24px; }
    
    /* SIDEBAR NAV */
    .nav-section { padding: 8px; }
    .nav-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); padding: 8px 12px 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; color: var(--text-muted); font-size: 14px; margin-bottom: 2px; }
    .nav-item:hover { background: var(--bg-card2); color: var(--text); }
    .nav-item.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); color: var(--primary); border: 1px solid rgba(99,102,241,0.3); }
    .nav-item .icon { width: 18px; text-align: center; font-size: 15px; }
    .nav-badge { margin-left: auto; background: var(--primary); color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 10px; }
    
    /* CARDS */
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; }
    .card-glass { background: rgba(30,41,59,0.8); backdrop-filter: blur(10px); border: 1px solid var(--border); border-radius: 12px; }
    
    /* BUTTONS */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover { background: var(--bg-card2); }
    .btn-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--danger); }
    .btn-sm { padding: 5px 10px; font-size: 12px; }
    .btn-icon { padding: 8px; border-radius: 8px; }
    
    /* BADGES */
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-success { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.3); }
    .badge-warning { background: rgba(245,158,11,0.15); color: var(--warning); border: 1px solid rgba(245,158,11,0.3); }
    .badge-danger { background: rgba(239,68,68,0.15); color: var(--danger); border: 1px solid rgba(239,68,68,0.3); }
    .badge-info { background: rgba(6,182,212,0.15); color: var(--accent); border: 1px solid rgba(6,182,212,0.3); }
    .badge-primary { background: rgba(99,102,241,0.15); color: var(--primary); border: 1px solid rgba(99,102,241,0.3); }
    
    /* INPUTS */
    .input { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 9px 12px; font-size: 14px; outline: none; width: 100%; transition: border-color 0.15s; }
    .input:focus { border-color: var(--primary); }
    .select { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 8px 12px; font-size: 14px; outline: none; width: 100%; }
    
    /* CHAT */
    #chat-messages { height: calc(100vh - 220px); overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding: 16px; }
    .msg-user { align-self: flex-end; max-width: 75%; }
    .msg-user .bubble { background: linear-gradient(135deg, var(--primary), var(--secondary)); padding: 12px 16px; border-radius: 16px 16px 4px 16px; color: white; font-size: 14px; line-height: 1.5; }
    .msg-assistant { align-self: flex-start; max-width: 90%; width: 100%; }
    .msg-assistant .bubble { background: var(--bg-card2); border: 1px solid var(--border); padding: 16px; border-radius: 4px 16px 16px 16px; font-size: 14px; line-height: 1.6; }
    .msg-meta { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
    
    /* INTENT BADGE */
    .intent-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; font-size: 11px; color: var(--primary); font-weight: 600; margin-bottom: 8px; }
    
    /* SQL CHIP */
    .sql-chip { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; margin-top: 8px; }
    .sql-chip pre { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #7dd3fc; padding: 10px 12px; overflow-x: auto; margin: 0; }
    
    /* CHART CONTAINER */
    .chart-container { width: 100%; height: 280px; margin-top: 12px; }
    
    /* PIVOT TABLE */
    .pivot-table { overflow-x: auto; margin-top: 12px; }
    .pivot-table table { border-collapse: collapse; font-size: 12px; width: 100%; }
    .pivot-table th { background: var(--bg-dark); padding: 8px 12px; text-align: right; border: 1px solid var(--border); color: var(--text-muted); font-weight: 600; }
    .pivot-table th:first-child { text-align: left; }
    .pivot-table td { padding: 7px 12px; text-align: right; border: 1px solid var(--border); }
    .pivot-table .row-header { text-align: left; font-weight: 500; color: var(--text); background: var(--bg-card2); }
    .pivot-table .total-row td, .pivot-table .total-col { background: rgba(99,102,241,0.1); font-weight: 700; color: var(--primary); }
    .pivot-table tr:hover td { background: rgba(99,102,241,0.05); }
    
    /* DATASET CARD */
    .dataset-card { border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--bg-card); transition: all 0.15s; cursor: pointer; }
    .dataset-card:hover { border-color: var(--primary); box-shadow: 0 0 0 1px rgba(99,102,241,0.2); }
    
    /* PROVIDER CARD */
    .provider-card { border: 1px solid var(--border); border-radius: 12px; padding: 20px; background: var(--bg-card); transition: all 0.15s; }
    .provider-card.active { border-color: var(--success); }
    .provider-card.inactive { opacity: 0.6; }
    
    /* STAT CARD */
    .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .stat-value { font-size: 28px; font-weight: 800; color: var(--text); margin: 4px 0; }
    .stat-label { font-size: 12px; color: var(--text-muted); }
    .stat-change { font-size: 12px; font-weight: 600; }
    .stat-change.up { color: var(--success); }
    .stat-change.down { color: var(--danger); }
    
    /* TYPING ANIMATION */
    .typing-dot { display: inline-block; width: 6px; height: 6px; background: var(--primary); border-radius: 50%; animation: typing 1.4s infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }
    
    /* TABS */
    .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
    .tab { padding: 10px 20px; font-size: 14px; font-weight: 500; cursor: pointer; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
    .tab:hover { color: var(--text); }
    .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
    
    /* MODALS */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 520px; max-width: calc(100vw - 48px); max-height: 80vh; overflow-y: auto; }
    
    /* DRAG DROP ZONE */
    .dropzone { border: 2px dashed var(--border); border-radius: 12px; padding: 48px 24px; text-align: center; transition: all 0.15s; cursor: pointer; }
    .dropzone:hover, .dropzone.dragging { border-color: var(--primary); background: rgba(99,102,241,0.05); }
    
    /* TOAST */
    #toast-container { position: fixed; top: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
    .toast { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; font-size: 13px; display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease; min-width: 280px; }
    .toast.success { border-color: var(--success); }
    .toast.error { border-color: var(--danger); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    
    /* LOGIN */
    #login-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, transparent 60%), var(--bg-dark); }
    .login-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 400px; }
    
    /* ANIMATIONS */
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    /* PROGRESS BAR */
    .progress-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 2px; transition: width 0.5s ease; }
    
    /* LOGO */
    .logo { display: flex; align-items: center; gap: 10px; padding: 20px 16px 12px; }
    .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .logo-text { font-size: 16px; font-weight: 800; color: var(--text); }
    .logo-sub { font-size: 10px; color: var(--text-muted); }
    
    /* GRID */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    
    /* LOADING SPINNER */
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    /* HEATMAP CELLS */
    .heat-cell { transition: all 0.15s; border-radius: 4px; }
    
    /* SPLIT PANE */
    #chat-split { display: flex; height: calc(100vh - 60px); }
    #chat-sidebar-pane { width: 260px; min-width: 260px; border-right: 1px solid var(--border); overflow-y: auto; background: var(--bg-card); }
    #chat-main-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  </style>
</head>
<body>
<div id="toast-container"></div>

<!-- LOGIN SCREEN -->
<div id="login-screen">
  <div class="login-card fade-in">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:60px;height:60px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">📊</div>
      <h1 style="font-size:24px;font-weight:800;margin:0;color:var(--text);">ECAP</h1>
      <p style="color:var(--text-muted);font-size:14px;margin:4px 0 0;">Enterprise Conversational Analytics Platform</p>
    </div>
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">EMAIL</label>
      <input type="email" id="login-email" class="input" placeholder="demo@ecap.com" value="demo@ecap.com">
    </div>
    <div style="margin-bottom:24px;">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">PASSWORD</label>
      <input type="password" id="login-password" class="input" placeholder="••••••••" value="password123">
    </div>
    <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;" onclick="handleLogin()">
      <i class="fas fa-sign-in-alt"></i> Masuk ke Platform
    </button>
    <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:16px;">
      Demo credentials sudah terisi. Klik Masuk untuk melanjutkan.
    </p>
  </div>
</div>

<!-- MAIN APP -->
<div id="app" style="display:none;">
  <!-- SIDEBAR -->
  <nav id="sidebar">
    <div class="logo">
      <div class="logo-icon">📊</div>
      <div>
        <div class="logo-text">ECAP</div>
        <div class="logo-sub">Enterprise Analytics</div>
      </div>
    </div>
    
    <div style="padding:0 8px;margin-bottom:8px;">
      <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15));border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:10px;font-size:12px;">
        <div style="font-weight:700;color:var(--primary);">PT Demo Enterprise</div>
        <div style="color:var(--text-muted);">Plan: Enterprise · Active</div>
      </div>
    </div>
    
    <div class="nav-section">
      <div class="nav-label">Analytics</div>
      <div class="nav-item active" onclick="navigate('dashboard')" id="nav-dashboard">
        <span class="icon">🏠</span> <span class="nav-text">Dashboard</span>
      </div>
      <div class="nav-item" onclick="navigate('chat')" id="nav-chat">
        <span class="icon">💬</span> <span class="nav-text">Chat & Analisis</span>
        <span class="nav-badge">3</span>
      </div>
      <div class="nav-item" onclick="navigate('analytics')" id="nav-analytics">
        <span class="icon">📈</span> <span class="nav-text">Analytics Studio</span>
      </div>
      <div class="nav-item" onclick="navigate('datasets')" id="nav-datasets">
        <span class="icon">🗄️</span> <span class="nav-text">Dataset Manager</span>
      </div>
    </div>
    
    <div class="nav-section">
      <div class="nav-label">Platform</div>
      <div class="nav-item" onclick="navigate('ai-runtime')" id="nav-ai-runtime">
        <span class="icon">🤖</span> <span class="nav-text">AI Runtime</span>
      </div>
      <div class="nav-item" onclick="navigate('reports')" id="nav-reports">
        <span class="icon">📑</span> <span class="nav-text">Reports</span>
      </div>
      <div class="nav-item" onclick="navigate('knowledge')" id="nav-knowledge">
        <span class="icon">📚</span> <span class="nav-text">Knowledge Base</span>
      </div>
    </div>
    
    <div class="nav-section" style="margin-top:auto;">
      <div class="nav-label">Admin</div>
      <div class="nav-item" onclick="navigate('admin')" id="nav-admin">
        <span class="icon">⚙️</span> <span class="nav-text">Admin Panel</span>
      </div>
    </div>
    
    <div style="padding:12px;border-top:1px solid var(--border);margin-top:auto;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:34px;height:34px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;">D</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Demo User</div>
          <div style="font-size:11px;color:var(--text-muted);">analyst</div>
        </div>
        <button class="btn-icon btn-outline btn-sm" onclick="handleLogout()" title="Logout">
          <i class="fas fa-sign-out-alt" style="font-size:12px;"></i>
        </button>
      </div>
    </div>
  </nav>

  <!-- MAIN CONTENT -->
  <main id="main">
    <!-- TOPBAR -->
    <div id="topbar">
      <button class="btn-icon btn-outline" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
      </button>
      <div id="page-title" style="font-size:16px;font-weight:700;flex:1;">Dashboard</div>
      
      <!-- Model Selector (global) -->
      <div style="display:flex;align-items:center;gap:8px;background:var(--bg-dark);border:1px solid var(--border);border-radius:8px;padding:4px 10px;">
        <i class="fas fa-robot" style="color:var(--primary);font-size:12px;"></i>
        <select id="global-model" class="select" style="background:transparent;border:none;font-size:13px;padding:2px;width:160px;">
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="claude-opus-4-5">Claude Opus 4.5</option>
          <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
          <option value="llama3.2">LLaMA 3.2 (Local)</option>
          <option value="deepseek-chat">DeepSeek Chat</option>
          <option value="o3-mini">o3 Mini</option>
        </select>
      </div>
      
      <button class="btn btn-primary btn-sm" onclick="openUploadModal()">
        <i class="fas fa-upload"></i> Upload Data
      </button>
    </div>
    
    <!-- VIEWS -->
    <div id="content">
      <div id="view-dashboard" class="fade-in"></div>
      <div id="view-chat" style="display:none;" class="fade-in"></div>
      <div id="view-analytics" style="display:none;" class="fade-in"></div>
      <div id="view-datasets" style="display:none;" class="fade-in"></div>
      <div id="view-ai-runtime" style="display:none;" class="fade-in"></div>
      <div id="view-reports" style="display:none;" class="fade-in"></div>
      <div id="view-knowledge" style="display:none;" class="fade-in"></div>
      <div id="view-admin" style="display:none;" class="fade-in"></div>
    </div>
  </main>
</div>

<!-- UPLOAD MODAL -->
<div id="upload-modal" class="modal-overlay" style="display:none;">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 style="margin:0;font-size:18px;font-weight:700;">Upload Dataset</h2>
      <button class="btn-icon btn-outline" onclick="closeModal('upload-modal')"><i class="fas fa-times"></i></button>
    </div>
    <div class="dropzone" id="dropzone" onclick="document.getElementById('file-input').click()"
         ondragover="event.preventDefault();this.classList.add('dragging')" 
         ondragleave="this.classList.remove('dragging')"
         ondrop="handleDrop(event)">
      <div style="font-size:40px;margin-bottom:12px;">📂</div>
      <div style="font-size:15px;font-weight:600;margin-bottom:4px;">Drag & Drop file disini</div>
      <div style="font-size:13px;color:var(--text-muted);">atau klik untuk memilih file</div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted);">
        Mendukung: CSV, Excel (.xlsx), Parquet, JSON, TSV | Maks: 500 MB
      </div>
    </div>
    <input type="file" id="file-input" style="display:none;" accept=".csv,.xlsx,.xls,.parquet,.json,.tsv" onchange="handleFileSelect(this)">
    
    <div id="upload-preview" style="display:none;margin-top:16px;">
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-dark);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:24px;" id="upload-file-icon">📄</div>
        <div style="flex:1;">
          <div id="upload-filename" style="font-weight:600;font-size:14px;"></div>
          <div id="upload-filesize" style="font-size:12px;color:var(--text-muted);"></div>
        </div>
        <button class="btn-icon btn-outline btn-sm" onclick="clearUpload()"><i class="fas fa-times"></i></button>
      </div>
      
      <div style="margin-top:16px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">NAMA DATASET</label>
        <input id="upload-name" class="input" placeholder="Nama dataset (opsional)">
      </div>
      <div style="margin-top:12px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">DESKRIPSI</label>
        <input id="upload-desc" class="input" placeholder="Deskripsi dataset...">
      </div>
      <div style="margin-top:12px;">
        <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">TAGS (pisahkan dengan koma)</label>
        <input id="upload-tags" class="input" placeholder="sales, q1, 2026">
      </div>
      
      <div id="upload-progress" style="display:none;margin-top:16px;">
        <div class="progress-bar"><div class="progress-fill" id="upload-progress-fill" style="width:0%"></div></div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;" id="upload-status-text">Mengupload...</div>
      </div>
    </div>
    
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;">
      <button class="btn btn-outline" onclick="closeModal('upload-modal')">Batal</button>
      <button class="btn btn-primary" onclick="submitUpload()" id="upload-btn" disabled>
        <i class="fas fa-cloud-upload-alt"></i> Upload & Proses
      </button>
    </div>
  </div>
</div>

<!-- ADD PROVIDER MODAL -->
<div id="provider-modal" class="modal-overlay" style="display:none;">
  <div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 style="margin:0;font-size:18px;font-weight:700;">Tambah AI Provider</h2>
      <button class="btn-icon btn-outline" onclick="closeModal('provider-modal')"><i class="fas fa-times"></i></button>
    </div>
    
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">PROVIDER TYPE</label>
      <select id="new-provider-type" class="select" onchange="updateProviderForm()">
        <option value="openai">OpenAI</option>
        <option value="gemini">Google Gemini</option>
        <option value="claude">Anthropic Claude</option>
        <option value="ollama">Ollama (Local)</option>
        <option value="azure_openai">Azure OpenAI</option>
        <option value="openrouter">OpenRouter</option>
        <option value="deepseek">DeepSeek</option>
        <option value="custom">Custom (OpenAI Compatible)</option>
      </select>
    </div>
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">NAMA PROVIDER</label>
      <input id="new-provider-name" class="input" placeholder="My OpenAI Production">
    </div>
    <div style="margin-bottom:16px;" id="api-key-field">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">API KEY</label>
      <input id="new-provider-key" type="password" class="input" placeholder="sk-...">
    </div>
    <div style="margin-bottom:16px;" id="base-url-field" style="display:none;">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">BASE URL</label>
      <input id="new-provider-url" class="input" placeholder="http://ollama-host:11434">
    </div>
    <div style="margin-bottom:16px;">
      <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">DEFAULT MODEL</label>
      <input id="new-provider-model" class="input" placeholder="gpt-4o">
    </div>
    
    <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:12px;font-size:12px;color:var(--warning);margin-bottom:20px;">
      <i class="fas fa-lock"></i> API Key akan dienkripsi AES-256 sebelum disimpan di database.
    </div>
    
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-outline" onclick="closeModal('provider-modal')">Batal</button>
      <button class="btn btn-primary" onclick="addProvider()">
        <i class="fas fa-plus"></i> Tambah Provider
      </button>
    </div>
  </div>
</div>

<script>
// ─── STATE ─────────────────────────────────────────────────────────────────
const state = {
  currentView: 'dashboard',
  selectedDatasets: [],
  currentSession: null,
  messages: [],
  chatTyping: false,
  providers: [],
  datasets: [],
  uploadFile: null,
};

const API = axios.create({ baseURL: '/api/v1', headers: { 'Content-Type': 'application/json' } });
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ecap_token');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

// ─── AUTH ──────────────────────────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('ecap_token', data.data.access_token);
    localStorage.setItem('ecap_user', JSON.stringify(data.data.user));
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    await initApp();
    showToast('success', '🎉 Selamat datang di ECAP Enterprise!');
  } catch (e) {
    showToast('error', '❌ Email atau password salah');
  }
}

function handleLogout() {
  localStorage.removeItem('ecap_token');
  localStorage.removeItem('ecap_user');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function initApp() {
  await Promise.all([loadDatasets(), loadProviders()]);
  renderDashboard();
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'login-password') handleLogin();
  });
}

// ─── NAVIGATION ────────────────────────────────────────────────────────────
function navigate(view) {
  state.currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('nav-' + view)?.classList.add('active');
  
  document.querySelectorAll('[id^="view-"]').forEach(el => el.style.display = 'none');
  const viewEl = document.getElementById('view-' + view);
  if (viewEl) { viewEl.style.display = 'block'; viewEl.className = 'fade-in'; }
  
  const titles = { dashboard:'Dashboard', chat:'Chat & Analisis', analytics:'Analytics Studio', datasets:'Dataset Manager', 'ai-runtime':'AI Runtime Manager', reports:'Reports & Export', knowledge:'Knowledge Base', admin:'Admin Panel' };
  document.getElementById('page-title').textContent = titles[view] || view;
  
  const renderers = { dashboard: renderDashboard, chat: renderChat, analytics: renderAnalytics, datasets: renderDatasets, 'ai-runtime': renderAIRuntime, reports: renderReports, knowledge: renderKnowledge, admin: renderAdmin };
  renderers[view]?.();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ─── DATA LOADING ──────────────────────────────────────────────────────────
async function loadDatasets() {
  try {
    const { data } = await API.get('/datasets');
    state.datasets = data.data;
  } catch (e) { state.datasets = []; }
}

async function loadProviders() {
  try {
    const { data } = await API.get('/ai-runtime/providers');
    state.providers = data.data;
  } catch (e) { state.providers = []; }
}

// ─── TOAST ─────────────────────────────────────────────────────────────────
function showToast(type, msg) {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + msg + '</span>';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── MODAL ─────────────────────────────────────────────────────────────────
function openUploadModal() { document.getElementById('upload-modal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ─── UPLOAD ────────────────────────────────────────────────────────────────
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file) setUploadFile(file);
}
function handleFileSelect(input) { if (input.files[0]) setUploadFile(input.files[0]); }
function setUploadFile(file) {
  state.uploadFile = file;
  document.getElementById('upload-preview').style.display = 'block';
  document.getElementById('upload-filename').textContent = file.name;
  document.getElementById('upload-filesize').textContent = formatBytes(file.size);
  document.getElementById('upload-name').value = file.name.replace(/\\.\\w+$/, '');
  const icons = { csv:'📋', xlsx:'📊', xls:'📊', parquet:'🗜️', json:'🔧', tsv:'📋' };
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('upload-file-icon').textContent = icons[ext] || '📄';
  document.getElementById('upload-btn').disabled = false;
}
function clearUpload() {
  state.uploadFile = null;
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('upload-btn').disabled = true;
  document.getElementById('file-input').value = '';
}

async function submitUpload() {
  if (!state.uploadFile) return;
  const progressDiv = document.getElementById('upload-progress');
  const progressFill = document.getElementById('upload-progress-fill');
  const statusText = document.getElementById('upload-status-text');
  progressDiv.style.display = 'block';
  
  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15, 90);
    progressFill.style.width = progress + '%';
    statusText.textContent = progress < 30 ? 'Mengupload file...' : progress < 60 ? 'Memproses data...' : progress < 85 ? 'Mendeteksi schema...' : 'Menghitung profil data...';
  }, 400);
  
  try {
    await API.post('/datasets/upload', { name: 'demo' });
    clearInterval(interval);
    progressFill.style.width = '100%';
    statusText.textContent = 'Selesai!';
    await loadDatasets();
    setTimeout(() => {
      closeModal('upload-modal');
      clearUpload();
      progressDiv.style.display = 'none';
      showToast('success', '✅ Dataset berhasil diupload dan diproses!');
      if (state.currentView === 'datasets') renderDatasets();
    }, 800);
  } catch(e) {
    clearInterval(interval);
    showToast('error', '❌ Upload gagal');
  }
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  const readyDs = state.datasets.filter(d => d.status === 'ready').length;
  const totalRows = state.datasets.filter(d => d.status === 'ready').reduce((s, d) => s + (d.row_count || 0), 0);
  const enabledProviders = state.providers.filter(p => p.is_enabled).length;
  
  el.innerHTML = \`
  <div style="margin-bottom:24px;">
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:800;">Selamat Datang, Demo User! 👋</h2>
    <p style="color:var(--text-muted);margin:0;font-size:14px;">Platform analitik percakapan enterprise Anda — semua data, satu tanya jawab.</p>
  </div>
  
  <div class="grid-4" style="margin-bottom:24px;">
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div>
          <div class="stat-label">Dataset Aktif</div>
          <div class="stat-value">\${readyDs}</div>
          <div class="stat-change up">↑ +2 bulan ini</div>
        </div>
        <div style="font-size:28px;opacity:0.6;">🗄️</div>
      </div>
    </div>
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div>
          <div class="stat-label">Total Baris Data</div>
          <div class="stat-value">\${(totalRows/1000).toFixed(0)}K</div>
          <div class="stat-change up">↑ +45K baris baru</div>
        </div>
        <div style="font-size:28px;opacity:0.6;">📊</div>
      </div>
    </div>
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div>
          <div class="stat-label">AI Providers Aktif</div>
          <div class="stat-value">\${enabledProviders}</div>
          <div class="stat-change up">GPT-4o sebagai default</div>
        </div>
        <div style="font-size:28px;opacity:0.6;">🤖</div>
      </div>
    </div>
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div>
          <div class="stat-label">AI Calls Hari Ini</div>
          <div class="stat-value">346</div>
          <div class="stat-change up">↑ 23% vs kemarin</div>
        </div>
        <div style="font-size:28px;opacity:0.6;">⚡</div>
      </div>
    </div>
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
    <div class="card" style="padding:20px;">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px;">📈 Revenue Trend 2026</div>
      <div id="dash-chart-1" style="height:220px;"></div>
    </div>
    <div class="card" style="padding:20px;">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px;">🤖 AI Usage per Provider</div>
      <div id="dash-chart-2" style="height:220px;"></div>
    </div>
  </div>
  
  <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:24px;">
    <div class="card" style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:15px;font-weight:700;">🗄️ Dataset Terbaru</div>
        <button class="btn btn-outline btn-sm" onclick="navigate('datasets')">Lihat Semua</button>
      </div>
      \${state.datasets.slice(0,3).map(ds => \`
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:22px;">\${ds.file_type === 'xlsx' ? '📊' : ds.file_type === 'csv' ? '📋' : '🗜️'}</div>
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:600;">\${ds.name}</div>
            <div style="font-size:12px;color:var(--text-muted);">\${(ds.row_count||0).toLocaleString()} baris · \${ds.column_count || 0} kolom</div>
          </div>
          <span class="badge \${ds.status === 'ready' ? 'badge-success' : ds.status === 'processing' ? 'badge-warning' : 'badge-danger'}">\${ds.status}</span>
        </div>
      \`).join('')}
    </div>
    
    <div class="card" style="padding:20px;">
      <div style="font-size:15px;font-weight:700;margin-bottom:16px;">⚡ Quick Actions</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-outline" style="justify-content:flex-start;text-align:left;" onclick="navigate('chat');setTimeout(()=>startNewChat(),200)">
          <span style="font-size:18px;">💬</span> <div><div style="font-weight:600;">Mulai Analisis Baru</div><div style="font-size:11px;color:var(--text-muted);">Tanya data dalam bahasa natural</div></div>
        </button>
        <button class="btn btn-outline" style="justify-content:flex-start;text-align:left;" onclick="openUploadModal()">
          <span style="font-size:18px;">📂</span> <div><div style="font-weight:600;">Upload Dataset Baru</div><div style="font-size:11px;color:var(--text-muted);">CSV, Excel, Parquet, JSON</div></div>
        </button>
        <button class="btn btn-outline" style="justify-content:flex-start;text-align:left;" onclick="navigate('analytics')">
          <span style="font-size:18px;">📈</span> <div><div style="font-weight:600;">Buka Analytics Studio</div><div style="font-size:11px;color:var(--text-muted);">Pivot, Forecast, Anomaly</div></div>
        </button>
        <button class="btn btn-outline" style="justify-content:flex-start;text-align:left;" onclick="navigate('ai-runtime')">
          <span style="font-size:18px;">🤖</span> <div><div style="font-weight:600;">Kelola AI Providers</div><div style="font-size:11px;color:var(--text-muted);">Tambah, toggle, pantau biaya</div></div>
        </button>
      </div>
    </div>
  </div>
  \`;
  
  // Render charts
  setTimeout(() => {
    const c1 = echarts.init(document.getElementById('dash-chart-1'));
    c1.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8', formatter: v => v/1000000 + 'M' } },
      series: [{ type: 'line', data: [4.2, 3.8, 5.1, 4.7, 6.2, 5.8].map(v => v * 1000000), smooth: true, areaStyle: { opacity: 0.2, color: '#6366f1' }, itemStyle: { color: '#6366f1' } }],
      grid: { left: 45, right: 10, top: 10, bottom: 20 },
      backgroundColor: 'transparent'
    });
    
    const c2 = echarts.init(document.getElementById('dash-chart-2'));
    c2.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} calls ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#94a3b8' }, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        data: [
          { value: 456, name: 'GPT-4o', itemStyle: { color: '#6366f1' } },
          { value: 623, name: 'GPT-4o Mini', itemStyle: { color: '#8b5cf6' } },
          { value: 155, name: 'Gemini 2.5 Pro', itemStyle: { color: '#06b6d4' } },
        ],
        label: { show: false }
      }],
      backgroundColor: 'transparent'
    });
  }, 100);
}

// ─── CHAT ──────────────────────────────────────────────────────────────────
function renderChat() {
  const el = document.getElementById('view-chat');
  el.style.padding = '0';
  el.style.margin = '-24px';
  el.style.height = 'calc(100vh - 60px)';
  
  el.innerHTML = \`
  <div style="display:flex;height:100%;">
    <!-- Chat sidebar -->
    <div style="width:260px;min-width:260px;border-right:1px solid var(--border);background:var(--bg-card);display:flex;flex-direction:column;">
      <div style="padding:16px;border-bottom:1px solid var(--border);">
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="startNewChat()">
          <i class="fas fa-plus"></i> Chat Baru
        </button>
      </div>
      <div style="padding:12px;border-bottom:1px solid var(--border);">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">DATASET AKTIF</div>
        \${state.datasets.filter(d => d.status === 'ready').map(ds => \`
          <label style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;cursor:pointer;font-size:13px;" class="\${state.selectedDatasets.includes(ds.id) ? 'active-ds' : ''}">
            <input type="checkbox" \${state.selectedDatasets.includes(ds.id) ? 'checked' : ''} onchange="toggleDataset('\${ds.id}')" style="accent-color:var(--primary);">
            <span style="font-size:16px;">\${ds.file_type === 'xlsx' ? '📊' : '📋'}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${ds.name}</div>
              <div style="font-size:11px;color:var(--text-muted);">\${(ds.row_count||0).toLocaleString()} baris</div>
            </div>
          </label>
        \`).join('')}
      </div>
      <div style="flex:1;overflow-y:auto;padding:8px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);padding:8px 4px 4px;">RIWAYAT SESI</div>
        <div onclick="loadSession('sess1')" style="padding:10px;border-radius:8px;cursor:pointer;margin-bottom:4px;border:1px solid \${state.currentSession === 'sess1' ? 'var(--primary)' : 'transparent'};background:\${state.currentSession === 'sess1' ? 'rgba(99,102,241,0.1)' : 'transparent'};">
          <div style="font-size:13px;font-weight:500;">Analisis Penjualan Q1 2026</div>
          <div style="font-size:11px;color:var(--text-muted);">4 pesan · GPT-4o</div>
        </div>
        <div onclick="loadSession('sess2')" style="padding:10px;border-radius:8px;cursor:pointer;margin-bottom:4px;border:1px solid transparent;">
          <div style="font-size:13px;font-weight:500;">Customer Segmentation</div>
          <div style="font-size:11px;color:var(--text-muted);">6 pesan · Gemini 2.5</div>
        </div>
      </div>
    </div>
    
    <!-- Chat main -->
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
      <!-- Chat header -->
      <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;background:var(--bg-card);">
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;" id="chat-title">\${state.currentSession ? 'Analisis Penjualan Q1 2026' : 'Sesi Baru'}</div>
          <div style="font-size:12px;color:var(--text-muted);" id="chat-subtitle">
            \${state.selectedDatasets.length > 0 ? state.selectedDatasets.length + ' dataset dipilih' : 'Pilih dataset di kiri untuk mulai'}
          </div>
        </div>
        <select id="chat-model" class="select" style="width:160px;font-size:13px;">
          <option>GPT-4o</option>
          <option>GPT-4o Mini</option>
          <option>Gemini 2.5 Pro</option>
          <option>Claude Opus 4.5</option>
          <option>LLaMA 3.2 (Local)</option>
        </select>
      </div>
      
      <!-- Messages -->
      <div id="chat-messages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;">
        \${state.messages.length === 0 ? renderChatWelcome() : state.messages.map(renderMessage).join('')}
      </div>
      
      <!-- Input -->
      <div style="padding:16px 20px;border-top:1px solid var(--border);background:var(--bg-card);">
        <div style="display:flex;gap:10px;align-items:flex-end;">
          <div style="flex:1;background:var(--bg-dark);border:1px solid var(--border);border-radius:12px;padding:10px 14px;">
            <textarea id="chat-input" placeholder="Tanya apa saja tentang data Anda... (Ctrl+Enter untuk kirim)" 
              style="width:100%;background:transparent;border:none;color:var(--text);font-size:14px;resize:none;outline:none;max-height:150px;overflow-y:auto;line-height:1.5;"
              rows="1" onkeydown="handleChatKey(event)" oninput="autoGrow(this)"></textarea>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-icon" title="Analitik Cepat" onclick="quickAnalytic('chart')">📈</button>
            <button class="btn btn-outline btn-icon" title="Pivot Table" onclick="quickAnalytic('pivot')">⊞</button>
            <button class="btn btn-outline btn-icon" title="Forecast" onclick="quickAnalytic('forecast')">🔮</button>
            <button class="btn btn-primary btn-icon" onclick="sendMessage()" id="send-btn" title="Kirim (Ctrl+Enter)">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
          \${['Top 10 produk by revenue', 'Trend revenue per bulan', 'Buat pivot cabang vs produk', 'Analisis anomali data', 'Forecast 3 bulan ke depan'].map(q => 
            \`<button class="btn btn-outline btn-sm" onclick="setPrompt('\${q}')" style="font-size:11px;">\${q}</button>\`
          ).join('')}
        </div>
      </div>
    </div>
  </div>
  \`;
  
  if (state.currentSession === 'sess1') renderMessages(state.messages);
}

function renderChatWelcome() {
  return \`
  <div style="text-align:center;margin:auto;max-width:480px;">
    <div style="font-size:56px;margin-bottom:16px;">💬</div>
    <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">Mulai Analisis dengan AI</h2>
    <p style="color:var(--text-muted);font-size:14px;line-height:1.6;margin:0 0 24px;">
      Pilih dataset di panel kiri, lalu tanyakan apa saja dalam bahasa natural. 
      ECAP akan menghasilkan SQL, chart, pivot table, dan insight secara otomatis.
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;">
      \${[
        { icon:'📊', title:'Query Analytics', desc:'Tanya data, dapatkan SQL + hasil + chart' },
        { icon:'⊞', title:'Pivot Table', desc:'Cross-tabulation otomatis dari natural language' },
        { icon:'📈', title:'Trend & Forecast', desc:'Prediksi berbasis Prophet + ML model' },
        { icon:'🔍', title:'Anomaly Detection', desc:'Temukan outlier dan pola tidak wajar' },
      ].map(f => \`
        <div style="padding:14px;background:var(--bg-card2);border:1px solid var(--border);border-radius:10px;">
          <div style="font-size:20px;margin-bottom:4px;">\${f.icon}</div>
          <div style="font-size:13px;font-weight:600;">\${f.title}</div>
          <div style="font-size:12px;color:var(--text-muted);">\${f.desc}</div>
        </div>
      \`).join('')}
    </div>
  </div>
  \`;
}

function renderMessage(msg) {
  if (msg.role === 'user') {
    return \`<div class="msg-user fade-in">
      <div class="bubble">\${msg.content}</div>
      <div class="msg-meta" style="text-align:right;">\${formatTime(msg.created_at)}</div>
    </div>\`;
  }
  
  const att = msg.attachments || {};
  let extra = '';
  
  if (msg.intent) {
    const intents = msg.intent.split('+');
    extra += \`<div style="margin-bottom:8px;">\${intents.map(i => \`<span class="intent-chip">\${intentIcon(i)} \${i}</span>\`).join(' ')}</div>\`;
  }
  
  if (att.sql) {
    extra += \`<div class="sql-chip">
      <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'" 
           style="padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);">
        <i class="fas fa-code" style="color:#7dd3fc;"></i> <span>Lihat SQL yang dihasilkan</span> <i class="fas fa-chevron-down" style="margin-left:auto;font-size:10px;"></i>
      </div>
      <div style="display:none;border-top:1px solid var(--border);"><pre>\${att.sql}</pre></div>
    </div>\`;
  }
  
  if (att.chart) {
    const chartId = 'chart_' + msg.id;
    extra += \`<div class="chart-container" id="\${chartId}"></div>\`;
    setTimeout(() => {
      const el = document.getElementById(chartId);
      if (el) {
        const chart = echarts.init(el, null, { renderer: 'canvas' });
        const opt = { ...att.chart.option, backgroundColor: 'transparent' };
        if (opt.xAxis) { opt.xAxis.axisLabel = { ...(opt.xAxis.axisLabel || {}), color: '#94a3b8' }; }
        if (opt.yAxis) { opt.yAxis.axisLabel = { ...(opt.yAxis.axisLabel || {}), color: '#94a3b8' }; }
        if (opt.legend) { opt.legend.textStyle = { color: '#94a3b8' }; }
        chart.setOption(opt);
      }
    }, 200);
  }
  
  if (att.pivot_data) {
    extra += renderPivotTable(att.pivot_data);
  }
  
  if (att.data && !att.chart) {
    extra += \`<div style="overflow-x:auto;margin-top:10px;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr>\${att.data.columns.map(c => \`<th style="padding:8px;background:var(--bg-dark);border:1px solid var(--border);text-align:left;color:var(--text-muted);">\${c}</th>\`).join('')}</tr></thead>
        <tbody>\${att.data.rows.slice(0,10).map(row => \`<tr>\${row.map(v => \`<td style="padding:7px 8px;border:1px solid var(--border);">\${typeof v === 'number' ? v.toLocaleString() : v}</td>\`).join('')}</tr>\`).join('')}</tbody>
      </table>
    </div>\`;
  }
  
  if (att.insight) {
    extra += \`<div style="margin-top:12px;padding:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:13px;line-height:1.6;">
      <span style="font-weight:700;color:var(--success);">💡 Insight: </span>\${att.insight}
    </div>\`;
  }
  
  // Export buttons
  if (att.data || att.pivot_data) {
    extra += \`<div style="display:flex;gap:6px;margin-top:10px;">
      <button class="btn btn-outline btn-sm" onclick="exportToExcel('\${msg.id}')"><i class="fas fa-file-excel" style="color:var(--success);"></i> Export Excel</button>
      <button class="btn btn-outline btn-sm" onclick="exportToCSV('\${msg.id}')"><i class="fas fa-file-csv" style="color:var(--accent);"></i> Export CSV</button>
      <button class="btn btn-outline btn-sm" onclick="saveChart('\${msg.id}')"><i class="fas fa-image" style="color:var(--warning);"></i> Save Chart</button>
    </div>\`;
  }
  
  return \`<div class="msg-assistant fade-in">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="width:28px;height:28px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div>
      <span style="font-size:13px;font-weight:600;color:var(--primary);">ECAP AI</span>
      <span style="font-size:11px;color:var(--text-muted);">\${formatTime(msg.created_at)}</span>
      \${msg.intent ? \`<span style="font-size:11px;color:var(--text-muted);">· \${document.getElementById('chat-model')?.value || 'GPT-4o'}</span>\` : ''}
    </div>
    <div class="bubble">
      <p style="margin:0 0 8px;">\${msg.content}</p>
      \${extra}
    </div>
  </div>\`;
}

function renderPivotTable(pd) {
  const fmtCur = v => v ? 'Rp ' + (v/1000000).toFixed(1) + 'M' : '-';
  return \`<div class="pivot-table">
    <table>
      <thead>
        <tr>
          <th></th>
          \${pd.columns.map(c => \`<th>\${c}</th>\`).join('')}
          <th style="color:var(--primary);">Total</th>
        </tr>
      </thead>
      <tbody>
        \${pd.rows.map((row, i) => \`
          <tr>
            <td class="row-header">\${row}</td>
            \${pd.values[i].map(v => \`<td>\${fmtCur(v)}</td>\`).join('')}
            <td class="total-col">\${fmtCur(pd.row_totals[i])}</td>
          </tr>
        \`).join('')}
        <tr class="total-row">
          <td style="text-align:left;font-weight:700;">Grand Total</td>
          \${pd.column_totals.map(v => \`<td>\${fmtCur(v)}</td>\`).join('')}
          <td style="color:var(--primary);font-weight:800;">\${fmtCur(pd.grand_total)}</td>
        </tr>
      </tbody>
    </table>
  </div>\`;
}

function intentIcon(intent) {
  const icons = { QUERY:'🔍', PIVOT:'⊞', CHART:'📊', INSIGHT:'💡', FORECAST:'🔮', ANOMALY:'⚠️', SUMMARY:'📝', COMPARE:'⚖️' };
  return icons[intent] || '⚡';
}

function renderMessages(msgs) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  el.innerHTML = msgs.map(renderMessage).join('');
  el.scrollTop = el.scrollHeight;
  // Render charts in messages
  setTimeout(() => {
    msgs.forEach(msg => {
      if (msg.attachments?.chart) {
        const chartEl = document.getElementById('chart_' + msg.id);
        if (chartEl && !echarts.getInstanceByDom(chartEl)) {
          const chart = echarts.init(chartEl);
          chart.setOption({ ...msg.attachments.chart.option, backgroundColor: 'transparent' });
        }
      }
    });
  }, 300);
}

async function loadSession(sessId) {
  state.currentSession = sessId;
  try {
    const { data } = await API.get('/chat/sessions/' + sessId + '/messages');
    state.messages = data.data;
    renderChat();
  } catch(e) {}
}

function startNewChat() {
  state.currentSession = null;
  state.messages = [];
  renderChat();
}

function toggleDataset(id) {
  if (state.selectedDatasets.includes(id)) {
    state.selectedDatasets = state.selectedDatasets.filter(d => d !== id);
  } else {
    state.selectedDatasets.push(id);
  }
  const subtitle = document.getElementById('chat-subtitle');
  if (subtitle) subtitle.textContent = state.selectedDatasets.length + ' dataset dipilih';
}

function setPrompt(text) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = text; autoGrow(input); }
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

function handleChatKey(e) {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); sendMessage(); }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const content = input?.value?.trim();
  if (!content) return;
  
  input.value = '';
  input.style.height = 'auto';
  
  if (state.selectedDatasets.length === 0) {
    showToast('error', '⚠️ Pilih minimal satu dataset terlebih dahulu!');
    return;
  }
  
  const userMsg = { id: 'u_' + Date.now(), role: 'user', content, created_at: new Date().toISOString() };
  state.messages.push(userMsg);
  
  const msgsEl = document.getElementById('chat-messages');
  if (msgsEl) {
    msgsEl.innerHTML += renderMessage(userMsg);
    // Add typing indicator
    msgsEl.innerHTML += \`<div id="typing-indicator" class="msg-assistant">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:28px;height:28px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:8px;display:flex;align-items:center;justify-content:center;">🤖</div>
        <span style="font-size:13px;font-weight:600;color:var(--primary);">ECAP AI</span>
      </div>
      <div class="bubble" style="display:flex;align-items:center;gap:6px;padding:14px 18px;">
        <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
        <span style="font-size:12px;color:var(--text-muted);margin-left:4px;">Menganalisis dengan \${document.getElementById('chat-model')?.value || 'GPT-4o'}...</span>
      </div>
    </div>\`;
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  
  try {
    const { data } = await API.post('/analytics/query', {
      dataset_ids: state.selectedDatasets,
      question: content,
      model_id: document.getElementById('chat-model')?.value || 'gpt-4o'
    });
    
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
    
    const aiMsg = {
      id: 'a_' + Date.now(),
      role: 'assistant',
      content: data.data.insight || 'Berikut hasil analisis data Anda:',
      intent: 'QUERY+CHART+INSIGHT',
      attachments: {
        sql: data.data.sql,
        data: data.data.result,
        chart: data.data.chart,
        insight: data.data.insight
      },
      created_at: new Date().toISOString()
    };
    state.messages.push(aiMsg);
    
    if (msgsEl) {
      msgsEl.innerHTML += renderMessage(aiMsg);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      // init charts
      setTimeout(() => {
        if (data.data.chart) {
          const chartEl = document.getElementById('chart_' + aiMsg.id);
          if (chartEl) {
            const chart = echarts.init(chartEl);
            chart.setOption({ ...data.data.chart.option, backgroundColor: 'transparent' });
          }
        }
      }, 200);
    }
  } catch(e) {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
    showToast('error', '❌ Gagal memproses permintaan');
  }
}

async function quickAnalytic(type) {
  if (state.selectedDatasets.length === 0) { showToast('error', '⚠️ Pilih dataset terlebih dahulu!'); return; }
  const prompts = {
    chart: 'Buat line chart trend revenue per bulan tahun ini',
    pivot: 'Buat pivot table cabang vs kategori produk',
    forecast: 'Forecast revenue 3 bulan ke depan menggunakan Prophet'
  };
  setPrompt(prompts[type] || '');
  await sendMessage();
}

function exportToExcel(msgId) { showToast('success', '📊 Export Excel dimulai...'); }
function exportToCSV(msgId) { showToast('success', '📋 Export CSV dimulai...'); }
function saveChart(msgId) { showToast('success', '🖼️ Chart disimpan!'); }

// ─── ANALYTICS STUDIO ─────────────────────────────────────────────────────
function renderAnalytics() {
  const el = document.getElementById('view-analytics');
  el.innerHTML = \`
  <div class="tabs">
    <div class="tab active" onclick="switchAnalyticsTab('query', this)">🔍 Query</div>
    <div class="tab" onclick="switchAnalyticsTab('pivot', this)">⊞ Pivot Table</div>
    <div class="tab" onclick="switchAnalyticsTab('chart', this)">📊 Chart Builder</div>
    <div class="tab" onclick="switchAnalyticsTab('forecast', this)">🔮 Forecast</div>
    <div class="tab" onclick="switchAnalyticsTab('anomaly', this)">⚠️ Anomaly</div>
  </div>
  <div id="analytics-content"></div>
  \`;
  switchAnalyticsTab('query');
}

function switchAnalyticsTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  
  const content = document.getElementById('analytics-content');
  const dsOptions = state.datasets.filter(d => d.status === 'ready').map(d => \`<option value="\${d.id}">\${d.name}</option>\`).join('');
  
  if (tab === 'query') {
    content.innerHTML = \`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="card" style="padding:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:16px;">Pertanyaan Natural Language</div>
        <select class="select" style="margin-bottom:12px;" id="query-ds">\${dsOptions}</select>
        <textarea id="query-question" class="input" style="height:100px;resize:vertical;" placeholder="Contoh: Tampilkan top 10 produk berdasarkan revenue bulan Januari..."></textarea>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <select id="query-model" class="select" style="flex:1;">
            <option>GPT-4o</option><option>Gemini 2.5 Pro</option><option>Claude Opus 4.5</option>
          </select>
          <button class="btn btn-primary" onclick="runQuery()"><i class="fas fa-play"></i> Jalankan</button>
        </div>
      </div>
      <div class="card" style="padding:20px;" id="query-result-panel">
        <div style="color:var(--text-muted);text-align:center;padding:40px 0;">
          <div style="font-size:32px;margin-bottom:8px;">🔍</div>
          Hasil query akan tampil di sini
        </div>
      </div>
    </div>
    <div id="query-chart-area"></div>
    \`;
  } else if (tab === 'pivot') {
    content.innerHTML = \`
    <div class="card" style="padding:20px;margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:16px;">⊞ Konfigurasi Pivot Table</div>
      <div class="grid-4">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">DATASET</label>
          <select class="select" id="pivot-ds">\${dsOptions}</select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">BARIS (Rows)</label>
          <input class="input" id="pivot-rows" value="cabang" placeholder="cabang, region...">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">KOLOM (Columns)</label>
          <input class="input" id="pivot-cols" value="kategori" placeholder="bulan, kategori...">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">VALUES + AGREGASI</label>
          <div style="display:flex;gap:6px;">
            <input class="input" id="pivot-vals" value="revenue" style="flex:1;" placeholder="revenue...">
            <select class="select" id="pivot-agg" style="width:80px;">
              <option>SUM</option><option>AVG</option><option>COUNT</option><option>MAX</option><option>MIN</option>
            </select>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="runPivot()">
        <i class="fas fa-table"></i> Generate Pivot Table
      </button>
    </div>
    <div id="pivot-result"></div>
    \`;
  } else if (tab === 'chart') {
    content.innerHTML = \`
    <div style="display:grid;grid-template-columns:320px 1fr;gap:20px;">
      <div class="card" style="padding:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:16px;">Chart Configuration</div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">DATASET</label>
          <select class="select">\${dsOptions}</select>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">JENIS CHART</label>
          <select class="select" id="chart-type">
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="area">Area Chart</option>
            <option value="heatmap">Heatmap</option>
            <option value="funnel">Funnel Chart</option>
            <option value="radar">Radar Chart</option>
          </select>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">PERTANYAAN / DESKRIPSI</label>
          <textarea id="chart-question" class="input" style="height:80px;" placeholder="Buat chart trend revenue per bulan..."></textarea>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="runChart()">
          <i class="fas fa-chart-bar"></i> Generate Chart
        </button>
      </div>
      <div class="card" style="padding:20px;">
        <div id="chart-output" style="height:350px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
          <div style="text-align:center;"><div style="font-size:48px;margin-bottom:8px;">📊</div><div>Chart akan tampil di sini</div></div>
        </div>
        <div id="chart-export-btns" style="display:none;margin-top:12px;gap:8px;display:flex;">
          <button class="btn btn-outline btn-sm" onclick="showToast('success','Export PNG dimulai...')"><i class="fas fa-image"></i> Export PNG</button>
          <button class="btn btn-outline btn-sm" onclick="showToast('success','Export SVG dimulai...')"><i class="fas fa-vector-square"></i> Export SVG</button>
          <button class="btn btn-outline btn-sm" onclick="showToast('success','Disimpan ke dashboard!')"><i class="fas fa-tachometer-alt"></i> Save to Dashboard</button>
        </div>
      </div>
    </div>
    \`;
  } else if (tab === 'forecast') {
    content.innerHTML = \`
    <div style="display:grid;grid-template-columns:320px 1fr;gap:20px;">
      <div class="card" style="padding:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:16px;">🔮 Forecast Config</div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">DATASET</label>
          <select class="select">\${dsOptions}</select>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">KOLOM METRIK</label>
          <input class="input" value="revenue" placeholder="revenue, quantity...">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">KOLOM TANGGAL</label>
          <input class="input" value="tanggal" placeholder="tanggal, date...">
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">PERIODE FORECAST</label>
          <div style="display:flex;gap:8px;">
            <input class="input" type="number" value="3" style="width:80px;" id="fc-periods">
            <select class="select" id="fc-unit"><option>Bulan</option><option>Minggu</option><option>Hari</option></select>
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">METODE</label>
          <select class="select">
            <option>Auto (Rekomendasi AI)</option>
            <option>Prophet (Facebook)</option>
            <option>Linear Regression</option>
            <option>Holt-Winters</option>
            <option>ARIMA</option>
          </select>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="runForecast()">
          <i class="fas fa-chart-line"></i> Jalankan Forecast
        </button>
      </div>
      <div class="card" style="padding:20px;">
        <div id="forecast-output" style="height:350px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
          <div style="text-align:center;"><div style="font-size:48px;margin-bottom:8px;">🔮</div><div>Hasil forecast akan tampil di sini</div></div>
        </div>
        <div id="forecast-metrics" style="display:none;margin-top:12px;"></div>
      </div>
    </div>
    \`;
  } else if (tab === 'anomaly') {
    content.innerHTML = \`
    <div class="card" style="padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;">⚠️ Anomaly Detection</div>
        <button class="btn btn-primary btn-sm" onclick="showToast('success','Menjalankan deteksi anomali...')">
          <i class="fas fa-search"></i> Deteksi Anomali
        </button>
      </div>
      <div class="grid-3">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">DATASET</label>
          <select class="select">\${dsOptions}</select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">KOLOM METRIK</label>
          <input class="input" value="revenue" placeholder="revenue...">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">SENSITIVITAS</label>
          <select class="select">
            <option>Medium (Rekomendasi)</option>
            <option>Low (Hanya Ekstrem)</option>
            <option>High (Semua Outlier)</option>
          </select>
        </div>
      </div>
    </div>
    <div class="card" style="padding:20px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--danger);">⚠️ 3 Anomali Terdeteksi</div>
      \${[
        { date: '2026-03-15', value: '12.5M', expected: '0.8M - 2.4M', severity: 'high', desc: 'Revenue 520% di atas batas normal — kemungkinan bulk order atau kesalahan input' },
        { date: '2026-02-08', value: '25K', expected: '350K - 600K', severity: 'medium', desc: 'Revenue sangat rendah di tengah bulan — perlu investigasi' },
        { date: '2026-01-22', value: '8.9M', expected: '1.2M - 2.8M', severity: 'high', desc: 'Revenue spike — konfirmasi dengan tim sales apakah ada event khusus' },
      ].map(a => \`
        <div style="display:flex;gap:16px;padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:10px;border-left:3px solid \${a.severity === 'high' ? 'var(--danger)' : 'var(--warning)'};">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-weight:700;font-size:14px;">Rp \${a.value}</span>
              <span style="font-size:12px;color:var(--text-muted);">pada \${a.date}</span>
              <span class="badge \${a.severity === 'high' ? 'badge-danger' : 'badge-warning'}">\${a.severity.toUpperCase()}</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Range normal: Rp \${a.expected}</div>
            <div style="font-size:13px;">\${a.desc}</div>
          </div>
        </div>
      \`).join('')}
    </div>
    \`;
  }
}

async function runQuery() {
  const question = document.getElementById('query-question').value.trim();
  if (!question) { showToast('error', 'Masukkan pertanyaan terlebih dahulu'); return; }
  const panel = document.getElementById('query-result-panel');
  panel.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div><div style="margin-top:8px;color:var(--text-muted);">Memproses...</div></div>';
  try {
    const { data } = await API.post('/analytics/query', { dataset_ids: [document.getElementById('query-ds').value], question });
    const d = data.data;
    panel.innerHTML = \`
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Hasil Query (\${d.result.row_count} baris, \${d.result.execution_ms}ms)</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr>\${d.result.columns.map(c => \`<th style="padding:8px;background:var(--bg-dark);border:1px solid var(--border);">\${c}</th>\`).join('')}</tr></thead>
          <tbody>\${d.result.rows.map(row => \`<tr>\${row.map(v => \`<td style="padding:7px 8px;border:1px solid var(--border);">\${typeof v === 'number' ? v.toLocaleString() : v}</td>\`).join('')}</tr>\`).join('')}</tbody>
        </table>
      </div>
      <div style="margin-top:12px;padding:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:13px;">
        💡 \${d.insight}
      </div>
    \`;
    // Chart
    const chartArea = document.getElementById('query-chart-area');
    if (chartArea && d.chart) {
      chartArea.innerHTML = '<div class="card" style="padding:20px;margin-top:16px;"><div id="query-chart" style="height:300px;"></div></div>';
      setTimeout(() => {
        const chart = echarts.init(document.getElementById('query-chart'));
        chart.setOption({ ...d.chart.option, backgroundColor: 'transparent' });
      }, 100);
    }
  } catch(e) { panel.innerHTML = '<div style="color:var(--danger);padding:20px;">Error: ' + e.message + '</div>'; }
}

async function runPivot() {
  const panel = document.getElementById('pivot-result');
  panel.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div><div style="margin-top:8px;color:var(--text-muted);">Membuat pivot table...</div></div>';
  try {
    const { data } = await API.post('/analytics/pivot', {
      dataset_id: document.getElementById('pivot-ds').value,
      rows: [document.getElementById('pivot-rows').value],
      columns: [document.getElementById('pivot-cols').value],
      values: [document.getElementById('pivot-vals').value],
      aggregation: document.getElementById('pivot-agg').value.toLowerCase()
    });
    const pd = data.data.pivot_data;
    panel.innerHTML = \`<div class="card" style="padding:20px;">\${renderPivotTable(pd)}</div>\`;
  } catch(e) { panel.innerHTML = '<div style="color:var(--danger);">Error</div>'; }
}

async function runChart() {
  const question = document.getElementById('chart-question').value.trim();
  const chartType = document.getElementById('chart-type').value;
  const output = document.getElementById('chart-output');
  output.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';
  try {
    const { data } = await API.post('/analytics/chart', { question: question || 'Trend revenue per bulan', chart_type_hint: chartType });
    const d = data.data;
    output.innerHTML = '';
    const chart = echarts.init(output);
    chart.setOption({ ...d.echarts_option, backgroundColor: 'transparent' });
    document.getElementById('chart-export-btns').style.display = 'flex';
  } catch(e) { output.innerHTML = '<div style="color:var(--danger);">Error</div>'; }
}

async function runForecast() {
  const output = document.getElementById('forecast-output');
  output.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';
  try {
    const { data } = await API.post('/analytics/forecast', { dataset_id: 'ds1', metric_column: 'revenue', date_column: 'tanggal', periods: parseInt(document.getElementById('fc-periods').value) || 3, period_unit: 'month', method: 'auto' });
    const d = data.data;
    output.innerHTML = '';
    const chart = echarts.init(output);
    chart.setOption({ ...d.chart.option, backgroundColor: 'transparent' });
    document.getElementById('forecast-metrics').style.display = 'block';
    document.getElementById('forecast-metrics').innerHTML = \`
      <div class="grid-3">
        <div class="stat-card" style="padding:14px;">
          <div class="stat-label">Metode</div><div style="font-size:18px;font-weight:700;">\${d.method_used.toUpperCase()}</div>
        </div>
        <div class="stat-card" style="padding:14px;">
          <div class="stat-label">MAPE Accuracy</div><div style="font-size:18px;font-weight:700;color:var(--success);">\${d.accuracy_metrics.mape}%</div>
        </div>
        <div class="stat-card" style="padding:14px;">
          <div class="stat-label">Forecast Juli 2026</div><div style="font-size:18px;font-weight:700;">Rp 6.5M</div>
        </div>
      </div>
    \`;
  } catch(e) { output.innerHTML = '<div style="color:var(--danger);">Error</div>'; }
}

// ─── DATASETS ─────────────────────────────────────────────────────────────
function renderDatasets() {
  const el = document.getElementById('view-datasets');
  el.innerHTML = \`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div>
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">Dataset Manager</h2>
      <p style="margin:0;color:var(--text-muted);font-size:14px;">\${state.datasets.length} dataset · \${state.datasets.filter(d => d.status === 'ready').length} siap digunakan</p>
    </div>
    <div style="display:flex;gap:8px;">
      <input class="input" placeholder="🔍 Cari dataset..." style="width:220px;" oninput="filterDatasets(this.value)">
      <button class="btn btn-primary" onclick="openUploadModal()"><i class="fas fa-plus"></i> Upload Dataset</button>
    </div>
  </div>
  
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;" id="datasets-grid">
    \${state.datasets.map(ds => \`
      <div class="dataset-card" onclick="openDatasetDetail('\${ds.id}')">
        <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:28px;">\${ds.file_type === 'xlsx' ? '📊' : ds.file_type === 'csv' ? '📋' : ds.file_type === 'parquet' ? '🗜️' : '📄'}</div>
            <div>
              <div style="font-size:14px;font-weight:700;">\${ds.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">\${ds.file_type.toUpperCase()} · \${formatBytes(ds.file_size_bytes)}</div>
            </div>
          </div>
          <span class="badge \${ds.status === 'ready' ? 'badge-success' : ds.status === 'processing' ? 'badge-warning' : 'badge-danger'}">\${ds.status}</span>
        </div>
        
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">\${ds.description || 'Tidak ada deskripsi'}</div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="text-align:center;padding:8px;background:var(--bg-dark);border-radius:6px;">
            <div style="font-weight:700;font-size:14px;">\${(ds.row_count||0).toLocaleString()}</div>
            <div style="font-size:11px;color:var(--text-muted);">Baris</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-dark);border-radius:6px;">
            <div style="font-weight:700;font-size:14px;">\${ds.column_count || 0}</div>
            <div style="font-size:11px;color:var(--text-muted);">Kolom</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-dark);border-radius:6px;">
            <span class="badge badge-info" style="font-size:10px;">\${ds.classification}</span>
            <div style="font-size:11px;color:var(--text-muted);">Klasifikasi</div>
          </div>
        </div>
        
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;">
          \${(ds.tags||[]).map(t => \`<span style="background:rgba(99,102,241,0.15);color:var(--primary);padding:2px 8px;border-radius:10px;font-size:11px;">#\${t}</span>\`).join('')}
        </div>
        
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();analyzeDataset('\${ds.id}')">
            <i class="fas fa-comments"></i> Analisis
          </button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();previewDataset('\${ds.id}')">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteDataset('\${ds.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    \`).join('')}
  </div>
  \`;
}

function filterDatasets(q) {
  const cards = document.querySelectorAll('.dataset-card');
  const query = q.toLowerCase();
  cards.forEach((card, i) => {
    const ds = state.datasets[i];
    const match = !query || ds.name.toLowerCase().includes(query) || (ds.tags||[]).some(t => t.includes(query));
    card.style.display = match ? 'block' : 'none';
  });
}

function analyzeDataset(id) {
  state.selectedDatasets = [id];
  navigate('chat');
  setTimeout(() => {
    const ds = state.datasets.find(d => d.id === id);
    if (ds) showToast('success', \`✅ Dataset "\${ds.name}" dipilih untuk analisis\`);
  }, 300);
}

async function previewDataset(id) {
  try {
    const { data } = await API.get('/datasets/' + id + '/preview');
    const d = data.data;
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = \`
      <div class="modal" style="width:700px;max-width:calc(100vw-48px);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;">Data Preview (5 baris)</h3>
          <button class="btn-icon btn-outline" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr>\${d.columns.map(c => \`<th style="padding:8px;background:var(--bg-dark);border:1px solid var(--border);white-space:nowrap;">\${c}</th>\`).join('')}</tr></thead>
            <tbody>\${d.rows.map(row => \`<tr>\${row.map(v => \`<td style="padding:7px 8px;border:1px solid var(--border);white-space:nowrap;">\${v}</td>\`).join('')}</tr>\`).join('')}</tbody>
          </table>
        </div>
      </div>\`;
    document.body.appendChild(modalOverlay);
    modalOverlay.onclick = e => { if (e.target === modalOverlay) modalOverlay.remove(); };
  } catch(e) { showToast('error', 'Gagal memuat preview'); }
}

function deleteDataset(id) {
  if (!confirm('Hapus dataset ini?')) return;
  state.datasets = state.datasets.filter(d => d.id !== id);
  renderDatasets();
  showToast('success', '✅ Dataset dihapus');
}

function openDatasetDetail(id) { previewDataset(id); }

// ─── AI RUNTIME ────────────────────────────────────────────────────────────
function renderAIRuntime() {
  const el = document.getElementById('view-ai-runtime');
  const totalCalls = state.providers.reduce((s, p) => s + p.usage_today.calls, 0);
  const totalCost = state.providers.reduce((s, p) => s + p.usage_today.cost_usd, 0);
  
  el.innerHTML = \`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div>
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">AI Runtime Manager</h2>
      <p style="margin:0;color:var(--text-muted);font-size:14px;">Kelola provider LLM, ganti model, pantau biaya</p>
    </div>
    <button class="btn btn-primary" onclick="document.getElementById('provider-modal').style.display='flex'">
      <i class="fas fa-plus"></i> Tambah Provider
    </button>
  </div>
  
  <div class="grid-4" style="margin-bottom:24px;">
    <div class="stat-card">
      <div class="stat-label">Total Provider</div>
      <div class="stat-value">\${state.providers.length}</div>
      <div class="stat-change up">\${state.providers.filter(p => p.is_enabled).length} aktif</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">AI Calls Hari Ini</div>
      <div class="stat-value">\${totalCalls}</div>
      <div class="stat-change up">↑ 23% vs kemarin</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Biaya Hari Ini</div>
      <div class="stat-value">$\${totalCost.toFixed(2)}</div>
      <div class="stat-change up">Budget: $10.00/hari</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Model Digunakan</div>
      <div class="stat-value">9</div>
      <div class="stat-change up">Across all providers</div>
    </div>
  </div>
  
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;margin-bottom:24px;">
    \${state.providers.map(p => \`
      <div class="provider-card \${p.is_enabled ? 'active' : 'inactive'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;">\${providerIcon(p.provider_type)}</div>
            <div>
              <div style="font-size:14px;font-weight:700;">\${p.name}</div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="badge \${p.health_status === 'healthy' ? 'badge-success' : p.health_status === 'degraded' ? 'badge-warning' : 'badge-danger'}">\${p.health_status}</span>
                \${p.is_default ? '<span class="badge badge-primary">DEFAULT</span>' : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <div class="toggle \${p.is_enabled ? 'on' : 'off'}" onclick="toggleProvider('\${p.id}',\${!p.is_enabled})" style="width:36px;height:20px;background:\${p.is_enabled ? 'var(--success)' : 'var(--border)'};border-radius:10px;position:relative;cursor:pointer;transition:all 0.2s;">
                <div style="position:absolute;top:2px;\${p.is_enabled ? 'right:2px' : 'left:2px'};width:16px;height:16px;background:white;border-radius:50%;transition:all 0.2s;"></div>
              </div>
            </label>
          </div>
        </div>
        
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">Models Tersedia</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            \${p.models.map(m => \`<span style="background:var(--bg-dark);border:1px solid var(--border);padding:3px 8px;border-radius:6px;font-size:11px;">\${m.display_name}</span>\`).join('')}
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;font-size:12px;">
          <div style="text-align:center;padding:8px;background:var(--bg-dark);border-radius:6px;">
            <div style="font-weight:700;">\${p.usage_today.calls}</div>
            <div style="color:var(--text-muted);">Calls</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-dark);border-radius:6px;">
            <div style="font-weight:700;">\${(p.usage_today.tokens/1000).toFixed(0)}K</div>
            <div style="color:var(--text-muted);">Tokens</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-dark);border-radius:6px;">
            <div style="font-weight:700;">$\${p.usage_today.cost_usd.toFixed(2)}</div>
            <div style="color:var(--text-muted);">Biaya</div>
          </div>
        </div>
        
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="healthCheck('\${p.id}')"><i class="fas fa-heartbeat"></i> Health Check</button>
          \${!p.is_default ? \`<button class="btn btn-outline btn-sm" onclick="setDefault('\${p.id}')"><i class="fas fa-star"></i> Set Default</button>\` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteProvider('\${p.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    \`).join('')}
  </div>
  
  <!-- Cost Chart -->
  <div class="card" style="padding:20px;">
    <div style="font-size:15px;font-weight:700;margin-bottom:16px;">📊 AI Cost Trend (7 Hari)</div>
    <div id="cost-chart" style="height:250px;"></div>
  </div>
  \`;
  
  setTimeout(() => {
    const chart = echarts.init(document.getElementById('cost-chart'));
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['GPT-4o', 'GPT-4o Mini', 'Gemini 2.5 Pro'], textStyle: { color: '#94a3b8' } },
      xAxis: { type: 'category', data: ['Jun 13', 'Jun 14', 'Jun 15', 'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19'], axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', name: 'Cost ($)', axisLabel: { color: '#94a3b8' } },
      series: [
        { name: 'GPT-4o', type: 'bar', stack: 'total', data: [3.2, 4.1, 3.8, 2.9, 5.1, 4.7, 4.2], itemStyle: { color: '#6366f1' } },
        { name: 'GPT-4o Mini', type: 'bar', stack: 'total', data: [0.8, 1.2, 1.4, 1.1, 2.1, 1.8, 1.5], itemStyle: { color: '#8b5cf6' } },
        { name: 'Gemini 2.5 Pro', type: 'bar', stack: 'total', data: [1.2, 1.5, 2.2, 2.1, 1.7, 2.1, 1.8], itemStyle: { color: '#06b6d4' } },
      ],
      grid: { left: 50, right: 10, top: 40, bottom: 30 },
      backgroundColor: 'transparent'
    });
  }, 100);
}

function providerIcon(type) {
  const icons = { openai:'🟢', gemini:'🔵', claude:'🟠', ollama:'🖥️', azure_openai:'☁️', openrouter:'🔀', deepseek:'🐋', custom:'⚙️' };
  return icons[type] || '🤖';
}

async function toggleProvider(id, enabled) {
  const p = state.providers.find(p => p.id === id);
  if (p) { p.is_enabled = enabled; renderAIRuntime(); showToast('success', enabled ? '✅ Provider diaktifkan' : '⏸️ Provider dinonaktifkan'); }
}

function setDefault(id) {
  state.providers.forEach(p => p.is_default = p.id === id);
  renderAIRuntime();
  showToast('success', '⭐ Default provider diubah');
}

async function healthCheck(id) {
  showToast('success', '🔍 Memeriksa kesehatan provider...');
  try {
    await API.post('/ai-runtime/providers/' + id + '/health-check');
    showToast('success', '✅ Provider sehat! Latensi: 234ms');
  } catch(e) {}
}

function deleteProvider(id) {
  if (!confirm('Hapus provider ini?')) return;
  state.providers = state.providers.filter(p => p.id !== id);
  renderAIRuntime();
  showToast('success', 'Provider dihapus');
}

function updateProviderForm() {
  const type = document.getElementById('new-provider-type').value;
  const baseUrlField = document.getElementById('base-url-field');
  const apiKeyField = document.getElementById('api-key-field');
  if (type === 'ollama') {
    baseUrlField.style.display = 'block';
    apiKeyField.style.display = 'none';
    document.getElementById('new-provider-url').placeholder = 'http://ollama-host:11434';
  } else {
    baseUrlField.style.display = 'none';
    apiKeyField.style.display = 'block';
  }
}

async function addProvider() {
  const name = document.getElementById('new-provider-name').value.trim();
  const type = document.getElementById('new-provider-type').value;
  if (!name) { showToast('error', 'Nama provider wajib diisi'); return; }
  try {
    const { data } = await API.post('/ai-runtime/providers', {
      name, provider_type: type,
      api_key: document.getElementById('new-provider-key').value,
      base_url: document.getElementById('new-provider-url').value,
      config: { default_model: document.getElementById('new-provider-model').value }
    });
    state.providers.push({ ...data.data, usage_today: { calls: 0, tokens: 0, cost_usd: 0 }, models: [] });
    closeModal('provider-modal');
    renderAIRuntime();
    showToast('success', '✅ Provider berhasil ditambahkan!');
  } catch(e) { showToast('error', 'Gagal menambahkan provider'); }
}

// ─── REPORTS ───────────────────────────────────────────────────────────────
function renderReports() {
  const el = document.getElementById('view-reports');
  el.innerHTML = \`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div>
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">Reports & Export</h2>
      <p style="margin:0;color:var(--text-muted);font-size:14px;">Generate laporan executive, data report, export Excel/PDF/PPTX</p>
    </div>
    <button class="btn btn-primary" onclick="openGenerateReport()"><i class="fas fa-plus"></i> Generate Report</button>
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:20px;">
    <div class="card" style="padding:20px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:16px;">🚀 Quick Generate</div>
      \${[
        { icon:'📊', title:'Executive Summary', desc:'Ringkasan eksekutif dengan KPI & rekomendasi', format:'PDF' },
        { icon:'📈', title:'Data Report Detail', desc:'Laporan lengkap dengan tabel, chart, pivot', format:'Excel' },
        { icon:'📑', title:'Presentation Deck', desc:'Slide presentasi siap pakai untuk meeting', format:'PPTX' },
        { icon:'📋', title:'Raw Data Export', desc:'Export seluruh data dalam format yang dipilih', format:'CSV' },
      ].map(r => \`
        <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;" 
             onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'"
             onclick="generateReport('\${r.title}','\${r.format}')">
          <div style="font-size:24px;">\${r.icon}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">\${r.title}</div>
            <div style="font-size:12px;color:var(--text-muted);">\${r.desc}</div>
          </div>
          <span class="badge badge-info">\${r.format}</span>
        </div>
      \`).join('')}
    </div>
    
    <div class="card" style="padding:20px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:16px;">📁 Report Terbaru</div>
      \${[
        { title:'Executive Summary Juni 2026', type:'executive_summary', format:'pdf', status:'ready', size:'2 MB', date:'Jun 15' },
        { title:'Sales Analysis Q1 2026', type:'data_report', format:'xlsx', status:'ready', size:'1 MB', date:'Jun 10' },
        { title:'Customer Deck Q2', type:'dashboard_export', format:'pptx', status:'processing', size:'—', date:'Jun 19' },
        { title:'Revenue Data Export', type:'data_report', format:'csv', status:'ready', size:'500 KB', date:'Jun 8' },
      ].map(r => \`
        <div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border);">
          <div style="font-size:22px;">\${r.format === 'pdf' ? '📕' : r.format === 'xlsx' ? '📗' : r.format === 'pptx' ? '📘' : '📄'}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">\${r.title}</div>
            <div style="font-size:11px;color:var(--text-muted);">\${r.format.toUpperCase()} · \${r.size} · \${r.date}</div>
          </div>
          <span class="badge \${r.status === 'ready' ? 'badge-success' : 'badge-warning'}">\${r.status}</span>
          \${r.status === 'ready' ? \`<button class="btn btn-outline btn-sm" onclick="showToast('success','Download dimulai...')"><i class="fas fa-download"></i></button>\` : '<div class="spinner"></div>'}
        </div>
      \`).join('')}
    </div>
  </div>
  \`;
}

async function generateReport(title, format) {
  showToast('success', \`⏳ Generating \${title} (\${format})...\`);
  try {
    await API.post('/reports/generate', { title, report_type: 'executive_summary', format: format.toLowerCase(), dataset_ids: state.selectedDatasets.length > 0 ? state.selectedDatasets : ['ds1'] });
    setTimeout(() => showToast('success', \`✅ \${title} selesai! Siap download.\`), 2500);
  } catch(e) {}
}

// ─── KNOWLEDGE BASE ─────────────────────────────────────────────────────────
function renderKnowledge() {
  const el = document.getElementById('view-knowledge');
  el.innerHTML = \`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div>
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;">Knowledge Base</h2>
      <p style="margin:0;color:var(--text-muted);font-size:14px;">Upload dokumen PDF/DOCX, AI akan belajar dari kontennya via RAG</p>
    </div>
    <button class="btn btn-primary" onclick="showToast('success','Fitur upload dokumen tersedia di versi full!')"><i class="fas fa-upload"></i> Upload Dokumen</button>
  </div>
  
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
    <div>
      <div class="card" style="padding:20px;margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:16px;">🔍 Cari di Knowledge Base</div>
        <div style="display:flex;gap:8px;">
          <input class="input" id="kb-query" placeholder="Contoh: prosedur approval pembelian di atas 50 juta..." style="flex:1;">
          <button class="btn btn-primary" onclick="searchKnowledge()"><i class="fas fa-search"></i> Cari</button>
        </div>
        <div id="kb-results" style="margin-top:16px;"></div>
      </div>
    </div>
    
    <div class="card" style="padding:20px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:16px;">📚 Dokumen Tersimpan</div>
      \${[
        { title:'SOP Pengadaan 2026', type:'pdf', chunks:145, date:'Jun 1' },
        { title:'Kebijakan Harga Transfer', type:'pdf', chunks:89, date:'May 28' },
        { title:'Annual Report 2025', type:'docx', chunks:312, date:'May 15' },
        { title:'Data Dictionary v3', type:'pdf', chunks:67, date:'May 10' },
      ].map(d => \`
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:20px;">\${d.type === 'pdf' ? '📕' : '📘'}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:500;">\${d.title}</div>
            <div style="font-size:11px;color:var(--text-muted);">\${d.chunks} chunk · \${d.date}</div>
          </div>
          <span class="badge badge-success">Ready</span>
        </div>
      \`).join('')}
    </div>
  </div>
  \`;
}

async function searchKnowledge() {
  const query = document.getElementById('kb-query').value.trim();
  if (!query) return;
  const results = document.getElementById('kb-results');
  results.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';
  await new Promise(r => setTimeout(r, 800));
  results.innerHTML = \`
    <div style="font-size:13px;font-weight:600;margin-bottom:10px;">3 hasil ditemukan untuk "\${query}"</div>
    \${[
      { doc:'SOP Pengadaan 2026', page:12, sim:0.92, text:'Pembelian di atas Rp 50 juta wajib mendapat persetujuan dari minimal 2 (dua) level manajemen di atas requestor, dengan dokumentasi lengkap berupa Purchase Requisition (PR) yang telah disetujui oleh Kepala Divisi terkait...' },
      { doc:'Kebijakan Harga Transfer', page:8, sim:0.85, text:'Transaksi antar unit bisnis di atas Rp 50 juta harus menggunakan harga transfer yang telah disetujui oleh Finance Director dan didokumentasikan dalam Transfer Pricing Agreement...' },
      { doc:'Annual Report 2025', page:45, sim:0.71, text:'Komite Audit memastikan bahwa seluruh pengeluaran di atas threshold yang ditetapkan telah melalui prosedur approval yang sesuai dengan kebijakan perusahaan...' },
    ].map(r => \`
      <div style="padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;border-left:3px solid var(--primary);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;color:var(--primary);">\${r.doc}</span>
          <div style="display:flex;gap:6px;">
            <span class="badge badge-info">hal. \${r.page}</span>
            <span class="badge badge-success">\${(r.sim*100).toFixed(0)}% relevan</span>
          </div>
        </div>
        <p style="font-size:13px;margin:0;line-height:1.6;color:var(--text);">\${r.text}</p>
      </div>
    \`).join('')}
  \`;
}

// ─── ADMIN ─────────────────────────────────────────────────────────────────
function renderAdmin() {
  const el = document.getElementById('view-admin');
  el.innerHTML = \`
  <div class="tabs">
    <div class="tab active" onclick="switchAdminTab('users', this)">👥 Users</div>
    <div class="tab" onclick="switchAdminTab('audit', this)">🔍 Audit Log</div>
    <div class="tab" onclick="switchAdminTab('system', this)">⚡ System Health</div>
  </div>
  <div id="admin-content"></div>
  \`;
  switchAdminTab('users');
}

function switchAdminTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  const content = document.getElementById('admin-content');
  
  if (tab === 'users') {
    content.innerHTML = \`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;">User Management</div>
      <button class="btn btn-primary btn-sm" onclick="showToast('success','Form tambah user terbuka!')"><i class="fas fa-plus"></i> Tambah User</button>
    </div>
    <div class="card" style="overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--bg-dark);">
          <th style="padding:12px 16px;text-align:left;color:var(--text-muted);">User</th>
          <th style="padding:12px 16px;text-align:left;color:var(--text-muted);">Role</th>
          <th style="padding:12px 16px;text-align:left;color:var(--text-muted);">Status</th>
          <th style="padding:12px 16px;text-align:left;color:var(--text-muted);">Last Login</th>
          <th style="padding:12px 16px;text-align:left;color:var(--text-muted);">Aksi</th>
        </tr></thead>
        <tbody>
          \${[
            { name:'Budi Santoso', email:'budi@demo.com', role:'analyst', status:'active', lastLogin:'10 menit lalu' },
            { name:'Siti Rahayu', email:'siti@demo.com', role:'data_admin', status:'active', lastLogin:'2 jam lalu' },
            { name:'Ahmad Fauzi', email:'ahmad@demo.com', role:'executive', status:'active', lastLogin:'Kemarin' },
            { name:'Dewi Kartika', email:'dewi@demo.com', role:'data_scientist', status:'inactive', lastLogin:'3 hari lalu' },
            { name:'Riko Pradana', email:'riko@demo.com', role:'auditor', status:'active', lastLogin:'5 hari lalu' },
          ].map(u => \`
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px 16px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;">\${u.name[0]}</div>
                  <div><div style="font-weight:600;">\${u.name}</div><div style="font-size:11px;color:var(--text-muted);">\${u.email}</div></div>
                </div>
              </td>
              <td style="padding:12px 16px;"><span class="badge badge-primary">\${u.role}</span></td>
              <td style="padding:12px 16px;"><span class="badge \${u.status === 'active' ? 'badge-success' : 'badge-danger'}">\${u.status}</span></td>
              <td style="padding:12px 16px;font-size:12px;color:var(--text-muted);">\${u.lastLogin}</td>
              <td style="padding:12px 16px;">
                <button class="btn btn-outline btn-sm" onclick="showToast('success','Edit user \${u.name}')">Edit</button>
              </td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </div>\`;
  } else if (tab === 'audit') {
    content.innerHTML = \`
    <div class="card" style="overflow:hidden;">
      <div style="padding:16px;border-bottom:1px solid var(--border);">
        <div style="display:flex;gap:8px;">
          <input class="input" placeholder="Cari aksi..." style="flex:1;">
          <select class="select" style="width:180px;">
            <option>Semua Aksi</option>
            <option>dataset.*</option>
            <option>chat.*</option>
            <option>auth.*</option>
          </select>
          <input type="date" class="input" style="width:150px;">
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--bg-dark);">
          <th style="padding:10px 16px;text-align:left;color:var(--text-muted);">Waktu</th>
          <th style="padding:10px 16px;text-align:left;color:var(--text-muted);">User</th>
          <th style="padding:10px 16px;text-align:left;color:var(--text-muted);">Aksi</th>
          <th style="padding:10px 16px;text-align:left;color:var(--text-muted);">Resource</th>
          <th style="padding:10px 16px;text-align:left;color:var(--text-muted);">Status</th>
        </tr></thead>
        <tbody>
          \${[
            { time:'10:42:15', user:'Budi Santoso', action:'chat.message_send', resource:'Session: Analisis Q1', status:'success' },
            { time:'10:38:02', user:'Siti Rahayu', action:'dataset.upload', resource:'Sales Q2 2026.xlsx', status:'success' },
            { time:'09:55:44', user:'Ahmad Fauzi', action:'report.generate', resource:'Executive Summary', status:'success' },
            { time:'09:30:11', user:'Dewi Kartika', action:'ai_provider.toggle', resource:'Claude Opus', status:'success' },
            { time:'09:15:03', user:'Riko Pradana', action:'auth.login_failed', resource:'riko@demo.com', status:'failure' },
          ].map(l => \`
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:10px 16px;font-size:12px;color:var(--text-muted);font-family:monospace;">\${l.time}</td>
              <td style="padding:10px 16px;font-size:13px;">\${l.user}</td>
              <td style="padding:10px 16px;"><code style="background:var(--bg-dark);padding:2px 6px;border-radius:4px;font-size:12px;">\${l.action}</code></td>
              <td style="padding:10px 16px;font-size:12px;color:var(--text-muted);">\${l.resource}</td>
              <td style="padding:10px 16px;"><span class="badge \${l.status === 'success' ? 'badge-success' : 'badge-danger'}">\${l.status}</span></td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    </div>\`;
  } else if (tab === 'system') {
    content.innerHTML = \`
    <div class="grid-4" style="margin-bottom:20px;">
      \${[
        { name:'API Server', status:'healthy', uptime:'99.98%', icon:'🖥️' },
        { name:'Database', status:'healthy', uptime:'99.99%', icon:'🗄️' },
        { name:'Redis Cache', status:'healthy', uptime:'100%', icon:'⚡' },
        { name:'AI Gateway', status:'healthy', uptime:'99.95%', icon:'🤖' },
      ].map(s => \`
        <div class="stat-card">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div>
              <div class="stat-label">\${s.name}</div>
              <div class="stat-value" style="font-size:20px;margin:4px 0;">\${s.uptime}</div>
              <span class="badge badge-success">\${s.status}</span>
            </div>
            <div style="font-size:28px;">\${s.icon}</div>
          </div>
        </div>
      \`).join('')}
    </div>
    <div class="card" style="padding:20px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:16px;">ECAP Platform Info</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
        <div><span style="color:var(--text-muted);">Version:</span> <strong>3.0.0</strong></div>
        <div><span style="color:var(--text-muted);">Environment:</span> <strong>Production</strong></div>
        <div><span style="color:var(--text-muted);">Database:</span> <strong>PostgreSQL 16 + pgvector</strong></div>
        <div><span style="color:var(--text-muted);">Cache:</span> <strong>Redis 7.2</strong></div>
        <div><span style="color:var(--text-muted);">Analytics Engine:</span> <strong>DuckDB 1.1.3</strong></div>
        <div><span style="color:var(--text-muted);">AI Framework:</span> <strong>Multi-provider Gateway</strong></div>
        <div><span style="color:var(--text-muted);">Uptime:</span> <strong>24 hari 6 jam</strong></div>
        <div><span style="color:var(--text-muted);">Total Requests:</span> <strong>1.2M</strong></div>
      </div>
    </div>\`;
  }
}

// ─── UTILITIES ─────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ─── INIT ─────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const token = localStorage.getItem('ecap_token');
  if (token) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  }
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.target.id === 'login-email' || e.target.id === 'login-password')) {
      handleLogin();
    }
  });
});
</script>
</body>
</html>`;
}

export default app
