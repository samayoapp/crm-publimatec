'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Link as LinkIcon,
  BookOpen,
  Download,
  Trash2,
  ExternalLink,
  MessageSquare,
  Check,
  AlertCircle,
  Plus,
  Sparkles,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Image as ImageIcon,
  Share2,
  Eye,
} from 'lucide-react';
import FilePreviewModal from '@/components/FilePreviewModal';
import PdfIcon from '@/components/PdfIcon';

interface DocumentItem {
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
}

interface ProposalDocumentsManagerProps {
  proposalId: string;
  proposalTitle?: string;
  clientName?: string;
  clientPhone?: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
}

export default function ProposalDocumentsManager({
  proposalId,
  proposalTitle = 'Propuesta',
  clientName = 'Cliente',
  clientPhone,
  currentUser,
}: ProposalDocumentsManagerProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [institutionalDocs, setInstitutionalDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'link' | 'library'>('list');

  // Floating File Preview
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Form states - Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('COTIZACION');
  const [uploadVersion, setUploadVersion] = useState('v1');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form states - Link
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkCategory, setLinkCategory] = useState('PRESENTACION');
  const [linkVersion, setLinkVersion] = useState('v1');
  const [linkNotes, setLinkNotes] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);

  // Success message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?proposalId=${proposalId}`);
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error fetching proposal documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutional = async () => {
    try {
      const res = await fetch('/api/documents?institutional=true');
      const data = await res.json();
      if (data.documents) {
        setInstitutionalDocs(data.documents);
      }
    } catch (err) {
      console.error('Error fetching institutional docs:', err);
    }
  };

  useEffect(() => {
    if (proposalId) {
      fetchDocuments();
      fetchInstitutional();
    }
  }, [proposalId]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Por favor selecciona un archivo (PDF, PPT, Excel, etc.)');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Upload file to server
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadRes = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Error al subir archivo');
      }

      // 2. Register document record
      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle.trim() || uploadFile.name,
          description: uploadNotes.trim() || null,
          fileUrl: uploadData.url,
          fileType: uploadData.fileType || 'PDF',
          fileSize: uploadData.size,
          category: uploadCategory,
          version: uploadVersion,
          proposalId,
          isInstitutional: false,
        }),
      });

      const docData = await docRes.json();
      if (!docRes.ok) {
        throw new Error(docData.error || 'Error al vincular documento a propuesta');
      }

      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      setActiveTab('list');
      fetchDocuments();
      showSuccess('Documento subido y vinculado con éxito');
    } catch (err: any) {
      setUploadError(err.message || 'Error en la subida');
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || !linkTitle.trim()) {
      setUploadError('El título y la URL del enlace son requeridos');
      return;
    }

    setSubmittingLink(true);
    setUploadError(null);

    try {
      let inferredType = 'LINK';
      const low = linkUrl.toLowerCase();
      if (low.includes('canva.com')) inferredType = 'PPT';
      else if (low.includes('drive.google.com') || low.includes('docs.google.com')) inferredType = 'LINK';
      else if (low.includes('sharepoint.com') || low.includes('onedrive')) inferredType = 'LINK';

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: linkTitle.trim(),
          description: linkNotes.trim() || null,
          fileUrl: linkUrl.trim(),
          fileType: inferredType,
          category: linkCategory,
          version: linkVersion,
          proposalId,
          isInstitutional: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar enlace');
      }

      setLinkUrl('');
      setLinkTitle('');
      setLinkNotes('');
      setActiveTab('list');
      fetchDocuments();
      showSuccess('Enlace vinculado exitosamente a la propuesta');
    } catch (err: any) {
      setUploadError(err.message || 'Error al guardar enlace');
    } finally {
      setSubmittingLink(false);
    }
  };

  const handleLinkInstitutional = async (instDoc: DocumentItem) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${instDoc.title} (Oficial Publimatec)`,
          description: instDoc.description,
          fileUrl: instDoc.fileUrl,
          fileType: instDoc.fileType,
          fileSize: instDoc.fileSize,
          category: instDoc.category,
          version: instDoc.version || 'v1',
          proposalId,
          isInstitutional: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al vincular recurso');
      }

      fetchDocuments();
      setActiveTab('list');
      showSuccess(`"${instDoc.title}" vinculado a la propuesta`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`¿Eliminar el documento "${docTitle}" de esta propuesta?`)) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      fetchDocuments();
      showSuccess('Documento eliminado');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return { label: 'PDF', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      case 'PPT':
        return { label: 'PPT / Canva', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'EXCEL':
        return { label: 'Excel', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'WORD':
        return { label: 'Word', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'IMAGE':
        return { label: 'Imagen', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      default:
        return { label: 'Enlace Nube', color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' };
    }
  };

  const shareViaWhatsApp = (doc: DocumentItem) => {
    const rawPhone = clientPhone ? clientPhone.replace(/[^0-9]/g, '') : '';
    const fullUrl = doc.fileUrl.startsWith('http')
      ? doc.fileUrl
      : `${window.location.origin}${doc.fileUrl}`;

    const text = `Hola ${clientName}, le comparto la propuesta comercial "${proposalTitle}" de PUBLIMATEC: ${doc.title} (${doc.version || 'v1'}): ${fullUrl}`;

    const targetUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="space-y-3.5">
      {/* Sub Navigation Tabs */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Adjuntos ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setUploadError(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Subir Archivo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('link');
            setUploadError(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'link'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Link Drive / Canva</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('library');
            setUploadError(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'library'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Biblioteca</span>
          <span className="sm:hidden">Oficial</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* TAB 1: LIST DOCUMENTS */}
      {activeTab === 'list' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Cargando documentos...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No hay documentos adjuntos a esta propuesta
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Puedes subir el PDF de la cotización, la presentación en PPT/Canva o vincular catálogos oficiales de Publimatec.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  + Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                >
                  Ver Biblioteca Oficial
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {documents.map((doc) => {
                const badge = getDocBadge(doc.fileType);
                const sizeStr = formatSize(doc.fileSize);
                return (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        onClick={() => setPreviewDoc(doc)}
                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        title="Clic para previsualizar"
                      >
                        {doc.fileType === 'IMAGE' ? (
                          <ImageIcon className="w-4 h-4 text-purple-500" />
                        ) : doc.fileType === 'EXCEL' ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        ) : doc.fileType === 'PPT' ? (
                          <FileCode className="w-4 h-4 text-amber-500" />
                        ) : doc.fileType === 'PDF' || doc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                          <PdfIcon className="w-5 h-5" />
                        ) : (
                          <FileText className="w-4 h-4 text-indigo-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block text-left"
                            title={`Previsualizar ${doc.title}`}
                          >
                            {doc.title}
                          </button>
                          {doc.version && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                              {doc.version}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className={`px-1.5 py-0.2 rounded border font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                          {sizeStr && <span>• {sizeStr}</span>}
                          {doc.uploadedBy && <span>• Por {doc.uploadedBy.name.split(' ')[0]}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quick Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        title="Previsualizar archivo"
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp Share Button */}
                      <button
                        type="button"
                        onClick={() => shareViaWhatsApp(doc)}
                        title="Compartir enlace por WhatsApp al cliente"
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Download or Open Link */}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={!doc.fileUrl.startsWith('http')}
                        title="Abrir o descargar archivo"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Delete */}
                      {(currentUser.role === 'ADMIN' || doc.uploadedBy?.id === currentUser.id) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.title)}
                          title="Eliminar documento"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD FILE */}
      {activeTab === 'upload' && (
        <form onSubmit={handleFileUpload} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Seleccionar Archivo (PDF, PPTX, XLSX, DOCX, Imagen - Máx. 50MB) *
            </label>
            <input
              type="file"
              required
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUploadFile(f);
                  if (!uploadTitle) {
                    setUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                  }
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Título Descriptivo *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Cotización Pantallas LED v2"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Versión
              </label>
              <input
                type="text"
                placeholder="v1, v2, Final..."
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir y Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: LINK TO CLOUD (DRIVE / CANVA) */}
      {activeTab === 'link' && (
        <form onSubmit={handleLinkSubmit} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3 animate-in fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Enlace de la Nube (Google Drive, Canva, OneDrive, SharePoint) *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.canva.com/design/... o https://drive.google.com/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Presentación / Documento *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Presentación Interactiva de Rótulos"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Versión
              </label>
              <input
                type="text"
                placeholder="v1, v2..."
                value={linkVersion}
                onChange={(e) => setLinkVersion(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingLink}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {submittingLink ? 'Guardando...' : 'Vincular Enlace'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: SELECT FROM INSTITUTIONAL LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Biblioteca Oficial Publimatec:</strong> Recursos corporativos aprobados por la Dirección listos para vincular a tu cliente con 1 clic.
            </span>
          </div>

          {institutionalDocs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">
              Aún no hay recursos institucionales publicados en la biblioteca.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {institutionalDocs.map((inst) => {
                const badge = getDocBadge(inst.fileType);
                return (
                  <div
                    key={inst.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {inst.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      {inst.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {inst.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLinkInstitutional(inst)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Vincular</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* FLOATING FILE PREVIEW MODAL */}
      <FilePreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        onShareWhatsApp={(doc) => {
          setPreviewDoc(null);
          const found = documents.find((d) => d.id === doc.id) || (doc as DocumentItem);
          shareViaWhatsApp(found);
        }}
      />
    </div>
  );
}
