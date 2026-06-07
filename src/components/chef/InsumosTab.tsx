import React, { useState } from 'react';
import { db } from '../../services/db';
import type { Ingrediente } from '../../services/db';
import { CustomSelect } from '../CustomSelect';

interface InsumosTabProps {
  ingredientes: Ingrediente[];
  onRefresh: () => void;
}

export const InsumosTab: React.FC<InsumosTabProps> = ({
  ingredientes,
  onRefresh
}) => {
  const [showInsumoForm, setShowInsumoForm] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingrediente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeRowActions, setActiveRowActions] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [refSearch, setRefSearch] = useState('');
  const [editingIngInPanel, setEditingIngInPanel] = useState<Ingrediente | null>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.actions-container')) {
        setActiveRowActions(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const [ingForm, setIngForm] = useState({
    nombre: '',
    unidadReceta: 'g',
    stockMinimo: '' as string | number,
    precioReferencia: '' as string | number,
    conservacion: 'secos' as 'secos' | 'refrigerado' | 'congelado',
    perecibilidad: 'media' as 'alta' | 'media' | 'baja',
    diasVidaUtil: '' as string | number
  });

  const getPrecioReferencia = (ing: Ingrediente) => {
    if (!ing.precioActivo) return '';
    if (ing.unidadReceta === 'g' || ing.unidadReceta === 'ml') {
      return (ing.precioActivo * 1000).toFixed(2);
    }
    return ing.precioActivo.toFixed(2);
  };

  const handleSaveIngrediente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingForm.nombre) return;

    const refPrice = ingForm.precioReferencia !== '' ? Number(ingForm.precioReferencia) : undefined;
    let precioCalculado = (editingIng || editingIngInPanel)?.precioActivo || 0;
    if (refPrice !== undefined) {
      if (ingForm.unidadReceta === 'g' || ingForm.unidadReceta === 'ml') {
        precioCalculado = refPrice / 1000;
      } else {
        precioCalculado = refPrice;
      }
    }

    await db.saveIngrediente({
      id: (editingIng || editingIngInPanel)?.id || 'ing_' + Math.random().toString(36).substr(2, 9),
      nombre: ingForm.nombre,
      unidadReceta: ingForm.unidadReceta as any,
      precioActivo: precioCalculado,
      stockActual: (editingIng || editingIngInPanel)?.stockActual || 0,
      stockMinimo: ingForm.stockMinimo !== '' ? Number(ingForm.stockMinimo) : undefined,
      fechaVencimiento: (editingIng || editingIngInPanel)?.fechaVencimiento,
      conservacion: ingForm.conservacion,
      perecibilidad: ingForm.perecibilidad,
      diasVidaUtil: ingForm.diasVidaUtil !== '' ? Number(ingForm.diasVidaUtil) : undefined,
      ultimaActualizacion: new Date().toISOString()
    });

    const resetForm = {
      nombre: '',
      unidadReceta: 'g',
      stockMinimo: '' as string | number,
      precioReferencia: '' as string | number,
      conservacion: 'secos' as 'secos' | 'refrigerado' | 'congelado',
      perecibilidad: 'media' as 'alta' | 'media' | 'baja',
      diasVidaUtil: '' as string | number
    };

    if (editingIng) {
      // Editar desde la tabla: cerrar el panel
      setEditingIng(null);
      setShowInsumoForm(false);
      setIngForm(resetForm);
    } else {
      // Crear nuevo o editar desde el panel: mantener abierto
      setEditingIngInPanel(null);
      setIngForm(resetForm);
    }
    onRefresh();
  };

  const handleEditIngrediente = (ing: Ingrediente) => {
    setEditingIng(ing);
    setIngForm({
      nombre: ing.nombre,
      unidadReceta: ing.unidadReceta,
      stockMinimo: ing.stockMinimo !== undefined ? ing.stockMinimo : '',
      precioReferencia: getPrecioReferencia(ing),
      conservacion: ing.conservacion || 'secos',
      perecibilidad: ing.perecibilidad || 'media',
      diasVidaUtil: ing.diasVidaUtil !== undefined ? ing.diasVidaUtil : ''
    });
  };

  const handleDeleteIngrediente = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await db.deleteIngrediente(confirmDeleteId);
    setConfirmDeleteId(null);
    onRefresh();
  };

  const handleStockMinBlur = async (ing: Ingrediente, value: string) => {
    const val = value === '' ? undefined : Number(value);
    if (val !== ing.stockMinimo) {
      const updated = { ...ing, stockMinimo: val };
      await db.saveIngrediente(updated);
      onRefresh();
    }
  };

  const handleStockMinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const filteredIngredientes = ingredientes.filter(ing => {
    const searchLower = searchQuery.toLowerCase();
    const conservacionLabel = ing.conservacion === 'secos' ? 'secos almacén despensa' : ing.conservacion === 'refrigerado' ? 'refrigerado refrigeración' : 'congelado congelación';
    const perecibilidadLabel = ing.perecibilidad === 'alta' ? 'alta perecibilidad' : ing.perecibilidad === 'media' ? 'media' : 'baja no perecedero';
    return (
      ing.nombre.toLowerCase().includes(searchLower) ||
      conservacionLabel.includes(searchLower) ||
      perecibilidadLabel.includes(searchLower)
    );
  });

  const totalItems = filteredIngredientes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedIngredientes = filteredIngredientes.slice(startIndex, startIndex + itemsPerPage);

  const isDrawerOpen = showInsumoForm || editingIng !== null;

  const handleCloseDrawer = () => {
    setEditingIng(null);
    setShowInsumoForm(false);
    setRefSearch('');
    setEditingIngInPanel(null);
    setIngForm({
      nombre: '',
      unidadReceta: 'g',
      stockMinimo: '',
      precioReferencia: '',
      conservacion: 'secos',
      perecibilidad: 'media',
      diasVidaUtil: ''
    });
  };

  const formatCostDisplay = (precioBase: number, unidad: string) => {
    if (precioBase === 0) return 'Sin compra registrada';
    if (unidad === 'g') return `$${(precioBase * 1000).toFixed(2)} / kg`;
    if (unidad === 'ml') return `$${(precioBase * 1000).toFixed(2)} / L`;
    return `$${precioBase.toFixed(2)} / ud.`;
  };

  const formatStockDisplay = (stock: number | undefined, unidad: string) => {
    if (stock === undefined) return '-';
    if (unidad === 'g') {
      if (stock >= 1000) return `${(stock / 1000).toFixed(2)} kg`;
      return `${stock} g`;
    }
    if (unidad === 'ml') {
      if (stock >= 1000) return `${(stock / 1000).toFixed(2)} L`;
      return `${stock} ml`;
    }
    return `${stock} ud.`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <div className="mixo-card" style={{ padding: '24px', width: '100%' }}>
        {/* Cabecera Interna Estandarizada */}
        <div className="flex-row-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <h2>Inventario y Costos de Insumos</h2>
        </div>

        {/* Listado de Insumos */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Buscador */}
          <div style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              className="search-input"
              placeholder="Buscar insumos por nombre o categoría..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Insumo</th>
                  <th className="text-center" style={{ width: '220px' }}>Conservación / Rotación</th>
                  <th className="text-right">Costo Compra</th>
                  <th className="text-right">Costo Uso</th>
                  <th className="text-right">Stock Actual</th>
                  <th className="text-right" style={{ width: '140px' }}>Stock Mínimo</th>
                  <th className="text-center">Vencimiento</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIngredientes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No se encontraron insumos.
                    </td>
                  </tr>
                ) : (
                  paginatedIngredientes.map(ing => {
                    const precioActivo = ing.precioActivo || 0;
                    const costoDeUso = precioActivo;
                    const conservacionText = ing.conservacion === 'secos' ? 'Secos' : ing.conservacion === 'refrigerado' ? 'Refrigerado' : 'Congelado';
                    const perecibilidadText = ing.perecibilidad === 'alta' ? 'Alta' : ing.perecibilidad === 'media' ? 'Media' : 'Baja (No perecedero)';
                    const vidaUtilText = ing.diasVidaUtil ? ` (${ing.diasVidaUtil}d)` : '';
                    return (
                      <tr key={ing.id}>
                        <td className="text-left cell-truncate" title={ing.nombre}>
                          <strong>{ing.nombre}</strong>
                        </td>
                        <td className="text-center">
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                            {`${conservacionText} / ${perecibilidadText}${vidaUtilText}`}
                          </span>
                        </td>
                        <td className="text-right">
                          {precioActivo === 0 ? (
                            <span style={{ color: 'var(--color-badge-warning-text)', fontSize: '14px', fontWeight: 500 }}>
                              Sin compra registrada
                            </span>
                          ) : (
                            formatCostDisplay(precioActivo, ing.unidadReceta)
                          )}
                        </td>
                        <td className="text-right">
                          {precioActivo === 0 ? (
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>-</span>
                          ) : (
                            <>
                              <strong>${costoDeUso.toFixed(4)}</strong> / {ing.unidadReceta}
                            </>
                          )}
                        </td>
                        <td className="text-right">
                          {ing.stockActual !== undefined ? (
                            <span style={{
                              fontWeight: ing.stockMinimo !== undefined && ing.stockActual < ing.stockMinimo ? 600 : 400,
                              color: ing.stockMinimo !== undefined && ing.stockActual < ing.stockMinimo
                                ? 'var(--color-badge-danger-text)'
                                : 'inherit',
                            }}
                            title={ing.stockMinimo !== undefined && ing.stockActual < ing.stockMinimo ? 'Stock por debajo del mínimo' : undefined}
                            >
                              {formatStockDisplay(ing.stockActual, ing.unidadReceta)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="text-right">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              key={ing.id + '_min_' + (ing.stockMinimo ?? 'none')}
                              type="number"
                              min="0"
                              step="any"
                              defaultValue={ing.stockMinimo !== undefined ? ing.stockMinimo : ''}
                              placeholder="Sin mín"
                              onBlur={(e) => handleStockMinBlur(ing, e.target.value)}
                              onKeyDown={handleStockMinKeyDown}
                              style={{
                                width: '80px',
                                height: '32px',
                                padding: '0 8px',
                                fontSize: '13px',
                                textAlign: 'right',
                                borderRadius: '8px',
                                backgroundColor: 'var(--color-bg-base)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)'
                              }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', minWidth: '24px', textAlign: 'left' }}>
                              {ing.unidadReceta}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          {ing.fechaVencimiento ? (
                            (() => {
                              const fechaObj = new Date(ing.fechaVencimiento);
                              const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                              const diff = fechaObj.getTime() - Date.now();
                              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                              if (days < 0) {
                                return (
                                  <span style={{ fontSize: '14px', color: 'var(--color-badge-danger-text)', fontWeight: 500 }}>
                                    {fechaFormateada} — Vencido
                                  </span>
                                );
                              } else if (days <= 3) {
                                return (
                                  <span style={{ fontSize: '14px', color: 'var(--color-badge-warning-text)', fontWeight: 500 }}>
                                    {fechaFormateada} — Vence en {days}d
                                  </span>
                                );
                              }
                              return (
                                <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                                  {fechaFormateada}
                                </span>
                              );
                            })()
                          ) : <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>—</span>}
                        </td>
                        <td className="text-right">
                          <div className="actions-container">
                            <button 
                              type="button" 
                              className="btn-actions-trigger" 
                              onClick={() => setActiveRowActions(activeRowActions === ing.id ? null : ing.id)}
                            >
                              ⋮
                            </button>
                            {activeRowActions === ing.id && (
                              <div className="actions-dropdown">
                                <button type="button" onClick={() => { handleEditIngrediente(ing); setActiveRowActions(null); }}>
                                  Editar
                                </button>
                                <button type="button" className="danger" onClick={() => { handleDeleteIngrediente(ing.id); setActiveRowActions(null); }}>
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex-row-between" style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <span className="text-secondary" style={{ fontSize: '13px' }}>
              Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} insumos
            </span>
            <div className="flex-gap-16">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                style={{ height: '36px', minWidth: '80px', padding: '0 16px' }}
              >
                Anterior
              </button>
              <span className="flex-center" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Pág. {activePage} de {totalPages}
              </span>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={activePage === totalPages}
                style={{ height: '36px', minWidth: '80px', padding: '0 16px' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop del Drawer */}
      <div 
        className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`} 
        onClick={handleCloseDrawer}
      />

      {/* Drawer Panel */}
      <div className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`}>
        <form onSubmit={handleSaveIngrediente} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="drawer-header">
            <h2>{editingIng ? 'Modificar Insumo' : 'Nuevo Insumo'}</h2>
            <button 
              type="button" 
              className="drawer-close-btn" 
              onClick={handleCloseDrawer}
            >
              ×
            </button>
          </div>

          <div className="drawer-body">
            {/* Indicador: editando desde el panel */}
            {editingIngInPanel && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Editando: <strong style={{ color: 'var(--color-text-primary)' }}>{editingIngInPanel.nombre}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIngInPanel(null);
                    setIngForm({
                      nombre: '',
                      unidadReceta: 'g',
                      stockMinimo: '',
                      precioReferencia: '',
                      conservacion: 'secos',
                      perecibilidad: 'media',
                      diasVidaUtil: ''
                    });
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0' }}
                >
                  ×
                </button>
              </div>
            )}

            <div className="form-group">
              <label>Nombre del Insumo</label>
              <input 
                type="text" 
                placeholder="ej. Tomate Chonto, Lomo Res" 
                value={ingForm.nombre}
                onChange={e => setIngForm({ ...ingForm, nombre: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Método de Conservación</label>
              <CustomSelect
                options={[
                  { value: 'secos', label: 'Secos / Almacén' },
                  { value: 'refrigerado', label: 'Refrigerado' },
                  { value: 'congelado', label: 'Congelado' }
                ]}
                value={ingForm.conservacion}
                onChange={val => setIngForm(prev => ({ ...prev, conservacion: val as any }))}
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Nivel de Perecibilidad</label>
              <CustomSelect
                options={[
                  { value: 'alta', label: 'Alta Perecibilidad (< 7 días)' },
                  { value: 'media', label: 'Media Perecibilidad (7 a 30 días)' },
                  { value: 'baja', label: 'No Perecedero / Baja Perecibilidad (> 30 días)' }
                ]}
                value={ingForm.perecibilidad}
                onChange={val => setIngForm(prev => ({ ...prev, perecibilidad: val as any }))}
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Días de Vida Útil sugeridos</label>
              <input 
                type="number" 
                min="0"
                placeholder="ej. 7" 
                value={ingForm.diasVidaUtil}
                onChange={e => setIngForm(prev => ({ ...prev, diasVidaUtil: e.target.value }))}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '28px',
                  padding: '0 16px',
                  backgroundColor: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div className="form-group">
              <label>Unidad del Insumo</label>
              <CustomSelect
                options={[
                  { value: 'g', label: 'Gramo (g)' },
                  { value: 'ml', label: 'Mililitro (ml)' },
                  { value: 'unidad', label: 'Unidad (ud.)' }
                ]}
                value={ingForm.unidadReceta}
                onChange={val => setIngForm(prev => ({ ...prev, unidadReceta: val }))}
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Costo de Compra de Referencia ($)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>$</span>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={ingForm.precioReferencia}
                  onChange={e => setIngForm(prev => ({ ...prev, precioReferencia: e.target.value }))}
                  style={{ flexGrow: 1 }}
                />
              </div>
              <span className="text-secondary" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {ingForm.unidadReceta === 'g' && 'Costo de referencia por Kilogramo (kg). Se dividirá por 1000 para recetas.'}
                {ingForm.unidadReceta === 'ml' && 'Costo de referencia por Litro (L). Se dividirá por 1000 para recetas.'}
                {ingForm.unidadReceta === 'unidad' && 'Costo de referencia por Unidad.'}
              </span>
            </div>

            {/* Referencia de insumos ya registrados */}
            <div style={{ marginTop: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  Insumos ya registrados
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <input
                type="text"
                className="search-input"
                placeholder="Buscar insumo existente..."
                value={refSearch}
                onChange={e => setRefSearch(e.target.value)}
                style={{ marginBottom: '8px', fontSize: '13px', height: '36px' }}
              />

              <div className="ref-insumos-container" style={{
                maxHeight: '200px',
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-bg-base)'
              }}>
                {(() => {
                  const refLower = refSearch.toLowerCase();
                  const filtered = ingredientes.filter(ing => {
                    const conservacionText = ing.conservacion === 'secos' ? 'secos almacén' : ing.conservacion === 'refrigerado' ? 'refrigerado' : 'congelado';
                    return (
                      ing.nombre.toLowerCase().includes(refLower) ||
                      conservacionText.includes(refLower)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        Sin resultados
                      </div>
                    );
                  }

                  return (
                    <table className="ref-insumos-table">
                      <tbody>
                        {filtered.map(ing => {
                          const unidadLabel = ing.unidadReceta === 'g' ? 'g' : ing.unidadReceta === 'ml' ? 'ml' : 'ud.';
                          return (
                            <tr key={ing.id}>
                              <td className="text-left cell-truncate" title={ing.nombre} style={{ fontWeight: 500 }}>
                                {ing.nombre}
                              </td>
                              <td className="text-left cell-truncate" title={ing.conservacion} style={{ color: 'var(--color-text-secondary)' }}>
                                {ing.conservacion === 'secos' ? 'Secos' : ing.conservacion === 'refrigerado' ? 'Refrigerado' : 'Congelado'}
                              </td>
                              <td className="text-center" style={{ width: '50px' }}>
                                <span className="badge" style={{ display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>
                                  {unidadLabel}
                                </span>
                              </td>
                              <td className="text-right" style={{ width: '70px' }}>
                                <button 
                                  type="button" 
                                  className="btn-ref-edit" 
                                  onClick={() => {
                                    setEditingIngInPanel(ing);
                                    setIngForm({
                                      nombre: ing.nombre,
                                      unidadReceta: ing.unidadReceta,
                                      stockMinimo: ing.stockMinimo !== undefined ? ing.stockMinimo : '',
                                      precioReferencia: getPrecioReferencia(ing),
                                      conservacion: ing.conservacion || 'secos',
                                      perecibilidad: ing.perecibilidad || 'media',
                                      diasVidaUtil: ing.diasVidaUtil !== undefined ? ing.diasVidaUtil : ''
                                    });
                                    // Scroll to top of drawer-body
                                    (document.querySelector('.drawer-panel.open .drawer-body') as HTMLElement)?.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Editar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>

          </div>

          <div className="drawer-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCloseDrawer}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              {editingIng || editingIngInPanel ? 'Guardar Cambios' : 'Añadir Insumo'}
            </button>
          </div>
        </form>
      </div>
      {/* Modal de confirmación de eliminación */}
      {confirmDeleteId && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => setConfirmDeleteId(null)}
          />
          <div
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 1001, background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-card)',
              padding: '24px', minWidth: '320px', maxWidth: '400px'
            }}
          >
            <h3 style={{ marginBottom: '8px' }}>¿Eliminar insumo?</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Esta acción no se puede deshacer. El insumo será eliminado del catálogo.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--color-danger, #ef5350)', borderColor: 'var(--color-danger, #ef5350)' }} onClick={handleConfirmDelete}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
