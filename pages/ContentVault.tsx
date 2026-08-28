import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { MOCK_ASSETS } from '../services/mockData';
import { ASSET_ICONS } from '../constants';
import { UploadCloud, Play, Sparkles, Trash2 } from 'lucide-react';
import { RepurposeModal } from '../components/RepurposeModal';
import { Asset, ViewState, RepurposeType, REPURPOSE_OPTIONS } from '../types';
import { RepurposeJobResult } from '../services/repurposeService';

interface ContentVaultProps {
  onRepurpose: (asset: Asset) => void;
  uploadedAssets: Asset[];
  setUploadedAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

// Helper to determine asset type from file
const getAssetTypeFromFile = (file: File): 'Video' | 'Audio' | 'PDF' | 'Text' => {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (mimeType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || fileName.endsWith('.webm')) {
    return 'Video';
  }
  if (mimeType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.m4a') || fileName.endsWith('.ogg')) {
    return 'Audio';
  }
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return 'PDF';
  }
  return 'Text';
};

// Helper to generate thumbnail URL based on type
const getThumbnailForType = (type: 'Video' | 'Audio' | 'PDF' | 'Text'): string => {
  const thumbnails: Record<string, string> = {
    Video: 'https://picsum.photos/id/19/200/120',
    Audio: 'https://picsum.photos/id/29/200/120',
    PDF: 'https://picsum.photos/id/39/200/120',
    Text: 'https://picsum.photos/id/49/200/120',
  };
  return thumbnails[type] || 'https://picsum.photos/id/59/200/120';
};

// Helper to format date for display
const formatUploadDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

