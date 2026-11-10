/**
 * CRM SPA In-Memory & Session Cache
 * Permite que la navegación entre páginas (Dashboard, Contactos, Empresas, Embudo, Propuestas)
 * sea INSTANTÁNEA (0 ms), manteniendo los datos calientes en memoria como una verdadera SPA,
 * y revalidando en segundo plano (Stale-While-Revalidate) sin bloquear al usuario con "Cargando...".
 */

interface CacheStore {
  dashboard: Record<string, { data: any; timestamp: number }>;
  contacts: any[] | null;
  contactsTimestamp: number;
  companies: any[] | null;
  companiesTimestamp: number;
  proposals: any[] | null;
  proposalsTimestamp: number;
  team: any[] | null;
  teamTimestamp: number;
  currentUser: any | null;
}

const memoryStore: CacheStore = {
  dashboard: {},
  contacts: null,
  contactsTimestamp: 0,
  companies: null,
  companiesTimestamp: 0,
  proposals: null,
  proposalsTimestamp: 0,
  team: null,
  teamTimestamp: 0,
  currentUser: null,
};

// Duración de frescura antes de pedir en background (45 segundos)
const STALE_TIME = 45 * 1000;

export const crmCache = {
  // Current User
  getUser(): any | null {
    if (memoryStore.currentUser) return memoryStore.currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('crm_active_user');
        if (stored) {
          memoryStore.currentUser = JSON.parse(stored);
          return memoryStore.currentUser;
        }
      } catch (e) {}
    }
    return null;
  },
  setUser(user: any) {
    if (!user) return;
    memoryStore.currentUser = user;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('crm_active_user', JSON.stringify(user));
      } catch (e) {}
    }
  },

  // Dashboard (soporta clave por filtro de asesor, por defecto 'ME')
  getDashboard(filterKey: string = 'ME'): { data: any | null; isStale: boolean } {
    const entry = memoryStore.dashboard[filterKey];
    return {
      data: entry?.data || null,
      isStale: !entry || Date.now() - entry.timestamp > STALE_TIME,
    };
  },
  setDashboard(data: any, filterKey: string = 'ME') {
    memoryStore.dashboard[filterKey] = {
      data,
      timestamp: Date.now(),
    };
  },

  // Contacts
  getContacts(): { data: any[] | null; isStale: boolean } {
    return {
      data: memoryStore.contacts,
      isStale: Date.now() - memoryStore.contactsTimestamp > STALE_TIME,
    };
  },
  setContacts(data: any[]) {
    memoryStore.contacts = data;
    memoryStore.contactsTimestamp = Date.now();
  },

  // Companies
  getCompanies(): { data: any[] | null; isStale: boolean } {
    return {
      data: memoryStore.companies,
      isStale: Date.now() - memoryStore.companiesTimestamp > STALE_TIME,
    };
  },
  setCompanies(data: any[]) {
    memoryStore.companies = data;
    memoryStore.companiesTimestamp = Date.now();
  },

  // Proposals
  getProposals(): { data: any[] | null; isStale: boolean } {
    return {
      data: memoryStore.proposals,
      isStale: Date.now() - memoryStore.proposalsTimestamp > STALE_TIME,
    };
  },
  setProposals(data: any[]) {
    memoryStore.proposals = data;
    memoryStore.proposalsTimestamp = Date.now();
  },

  // Team
  getTeam(): { data: any[] | null; isStale: boolean } {
    return {
      data: memoryStore.team,
      isStale: Date.now() - memoryStore.teamTimestamp > STALE_TIME,
    };
  },
  setTeam(data: any[]) {
    memoryStore.team = data;
    memoryStore.teamTimestamp = Date.now();
  },

  // Invalidate specific cache
  invalidate(key?: 'dashboard' | 'contacts' | 'companies' | 'proposals' | 'team' | 'all') {
    if (!key || key === 'all') {
      memoryStore.dashboard = {};
      memoryStore.contactsTimestamp = 0;
      memoryStore.companiesTimestamp = 0;
      memoryStore.proposalsTimestamp = 0;
      memoryStore.teamTimestamp = 0;
    } else if (key === 'dashboard') {
      memoryStore.dashboard = {};
    } else if (key === 'contacts') {
      memoryStore.contactsTimestamp = 0;
      memoryStore.dashboard = {};
    } else if (key === 'companies') {
      memoryStore.companiesTimestamp = 0;
      memoryStore.contactsTimestamp = 0;
    } else if (key === 'proposals') {
      memoryStore.proposalsTimestamp = 0;
      memoryStore.dashboard = {};
    } else if (key === 'team') {
      memoryStore.teamTimestamp = 0;
    }
  },

  // Prefetch data in background
  async prefetchCoreData() {
    try {
      const promises: Promise<any>[] = [];

      if (!memoryStore.contacts || Date.now() - memoryStore.contactsTimestamp > STALE_TIME) {
        promises.push(
          fetch('/api/contacts')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.contacts && crmCache.setContacts(d.contacts))
            .catch(() => {})
        );
      }

      if (!memoryStore.companies || Date.now() - memoryStore.companiesTimestamp > STALE_TIME) {
        promises.push(
          fetch('/api/companies')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.companies && crmCache.setCompanies(d.companies))
            .catch(() => {})
        );
      }

      if (!memoryStore.proposals || Date.now() - memoryStore.proposalsTimestamp > STALE_TIME) {
        promises.push(
          fetch('/api/proposals')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.proposals && crmCache.setProposals(d.proposals))
            .catch(() => {})
        );
      }

      await Promise.all(promises);
    } catch (e) {}
  },
};
