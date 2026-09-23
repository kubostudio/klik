'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/styles/modules/dashboard.module.scss';
import {
  getOrders,
  getProducts,
  getCustomers,
  getCurrentStore,
  getLowStockProducts,
  getTopSellingProducts,
  getSalesChart,
} from '@/lib/supabase/db';
import { Order, Product, LowStockProduct, TopProduct, SalesDataPoint } from '@/lib/supabase/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  ShoppingBag,
  Plus,
  ArrowRight,
  Circle,
  Eye,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Package,
} from 'lucide-react';

type ChartPeriod = 'week' | 'month' | 'year';

interface SalesChartProps {
  data: SalesDataPoint[];
  loading: boolean;
  metric: 'revenue' | 'orders';
  period: ChartPeriod;
}

function SalesChart({ data, loading, metric, period }: SalesChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const VIEW_W = 680;
  const VIEW_H = 220;
  const PAD_L = 60;
  const PAD_R = 24;
  const PAD_T = 20;
  const PAD_B = 35;
  const CHART_W = VIEW_W - PAD_L - PAD_R;
  const CHART_H = VIEW_H - PAD_T - PAD_B;
  const BASE_Y = PAD_T + CHART_H;

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '210px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--color-surface, #f9fafb)',
          borderRadius: '12px',
          border: '1px solid var(--color-hairline, #e2e8f0)',
          padding: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-mid-gray)', fontSize: '0.875rem' }}>
          <TrendingUp size={18} style={{ opacity: 0.6 }} />
          <span>Cargando datos del gráfico...</span>
        </div>
      </div>
    );
  }

  // Determine values and nice max scale
  const values = data.map((d) => (metric === 'revenue' ? d.total : d.count));
  const rawMax = Math.max(...values, 0);

  let maxVal = 10;
  if (metric === 'revenue') {
    if (rawMax <= 0) maxVal = 50;
    else if (rawMax <= 50) maxVal = 50;
    else if (rawMax <= 100) maxVal = 100;
    else if (rawMax <= 250) maxVal = 250;
    else if (rawMax <= 500) maxVal = 500;
    else if (rawMax <= 1000) maxVal = 1000;
    else if (rawMax <= 2500) maxVal = 2500;
    else if (rawMax <= 5000) maxVal = 5000;
    else {
      const power = Math.pow(10, Math.floor(Math.log10(rawMax)));
      maxVal = Math.ceil((rawMax * 1.15) / power) * power;
    }
  } else {
    if (rawMax <= 0) maxVal = 4;
    else if (rawMax <= 4) maxVal = 4;
    else if (rawMax <= 10) maxVal = 10;
    else if (rawMax <= 20) maxVal = 20;
    else maxVal = Math.ceil(rawMax * 1.25);
  }

  // Calculate coordinates
  const N = data.length;
  const points = data.map((d, i) => {
    const x = N <= 1 ? PAD_L + CHART_W / 2 : PAD_L + (i / (N - 1)) * CHART_W;
    const val = metric === 'revenue' ? d.total : d.count;
    const clampedVal = Math.max(0, Math.min(val, maxVal));
    const y = BASE_Y - (clampedVal / maxVal) * CHART_H;
    return { x, y, data: d, val };
  });

  // Smooth cubic bezier curve
  let linePath = '';
  if (points.length === 1) {
    linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  } else if (points.length === 2) {
    linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  } else if (points.length > 2) {
    linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = Math.min(BASE_Y, Math.max(PAD_T, p1.y + (p2.y - p0.y) / 6));

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = Math.min(BASE_Y, Math.max(PAD_T, p2.y - (p3.y - p1.y) / 6));

      linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
  }

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${BASE_Y} L ${points[0].x.toFixed(1)} ${BASE_Y} Z`
      : '';

  // 4 Y-axis ticks
  const ticks = [
    { fraction: 1, val: maxVal },
    { fraction: 0.666, val: maxVal * 0.666 },
    { fraction: 0.333, val: maxVal * 0.333 },
    { fraction: 0, val: 0 },
  ];

  // Mouse / Touch pointer handler
  const handlePointer = (clientX: number) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * VIEW_W;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };

  const isAllZero = rawMax === 0;

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseMove={(e) => handlePointer(e.clientX)}
        onMouseLeave={() => setHoveredIdx(null)}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointer(e.touches[0].clientX);
        }}
        onTouchEnd={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="salesLineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97742" stopOpacity="0.30" />
            <stop offset="70%" stopColor="#d97742" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#d97742" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines and Y-axis labels */}
        {ticks.map((t, idx) => {
          const y = BASE_Y - t.fraction * CHART_H;
          let labelText = '';
          if (t.fraction === 0) {
            labelText = metric === 'revenue' ? 'S/ 0' : '0';
          } else if (metric === 'revenue') {
            labelText = t.val >= 1000 ? `S/ ${(t.val / 1000).toFixed(1)}k` : `S/ ${Math.round(t.val)}`;
          } else {
            labelText = `${Math.round(t.val)}`;
          }

          return (
            <g key={idx}>
              <line
                x1={PAD_L}
                y1={y}
                x2={PAD_L + CHART_W}
                y2={y}
                stroke={t.fraction === 0 ? 'var(--color-hairline, #e2e8f0)' : 'var(--color-hairline, #f1f5f9)'}
                strokeWidth={t.fraction === 0 ? 1.5 : 1}
                strokeDasharray={t.fraction === 0 ? undefined : '4 4'}
              />
              <text
                x={PAD_L - 10}
                y={y + 3.5}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="500"
              >
                {labelText}
              </text>
            </g>
          );
        })}

        {/* Gradient area underneath line */}
        {areaPath && <path d={areaPath} fill="url(#salesLineGradient)" />}

        {/* Smooth curved line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#d97742"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Subtle dots on points with positive values if not hovered */}
        {points.map((p, idx) => {
          if (p.val > 0 && hoveredIdx !== idx) {
            return (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#ffffff"
                stroke="#d97742"
                strokeWidth="2.5"
              />
            );
          }
          return null;
        })}

        {/* Active hover crosshair and indicator */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <g>
            <line
              x1={points[hoveredIdx].x}
              y1={PAD_T}
              x2={points[hoveredIdx].x}
              y2={BASE_Y}
              stroke="#d97742"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity="0.75"
            />
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].y}
              r="8"
              fill="#d97742"
              fillOpacity="0.25"
            />
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].y}
              r="4.5"
              fill="#d97742"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* X-axis labels */}
        {points.map((p, idx) => {
          let showLabel = true;
          if (N > 14) {
            const step = Math.ceil(N / 7);
            showLabel = idx % step === 0 || idx === N - 1;
          } else if (N > 7) {
            showLabel = idx % 2 === 0 || idx === N - 1;
          }

          if (!showLabel) return null;

          return (
            <text
              key={idx}
              x={p.x}
              y={BASE_Y + 18}
              textAnchor="middle"
              fontSize="11"
              fill={hoveredIdx === idx ? '#d97742' : '#94a3b8'}
              fontWeight={hoveredIdx === idx ? '600' : '500'}
            >
              {p.data.label}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hoveredIdx].x / VIEW_W) * 100}%`,
            top: `${(points[hoveredIdx].y / VIEW_H) * 100}%`,
            transform: `translate(${
              points[hoveredIdx].x > VIEW_W * 0.72
                ? '-100%'
                : points[hoveredIdx].x < VIEW_W * 0.28
                ? '0%'
                : '-50%'
            }, -125%)`,
            pointerEvents: 'none',
            backgroundColor: '#18181b',
            color: '#ffffff',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
            fontSize: '0.75rem',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: '140px',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: '#e4e4e7',
              marginBottom: '0.35rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              paddingBottom: '0.25rem',
              textTransform: 'capitalize',
            }}
          >
            {points[hoveredIdx].data.fullDate || points[hoveredIdx].data.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f97316' }} />
              Ventas:
            </span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>
              {formatCurrency(points[hoveredIdx].data.total)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.2rem' }}>
            <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              Pedidos:
            </span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>
              {points[hoveredIdx].data.count} {points[hoveredIdx].data.count === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        </div>
      )}

      {/* Gentle notice if no sales registered in this period */}
      {isAllZero && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--color-hairline, #e2e8f0)',
            padding: '0.4rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-mid-gray, #6b7280)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          Sin ventas registradas en este período
        </div>
      )}
    </div>
  );
}

