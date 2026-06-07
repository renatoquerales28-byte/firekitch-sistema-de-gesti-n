import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import type { Ingrediente, Proveedor, RegistroHistoricoPrecio } from '../../services/db';
import { CustomSelect } from '../CustomSelect';

interface HistorialPreciosTabProps {
  onRefresh?: () => void;
}

export const HistorialPreciosTab: React.FC<HistorialPreciosTabProps> = () => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<string>('');
  const [historialOriginal, setHistorialOriginal] = useState<RegistroHistoricoPrecio[]>([]);
  const [historialFiltrado, setHistorialFiltrado] = useState<any[]>([]);

  const loadData = async () => {
    const listIng = await db.getIngredientes();
    const listProv = await db.getProveedores();
    const listHist = await db.getHistoricoPrecios();
    
    setIngredientes(listIng);
    setProveedores(listProv);
    setHistorialOriginal(listHist);

    // Seleccionar por defecto el primer ingrediente si hay disponibles
    if (listIng.length > 0 && !selectedIngredienteId) {
      setSelectedIngredienteId(listIng[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedIngredienteId) {
      setHistorialFiltrado([]);
      return;
    }

    const ing = ingredientes.find(i => i.id === selectedIngredienteId);
    if (!ing) return;

    // 1. Filtrar registros del ingrediente seleccionado y ordenar por fecha ascendente para calcular variaciones
    const registrosIng = historialOriginal
      .filter(h => h.ingredienteId === selectedIngredienteId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 2. Mapear calculando la variación porcentual con respecto al precio anterior
    const historialConVariacion = registrosIng.map((reg, idx) => {
      let variacion = 0;
      let precioAnterior = 0;
      
      if (idx > 0) {
        precioAnterior = registrosIng[idx - 1].precioUnitarioAP;
        variacion = precioAnterior > 0 
          ? ((reg.precioUnitarioAP - precioAnterior) / precioAnterior) * 100 
          : 0;
      }

      // Convertir precio unitario de uso interno a precio comercial
      const scale = (ing.unidadReceta === 'g' || ing.unidadReceta === 'ml') ? 1000 : 1;
      const precioComercial = reg.precioUnitarioAP * scale;
      const precioAnteriorComercial = precioAnterior * scale;

      return {
        ...reg,
        precioComercial,
        precioAnteriorComercial,
        variacion,
        unidadComercial: ing.unidadReceta === 'g' ? 'kg' : ing.unidadReceta === 'ml' ? 'L' : 'ud.'
      };
    });

    // 3. Invertir el orden para mostrar del más reciente al más antiguo en la tabla
    setHistorialFiltrado([...historialConVariacion].reverse());
  }, [selectedIngredienteId, historialOriginal, ingredientes]);

  const ingSeleccionado = ingredientes.find(i => i.id === selectedIngredienteId);

  // KPIs
  const totalRegistros = historialFiltrado.length;
  const precioActual = ingSeleccionado ? (ingSeleccionado.precioActivo || 0) * ((ingSeleccionado.unidadReceta === 'g' || ingSeleccionado.unidadReceta === 'ml') ? 1000 : 1) : 0;
  
  const preciosComerciales = historialFiltrado.map(h => h.precioComercial);
  const precioMax = preciosComerciales.length > 0 ? Math.max(...preciosComerciales) : 0;
  const precioMin = preciosComerciales.length > 0 ? Math.min(...preciosComerciales) : 0;
  const ultimaVariacion = historialFiltrado.length > 0 ? historialFiltrado[0].variacion : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0 }}>
      <div className="mixo-card" style={{ padding: '24px' }}>
        <div className="flex-row-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <h2>Historial de Costos de Insumos</h2>
            <span className="text-secondary">Analice la variación de precios de compra y ajustes manuales a lo largo del tiempo.</span>
          </div>
        </div>

        {/* Selector de ingrediente */}
        <div style={{ maxWidth: '400px', marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
            Seleccionar Insumo / Ingrediente
          </label>
          <CustomSelect
            options={ingredientes.map(i => ({
              value: i.id,
              label: `${i.nombre} (${i.unidadReceta === 'g' ? 'kg' : i.unidadReceta === 'ml' ? 'L' : 'ud.'})`
            }))}
            value={selectedIngredienteId}
            onChange={val => setSelectedIngredienteId(val)}
          />
        </div>

        {selectedIngredienteId && ingSeleccionado && (
          <>
            {/* KPIs Tarjetas */}
            <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '20px' }}>
              <div className="mixo-card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Costo Activo de Referencia</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px', color: 'var(--color-accent)' }}>
                  ${precioActual.toFixed(2)}
                  <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>
                    {` / ${ingSeleccionado.unidadReceta === 'g' ? 'kg' : ingSeleccionado.unidadReceta === 'ml' ? 'L' : 'ud.'}`}
                  </span>
                </h3>
                {totalRegistros > 1 && (
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 600,
                    color: ultimaVariacion > 0 ? '#ff8a80' : ultimaVariacion < 0 ? '#81c784' : 'var(--color-text-secondary)' 
                  }}>
                    {ultimaVariacion > 0 ? `+${ultimaVariacion.toFixed(1)}% (aumento) vs anterior` : ultimaVariacion < 0 ? `${ultimaVariacion.toFixed(1)}% (reducción) vs anterior` : 'Sin variación vs anterior'}
                  </span>
                )}
              </div>

              <div className="mixo-card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Mínimo Histórico</span>
                    <h4 style={{ fontSize: '20px', marginTop: '4px', color: '#81c784' }}>
                      ${precioMin.toFixed(2)}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>
                        {` / ${ingSeleccionado.unidadReceta === 'g' ? 'kg' : ingSeleccionado.unidadReceta === 'ml' ? 'L' : 'ud.'}`}
                      </span>
                    </h4>
                  </div>
                  <div>
                    <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Máximo Histórico</span>
                    <h4 style={{ fontSize: '20px', marginTop: '4px', color: '#ff8a80' }}>
                      ${precioMax.toFixed(2)}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>
                        {` / ${ingSeleccionado.unidadReceta === 'g' ? 'kg' : ingSeleccionado.unidadReceta === 'ml' ? 'L' : 'ud.'}`}
                      </span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de registros */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: '150px' }}>Fecha</th>
                    <th className="text-left">Origen / Transacción</th>
                    <th className="text-right" style={{ width: '130px' }}>Cantidad</th>
                    <th className="text-right" style={{ width: '150px' }}>Precio Comercial</th>
                    <th className="text-right" style={{ width: '150px' }}>Variación (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {historialFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '24px' }}>
                        No hay registros históricos para este insumo.
                      </td>
                    </tr>
                  ) : (
                    historialFiltrado.map((h, idx) => {
                      const isManual = h.proveedorId === 'ajuste_manual';
                      let origenLabel = 'Compra registrada';
                      
                      if (isManual) {
                        origenLabel = 'Ajuste Manual por Administrador';
                      } else {
                        const prov = proveedores.find(p => p.id === h.proveedorId);
                        origenLabel = prov ? `Factura — ${prov.nombreComercial}` : 'Factura de Compra';
                      }

                      // Estilos de variación porcentual
                      let varColor = 'var(--color-text-secondary)';
                      let varLabel = '0.0%';
                      if (h.variacion > 0) {
                        varColor = '#ff8a80'; // Rojo
                        varLabel = `+${h.variacion.toFixed(1)}% (alza)`;
                      } else if (h.variacion < 0) {
                        varColor = '#81c784'; // Verde
                        varLabel = `${h.variacion.toFixed(1)}% (baja)`;
                      }

                      // Si es el primer elemento cronológico (el último en el array revertido), no tiene variación anterior
                      const esPrimerRegistro = idx === historialFiltrado.length - 1;

                      return (
                        <tr key={h.id}>
                          <td className="text-center">
                            {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="text-left">
                            <strong style={{ color: isManual ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                              {origenLabel}
                            </strong>
                          </td>
                          <td className="text-right" style={{ color: isManual ? 'var(--color-text-secondary)' : 'inherit' }}>
                            {isManual ? '—' : `${h.cantidad.toFixed(2)} ${ingSeleccionado.unidadReceta}`}
                          </td>
                          <td className="text-right">
                            <strong>${h.precioComercial.toFixed(2)}</strong> / {h.unidadComercial}
                          </td>
                          <td className="text-right" style={{ color: varColor, fontWeight: 600 }}>
                            {esPrimerRegistro ? 'Inicial' : varLabel}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
