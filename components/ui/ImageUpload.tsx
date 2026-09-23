'use client';

import { useState, useRef } from 'react';
import styles from '@/styles/modules/image-upload.module.scss';
import { uploadImage } from '@/lib/supabase/storage';
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: 'stores' | 'products';
  aspectRatio?: 'square' | 'wide';
  helperText?: string;
  placeholderText?: string;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  folder = 'products',
  aspectRatio = 'square',
  helperText,
  placeholderText = 'Arrastra una foto o haz clic para subirla',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrlValue, setInputUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo puedes subir archivos de imagen (JPG, PNG, WEBP, GIF).');
      return;
    }

    // Validar tamaño máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La imagen es demasiado pesada. El tamaño máximo es de 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file, folder);
      onChange(publicUrl);
    } catch (err: any) {
      console.warn('Fallo upload a Supabase Storage, usando respaldo Base64 local:', err);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } catch (readErr) {
        setErrorMessage(err?.message || 'Ocurrió un error al procesar la imagen.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrlValue.trim()) {
      onChange(inputUrlValue.trim());
      setShowUrlInput(false);
      setInputUrlValue('');
    }
  };

  const isStore = folder === 'stores';

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      {/* Si ya hay imagen seleccionada, mostrar preview moderna */}
      {value ? (
        <div className={styles.previewContainer}>
          <div
            className={`${styles.imageFrame} ${
              isStore ? styles['imageFrame--store'] : ''
            } ${aspectRatio === 'wide' ? styles['imageFrame--wide'] : ''}`}
          >
            <img
              src={value}
              alt="Preview"
              className={styles.thumbnail}
            />
            {isUploading && (
              <div className={styles.overlayUploading}>
                <Loader2 size={24} className="spin" />
              </div>
            )}
          </div>

          <div className={styles.previewContent}>
            <div className={styles.previewMeta}>
              <div className={styles.statusBadge}>
                <CheckCircle2 size={13} />
                <span>{isStore ? 'Logo cargado' : 'Imagen activa'}</span>
              </div>
              <p className={styles.previewHint}>
                Esta imagen se mostrará en la cabecera de tu tienda pública.
              </p>
            </div>

            <div className={styles.previewActions}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn--secondary btn--sm"
                disabled={isUploading}
              >
                <RefreshCw size={13} /> Cambiar foto
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className={`btn btn--outline btn--sm ${styles.deleteButton}`}
                disabled={isUploading}
                title="Eliminar imagen"
              >
                <X size={13} /> Quitar
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Si no hay imagen, mostrar Dropzone estilizado */
        <div
          className={`${styles.dropzone} ${isDragging ? styles['dropzone--active'] : ''} ${
            isUploading ? styles['dropzone--uploading'] : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.iconCircle}>
            {isUploading ? (
              <Loader2 size={20} className="spin" />
            ) : (
              <Upload size={18} />
            )}
          </div>

          <div className={styles.promptText}>
            {isUploading ? (
              'Subiendo imagen...'
            ) : (
              <span>{placeholderText}</span>
            )}
          </div>

          <div className={styles.subText}>
            JPG, PNG, WEBP o GIF (Recomendado 1:1, máx. 5MB)
          </div>
        </div>
      )}

      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className={styles.hiddenInput}
      />

      {/* Alternativa de ingresar URL directa si se desea */}
      {!value && (
        <div className={styles.urlSection}>
          <button
            type="button"
            className={styles.urlToggle}
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <LinkIcon size={12} />
            {showUrlInput ? 'Ocultar ingreso por enlace' : 'O pegar enlace / URL directa'}
          </button>

          {showUrlInput && (
            <div className={styles.urlInputRow}>
              <input
                type="url"
                className="input"
                placeholder="https://ejemplo.com/mi-logo.png"
                value={inputUrlValue}
                onChange={(e) => setInputUrlValue(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleApplyUrl}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}

      {helperText && <span className={styles.helperText}>{helperText}</span>}

      {errorMessage && (
        <div className={styles.errorText}>
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
