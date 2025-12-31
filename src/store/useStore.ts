import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { normalizeKeyId, denormalizeKeyId } from '../utils/keyboardLayouts';

interface Action {
  type: 'key_down' | 'key_up' | 'mouse_click' | 'mouse_down' | 'mouse_up' | 'mouse_move';
  value?: string;
  button?: string;
  x?: number;
  y?: number;
  delay_ms: number;
  duration_ms?: number;
}

interface MacroConfig {
  id: string;
  name: string;
  trigger: {
    device: 'keyboard' | 'mouse';
    key: string;
  };
  mode: 'once' | 'hold' | 'toggle' | 'repeat';
  repeatCount?: number;
  repeatDelayMs?: number;
  actions: Action[];
}

interface Settings {
  language: string;
  auto_start: boolean;
  theme: 'light' | 'dark';
  layout: 'AZERTY' | 'QWERTY' | 'QWERTZ';
  keyboard_layout_type: 'AZERTY' | 'QWERTY';
  keyboard_size: '60%' | '80%' | '100%';
  keyboard_scale: number;
  cursor_scale: number;
  time_unit: 'ms' | 's' | 'm';
  active_profile: string;
  battery_level?: number;
  opacity?: number;
  illumination_color?: string;
  refresh_rate?: number;
}

interface Profile {
  name: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  view: 'dashboard' | 'settings' | 'list';
  selectedKey: string | null;
  macros: MacroConfig[];
  profiles: Profile[];
  settings: Settings;
  translations: Record<string, string>;
  antigravityEnabled: boolean;
  activeProfile: string;
  isSidebarOpen: boolean;
  notifications: Toast[];

  // Actions
  setView: (view: 'dashboard' | 'settings' | 'list') => void;
  setSelectedKey: (key: string | null) => void;
  setProfile: (profile: string) => Promise<void>;
  setMacros: (macros: MacroConfig[]) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;

  // Async Backend Actions
  loadMacros: () => Promise<void>;
  saveMacro: (macro: MacroConfig) => Promise<{ success: boolean; error?: string }>;
  deleteMacro: (id: string) => Promise<{ success: boolean; error?: string }>;
  exportMacro: (macro: MacroConfig) => Promise<string>;
  importMacro: (base64: string) => Promise<void>;
  loadConfig: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>, persist?: boolean) => Promise<void>;
  loadTranslations: (lang: string) => Promise<void>;
  loadProfiles: () => Promise<void>;
  createProfile: (name: string) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;
  bindMacroToKey: (macroId: string, keyId: string) => Promise<{ success: boolean; error?: string }>;

  // Helpers
  t: (key: string) => string;
}

