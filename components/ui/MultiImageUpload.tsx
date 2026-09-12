'use client';

import { useState, useRef } from 'react';
import styles from '@/styles/modules/multi-image-upload.module.scss';
import { uploadImage } from '@/lib/supabase/storage';
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  Star,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';

interface MultiImageUploadProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: 'products' | 'stores';
  helperText?: string;
}

export default function MultiImageUpload({
  label,
  images = [],
  onChange,
  maxImages = 6,
  folder = 'products',
  helperText = 'Sube hasta 6 fotos. La primera será la foto de portada principal.',
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(fileList);

    if (files.length === 0) return;

    // Verificar límite
    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Ya has alcanzado el límite máximo de ${maxImages} fotos.`);
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setErrorMessage(`Solo se pueden agregar ${availableSlots} fotos más (máx. ${maxImages}).`);
    }

    // Validar tipo y peso
    for (const f of filesToUpload) {
      if (!f.type.startsWith('image/')) {
        setErrorMessage('Solo se admiten archivos de imagen (JPG, PNG, WEBP, GIF).');
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setErrorMessage(`La imagen "${f.name}" supera el tamaño máximo permitido de 5MB.`);
        return;
      }
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadStatus(`Subiendo foto ${i + 1} de ${filesToUpload.length}...`);
        const url = await uploadImage(filesToUpload[i], folder);
        uploadedUrls.push(url);
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err: any) {
      console.error('Error al subir imágenes:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al subir alguna de las imágenes.');
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, idx) => idx !== index);
    onChange([target, ...rest]);
  };

  const handleAddManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    if (images.length >= maxImages) {
      setErrorMessage(`Límite de ${maxImages} fotos alcanzado.`);
      return;
    }
    onChange([...images, manualUrl.trim()]);
    setManualUrl('');
    setShowUrlInput(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <label className={styles.label}>{label}</label>
        <span className={styles.counter}>
          {images.length} de {maxImages} fotos
        </span>
      </div>

      {/* Galería si hay imágenes cargadas */}
      {images.length > 0 ? (
        <div className={styles.grid}>
          {images.map((url, idx) => {
            const isPrimary = idx === 0;
            return (
              <div
                key={`${url}-${idx}`}
                className={`${styles.imageCard} ${isPrimary ? styles['imageCard--primary'] : ''}`}
              >
                <img src={url} alt={`Foto ${idx + 1}`} className={styles.thumbnail} />

                {isPrimary && (
                  <div className={styles.primaryBadge}>
                    <Star size={10} fill="#FFFFFF" /> Portada
                  </div>
                )}

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className={styles.deleteBtn}
                    title="Eliminar foto"
                  >
                    <X size={14} />
                  </button>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(idx)}
                      className={styles.makePrimaryBtn}
                    >
                      Hacer portada
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Botón para añadir más si no se ha alcanzado el límite */}
          {images.length < maxImages && (
            <div
              className={`${styles.addCard} ${isUploading ? styles['addCard--uploading'] : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 size={22} className="spin" color="#D97706" />
                  <span className={styles.addCardText}>{uploadStatus || 'Subiendo...'}</span>
                </>
              ) : (
                <>
                  <Plus size={22} />
                  <span className={styles.addCardText}>Agregar foto</span>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Dropzone inicial cuando no hay fotos */
        <div
          className={`${styles.emptyDropzone} ${isDragging ? styles['emptyDropzone--active'] : ''} ${
            isUploading ? styles['emptyDropzone--uploading'] : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.iconCircle}>
            {isUploading ? (
              <Loader2 size={22} className="spin" color="#D97706" />
            ) : (
              <Upload size={20} />
            )}
          </div>

          <div className={styles.promptText}>
            {isUploading ? (
              uploadStatus || 'Subiendo fotos...'
            ) : (
              <>
                Arrastra aquí tus fotos o <span>haz clic para seleccionarlas</span>
              </>
            )}
          </div>

          <div className={styles.subText}>
            Puedes seleccionar varias fotos a la vez. JPG, PNG o WEBP (Máx. 5MB c/u)
          </div>
        </div>
      )}

      {/* Input de archivos múltiple */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className={styles.hiddenInput}
      />

      {/* Opción para agregar URL manual */}
      {images.length < maxImages && (
        <div>
          <button
            type="button"
            className={styles.urlToggle}
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            {showUrlInput ? 'Ocultar campo de enlace' : '+ O agregar foto por enlace/URL'}
          </button>

          {showUrlInput && (
            <div className={styles.urlInputRow}>
              <input
                type="url"
                className="input input--sm"
                placeholder="https://images.unsplash.com/..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleAddManualUrl}
              >
                Agregar
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