export const ContentVault: React.FC<ContentVaultProps> = ({ onRepurpose, uploadedAssets, setUploadedAssets }) => {
  const [repurposeAsset, setRepurposeAsset] = useState<Asset | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from input
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process uploaded files
  const processFiles = (files: File[]) => {
    const newAssets: Asset[] = files.map((file) => {
      const assetType = getAssetTypeFromFile(file);
      return {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: file.name,
        type: assetType,
        programme: 'Unsorted',
        status: 'Processing' as const,
        thumbnail: getThumbnailForType(assetType),
        uploadDate: new Date().toISOString(),
        // Store the actual file blob for processing
        fileBlob: file,
      };
    });

    setUploadedAssets((prev) => [...newAssets, ...prev]);

    // Process files to extract text content
    newAssets.forEach(async (asset) => {
      try {
        let extractedText = '';

        if (asset.type === 'Text' && asset.fileBlob) {
          // For text files, read content directly
          extractedText = await asset.fileBlob.text();
        }
        // For PDF/Video/Audio, text will be extracted during repurpose process

        // Update asset with extracted text and mark as ready
        setUploadedAssets((prev) =>
          prev.map((a) =>
            a.id === asset.id
              ? { ...a, status: 'Ready' as const, transcript: extractedText || a.transcript }
              : a
          )
        );
      } catch (error) {
        console.error('Error processing file:', asset.title, error);
        setUploadedAssets((prev) =>
          prev.map((a) =>
            a.id === asset.id ? { ...a, status: 'Ready' as const } : a
          )
        );
      }
    });
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  // Only show mock data if there are no uploaded assets (for demo purposes)
  // Once user uploads anything, mock data is hidden
  const allAssets = uploadedAssets.length > 0 ? uploadedAssets : MOCK_ASSETS;

  // Handle asset deletion
  const handleDeleteAsset = (assetId: string, assetTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${assetTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingId(assetId);

    // Remove from uploaded assets
    setUploadedAssets(prev => prev.filter(asset => asset.id !== assetId));

    setDeletingId(null);
  };

  const handleConfirmRepurpose = async (option: RepurposeType, date: string, result?: RepurposeJobResult) => {
    console.log('Job Completed:', { asset: repurposeAsset, option, date, result });

    if (!result || !result.success) {
      alert('❌ Repurposing failed. Please try again.');
      setRepurposeAsset(null);
      return;
    }

    try {
      const optionLabel = REPURPOSE_OPTIONS[option]?.label || option;

      // Check if n8n already saved the post (Image_Gen via Flow 4)
      if (result.savedByN8n && result.postId) {
        console.log('Post already saved by n8n Flow 4, updating schedule...');

        const { updateScheduledPost } = await import('../services/scheduledPostsService');

        await updateScheduledPost(result.postId, {
          status: 'scheduled',
          schedule_at: date,
        });

        alert(`🎉 AI Content Generated & Scheduled!

Type: ${optionLabel}
Scheduled for: ${new Date(date).toLocaleString()}

✅ Post saved via n8n workflow with permanent image URL`);

        setRepurposeAsset(null);
        return;
      }

      // Import the insertScheduledPost function
      const { insertScheduledPost } = await import('../services/scheduledPostsService');

      // All results now have captions - use them directly
      const contentToSchedule = {
        facebook: result.captions?.facebook || `Content from: ${repurposeAsset?.title}`,
        instagram: result.captions?.instagram || `Content from: ${repurposeAsset?.title}`
      };

      // Capture image URL if present
      const imageUrl = result.imageUrl || null;

      console.log('Scheduling post with captions:', contentToSchedule);
      console.log('Image URL:', imageUrl);

      // Save as scheduled post
      const postData = {
        platforms: ['facebook', 'instagram'] as ('facebook' | 'instagram')[],
        content: contentToSchedule,
        status: 'scheduled' as const,
        schedule_at: date,
        image_url: imageUrl
      };

      const newPost = await insertScheduledPost(postData);

      if (newPost) {
        alert(`🎉 Repurposed Content Scheduled!

Type: ${optionLabel}
Scheduled for: ${new Date(date).toLocaleString()}

✅ Saved to calendar as a scheduled post`);
      } else {
        alert(`⚠️ Content processed but not saved (Supabase not configured)

Type: ${optionLabel}
Scheduled for: ${new Date(date).toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error saving repurposed content:', error);
      alert(`✅ Content repurposed successfully!

Type: ${REPURPOSE_OPTIONS[option]?.label}
Scheduled for: ${new Date(date).toLocaleString()}

⚠️ Note: Not saved to database (Supabase configuration needed)`);
    } finally {
      setRepurposeAsset(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Vault</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your raw assets and repurpose them.</p>
        </div>
        <button
          onClick={handleUploadClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
        >
          <UploadCloud size={18} />
          Upload New
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Zone */}
      <div
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-600'
          }`}>
          <UploadCloud size={24} />
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </h3>
        <p className="text-slate-500 text-sm mt-1">Support for Video, Audio, PDF, and Text</p>
        <p className="text-blue-600 text-sm mt-2 font-medium">or click to browse</p>
      </div>

      {/* Asset Library */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allAssets.map((asset) => (
              <tr key={asset.id} className={`hover:bg-slate-50 transition-colors group ${deletingId === asset.id ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-10 rounded overflow-hidden relative flex-shrink-0 bg-slate-200">
                      <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
                      {asset.type === 'Video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play size={12} className="text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{asset.title}</div>
                      <div className="text-xs text-slate-400">ID: {asset.id.substring(0, 20)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {ASSET_ICONS[asset.type]}
                    {asset.type}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${asset.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
                  `}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {asset.uploadDate?.includes('T')
                    ? formatUploadDate(new Date(asset.uploadDate))
                    : asset.uploadDate}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setRepurposeAsset(asset)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <Sparkles size={14} />
                      Repurpose
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset.id, asset.title)}
                      disabled={deletingId === asset.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {repurposeAsset && (
        <RepurposeModal
          asset={repurposeAsset}
          onClose={() => setRepurposeAsset(null)}
          onConfirm={handleConfirmRepurpose}
        />
      )}
    </div>
  );
};
