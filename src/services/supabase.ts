import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Mixo Offline-First Mode: Las credenciales de Supabase no están configuradas en las variables de entorno. ' +
    'La aplicación operará en modo 100% local en IndexedDB/LocalStorage. ' +
    'Para activar la sincronización, configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env.'
  );
}

// Inicializar el cliente. Si no está configurado, pasamos strings de prueba para evitar caídas en el arranque.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
