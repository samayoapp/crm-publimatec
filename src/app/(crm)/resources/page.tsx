'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FolderOpen,
  Folder as FolderIcon,
  FolderPlus,
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
  ChevronRight,
  Tag as TagIcon,
  FolderSymlink,
  User as UserIcon,
  Users,
  MoreVertical,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import FilePreviewModal from '@/components/FilePreviewModal';

interface FolderItem {
  id: string;
  name: string;
  color?: string | null;
  isInstitutional: boolean;
  userId?: string | null;
  _count?: {
    documents: number;
  };
  createdAt: string;
}

interface ResourceItem {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  category: string;
  tags?: string[];
  version?: string | null;
  isInstitutional: boolean;
  folderId?: string | null;
  folder?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  uploadedBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_TAGS = [
  'Catálogo',
  'Presentación',
  'Ficha Técnica',
  'Cotización',
  'Contrato',
  'Plantilla',
  'Brochure',
  'Tarifario',
  'Propuesta',
  'Render',
];

const FOLDER_COLORS: { id: string; label: string; bg: string; text: string; border: string; ring: string }[] = [
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-500/10 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', ring: 'ring-indigo-500' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500/10 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-500' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500/10 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', ring: 'ring-amber-500' },
  { id: 'rose', label: 'Rosa / Rojo', bg: 'bg-rose-500/10 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', ring: 'ring-rose-500' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-500/10 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', ring: 'ring-purple-500' },
  { id: 'cyan', label: 'Cian', bg: 'bg-cyan-500/10 dark:bg-cyan-950/40', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', ring: 'ring-cyan-500' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-500/10 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', ring: 'ring-blue-500' },
];

export default function ResourcesPage() {
  // Tabs: institutional vs personal
  const [activeTab, setActiveTab] = useState<'institutional' | 'personal'>('institutional');

  // User & Team data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('');

  // Resources & Folders
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Folder Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('indigo');
  const [savingFolder, setSavingFolder] = useState(false);

  // Document Upload / Edit Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ResourceItem | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFolderId, setDocFolderId] = useState<string>('');
  const [docTags, setDocTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [docVersion, setDocVersion] = useState('v1');
  const [savingDoc, setSavingDoc] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Move Document Modal
  const [moveDoc, setMoveDoc] = useState<ResourceItem | null>(null);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string>('');

  // WhatsApp Share Dialog
  const [shareDoc, setShareDoc] = useState<ResourceItem | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappClientName, setWhatsappClientName] = useState('');

  // Floating File Preview Modal
  const [previewDoc, setPreviewDoc] = useState<ResourceItem | null>(null);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch initial user and team
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          setSelectedAdvisorId(data.user.id);
          if (data.user.role === 'ADMIN') {
            fetch('/api/team')
              .then((res) => res.json())
              .then((tdata) => {
                if (tdata.team) setTeamMembers(tdata.team);
              })
              .catch(console.error);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch folders and documents whenever tab or advisor changes
  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const isInst = activeTab === 'institutional';
      const targetUser = !isInst && selectedAdvisorId ? `&userId=${selectedAdvisorId}` : '';

      // 1. Fetch folders
      const foldersUrl = `/api/folders?institutional=${isInst}${targetUser}`;
      const fRes = await fetch(foldersUrl);
      const fData = await fRes.json();
      if (fData.folders) {
        setFolders(fData.folders);
      }

      // 2. Fetch documents
      const docsUrl = isInst
        ? `/api/documents?institutional=true`
        : `/api/documents?personal=true${targetUser}`;
      const dRes = await fetch(docsUrl);
      const dData = await dRes.json();
      if (dData.documents) {
        setResources(dData.documents);
      }
    } catch (err) {
      console.error('Error al cargar datos de biblioteca:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setSelectedFolderId(null);
      setSelectedTag('ALL');
      fetchLibraryData();
    }
  }, [activeTab, selectedAdvisorId, currentUser]);

  // Derived permissions
  const canEditCurrentSpace = useMemo(() => {
    if (!currentUser) return false;
    if (activeTab === 'institutional') {
      return currentUser.role === 'ADMIN';
    }
    // Personal space: owner or admin
    return currentUser.role === 'ADMIN' || selectedAdvisorId === currentUser.id;
  }, [currentUser, activeTab, selectedAdvisorId]);

  // Available tags in current library
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>(DEFAULT_TAGS);
    resources.forEach((r) => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach((t) => tagSet.add(t));
      }
      if (r.category) {
        tagSet.add(r.category);
      }
    });
    return Array.from(tagSet);
  }, [resources]);

  // Filtered documents
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      // Filter by folder
      if (selectedFolderId !== null) {
        if (selectedFolderId === 'ROOT') {
          if (item.folderId) return false;
        } else if (item.folderId !== selectedFolderId) {
          return false;
        }
      }

      // Filter by Tag
      if (selectedTag !== 'ALL') {
        const itemTags = item.tags || [];
        const hasTag =
          itemTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
          (item.category && item.category.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // Filter by search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesTag = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      return true;
    });
  }, [resources, selectedFolderId, selectedTag, search]);

  const activeFolderObj = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'ROOT') return null;
    return folders.find((f) => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  // Helpers for badge styles
  const getDocBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return { label: 'PDF', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
      case 'PPT':
        return { label: 'PPT / Canva', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'EXCEL':
        return { label: 'Excel', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'WORD':
        return { label: 'Word', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'IMAGE':
        return { label: 'Imagen', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Enlace Nube', color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' };
    }
  };

  const getFolderColorStyle = (color?: string | null) => {
    const c = FOLDER_COLORS.find((fc) => fc.id === color) || FOLDER_COLORS[0];
    return c;
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCopyLink = (fileUrl: string) => {
    const full = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
    navigator.clipboard.writeText(full);
    showToast('Enlace copiado al portapapeles');
  };

  // Create / Edit Folder
  const handleOpenFolderModal = (folder?: FolderItem) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderName(folder.name);
      setFolderColor(folder.color || 'indigo');
    } else {
      setEditingFolder(null);
      setFolderName('');
      setFolderColor('indigo');
    }
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setSavingFolder(true);
    try {
      const isInst = activeTab === 'institutional';
      if (editingFolder) {
        // Edit
        const res = await fetch(`/api/folders/${editingFolder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: folderName.trim(),
            color: folderColor,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar carpeta');
        showToast('Carpeta actualizada con éxito');
      } else {
        // Create
        const res = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: folderName.trim(),
            color: folderColor,
            isInstitutional: isInst,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear carpeta');
        showToast('Carpeta creada con éxito');
      }

      setIsFolderModalOpen(false);
      setFolderName('');
      fetchLibraryData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar carpeta');
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: FolderItem) => {
    if (
      !confirm(
        `¿Eliminar la carpeta "${folder.name}"? Los documentos que contiene no se borrarán; se mantendrán en la raíz del espacio.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar carpeta');
      }
      showToast('Carpeta eliminada');
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(null);
      }
      fetchLibraryData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  // Open Document Modal (Upload or Edit)
  const handleOpenDocModal = (doc?: ResourceItem) => {
    setModalError(null);
    if (doc) {
      setEditingDoc(doc);
      setDocTitle(doc.title);
      setDocDescription(doc.description || '');
      setDocFolderId(doc.folderId || '');
      setDocTags(doc.tags && doc.tags.length > 0 ? doc.tags : [doc.category].filter(Boolean));
      setDocVersion(doc.version || 'v1');
      setUploadMode(doc.fileType === 'LINK' ? 'link' : 'file');
      setLinkUrl(doc.fileUrl.startsWith('http') ? doc.fileUrl : '');
      setFileToUpload(null);
    } else {
      setEditingDoc(null);
      setDocTitle('');
      setDocDescription('');
      setDocFolderId(selectedFolderId && selectedFolderId !== 'ROOT' ? selectedFolderId : '');
      setDocTags([]);
      setDocVersion('v1');
      setUploadMode('file');
      setLinkUrl('');
      setFileToUpload(null);
    }
    setIsDocModalOpen(true);
  };

  const handleToggleDocTag = (tag: string) => {
    if (docTags.includes(tag)) {
      setDocTags(docTags.filter((t) => t !== tag));
    } else {
      setDocTags([...docTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const t = customTagInput.trim();
    if (t && !docTags.includes(t)) {
      setDocTags([...docTags, t]);
      setCustomTagInput('');
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setModalError('Por favor ingresa un título para el documento');
      return;
    }

    setSavingDoc(true);
    setModalError(null);

    try {
      const isInst = activeTab === 'institutional';

      if (editingDoc) {
        // Edit existing document metadata
        const res = await fetch(`/api/documents/${editingDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: docTitle.trim(),
            description: docDescription.trim() || null,
            folderId: docFolderId || null,
            tags: docTags,
            category: docTags[0] || editingDoc.category,
            version: docVersion.trim() || 'v1',
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar documento');
        showToast('Documento actualizado con éxito');
      } else {
        // Create new document
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
            title: docTitle.trim(),
            description: docDescription.trim() || null,
            fileUrl: finalFileUrl,
            fileType: inferredType,
            fileSize,
            category: docTags[0] || 'GENERAL',
            tags: docTags,
            folderId: docFolderId || null,
            version: docVersion.trim() || 'v1',
            isInstitutional: isInst,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al registrar documento');
        showToast(isInst ? 'Recurso institucional publicado' : 'Documento guardado en tu espacio');
      }

      setIsDocModalOpen(false);
      fetchLibraryData();
    } catch (err: any) {
      setModalError(err.message || 'Error al procesar documento');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar el documento "${title}"?`)) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      showToast('Documento eliminado');
      fetchLibraryData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  // Quick Move Document
  const handleConfirmMoveDoc = async () => {
    if (!moveDoc) return;
    try {
      const res = await fetch(`/api/documents/${moveDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: targetMoveFolderId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al mover documento');
      }
      showToast('Documento movido con éxito');
      setMoveDoc(null);
      fetchLibraryData();
    } catch (err: any) {
      alert(err.message || 'Error al mover');
    }
  };

  // WhatsApp Share Dialog
  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDoc) return;

    const rawPhone = whatsappPhone.replace(/[^0-9]/g, '');
    const clientGreeting = whatsappClientName.trim() ? `Hola ${whatsappClientName.trim()}, ` : 'Hola, ';
    const fullUrl = shareDoc.fileUrl.startsWith('http')
      ? shareDoc.fileUrl
      : `${window.location.origin}${shareDoc.fileUrl}`;

    const text = `${clientGreeting}le comparto el documento de PUBLIMATEC: "${shareDoc.title}" (${shareDoc.fileType}${shareDoc.version ? ` • ${shareDoc.version}` : ''}): ${fullUrl}`;

    const targetUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(targetUrl, '_blank');
    setShareDoc(null);
    setWhatsappPhone('');
    setWhatsappClientName('');
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

      {/* Hero Header with Space Tabs */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-indigo-500/20 shadow-xl">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-wide uppercase text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Sales Enablement • Repositorio y Biblioteca Digital</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
                Biblioteca Comercial & Documentos
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mt-1">
                Material corporativo oficial, carpetas por servicio y tu espacio de documentos personales de venta.
              </p>
            </div>

            {/* Quick Action Button */}
            {canEditCurrentSpace && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenFolderModal()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5"
                >
                  <FolderPlus className="w-4 h-4 text-indigo-300" />
                  <span>Nueva Carpeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDocModal()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-lg shadow-white/10 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>{activeTab === 'institutional' ? 'Publicar Recurso Oficial' : 'Subir Documento'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SPACE TABS: Institucional vs Personal */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('institutional')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'institutional'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>🏛️ Espacio Institucional (Material Oficial)</span>
              {activeTab === 'institutional' && (
                <span className="text-[10px] bg-indigo-700/80 px-2 py-0.5 rounded-full font-bold">
                  {currentUser?.role === 'ADMIN' ? 'Edición Dirección' : 'Solo Lectura'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'personal'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>💼 Mi Espacio Personal (Mis Carpetas)</span>
              {activeTab === 'personal' && (
                <span className="text-[10px] bg-indigo-700/80 px-2 py-0.5 rounded-full font-bold">
                  Privado
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BANNER INFORMATIVO SEGÚN PESTAÑA */}
      {activeTab === 'institutional' ? (
        currentUser?.role === 'ADMIN' ? (
          <div className="p-3.5 px-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 text-xs text-indigo-950 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong>Modo Dirección Comercial:</strong> Los recursos y carpetas creados aquí son visibles para todo el equipo de ventas. Solo tú puedes modificarlos o eliminarlos.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 px-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Material Corporativo Oficial:</strong> Como asesor comercial puedes explorar carpetas, descargar, previsualizar y compartir estos recursos oficiales por WhatsApp. La edición está reservada para Dirección.
              </span>
            </div>
          </div>
        )
      ) : (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Espacio Personal:</strong> Organiza tus carpetas privadas, cotizaciones de trabajo, fichas y enlaces propios. Nadie más puede modificar tus carpetas personales.
            </span>
          </div>

          {/* Selector de Asesor para Administradores */}
          {currentUser?.role === 'ADMIN' && teamMembers.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Users className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
                Ver espacio de:
              </span>
              <select
                value={selectedAdvisorId}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
              >
                <option value={currentUser.id}>Mi Espacio Propio (Director)</option>
                {teamMembers
                  .filter((m) => m.id !== currentUser.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role === 'ADMIN' ? 'Director' : 'Asesor'})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN DE CARPETAS (FOLDERS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Carpetas {activeTab === 'institutional' ? 'Institucionales' : 'Personales'}
            </h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {folders.length}
            </span>
          </div>

          {canEditCurrentSpace && (
            <button
              type="button"
              onClick={() => handleOpenFolderModal()}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Carpeta</span>
            </button>
          )}
        </div>

        {/* Folder Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Card: Todos los Archivos / Raíz */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
              selectedFolderId === null
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <FolderIcon className={`w-5 h-5 ${selectedFolderId === null ? 'text-white' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedFolderId === null ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {resources.length}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold block truncate">Todos los Archivos</span>
              <span className={`text-[10px] block ${selectedFolderId === null ? 'text-indigo-200' : 'text-slate-400'}`}>
                Vista general
              </span>
            </div>
          </button>

          {/* Folder items */}
          {folders.map((f) => {
            const isSelected = selectedFolderId === f.id;
            const colorStyle = getFolderColorStyle(f.color);
            const count = f._count?.documents ?? resources.filter((r) => r.folderId === f.id).length;

            return (
              <div
                key={f.id}
                className={`group relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                onClick={() => setSelectedFolderId(f.id)}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
                    <FolderIcon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {count}
                    </span>

                    {/* Folder Edit/Delete Dropdown trigger (if editable) */}
                    {canEditCurrentSpace && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenFolderModal(f)}
                          title="Editar carpeta"
                          className="p-1 rounded text-slate-400 hover:text-indigo-600"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFolder(f)}
                          title="Eliminar carpeta"
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {count} {count === 1 ? 'documento' : 'documentos'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Folder: Archivos en la Raíz (Sin Carpeta) */}
          {resources.some((r) => !r.folderId) && (
            <button
              type="button"
              onClick={() => setSelectedFolderId('ROOT')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                selectedFolderId === 'ROOT'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {resources.filter((r) => !r.folderId).length}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold block truncate">Sin Carpeta</span>
                <span className="text-[10px] text-slate-400 block">En la raíz</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* BREADCRUMB / ACTIVE FOLDER BANNER */}
      {selectedFolderId && (
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Todas las Carpetas
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FolderIcon className="w-3.5 h-3.5 text-indigo-500" />
              {activeFolderObj ? activeFolderObj.name : 'Sin Carpeta (Raíz)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          >
            Mostrar todos los archivos ✕
          </button>
        </div>
      )}

      {/* FILTER BAR: TAGS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mr-1 shrink-0">
            <TagIcon className="w-3 h-3" />
            <span>Tags:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTag('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedTag === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Todos los Tags
          </button>

          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título, tag o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-2">Cargando documentos de este espacio...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 space-y-3">
          <FolderOpen className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No se encontraron documentos en este espacio o carpeta
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {canEditCurrentSpace
              ? 'Puedes subir un archivo o registrar un enlace en la nube (Drive, Canva, etc.) con sus tags de categorización.'
              : 'No hay documentos cargados en esta vista.'}
          </p>
          {canEditCurrentSpace && (
            <button
              type="button"
              onClick={() => handleOpenDocModal()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Primer Documento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((item) => {
            const badge = getDocBadge(item.fileType);
            const sizeStr = formatSize(item.fileSize);
            const folderStyle = item.folder?.color ? getFolderColorStyle(item.folder.color) : null;
            const displayTags = item.tags && item.tags.length > 0 ? item.tags : [item.category].filter(Boolean);

            return (
              <div
                key={item.id}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => setPreviewDoc(item)}
                      className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                      title="Clic para previsualizar"
                    >
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

                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {/* Carpeta Badge */}
                      {item.folder ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            folderStyle
                              ? `${folderStyle.bg} ${folderStyle.text} ${folderStyle.border}`
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <FolderIcon className="w-3 h-3" />
                          <span>{item.folder.name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                          Raíz
                        </span>
                      )}

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
                    <h3
                      onClick={() => setPreviewDoc(item)}
                      className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
                      title={`Previsualizar ${item.title}`}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* TAGS PILLS */}
                  {displayTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {displayTags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{sizeStr || 'Enlace externo'}</span>

                  <div className="flex items-center gap-1">
                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(item)}
                      title="Previsualizar archivo"
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Share WhatsApp */}
                    <button
                      type="button"
                      onClick={() => setShareDoc(item)}
                      title="Compartir por WhatsApp"
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.fileUrl)}
                      title="Copiar enlace directo"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Open / Download */}
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.fileType === 'LINK' ? 'Abrir enlace' : 'Descargar archivo'}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {item.fileType === 'LINK' ? (
                        <ExternalLink className="w-3.5 h-3.5" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </a>

                    {/* Mover a Carpeta (if editable) */}
                    {canEditCurrentSpace && (
                      <button
                        type="button"
                        onClick={() => {
                          setMoveDoc(item);
                          setTargetMoveFolderId(item.folderId || '');
                        }}
                        title="Mover a otra carpeta"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FolderSymlink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit Metadata (if editable) */}
                    {canEditCurrentSpace && (
                      <button
                        type="button"
                        onClick={() => handleOpenDocModal(item)}
                        title="Editar tags / título"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete (if editable) */}
                    {canEditCurrentSpace && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(item.id, item.title)}
                        title="Eliminar documento"
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

      {/* MODAL: CREAR / EDITAR CARPETA */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Carpeta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Catálogos 2026, Rótulos LED, Pauta..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Identificador
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {FOLDER_COLORS.map((fc) => (
                    <button
                      key={fc.id}
                      type="button"
                      onClick={() => setFolderColor(fc.id)}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        folderColor === fc.id
                          ? `${fc.bg} ${fc.text} ${fc.border} ring-2 ring-indigo-500`
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <FolderIcon className="w-3.5 h-3.5" />
                      <span className="text-[11px] truncate">{fc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFolder}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                >
                  {savingFolder ? 'Guardando...' : editingFolder ? 'Actualizar' : 'Crear Carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBIR / EDITAR DOCUMENTO */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingDoc
                      ? 'Editar Documento'
                      : activeTab === 'institutional'
                      ? 'Publicar Recurso Oficial'
                      : 'Subir Documento Personal'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Espacio: {activeTab === 'institutional' ? 'Institucional (Oficial)' : 'Personal Privado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Mode Switcher: File vs Cloud Link (solo si es nuevo documento) */}
            {!editingDoc && (
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
                  <span>Enlace Canva / Drive</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveDoc} className="space-y-3.5">
              {!editingDoc && (
                uploadMode === 'file' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Archivo *
                    </label>
                    <input
                      type="file"
                      required
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setFileToUpload(f);
                          if (!docTitle) setDocTitle(f.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      URL del Enlace en la Nube (Canva, Google Drive, SharePoint) *
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
                )
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Catálogo de Rótulos y Pantallas 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Selector de Carpeta */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Carpeta Destino
                  </label>
                  <select
                    value={docFolderId}
                    onChange={(e) => setDocFolderId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">(Sin Carpeta - Raíz)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Versión */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Versión
                  </label>
                  <input
                    type="text"
                    placeholder="ej. v1, 2026, Rev 2"
                    value={docVersion}
                    onChange={(e) => setDocVersion(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              {/* SELECCIÓN DE TAGS (CATEGORIZACIÓN FLEXIBLE) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  TAGs & Etiquetas para Filtrar
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-32 overflow-y-auto">
                  {DEFAULT_TAGS.map((t) => {
                    const isSelected = docTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleDocTag(t)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        <span>#{t}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input para agregar tag personalizado */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Escribir tag personalizado y presionar Enter..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                  >
                    + Agregar Tag
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Notas del Documento
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el uso, público objetivo o alcance..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                >
                  {savingDoc ? 'Guardando...' : editingDoc ? 'Actualizar Documento' : 'Guardar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVER DOCUMENTO A OTRA CARPETA */}
      {moveDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600">
                <FolderSymlink className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mover a Otra Carpeta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoveDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block truncate">
                {moveDoc.title}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Carpeta actual: {moveDoc.folder?.name || 'Raíz (Sin Carpeta)'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecciona la Carpeta Destino:
              </label>
              <select
                value={targetMoveFolderId}
                onChange={(e) => setTargetMoveFolderId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">📁 Raíz (Sin Carpeta)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMoveDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveDoc}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25"
              >
                Mover Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPARTIR POR WHATSAPP */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <Share2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Compartir por WhatsApp
                </h3>
              </div>
              <button
                type="button"
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
                {shareDoc.fileType} • {shareDoc.version || 'v1'}
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShareDoc(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
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

      {/* FLOATING FILE PREVIEW MODAL */}
      <FilePreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        onShareWhatsApp={(doc) => {
          setPreviewDoc(null);
          setShareDoc(doc as ResourceItem);
        }}
      />
    </div>
  );
}
