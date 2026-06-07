import { useState, useEffect } from 'react';
import { db } from './services/db';
import type { ConfiguracionCostos } from './services/db';
import { ChefConsole } from './components/ChefConsole';
import { AdminConsole } from './components/AdminConsole';
import logoBlanco from './assets/logo-blanco.svg';
import logoNegro from './assets/logo-negro.svg';

type ChefTab    = 'dashboard' | 'recetas' | 'lotes' | 'planificador';
type AdminSubTab = 'compras' | 'insumos' | 'ventas' | 'mermas' | 'financiero';
type ActiveSection = 'chef' | 'admin';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('mixo_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [activeSection, setActiveSection] = useState<ActiveSection>('chef');
  const [activeChefTab,  setActiveChefTab]  = useState<ChefTab>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSubTab>('compras');
  const [config, setConfig] = useState<ConfiguracionCostos | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchConfig = async () => {
    const current = await db.getConfiguracion();
    setConfig(current);
  };

  useEffect(() => { fetchConfig(); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mixo_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const handleUpdateConfig = async (newConfig: ConfiguracionCostos) => {
    const updated = await db.saveConfiguracion(newConfig);
    setConfig(updated);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSwitchTab = (tab: string, section: 'chef' | 'admin' = 'chef') => {
    setActiveSection(section);
    if (section === 'chef') {
      setActiveChefTab(tab as ChefTab);
    } else {
      setActiveAdminTab(tab as AdminSubTab);
    }
  };

  if (!config) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <span className="badge accent">Cargando Mixo...</span>
      </div>
    );
  }

  // Cocina: flujo natural de un cocinero
  const chefTabs: { key: ChefTab; label: string }[] = [
    { key: 'dashboard',    label: 'Resumen'      },
    { key: 'recetas',      label: 'Recetario'    },
    { key: 'lotes',        label: 'Producción'   },
    { key: 'planificador', label: 'Planificador' },
  ];

  // Admin: flujo operativo lógico
  const adminTabs: { key: AdminSubTab; label: string }[] = [
    { key: 'ventas',     label: 'Ventas'         },
    { key: 'compras',    label: 'Compras'        }, // incluye Proveedores e Historial
    { key: 'insumos',    label: 'Inventario'     },
    { key: 'mermas',     label: 'Mermas'         },
    { key: 'financiero', label: 'Configuración'  },
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img 
            src={theme === 'dark' ? logoBlanco : logoNegro} 
            alt="Mixo" 
            style={{ maxWidth: '80%', height: 'auto', display: 'block', margin: '0 auto' }} 
          />
        </div>

        {/* Resumen General */}
        <button
          className={`sidebar-nav-item ${activeSection === 'chef' && activeChefTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveSection('chef'); setActiveChefTab('dashboard'); }}
          title="Resumen General"
        >
          Resumen General
        </button>

        {/* Sección Cocina */}
        <div className="sidebar-section-label">Cocina</div>
        {chefTabs.filter(tab => tab.key !== 'dashboard').map(tab => (
          <button
            key={tab.key}
            className={`sidebar-nav-item ${activeSection === 'chef' && activeChefTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveSection('chef'); setActiveChefTab(tab.key); }}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}

        {/* Sección Admin */}
        <div className="sidebar-section-label">Administración</div>
        {adminTabs.map(tab => (
          <button
            key={tab.key}
            className={`sidebar-nav-item ${activeSection === 'admin' && activeAdminTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveSection('admin'); setActiveAdminTab(tab.key); }}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}

        {/* Footer del sidebar */}
        <div className="sidebar-footer">
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={toggleTheme}>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="app-content">
        {activeSection === 'admin' ? (
          <AdminConsole
            config={config}
            onUpdateConfig={handleUpdateConfig}
            key={`admin-${refreshTrigger}`}
            onRefreshData={fetchConfig}
            activeSubTab={activeAdminTab}
            onChangeSubTab={setActiveAdminTab}
          />
        ) : (
          <ChefConsole
            config={config}
            activeTab={activeChefTab}
            onChangeTab={setActiveChefTab}
            key={`chef-${refreshTrigger}`}
            onRefreshData={fetchConfig}
            onSwitchTabGlobal={handleSwitchTab}
          />
        )}
      </main>
    </div>
  );
}

export default App;
