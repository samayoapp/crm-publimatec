'use client';

import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  contactName: string;
  advisorName?: string;
  projectName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customText?: string;
}

export default function WhatsAppButton({
  phone,
  contactName,
  advisorName = 'nuestro equipo',
  projectName,
  size = 'md',
  className = '',
  customText,
}: WhatsAppButtonProps) {
  // Clean phone number (remove spaces, symbols)
  let cleanPhone = phone.replace(/[^0-9]/g, '');

  // If Honduras phone with 8 digits and no country code, add 504
  if (cleanPhone.length === 8) {
    cleanPhone = '504' + cleanPhone;
  }

  const defaultMessage = projectName
    ? `Hola ${contactName}, un gusto saludarte. Te escribe ${advisorName} de PixelMedia sobre el proyecto de ${projectName}. ¿Tienes unos minutos para conversar?`
    : `Hola ${contactName}, un gusto saludarte. Te escribe ${advisorName} de PixelMedia.`;

  const message = encodeURIComponent(customText || defaultMessage);
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs font-medium gap-1.5',
    lg: 'px-4 py-2 text-sm font-semibold gap-2',
  };

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Abrir WhatsApp con ${contactName}`}
      className={`inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm shadow-emerald-700/20 active:scale-95 ${sizeClasses[size]} ${className}`}
    >
      <MessageCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>WhatsApp</span>
    </a>
  );
}
