import React, { useState } from 'react';
import { db } from '../../services/db';
import type { Ingrediente, Receta, PasoPreparacion, IngredienteReceta, ConfiguracionCostos, LoteProduccion } from '../../services/db';
import { CustomSelect } from '../CustomSelect';
import { ConfirmModal } from '../ConfirmModal';

interface RecetasTabProps {
  recetas: Receta[];
  ingredientes: Ingrediente[];
  lotesProduccion: LoteProduccion[];
  config: ConfiguracionCostos;
  onRefresh: () => void;
  onShowTechnicalSheet: (receta: Receta) => void;
}

export const RecetasTab: React.FC<RecetasTabProps> = ({
  recetas,
  ingredientes,
  lotesProduccion,
  config,
  onRefresh,
  onShowTechnicalSheet
}) => {
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Receta | null>(null);
  const [drawerTab, setDrawerTab] = useState<'general' | 'ingredientes' | 'preparacion'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeRowActions, setActiveRowActions] = useState<string | null>(null);

  // Estados para Registro Rápido de Insumo
  const [showInsumoForm, setShowInsumoForm] = useState(false);
  const [quickRegisterRowIndex, setQuickRegisterRowIndex] = useState<number | null>(null);

  const [ingForm, setIngForm] = useState({
    nombre: '',
    unidadReceta: 'g',
    conservacion: 'secos' as 'secos' | 'refrigerado' | 'congelado',
    perecibilidad: 'media' as 'alta' | 'media' | 'baja',
    diasVidaUtil: '' as string | number
  });

  const [refSearch, setRefSearch] = useState('');
  const [editingIngInPanel, setEditingIngInPanel] = useState<Ingrediente | null>(null);

  const handleOpenNewIngrediente = (rowIndex: number | null = null) => {
    setQuickRegisterRowIndex(rowIndex);
    setIngForm({
      nombre: '',
      unidadReceta: 'g',
      conservacion: 'secos',
      perecibilidad: 'media',
      diasVidaUtil: ''
    });
    setShowInsumoForm(true);
  };

  const handleCloseInsumoDrawer = () => {
    setShowInsumoForm(false);
    setQuickRegisterRowIndex(null);
    setEditingIngInPanel(null);
    setIngForm({
      nombre: '',
      unidadReceta: 'g',
      conservacion: 'secos',
      perecibilidad: 'media',
      diasVidaUtil: ''
    });
    setRefSearch('');
  };

  const handleSaveIngrediente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingForm.nombre) return;

    const ingId = editingIngInPanel?.id || 'ing_' + Math.random().toString(36).substr(2, 9);
    const nuevoIng: Ingrediente = {
      id: ingId,
      nombre: ingForm.nombre,
      unidadReceta: ingForm.unidadReceta as any,
      precioActivo: editingIngInPanel?.precioActivo || 0,
      stockActual: editingIngInPanel?.stockActual || 0,
      stockMinimo: editingIngInPanel?.stockMinimo,
      fechaVencimiento: editingIngInPanel?.fechaVencimiento,
      conservacion: ingForm.conservacion,
      perecibilidad: ingForm.perecibilidad,
      diasVidaUtil: ingForm.diasVidaUtil !== '' ? Number(ingForm.diasVidaUtil) : undefined,
      ultimaActualizacion: new Date().toISOString()
    };

    await db.saveIngrediente(nuevoIng);

    if (quickRegisterRowIndex !== null) {
      // Viene de fila de receta: asignar y cerrar
      handleUpdateRecetaIngrediente(quickRegisterRowIndex, 'ingredienteId', ingId);
      handleCloseInsumoDrawer();
    } else {
      // Creación libre o edición en panel: limpiar/resetear
      setEditingIngInPanel(null);
      setIngForm({
        nombre: '',
        unidadReceta: 'g',
        conservacion: 'secos',
        perecibilidad: 'media',
        diasVidaUtil: ''
      });
    }
    onRefresh();
  };

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.actions-container')) {
        setActiveRowActions(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Estado para el Creador de Receta
  const [recetaForm, setRecetaForm] = useState({
    nombre: '',
    esSubReceta: false,
    codigoIntegracionPOS: '',
    unidadRendimiento: 'porciones' as 'kg' | 'litro' | 'porciones',
    cantidadRendimiento: 1 as number | string,
    vidaUtilHoras: 24 as number | string,
    temperaturaAlmacenado: 'Refrigerado (2°C - 4°C)',
    alergenos: [] as ('gluten' | 'lactosa' | 'frutos_secos' | 'mariscos' | 'huevo' | 'soya')[],
    precioVentaMenu: '' as number | string
  });

  const [recetaIngredientes, setRecetaIngredientes] = useState<any[]>([]);
  const [recetaPasos, setRecetaPasos] = useState<any[]>([]);

  // --- CÁLCULOS VISUALES RÁPIDOS EN RECETAS ---
  const getCostoTotalLote = (ings: IngredienteReceta[]) => {
    let total = 0;
    ings.forEach(item => {
      if (item.esRecetaAnidada) {
        const sub = recetas.find(r => r.id === item.ingredienteId);
        if (sub) {
          const costoSubTotal = getCostoTotalLote(sub.ingredientes);
          const costoGramo = costoSubTotal / sub.cantidadRendimiento;
          total += costoGramo * item.cantidadRequerida;
        }
      } else {
        const ing = ingredientes.find(i => i.id === item.ingredienteId);
        if (ing) {
          total += db.calcularCostoUsoIngrediente(ing, item.cantidadRequerida);
        }
      }
    });
    return total;
  };

  // --- CONTROLADORES DE RECETAS ---
  const handleAddIngredienteToReceta = () => {
    setRecetaIngredientes([...recetaIngredientes, {
      ingredienteId: ingredientes[0]?.id || '',
      esRecetaAnidada: false,
      cantidadRequerida: 0
    }]);
  };

  const handleRemoveIngredienteFromReceta = (index: number) => {
    setRecetaIngredientes(recetaIngredientes.filter((_, i) => i !== index));
  };

  const handleUpdateRecetaIngrediente = (index: number, field: keyof IngredienteReceta, value: any) => {
    const list = [...recetaIngredientes];
    if (field === 'ingredienteId') {
      list[index].ingredienteId = value;
      const isSub = recetas.some(r => r.id === value);
      list[index].esRecetaAnidada = isSub;
    } else {
      (list[index] as any)[field] = value;
    }
    setRecetaIngredientes(list);
  };

  const handleAddPasoToReceta = () => {
    const nPaso = recetaPasos.length + 1;
    setRecetaPasos([...recetaPasos, {
      numeroPaso: nPaso,
      estacion: 'preparacion_fria',
      descripcion: '',
      tiempoMinutos: 5,
      ingredientesAsociados: []
    }]);
  };

  const handleRemovePasoFromReceta = (index: number) => {
    const list = recetaPasos.filter((_, i) => i !== index).map((p, i) => ({
      ...p,
      numeroPaso: i + 1
    }));
    setRecetaPasos(list);
  };

  const handleUpdateRecetaPaso = (index: number, field: keyof PasoPreparacion, value: any) => {
    const list = [...recetaPasos];
    (list[index] as any)[field] = value;
    setRecetaPasos(list);
  };

  const handleToggleAlergeno = (alergeno: any) => {
    const active = recetaForm.alergenos.includes(alergeno);
    if (active) {
      setRecetaForm({
        ...recetaForm,
        alergenos: recetaForm.alergenos.filter(a => a !== alergeno)
      });
    } else {
      setRecetaForm({
        ...recetaForm,
        alergenos: [...recetaForm.alergenos, alergeno]
      });
    }
  };

  const handleSaveReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recetaForm.nombre) return;

    const nuevaReceta: Receta = {
      id: (!editingReceta || editingReceta.id === 'new')
        ? 'rec_' + Math.random().toString(36).substr(2, 9)
        : editingReceta.id,
      nombre: recetaForm.nombre,
      esSubReceta: recetaForm.esSubReceta,
      codigoIntegracionPOS: recetaForm.codigoIntegracionPOS || undefined,
      unidadRendimiento: recetaForm.unidadRendimiento,
      cantidadRendimiento: Number(recetaForm.cantidadRendimiento),
      vidaUtilHoras: recetaForm.vidaUtilHoras ? Number(recetaForm.vidaUtilHoras) : undefined,
      temperaturaAlmacenado: recetaForm.temperaturaAlmacenado || undefined,
      alergenos: recetaForm.alergenos,
      ingredientes: recetaIngredientes
        .filter(i => Number(i.cantidadRequerida) > 0)
        .map(i => ({
          ingredienteId: i.ingredienteId,
          esRecetaAnidada: i.esRecetaAnidada,
          cantidadRequerida: Number(i.cantidadRequerida)
        })),
      pasos: recetaPasos.filter(p => p.descripcion).map(p => ({
        numeroPaso: Number(p.numeroPaso),
        estacion: p.estacion,
        descripcion: p.descripcion,
        tiempoMinutos: Number(p.tiempoMinutos || 0),
        temperaturaObjetivo: p.temperaturaObjetivo ? Number(p.temperaturaObjetivo) : undefined,
        ingredientesAsociados: p.ingredientesAsociados
      })),
      tiempoPreparacionTotal: recetaPasos.reduce((acc, curr) => acc + Number(curr.tiempoMinutos || 0), 0),
      actualizadoPor: 'chef_ramon',
      ultimaActualizacion: new Date().toISOString(),
      precioVentaMenu: recetaForm.precioVentaMenu ? Number(recetaForm.precioVentaMenu) : undefined
    };

    await db.saveReceta(nuevaReceta);
    handleCancelRecetaEdit();
    onRefresh();
  };

  const handleEditReceta = (rec: Receta) => {
    setDrawerTab('general');
    setEditingReceta(rec);
    setRecetaForm({
      nombre: rec.nombre,
      esSubReceta: rec.esSubReceta,
      codigoIntegracionPOS: rec.codigoIntegracionPOS || '',
      unidadRendimiento: rec.unidadRendimiento,
      cantidadRendimiento: rec.cantidadRendimiento,
      vidaUtilHoras: rec.vidaUtilHoras || 24,
      temperaturaAlmacenado: rec.temperaturaAlmacenado || 'Refrigerado (2°C - 4°C)',
      alergenos: rec.alergenos,
      precioVentaMenu: rec.precioVentaMenu !== undefined ? rec.precioVentaMenu : ''
    });
    setRecetaIngredientes(rec.ingredientes);
    setRecetaPasos(rec.pasos);
  };

  const handleCancelRecetaEdit = () => {
    setEditingReceta(null);
    setRecetaForm({
      nombre: '',
      esSubReceta: false,
      codigoIntegracionPOS: '',
      unidadRendimiento: 'porciones',
      cantidadRendimiento: 1,
      vidaUtilHoras: 24,
      temperaturaAlmacenado: 'Refrigerado (2°C - 4°C)',
      alergenos: [],
      precioVentaMenu: ''
    });
    setRecetaIngredientes([]);
    setRecetaPasos([]);
  };

  const handleDeleteReceta = (receta: Receta) => {
    setRecipeToDelete(receta);
  };

  const filteredRecetas = recetas.filter(rec => {
    const searchLower = searchQuery.toLowerCase();
    return (
      rec.nombre.toLowerCase().includes(searchLower) ||
      (rec.esSubReceta ? 'sub-receta' : 'plato final').includes(searchLower) ||
      (rec.codigoIntegracionPOS || '').toLowerCase().includes(searchLower)
    );
  });

  const totalItems = filteredRecetas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedRecetas = filteredRecetas.slice(startIndex, startIndex + itemsPerPage);

  const isDrawerOpen = editingReceta !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      {/* Listado de Recetas */}
      <div className="mixo-card" style={{ padding: '24px', width: '100%' }}>
        <div className="flex-row-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <h2>Recetario y Fichas Técnicas</h2>
          <div className="flex-gap-16">
            <button className="btn btn-secondary" onClick={() => handleOpenNewIngrediente(null)}>
              Registrar Insumo
            </button>
            <button className="btn btn-primary" onClick={() => {
              setDrawerTab('general');
              setEditingReceta({ id: 'new' } as any);
            }}>
              Crear Nueva Receta
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Buscador */}
          <div style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              className="search-input"
              placeholder="Buscar fórmulas por nombre, tipo o código SKU..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Receta / Plato</th>
                  <th className="text-center">Tipo</th>
                  <th className="text-right">Rendimiento del Lote</th>
                  <th className="text-right">Costo de Insumos</th>
                  <th className="text-right">Costo por Porción</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecetas.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No se encontraron recetas.
                    </td>
                  </tr>
                ) : (
                  paginatedRecetas.map(rec => {
                    const costoLote = getCostoTotalLote(rec.ingredientes);
                    const costoPorcion = costoLote / rec.cantidadRendimiento;

                    // Buscar último lote de producción de esta receta
                    const lotesReceta = lotesProduccion
                      .filter(l => l.recetaId === rec.id)
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                    const ultimoLote = lotesReceta[0];

                    return (
                      <tr key={rec.id}>
                        <td className="text-left">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="cell-truncate" title={rec.nombre} style={{ fontWeight: 'bold' }}>
                              {rec.nombre}
                            </span>
                            {rec.codigoIntegracionPOS && (
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '4px' }} title={`SKU POS: ${rec.codigoIntegracionPOS}`}>
                                (SKU: {rec.codigoIntegracionPOS})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                            {rec.esSubReceta ? 'Sub-receta' : 'Plato Final'}
                          </span>
                        </td>
                        <td className="text-right">
                          {rec.cantidadRendimiento} {rec.unidadRendimiento === 'porciones' ? 'porciones' : rec.unidadRendimiento === 'litro' ? 'L' : rec.unidadRendimiento}
                        </td>
                        <td className="text-right">
                          Teór: ${costoLote.toFixed(2)}{ultimoLote && ` | Real: $${ultimoLote.costoTotalInsumos.toFixed(2)}`}
                        </td>
                        <td className="text-right">
                          <strong>Teór: ${costoPorcion.toFixed(2)}</strong>{ultimoLote && ` | Real: $${ultimoLote.costoPorcionReal.toFixed(2)}`}
                        </td>
                        <td className="text-right">
                          <div className="actions-container">
                            <button 
                              type="button" 
                              className="btn-actions-trigger" 
                              onClick={() => setActiveRowActions(activeRowActions === rec.id ? null : rec.id)}
                            >
                              ⋮
                            </button>
                            {activeRowActions === rec.id && (
                              <div className="actions-dropdown">
                                <button type="button" onClick={() => { onShowTechnicalSheet(rec); setActiveRowActions(null); }}>
                                  Ficha Técnica
                                </button>
                                <button type="button" onClick={() => { handleEditReceta(rec); setActiveRowActions(null); }}>
                                  Editar
                                </button>
                                <button type="button" className="danger" onClick={() => { handleDeleteReceta(rec); setActiveRowActions(null); }}>
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
              Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} recetas
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
        onClick={handleCancelRecetaEdit}
      />

      {/* Drawer Panel (Ancho / Wide) */}
      <div className={`drawer-panel wide ${isDrawerOpen ? 'open' : ''}`}>
        {editingReceta && (
          <form onSubmit={handleSaveReceta} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="drawer-header">
              <h2>{editingReceta.id === 'new' ? 'Nueva Receta de Cocina' : 'Modificar Receta'}</h2>
              <button 
                type="button" 
                className="drawer-close-btn" 
                onClick={handleCancelRecetaEdit}
              >
                ×
              </button>
            </div>

            {/* Tab Switcher */}
            <div style={{ padding: '0 24px 0 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0' }}>
              <button
                type="button"
                onClick={() => setDrawerTab('general')}
                style={{
                  fontFamily: 'var(--font-family)',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: drawerTab === 'general' ? '2px solid var(--color-accent)' : '2px solid transparent',
                  color: drawerTab === 'general' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px'
                }}
              >
                Datos Generales
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('ingredientes')}
                style={{
                  fontFamily: 'var(--font-family)',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: drawerTab === 'ingredientes' ? '2px solid var(--color-accent)' : '2px solid transparent',
                  color: drawerTab === 'ingredientes' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px'
                }}
              >
                Ingredientes
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('preparacion')}
                style={{
                  fontFamily: 'var(--font-family)',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: drawerTab === 'preparacion' ? '2px solid var(--color-accent)' : '2px solid transparent',
                  color: drawerTab === 'preparacion' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px'
                }}
              >
                Preparación
              </button>
            </div>

            <div className="drawer-body">
              {drawerTab === 'general' && (
              <>
              <div className="form-row">
                <div className="form-group col-2x">
                  <label>Nombre de la Receta</label>
                  <input 
                    type="text" 
                    placeholder="ej. Pasta Boloñesa, Salsa de Ajo Base"
                    value={recetaForm.nombre}
                    onChange={e => setRecetaForm({ ...recetaForm, nombre: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group col-1x">
                  <label>Código POS (SKU)</label>
                  <input 
                    type="text" 
                    placeholder="ej. PAS-BOL-01"
                    value={recetaForm.codigoIntegracionPOS}
                    onChange={e => setRecetaForm({ ...recetaForm, codigoIntegracionPOS: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-1x">
                  <label>Tipo de Fórmula</label>
                  <CustomSelect
                    options={[
                      { value: 'no', label: 'Plato Final (Menú)' },
                      { value: 'si', label: 'Sub-receta de Lote' }
                    ]}
                    value={recetaForm.esSubReceta ? 'si' : 'no'}
                    onChange={val => setRecetaForm({ ...recetaForm, esSubReceta: val === 'si' })}
                  />
                </div>

                <div className="form-group col-1x">
                  <label>Unidad del Lote</label>
                  <CustomSelect
                    options={[
                      { value: 'porciones', label: 'Porciones' },
                      { value: 'kg', label: 'Kilogramos (kg)' },
                      { value: 'litro', label: 'Litros (l)' }
                    ]}
                    value={recetaForm.unidadRendimiento}
                    onChange={val => setRecetaForm({ ...recetaForm, unidadRendimiento: val as any })}
                  />
                </div>

                <div className="form-group col-1x">
                  <label>Rendimiento de Lote</label>
                  <input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    value={recetaForm.cantidadRendimiento}
                    onChange={e => setRecetaForm({ ...recetaForm, cantidadRendimiento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-1x">
                  <label>Vida Útil (Horas)</label>
                  <input 
                    type="number" 
                    value={recetaForm.vidaUtilHoras}
                    onChange={e => setRecetaForm({ ...recetaForm, vidaUtilHoras: e.target.value })}
                  />
                </div>
                
                <div className="form-group col-1x">
                  <label>Conservación</label>
                  <input 
                    type="text" 
                    value={recetaForm.temperaturaAlmacenado}
                    onChange={e => setRecetaForm({ ...recetaForm, temperaturaAlmacenado: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alérgenos del Plato</label>
                <div className="flex-gap-16" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  {['gluten', 'lactosa', 'frutos_secos', 'mariscos', 'huevo', 'soya'].map(a => {
                    const active = recetaForm.alergenos.includes(a as any);
                    return (
                      <button 
                        key={a}
                        type="button"
                        className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ height: '36px', minWidth: 'auto', padding: '0 16px' }}
                        onClick={() => handleToggleAlergeno(a)}
                      >
                        {a.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
              </>
              )}

              {/* INGREDIENTES EN RECETA */}
              {drawerTab === 'ingredientes' && (
              <div className="mixo-card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', overflow: 'visible' }}>
                <div className="flex-row-between">
                  <h3>Ingredientes y Sub-recetas</h3>
                  <button type="button" className="btn btn-secondary" style={{ height: '36px', padding: '0 16px' }} onClick={handleAddIngredienteToReceta}>
                    + Añadir Insumo
                  </button>
                </div>

                {recetaIngredientes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Añada los ingredientes necesarios para calcular el costo.
                  </div>
                ) : (
                  recetaIngredientes.map((item, idx) => {
                    const optionsRecetas = recetas.filter(r => r.esSubReceta && r.id !== editingReceta.id);
                    const selectedIng = ingredientes.find(i => i.id === item.ingredienteId);
                    const selectedSub = optionsRecetas.find(r => r.id === item.ingredienteId);
                    const unit = selectedIng ? selectedIng.unidadReceta : selectedSub ? selectedSub.unidadRendimiento : '';

                    return (
                      <div className="form-row" key={idx} style={{ alignItems: 'flex-end', marginTop: '12px' }}>
                        <div className="form-group" style={{ flexGrow: 2 }}>
                          <label>Insumo o Sub-receta</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <CustomSelect
                              options={[
                                ...ingredientes.map(i => {
                                  const price = i.precioActivo || 0;
                                  let priceText = '';
                                  if (i.unidadReceta === 'g') priceText = `$${(price * 1000).toFixed(2)}/kg`;
                                  else if (i.unidadReceta === 'ml') priceText = `$${(price * 1000).toFixed(2)}/L`;
                                  else priceText = `$${price.toFixed(2)}/ud.`;
                                  return {
                                    value: i.id,
                                    label: `${i.nombre} (${priceText})`,
                                    group: 'Ingredientes Base'
                                  };
                                }),
                                ...optionsRecetas.map(r => ({
                                  value: r.id,
                                  label: `${r.nombre} (Lote)`,
                                  group: 'Sub-recetas de Bodega'
                                }))
                              ]}
                              value={item.ingredienteId}
                              onChange={val => handleUpdateRecetaIngrediente(idx, 'ingredienteId', val)}
                              style={{ flexGrow: 1 }}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ height: '44px', minWidth: 'auto', padding: '0 12px' }}
                              onClick={() => handleOpenNewIngrediente(idx)}
                              title="Registrar Nuevo Insumo"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ maxWidth: '120px' }}>
                          <label>Cant. ({unit})</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.cantidadRequerida === 0 || item.cantidadRequerida === '' ? '' : item.cantidadRequerida}
                            onChange={e => handleUpdateRecetaIngrediente(idx, 'cantidadRequerida', e.target.value)}
                            required
                          />
                        </div>

                        <button 
                          type="button" 
                          className="btn btn-action danger" 
                          style={{ height: '44px', minWidth: 'auto', padding: '0 8px' }}
                          onClick={() => handleRemoveIngredienteFromReceta(idx)}
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              )}

              {/* PASOS DE PREPARACIÓN */}
              {drawerTab === 'preparacion' && (
              <div className="mixo-card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', overflow: 'visible' }}>
                <div className="flex-row-between">
                  <h3>Guía de Preparación</h3>
                  <button type="button" className="btn btn-secondary" style={{ height: '36px', padding: '0 16px' }} onClick={handleAddPasoToReceta}>
                    + Añadir Paso
                  </button>
                </div>

                {recetaPasos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Registre los pasos operativos para estandarizar la receta.
                  </div>
                ) : (
                  recetaPasos.map((paso, idx) => (
                    <div className="mixo-card" key={idx} style={{ padding: '12px', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)', marginTop: '12px' }}>
                      <div className="flex-row-between">
                        <h4>Paso #{paso.numeroPaso}</h4>
                        <button type="button" className="btn btn-action danger" onClick={() => handleRemovePasoFromReceta(idx)}>
                          Eliminar Paso
                        </button>
                      </div>

                      <div className="form-row" style={{ marginTop: '8px' }}>
                        <div className="form-group col-2x">
                          <label>Estación de Cocina</label>
                          <CustomSelect
                            options={[
                              { value: 'preparacion_fria', label: 'Preparación Fría / Mesa' },
                              { value: 'estufa', label: 'Estufa / Cocción' },
                              { value: 'parrilla', label: 'Parrilla / Plancha' },
                              { value: 'horno', label: 'Horno' },
                              { value: 'emplatado', label: 'Emplatado / Servicio' }
                            ]}
                            value={paso.estacion}
                            onChange={val => handleUpdateRecetaPaso(idx, 'estacion', val)}
                          />
                        </div>

                        <div className="form-group col-1x">
                          <label>Tiempo (Min)</label>
                          <input 
                            type="number"
                            value={paso.tiempoMinutos === 0 || paso.tiempoMinutos === '' ? '' : paso.tiempoMinutos}
                            onChange={e => handleUpdateRecetaPaso(idx, 'tiempoMinutos', e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group col-1x">
                          <label>Temp. (ºC)</label>
                          <input 
                            type="number"
                            placeholder="Opcional"
                            value={paso.temperaturaObjetivo || ''}
                            onChange={e => handleUpdateRecetaPaso(idx, 'temperaturaObjetivo', e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: '8px' }}>
                        <label>Instrucciones de Cocción</label>
                        <textarea 
                          placeholder="Describa la acción..."
                          value={paso.descripcion}
                          onChange={e => handleUpdateRecetaPaso(idx, 'descripcion', e.target.value)}
                          required
                        />
                      </div>

                      {/* Vincular ingredientes a este paso */}
                      <div className="form-group" style={{ marginTop: '8px' }}>
                        <label>Insumos Usados en este Paso</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {recetaIngredientes.map(item => {
                            const ing = ingredientes.find(i => i.id === item.ingredienteId);
                            const sub = recetas.find(r => r.id === item.ingredienteId);
                            const name = ing ? ing.nombre : sub ? sub.nombre : 'Insumo';
                            const id = item.ingredienteId;
                            const isAssociated = paso.ingredientesAsociados.includes(id);

                            return (
                              <button
                                key={id}
                                type="button"
                                className={`btn ${isAssociated ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ height: '32px', minWidth: 'auto', padding: '0 12px', fontSize: '12px' }}
                                onClick={() => {
                                  const list = [...paso.ingredientesAsociados];
                                  if (isAssociated) {
                                    handleUpdateRecetaPaso(idx, 'ingredientesAsociados', list.filter(i => i !== id));
                                  } else {
                                    handleUpdateRecetaPaso(idx, 'ingredientesAsociados', [...list, id]);
                                  }
                                }}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              )}
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCancelRecetaEdit}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
                Guardar Receta
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Backdrop del Drawer de Insumos */}
      <div 
        className={`drawer-backdrop ${showInsumoForm ? 'open' : ''}`} 
        onClick={handleCloseInsumoDrawer}
        style={{ zIndex: 1250 }}
      />

      {/* Drawer Panel de Insumos */}
      <div className={`drawer-panel ${showInsumoForm ? 'open' : ''}`} style={{ zIndex: 1300 }}>
        <form onSubmit={handleSaveIngrediente} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="drawer-header">
            <h2>Nuevo Insumo</h2>
            <button 
              type="button" 
              className="drawer-close-btn" 
              onClick={handleCloseInsumoDrawer}
            >
              ×
            </button>
          </div>

          <div className="drawer-body">
            {editingIngInPanel && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                marginBottom: '12px'
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

            <span className="text-secondary" style={{ fontSize: '13px' }}>
              Defina las propiedades base del insumo para agregarlo al catálogo.
            </span>

            <div className="form-group" style={{ marginTop: '12px' }}>
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
              onClick={handleCloseInsumoDrawer}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              {editingIngInPanel ? 'Guardar Cambios' : 'Añadir Insumo'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={recipeToDelete !== null}
        title="Eliminar Receta"
        message={recipeToDelete ? `¿Estás seguro de que deseas eliminar la receta ${recipeToDelete.nombre}? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onCancel={() => setRecipeToDelete(null)}
        onConfirm={async () => {
          if (recipeToDelete) {
            await db.deleteReceta(recipeToDelete.id);
            setRecipeToDelete(null);
            onRefresh();
          }
        }}
      />
    </div>
  );
};
