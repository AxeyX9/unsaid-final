import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CreateStoryDialog({ open, onOpenChange, user }) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          setImagePreview(base64);
          
          const response = await axios.post(`${API}/upload/image`, {
            imageData: base64
          });
          
          setImageUrl(response.data.imageUrl);
          toast.success('Image uploaded!');
        } catch (error) {
          toast.error('Failed to upload image');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!text.trim() && !imageUrl) {
      toast.error('Please add text or image');
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API}/stories`, {
        text: text.trim() || null,
        imageUrl: imageUrl || null
      });
      toast.success('Story created!');
      setText('');
      setImagePreview('');
      setImageUrl('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
              <button
                onClick={() => {
                  setImagePreview('');
                  setImageUrl('');
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Textarea
                placeholder="Share something..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-white/5 border-white/10 text-white min-h-[120px] resize-none"
              />

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border-2 border-dashed border-white/20">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <span>{uploading ? 'Uploading...' : 'Add Photo'}</span>
                </div>
              </label>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={uploading || creating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {creating ? 'Creating...' : 'Share Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateStoryDialog;