export default function DashboardHomePage() {
  const { store, sellerName, isLoadingStore } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCount, setCustomerCount] = useState(0);

  // New analytics state
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesChart, setSalesChart] = useState<SalesDataPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('week');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      setLoading(true);
      const activeStore = store || (await getCurrentStore());

      if (activeStore && !isCancelled) {
        try {
          const [ord, prod, cust, lowStock, topSellers, chart] = await Promise.all([
            getOrders(activeStore.id),
            getProducts(activeStore.id),
            getCustomers(activeStore.id),
            getLowStockProducts(activeStore.id),
            getTopSellingProducts(activeStore.id),
            getSalesChart(activeStore.id, 'week'),
          ]);
          if (!isCancelled) {
            setOrders(ord);
            setProducts(prod);
            setCustomerCount(cust.length);
            setLowStockProducts(lowStock);
            setTopProducts(topSellers);
            setSalesChart(chart);
          }
        } catch (err) {
          console.error('Error loading dashboard data:', err);
        }
      }

      if (!isCancelled) setLoading(false);
    }

    loadDashboard();
    return () => { isCancelled = true; };
  }, [store?.id]);

  const handleChartPeriodChange = async (period: ChartPeriod) => {
    if (!store) return;
    setChartPeriod(period);
    setChartLoading(true);
    const chart = await getSalesChart(store.id, period);
    setSalesChart(chart);
    setChartLoading(false);
  };

  const totalOrdersCount = orders.length;
  const totalSales = orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? Number(o.total || 0) : 0), 0);
  const recentOrders = orders.slice(0, 5);
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;

  return (
    <div>
      {/* GREETING HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
            Hola,{' '}
            {isLoadingStore && !sellerName ? (
              <span className={styles.skeletonGreeting} />
            ) : (
              sellerName || 'Emprendedor'
            )}
            .
          </h1>
          <p style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Aquí tienes el resumen de tu tienda.
          </p>
        </div>
      </div>

      {/* ONBOARDING: no products yet */}
      {!loading && products.length === 0 && (
        <div style={{ backgroundColor: 'var(--color-ink-soft)', border: '1px solid var(--color-ink-soft)', borderRadius: '24px', padding: '20px', marginBottom: '1.5rem', color: '#fafafa' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#fafafa', marginBottom: '0.5rem' }}>
            Empieza creando tu primer producto
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#a3a3a3', marginBottom: '1rem' }}>
            Tu tienda está creada. Para recibir tus primeros pedidos, agrega un artículo a tu catálogo.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a3a3a3' }}><CheckCircle2 size={16} /> Cuenta creada</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a3a3a3' }}><CheckCircle2 size={16} /> Tienda creada</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fafafa', fontWeight: 600 }}><Circle size={16} /> Agregar productos</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a3a3a3' }}><Circle size={16} /> Publicar catálogo</div>
          </div>
          <Link href="/dashboard/products" className="btn btn--secondary btn--sm">
            <Plus size={14} /> Agregar primer producto
          </Link>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pedidos totales</div>
          <div className={styles.statValue}>
            {loading ? <span className={styles.skeletonSlug} style={{ width: 44, height: 26, display: 'inline-block', marginTop: 4 }} /> : totalOrdersCount}
          </div>
          {newOrdersCount > 0 && !loading && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 800, marginTop: '0.25rem' }}>
              {newOrdersCount} {newOrdersCount > 1 ? 'nuevos' : 'nuevo'} por revisar
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ventas totales</div>
          <div className={styles.statValue}>
            {loading ? <span className={styles.skeletonSlug} style={{ width: 88, height: 26, display: 'inline-block', marginTop: 4 }} /> : formatCurrency(totalSales)}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Clientes</div>
          <div className={styles.statValue}>
            {loading ? <span className={styles.skeletonSlug} style={{ width: 44, height: 26, display: 'inline-block', marginTop: 4 }} /> : customerCount}
          </div>
        </div>
      </div>

      {/* SALES CHART */}
      <div className={styles.panel} style={{ marginBottom: '1.25rem' }}>
        <div className={styles.panel__header}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-primary)" /> Gráfico de Ventas
          </h2>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['week', 'month', 'year'] as ChartPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handleChartPeriodChange(p)}
                className={`btn btn--sm ${chartPeriod === p ? 'btn--primary' : 'btn--secondary'}`}
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.8125rem' }}
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '1.25rem 1.25rem 1.5rem' }}>
          {/* Chart totals & metric selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              {/* Card Monto */}
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  background: chartMetric === 'revenue' ? 'rgba(217, 119, 66, 0.08)' : 'var(--color-surface, #f9fafb)',
                  border: `1.5px solid ${chartMetric === 'revenue' ? 'var(--color-primary)' : 'var(--color-hairline, #e2e8f0)'}`,
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                    color: chartMetric === 'revenue' ? 'var(--color-primary)' : 'var(--color-mid-gray)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: chartMetric === 'revenue' ? 'var(--color-primary)' : '#9ca3af',
                    }}
                  />
                  Ventas ({chartPeriod === 'week' ? '7 días' : chartPeriod === 'month' ? '30 días' : '12 meses'})
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginTop: '0.15rem' }}>
                  {formatCurrency(salesChart.reduce((a, b) => a + b.total, 0))}
                </div>
              </button>

              {/* Card Cantidad de Pedidos */}
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  background: chartMetric === 'orders' ? 'rgba(217, 119, 66, 0.08)' : 'var(--color-surface, #f9fafb)',
                  border: `1.5px solid ${chartMetric === 'orders' ? 'var(--color-primary)' : 'var(--color-hairline, #e2e8f0)'}`,
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                    color: chartMetric === 'orders' ? 'var(--color-primary)' : 'var(--color-mid-gray)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: chartMetric === 'orders' ? 'var(--color-primary)' : '#9ca3af',
                    }}
                  />
                  Cantidad de Pedidos
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-ink)', marginTop: '0.15rem' }}>
                  {salesChart.reduce((a, b) => a + b.count, 0)}{' '}
                  {salesChart.reduce((a, b) => a + b.count, 0) === 1 ? 'pedido' : 'pedidos'}
                </div>
              </button>
            </div>

            {/* Active metric label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-mid-gray)' }}>
              <span>Graficando:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  padding: '0.2rem 0.6rem',
                  backgroundColor: 'rgba(217, 119, 66, 0.1)',
                  borderRadius: '6px',
                }}
              >
                {chartMetric === 'revenue' ? 'Monto en Soles (S/)' : 'Cantidad de Pedidos'}
              </span>
            </div>
          </div>

          <SalesChart
            data={salesChart}
            loading={chartLoading}
            metric={chartMetric}
            period={chartPeriod}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* LOW STOCK ALERT */}
        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--color-primary)" /> Bajo Stock
            </h2>
            <Link href="/dashboard/products" style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonText} style={{ width: '100%', height: 20 }} />)}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                <Package size={28} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.5 }} />
                Todos los productos tienen stock suficiente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {lowStockProducts.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={16} color="var(--color-mid-gray)" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    </div>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '8px',
                      backgroundColor: p.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                      color: p.stock === 0 ? '#ef4444' : '#ca8a04',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.stock === 0 ? 'Agotado' : `${p.stock} uds.`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TOP SELLERS */}
        <div className={styles.panel}>
          <div className={styles.panel__header}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} /> Más Vendidos
            </h2>
          </div>
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[1, 2, 3].map((i) => <div key={i} className={styles.skeletonText} style={{ width: '100%', height: 20 }} />)}
              </div>
            ) : topProducts.length === 0 ? (
              <div style={{ color: 'var(--color-mid-gray)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                <TrendingUp size={28} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.5 }} />
                Las ventas aparecerán aquí una vez que recibas pedidos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {topProducts.map((p, idx) => (
                  <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: idx === 0 ? 'var(--color-primary)' : 'var(--color-surface-alt)', color: idx === 0 ? 'white' : 'var(--color-mid-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={16} color="var(--color-mid-gray)" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>{p.units_sold} uds. · {formatCurrency(p.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS PANEL */}
      <div className={styles.panel}>
        <div className={styles.panel__header}>
          <h2>Pedidos recientes</h2>
          <Link href="/dashboard/orders" style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
            Ver todos los pedidos <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className={styles.skeletonText} style={{ width: '100%', height: 20 }} />
            <div className={styles.skeletonText} style={{ width: '90%', height: 20 }} />
            <div className={styles.skeletonText} style={{ width: '95%', height: 20 }} />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state" style={{ border: 'none', padding: '3rem 1rem' }}>
            <div className="empty-state__icon"><ShoppingBag size={40} /></div>
            <div className="empty-state__title">Tus primeros pedidos aparecerán aquí</div>
            <div className="empty-state__description">Comparte tu enlace de Klik en tus redes sociales para empezar a recibir pedidos por WhatsApp.</div>
            {store?.slug && (
              <Link href={`/${store.slug}`} target="_blank" className="btn btn--secondary btn--sm">
                Visitar mi tienda pública
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.order_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-mid-gray)' }}>
                        {order.customer_phone}
                        {order.customer_dni && ` • DNI: ${order.customer_dni}`}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-mid-gray)' }}>{formatDate(order.created_at)}</td>
                    <td>
                      {order.items && order.items.length > 0 ? (
                        <div style={{ fontSize: '0.8125rem' }}>
                          {order.items[0].product_name}
                          {order.items.length > 1 && (
                            <span style={{ color: 'var(--color-mid-gray)' }}> +{order.items.length - 1} más</span>
                          )}
                        </div>
                      ) : '1 producto'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                    <td>
                      <span className={`badge badge--${order.status}`}>
                        {order.status === 'new' && 'Nuevo'}
                        {order.status === 'contacted' && 'Contactado'}
                        {order.status === 'confirmed' && 'Confirmado'}
                        {order.status === 'delivered' && 'Entregado'}
                        {order.status === 'cancelled' && 'Cancelado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href="/dashboard/orders" className="btn btn--secondary btn--sm" style={{ padding: '0.35rem 0.65rem' }} title="Revisar pedido">
                        <Eye size={13} /> Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