export const useStore = create<AppState>((set, get) => ({
  view: 'dashboard',
  selectedKey: null,
  macros: [],
  profiles: [],
  settings: {
    language: 'fr',
    auto_start: false,
    theme: 'dark',
    layout: 'AZERTY',
    keyboard_layout_type: 'AZERTY',
    keyboard_size: '100%',
    keyboard_scale: 1.2,
    cursor_scale: 0.9,
    time_unit: 'ms',
    active_profile: 'Default',
    opacity: 95,
    illumination_color: '#6366f1',
    refresh_rate: 1
  },
  translations: {},
  antigravityEnabled: false,
  activeProfile: 'Default',
  isSidebarOpen: false,
  notifications: [],

  setView: (view) => set({ view }),
  setSelectedKey: (selectedKey) => {
    const normalized = selectedKey ? normalizeKeyId(selectedKey) : null;
    set({ selectedKey: normalized });
  },
  setProfile: async (activeProfile) => {
    set({ activeProfile });
    await get().updateSettings({ active_profile: activeProfile });
    await get().loadMacros();
    // Persister le changement de profil
    try {
      await invoke("save_profile_to_disk", { profile: { name: activeProfile } });
    } catch (e) {
      console.error("Erreur de sauvegarde profil:", e);
    }
  },
  setMacros: (macros) => set({ macros }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  addNotification: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    setTimeout(() => get().removeNotification(id), 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  loadMacros: async () => {
    try {
      console.log("🔍 [useStore] Chargement des macros...");
      const macros = await invoke<MacroConfig[]>("get_all_macros");
      console.log(`📥 [useStore] ${macros.length} macros reçues du backend`);

      // Verification explicite du chargement
      if (macros.length > 0) {
        console.log("📝 Exemple de macro:", JSON.stringify(macros[0], null, 2));
      } else {
        console.warn("⚠️ Aucune macro chargée. Vérifiez l'existence des fichiers.");
      }

      const denormalizedMacros = macros.map(m => {
        const normalized = {
          ...m,
          trigger: {
            ...m.trigger,
            key: normalizeKeyId(m.trigger.key)
          }
        };
        // console.log(`  - Macro: ${m.name}, Key: ${m.trigger.key} -> ${normalized.trigger.key}`);
        return normalized;
      });

      set({ macros: denormalizedMacros });
      console.log("✅ [useStore] Macros mises à jour dans le store Zustand");
    } catch (error) {
      console.error("❌ [useStore] Failed to load macros:", error);
    }
  },

  saveMacro: async (macro) => {
    try {
      // Basic validation for name and characters
      const forbiddenChars = /[<>:"/\\|?*]/;
      if (forbiddenChars.test(macro.name)) {
        return { success: false, error: "invalid_chars" };
      }

      // Check for duplicate name if it's a new macro
      const existing = get().macros.find(m => m.name.toLowerCase() === macro.name.toLowerCase() && m.id !== macro.id);
      if (existing) {
        return { success: false, error: "duplicate_name" };
      }

      const normalizedMacro = {
        ...macro,
        trigger: {
          ...macro.trigger,
          key: normalizeKeyId(macro.trigger.key)
        }
      };

      console.log("🚀 [useStore] Envoi à save_macro:", JSON.stringify(normalizedMacro, null, 2));

      await invoke("save_macro", {
        macroConfig: normalizedMacro
      });

      await get().loadMacros();
      get().addNotification('Macro sauvegardée !', 'success');
      return { success: true };
    } catch (error) {
      console.error("Failed to save macro:", error);
      get().addNotification('Erreur lors de la sauvegarde', 'error');
      return { success: false, error: "save_failed" };
    }
  },

  deleteMacro: async (id: string) => {
    try {
      console.log(`🗑️ [useStore] Suppression de la macro: ${id}`);
      await invoke("delete_macro", { id });
      await get().loadMacros();
      return { success: true };
    } catch (error) {
      console.error("❌ [useStore] Failed to delete macro:", error);
      return { success: false, error: String(error) };
    }
  },

  exportMacro: async (macro) => {
    return await invoke<string>("export_macro_base64", { macro_config: macro });
  },

  importMacro: async (base64) => {
    try {
      await invoke("import_macro_base64", { data: base64 });
      await get().loadMacros();
    } catch (error) {
      console.error("Failed to import macro:", error);
    }
  },

  loadConfig: async () => {
    try {
      const config = await invoke<any>("get_config");
      if (config && config.settings) {
        set({
          settings: { ...get().settings, ...config.settings },
          activeProfile: config.settings.active_profile || 'Default'
        });
        await get().loadTranslations(config.settings.language);
        await get().loadMacros();
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  },

  updateSettings: async (newSettings, persist = true) => {
    try {
      const updated = { ...get().settings, ...newSettings };
      set({ settings: updated });
      if (persist) {
        await invoke("save_config", { config: { settings: updated } });
      }
      if (newSettings.language) {
        await get().loadTranslations(newSettings.language);
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  },

  loadTranslations: async (lang: string) => {
    try {
      const translations = await invoke<Record<string, string>>("get_translations", { lang });
      set({ translations });
    } catch (error) {
      console.error("Failed to load translations:", error);
    }
  },

  loadProfiles: async () => {
    try {
      const profiles = await invoke<Profile[]>("get_all_profiles");
      set({ profiles });
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  },

  createProfile: async (name: string) => {
    try {
      const profile = { name };
      await invoke("save_profile", { profile });
      await invoke("save_profile_to_disk", { profile });
      await get().loadProfiles();
      await get().setProfile(name);
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  },

  deleteProfile: async (name: string) => {
    try {
      await invoke("delete_profile", { name });
      await get().loadProfiles();
      if (get().activeProfile === name) {
        await get().setProfile('Default');
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
    }
  },

  bindMacroToKey: async (macroId: string, keyId: string) => {
    try {
      const macro = get().macros.find(m => m.id === macroId);
      if (!macro) return { success: false, error: "macro_not_found" };

      const normalizedKey = normalizeKeyId(keyId);

      // Si la touche est 'UNASSIGNED', on met simplement à jour la macro existante
      // Sinon, on clone la macro pour la nouvelle touche (comportement attendu du drag & drop)
      if (macro.trigger.key === 'UNASSIGNED') {
        const updatedMacro: MacroConfig = {
          ...macro,
          trigger: {
            ...macro.trigger,
            key: normalizedKey
          }
        };
        await invoke("save_macro", { macroConfig: updatedMacro });
      } else {
        // Si on glisse une macro déjà assignée sur une nouvelle touche
        const newMacro: MacroConfig = {
          ...macro,
          id: crypto.randomUUID(),
          trigger: {
            ...macro.trigger,
            key: normalizedKey
          }
        };
        await invoke("save_macro", { macroConfig: newMacro });
      }

      await get().loadMacros();
      get().addNotification('Macro liée à la touche !', 'success');
      return { success: true };
    } catch (error) {
      console.error("Failed to bind macro to key:", error);
      get().addNotification('Erreur lors de la liaison', 'error');
      return { success: false, error: "bind_failed" };
    }
  },

  t: (key: string) => {
    return get().translations[key] || key;
  }
}));
