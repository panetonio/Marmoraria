import React, { useRef, useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';

interface Photo {
  id: string;
  dataUrl: string;
  description?: string;
}

interface PhotoCaptureProps {
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  initialPhotos?: Photo[];
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ 
  onPhotosChange, 
  maxPhotos = 5,
  initialPhotos = []
}) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!(file instanceof File) || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: Photo = {
          id: `photo-${Date.now()}-${Math.random()}`,
          dataUrl,
          description: ''
        };

        setPhotos(prev => {
          const updated = [...prev, newPhoto];
          onPhotosChange(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fromCamera && cameraInputRef.current) {
      cameraInputRef.current.value = '';
    } else if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      onPhotosChange(updated);
      return updated;
    });
  };

  const handleStartEdit = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditDescription(photo.description || '');
  };

  const handleSaveDescription = () => {
    if (!editingPhotoId) return;

    setPhotos(prev => {
      const updated = prev.map(p => 
        p.id === editingPhotoId 
          ? { ...p, description: editDescription } 
          : p
      );
      onPhotosChange(updated);
      return updated;
    });

    setEditingPhotoId(null);
    setEditDescription('');
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Botões de captura */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => cameraInputRef.current?.click()}
          disabled={!canAddMore}
          className="flex-1 min-w-[200px]"
        >
          📷 Tirar Foto
        </Button>
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddMore}
          className="flex-1 min-w-[200px]"
        >
          🖼️ Escolher da Galeria
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, true)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e, false)}
        className="hidden"
      />

      {/* Contador */}
      <p className="text-sm text-text-secondary dark:text-slate-400 text-center">
        {photos.length} de {maxPhotos} fotos
      </p>

      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="p-3">
              <div className="space-y-3">
                <div className="relative group">
                  <img 
                    src={photo.dataUrl} 
                    alt={photo.description || 'Foto'} 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover foto"
                  >
                    🗑️
                  </button>
                </div>

                {editingPhotoId === photo.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Adicione uma descrição..."
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveDescription}
                        className="flex-1"
                      >
                        Salvar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setEditingPhotoId(null);
                          setEditDescription('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-text-secondary dark:text-slate-400 flex-1">
                      {photo.description || 'Sem descrição'}
                    </p>
                    <button
                      onClick={() => handleStartEdit(photo)}
                      className="text-primary hover:text-primary/80 text-sm font-medium ml-2"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-border dark:border-slate-600 rounded-lg">
          <p className="text-text-secondary dark:text-slate-400">
            Nenhuma foto adicionada. Use os botões acima para capturar ou selecionar fotos.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;

