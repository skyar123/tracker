import React, { useState } from 'react';
import { X, Sparkles, Upload, FileText, AlertTriangle, Loader2 } from 'lucide-react';

export default function MagicImportModal({ isOpen, onClose, onDataExtracted }) {
  const [textMode, setTextMode] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleExtract = async () => {
    const apiKey = localStorage.getItem('cf_gemini_api_key');
    if (!apiKey) {
      setError('Please configure your Gemini API Key in Settings first.');
      return;
    }

    if (textMode && !textInput.trim()) {
      setError('Please paste some text first.');
      return;
    }

    if (!textMode && !imageFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const promptText = `
Extract the following information from the provided content and return it as a pure JSON object.
Use empty strings "" if a field is not found or you are unsure. Do not guess information.
Ensure dates are in YYYY-MM-DD format if possible.

Required JSON keys:
- child_name (string, e.g. "John Doe")
- child_dob (string, YYYY-MM-DD format)
- caregiver_name (string, full name)
- caregiver_dob (string, YYYY-MM-DD format)
- intake_date (string, YYYY-MM-DD format)
- diagnosis (string, e.g. "F90.0 ADHD")
- insurance_type (string, "Medicaid" or "Commercial")
`;

      const parts = [{ text: promptText }];
      
      if (textMode) {
        parts.push({ text: `\n\nCONTENT TO EXTRACT FROM:\n${textInput}` });
      } else {
        const base64Image = await fileToBase64(imageFile);
        parts.push({
          inlineData: {
            mimeType: imageFile.type,
            data: base64Image
          }
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const jsonText = data.candidates[0].content.parts[0].text;
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (e) {
        // Fallback cleanup if model wrapped in markdown
        const cleaned = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      onDataExtracted(parsedData);
      onClose();
      
    } catch (err) {
      console.error(err);
      setError('Failed to extract data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-indigo-900">Magic Import</h2>
              <p className="text-sm text-indigo-600 mt-1">Paste referral text or upload a screenshot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-indigo-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-2 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setTextMode(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md flex justify-center items-center gap-2 transition-all ${
                textMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" /> Paste Text
            </button>
            <button
              onClick={() => setTextMode(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md flex justify-center items-center gap-2 transition-all ${
                !textMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload Image
            </button>
          </div>

          <div className="min-h-[200px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative">
            {textMode ? (
              <textarea
                className="w-full h-full min-h-[200px] p-4 bg-transparent outline-none resize-none"
                placeholder="Paste referral document, email, or clinical note here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center border-2 border-dashed border-indigo-200 rounded-xl m-2 bg-white hover:bg-indigo-50 transition-colors relative">
                {imagePreview ? (
                  <div className="absolute inset-0 p-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-md hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-indigo-300 mb-3" />
                    <p className="font-semibold text-indigo-900 mb-1">Click to upload screenshot</p>
                    <p className="text-sm text-slate-500">JPG, PNG, GIF up to 5MB</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleImageUpload}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleExtract}
            disabled={isLoading}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isLoading ? 'Extracting Data...' : 'Extract Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
