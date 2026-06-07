import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { ConfiguracionCostos, Ingrediente } from '../services/db';
import { ComprasModule } from './admin/ComprasModule';
import { MermasTab } from './admin/MermasTab';
import { VentasTab } from './admin/VentasTab';
import { FinancieroTab } from './admin/FinancieroTab';
import { InsumosTab } from './chef/InsumosTab';

interface AdminConsoleProps {
  config: ConfiguracionCostos;
  onUpdateConfig: (newConfig: ConfiguracionCostos) => void;
  onRefreshData?: () => void;
  activeSubTab: 'compras' | 'insumos' | 'ventas' | 'mermas' | 'financiero';
  onChangeSubTab: (tab: 'compras' | 'insumos' | 'ventas' | 'mermas' | 'financiero') => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  config,
  onUpdateConfig,
  onRefreshData,
  activeSubTab,
}) => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);

  const loadCatalogos = async () => {
    const listIng = await db.getIngredientes();
    setIngredientes(listIng);
  };

  useEffect(() => {
    loadCatalogos();
  }, []);

  const handleRefresh = () => {
    loadCatalogos();
    if (onRefreshData) onRefreshData();
  };

  return (
    <>
      {activeSubTab === 'compras'    && <ComprasModule onRefresh={handleRefresh} />}
      {activeSubTab === 'insumos'    && (
        <InsumosTab 
          ingredientes={ingredientes}
          onRefresh={handleRefresh}
        />
      )}
      {activeSubTab === 'ventas'     && <VentasTab     onRefresh={handleRefresh} />}
      {activeSubTab === 'mermas'     && <MermasTab     onRefresh={handleRefresh} />}
      {activeSubTab === 'financiero' && (
        <FinancieroTab config={config} onUpdateConfig={onUpdateConfig} />
      )}
    </>
  );
};
