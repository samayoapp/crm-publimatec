'use client';

import { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  Upload,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Trash2,
  Edit,
  Sparkles,
  Share2,
  Check,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Copy,
  Layers,
  X,
  ShieldCheck,
} from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  category: string;
  version?: string | null;
  isInstitutional: boolean;
  uploadedBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Todos los Recursos' },
  { id: 'CATALOGO', label: 'Catálogos Oficiales' },
  { id: 'PRESENTACION', label: 'Presentaciones (PPT/Canva)' },
  { id: 'FICHA_TECNICA', label: 'Fichas Técnicas' },
  { id: 'COTIZACION', label: 'Plantillas de Cotización' },
  { id: 'CONTRATO', label: 'Contratos & Formatos' },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CATALOGO');
  const [version, setVersion] = useState('v1');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // WhatsApp Share Dialog
  const [shareDoc, setShareDoc] = useState<ResourceItem | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappClientName, setWhatsappClientName] = useState('');

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents?institutional=true');
      const data = await res.json();
      if (data.documents) {
        setResources(data.documents);
      }
    } catch (err) {
      console.error('Error fetching institutional resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchUser();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyLink = (fileUrl: string) => {
    const full = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
    navigator.clipboard.writeText(full);
    showToast('Enlace copiado al portapapeles');
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError('Por favor ingresa un título para el recurso');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      let finalFileUrl = linkUrl.trim();
      let inferredType = 'LINK';
      let fileSize: number | null = null;

      if (uploadMode === 'file') {
        if (!fileToUpload) {
          throw new Error('Por favor selecciona un archivo para subir');
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const uploadRes = await fetch('/api/upload/document', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Error al subir archivo');
        }

        finalFileUrl = uploadData.url;
        inferredType = uploadData.fileType || 'PDF';
        fileSize = uploadData.size;
      } else {
        if (!linkUrl.trim()) {
          throw new Error('Por favor ingresa la URL del enlace');
        }
        const low = linkUrl.toLowerCase();
        if (low.includes('canva.com')) inferredType = 'PPT';
        else if (low.includes('drive.google.com') || low.includes('docs.google.com')) inferredType = 'LINK';
        else if (low.includes('sharepoint.com') || low.includes('onedrive')) inferredType = 'LINK';
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          fileUrl: finalFileUrl,
          fileType: inferredType,
          fileSize,
          category,
          version: version.trim() || 'v1',
          isInstitutional: true, // Siempre institucional aquí
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar recurso');
      }

      setIsModalOpen(false);
      setFileToUpload(null);
      setLinkUrl('');
      setTitle('');
      setDescription('');
      fetchResources();
      showToast('Recurso institucional publicado con éxito');
    } catch (err: any) {
      setModalError(err.message || 'Error al procesar el recurso');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string, itemTitle: string) => {
    if (!confirm(`¿Eliminar el recurso institucional "${itemTitle}"? Ya no estará disponible para los vendedores.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      fetchResources();
      showToast('Recurso eliminado');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDoc) return;

    const rawPhone = whatsappPhone.replace(/[^0-9]/g, '');
    const clientGreeting = whatsappClientName.trim() ? `Hola ${whatsappClientName.trim()}, ` : 'Hola, ';
    const fullUrl = shareDoc.fileUrl.startsWith('http')
      ? shareDoc.fileUrl
      : `${window.location.origin}${shareDoc.fileUrl}`;

    const text = `${clientGreeting}le comparto el recurso oficial de PUBLIMATEC: "${shareDoc.title}" (${shareDoc.category}): ${fullUrl}`;

    const targetUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(targetUrl, '_blank');
    setShareDoc(null);
    setWhatsappPhone('');
    setWhatsappClientName('');
  };

  const filteredResources = resources.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
    }
    return true;
  });

  const getDocBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return { label: 'PDF Oficial', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
      case 'PPT':
        return { label: 'PPT / Canva', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'EXCEL':
        return { label: 'Excel / Cotizador', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'WORD':
        return { label: 'Formato Word', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'IMAGE':
        return { label: 'Imagen / Render', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Enlace Nube', color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' };
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3 px-4 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-6 sm:p-8 text-white border border-indigo-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sales Enablement • Material Oficial Publimatec</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Biblioteca de Recursos & Material Comercial
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Catálogos corporativos, presentaciones oficiales en PPT/Canva, fichas técnicas de materiales y plantillas de cotización disponibles para todo el equipo de ventas.
            </p>
          </div>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => {
                setIsModalOpen(true);
                setModalError(null);
              }}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-lg shadow-white/10 transition-all flex items-center justify-center gap-2 shrink-0 group hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-indigo-600 group-hover:rotate-90 transition-transform" />
              <span>Publicar Recurso Oficial</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título o palabra clave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-2">Cargando biblioteca comercial...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 space-y-3">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No se encontraron recursos en esta categoría
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {currentUser?.role === 'ADMIN'
              ? 'Comienza subiendo el primer catálogo o presentación corporativa oficial de Publimatec.'
              : 'La Dirección Comercial aún no ha publicado documentos en esta sección.'}
          </p>
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Primer Recurso</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((item) => {
            const badge = getDocBadge(item.fileType);
            const sizeStr = formatSize(item.fileSize);
            return (
              <div
                key={item.id}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                      {item.fileType === 'PPT' ? (
                        <FileCode className="w-5 h-5 text-amber-500" />
                      ) : item.fileType === 'EXCEL' ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                      ) : item.fileType === 'IMAGE' ? (
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {item.version && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.version}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{sizeStr || 'Enlace externo'}</span>

                  <div className="flex items-center gap-1">
                    {/* Share WhatsApp */}
                    <button
                      onClick={() => setShareDoc(item)}
                      title="Compartir por WhatsApp"
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={() => handleCopyLink(item.fileUrl)}
                      title="Copiar enlace"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Open / Download */}
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={!item.fileUrl.startsWith('http')}
                      title="Ver o descargar"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete if Admin */}
                    {currentUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteResource(item.id, item.title)}
                        title="Eliminar recurso oficial"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: PUBLICAR RECURSO INSTITUCIONAL (ADMIN ONLY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Publicar Recurso Institucional
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Estará disponible para todo el equipo de ventas de PUBLIMATEC.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Mode Switcher: File vs Cloud Link */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  uploadMode === 'file'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Archivo (PDF, PPT, Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  uploadMode === 'link'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Enlace Nube / Canva / Drive</span>
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-3">
              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Archivo Oficial (Máx. 50MB) *
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFileToUpload(f);
                        if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL de Google Drive, Canva o SharePoint *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.canva.com/design/... o https://drive.google.com/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título Oficial del Recurso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Catálogo Oficial de Pantallas LED y Rótulos 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="CATALOGO">Catálogo Oficial</option>
                    <option value="PRESENTACION">Presentación Corporativa</option>
                    <option value="FICHA_TECNICA">Ficha Técnica</option>
                    <option value="COTIZACION">Plantilla de Cotización</option>
                    <option value="CONTRATO">Contrato & Formato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Versión
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 2026 v1"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Instrucciones para el Asesor
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. Presentación oficial para clientes medianos y corporativos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                >
                  {saving ? 'Publicando...' : 'Publicar Recurso Oficial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPARTIR POR WHATSAPP */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <Share2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Compartir por WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setShareDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block truncate">
                {shareDoc.title}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {shareDoc.category} • {shareDoc.version || 'v1'}
              </span>
            </div>

            <form onSubmit={handleSendWhatsApp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Lic. Mariana Zelaya"
                  value={whatsappClientName}
                  onChange={(e) => setWhatsappClientName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número de WhatsApp (Opcional si abres chat libre)
                </label>
                <input
                  type="tel"
                  placeholder="ej. 50499887766"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShareDoc(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Abrir WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
