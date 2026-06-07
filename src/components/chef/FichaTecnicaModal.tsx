import React from 'react';
import { db } from '../../services/db';
import type { Ingrediente, Receta, LoteProduccion, IngredienteReceta } from '../../services/db';

interface FichaTecnicaModalProps {
  receta: Receta;
  recetas: Receta[];
  ingredientes: Ingrediente[];
  lotesProduccion: LoteProduccion[];
  onClose: () => void;
}

export const FichaTecnicaModal: React.FC<FichaTecnicaModalProps> = ({
  receta,
  recetas,
  ingredientes,
  lotesProduccion,
  onClose
}) => {
  // --- CÁLCULO DE COSTO TOTAL ---
  const getCostoTotalLote = (ings: IngredienteReceta[]): number => {
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

  return (
    <div className="mixo-card" style={{ backgroundColor: 'var(--color-surface-card)' }}>
      <div className="flex-row-between" style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '16px' }}>
        <div>
          <h1>FICHA TÉCNICA DE COCINA</h1>
          <span className="text-secondary">Estandarización Operativa del Menú - Mixo Ecosistema</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2>{receta.nombre.toUpperCase()}</h2>
          {receta.codigoIntegracionPOS && (
            <div className="badge accent" style={{ display: 'inline-block', marginTop: '4px' }}>
              SKU POS: {receta.codigoIntegracionPOS}
            </div>
          )}
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginTop: '20px' }}>
        <div className="mixo-card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)' }}>
          <h3>Especificaciones del Lote</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <p><strong>Rendimiento de Lote:</strong> {receta.cantidadRendimiento} {receta.unidadRendimiento}</p>
            <p><strong>Vida Útil Recomendada:</strong> {receta.vidaUtilHoras || 'N/A'} Horas</p>
            <p><strong>Conservación:</strong> {receta.temperaturaAlmacenado || 'N/A'}</p>
            <p><strong>Tiempo total de cocina:</strong> {receta.tiempoPreparacionTotal} minutos</p>
            {(() => {
              const costoLote = getCostoTotalLote(receta.ingredientes);
              const costoPorcion = costoLote / receta.cantidadRendimiento;
              const lotesReceta = lotesProduccion
                .filter(l => l.recetaId === receta.id)
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
              const ultimoLote = lotesReceta[0];

              return (
                <>
                  <p><strong>Costo de Insumos (Teórico):</strong> ${costoLote.toFixed(2)} (${costoPorcion.toFixed(2)} / {receta.unidadRendimiento === 'porciones' ? 'porción' : receta.unidadRendimiento})</p>
                  {ultimoLote && (
                    <p><strong>Último Costo Lote Real:</strong> <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>${ultimoLote.costoTotalInsumos.toFixed(2)} (${ultimoLote.costoPorcionReal.toFixed(2)} / {receta.unidadRendimiento === 'porciones' ? 'porción' : receta.unidadRendimiento})</span></p>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="mixo-card" style={{ padding: '16px', backgroundColor: 'var(--color-bg-base)' }}>
          <h3>Alérgenos e Inocuidad</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {receta.alergenos.length === 0 ? (
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Este plato es seguro, libre de alérgenos comunes.</span>
            ) : (
              receta.alergenos.map(a => (
                <span key={a} className="badge accent" style={{ backgroundColor: '#ff8a80', color: '#000', fontWeight: '500' }}>
                  Alérgeno: {a.toUpperCase()}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ingredientes de la Ficha */}
      <div style={{ marginTop: '24px' }}>
        <h3>Insumos Necesarios</h3>
        <table style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <th>Insumo / Sub-receta</th>
              <th>Cantidad Requerida</th>
            </tr>
          </thead>
          <tbody>
            {receta.ingredientes.map((item, idx) => {
              const ing = ingredientes.find(i => i.id === item.ingredienteId);
              const sub = recetas.find(r => r.id === item.ingredienteId);
              const name = ing ? ing.nombre : sub ? sub.nombre : 'Insumo';
              const unit = ing ? ing.unidadReceta : sub ? sub.unidadRendimiento : '';
              return (
                <tr key={idx}>
                  <td><strong>{name}</strong></td>
                  <td>{item.cantidadRequerida} {unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pasos de Preparación de la Ficha */}
      <div style={{ marginTop: '24px' }}>
        <h3>Guía Operativa de Preparación</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {receta.pasos.map((paso, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: 'var(--color-text-on-accent)', fontWeight: 'bold' }}>
                  {paso.numeroPaso}
                </div>
                <span className="text-secondary" style={{ fontSize: '10px', marginTop: '4px' }}>{paso.tiempoMinutos} min</span>
              </div>

              <div style={{ flexGrow: 1 }}>
                <div className="flex-row-between">
                  <strong style={{ textTransform: 'capitalize' }}>Estación: {paso.estacion.replace('_', ' ')}</strong>
                  {paso.temperaturaObjetivo && (
                    <span style={{ color: '#ff8a80', fontSize: '14px', fontWeight: '500' }}>
                      Temperatura: {paso.temperaturaObjetivo}ºC
                    </span>
                  )}
                </div>
                <p style={{ marginTop: '4px', fontSize: '15px' }}>{paso.descripcion}</p>
                
                {/* Insumos usados en este paso */}
                {paso.ingredientesAsociados.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Usar en este paso:</span>
                    {paso.ingredientesAsociados.map(id => {
                      const ing = ingredientes.find(i => i.id === id);
                      const sub = recetas.find(r => r.id === id);
                      const name = ing ? ing.nombre : sub ? sub.nombre : 'Insumo';
                      return (
                        <span key={id} className="badge" style={{ fontSize: '10px' }}>{name}</span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-row-between" style={{ marginTop: '32px' }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Volver al Recetario
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir Ficha Técnica
        </button>
      </div>
    </div>
  );
};
