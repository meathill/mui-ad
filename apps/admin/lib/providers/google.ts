import { GoogleGenAI } from '@google/genai';
import { base64ToArrayBuffer, type ImageProvider } from './types';

export const googleProvider: ImageProvider = {
  id: 'google',
  label: 'Google (Gemini)',
  keyUrl: 'https://aistudio.google.com/app/apikey',
  models: [
    {
      id: 'gemini-3-pro-image-preview',
      label: 'Nano Banana Pro (gemini-3-pro-image-preview)',
      defaultSize: '1024x1024',
      sizes: ['1024x1024'],
    },
    {
      id: 'gemini-3.1-flash-image-preview',
      label: 'Nano Banana 2 (gemini-3.1-flash-image-preview)',
      defaultSize: '1024x1024',
      sizes: ['1024x1024'],
    },
  ],
  async generate(input, apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: input.model,
      contents: input.prompt,
    });
    // Find the first inline image part in the response
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
      if (inline?.data) {
        return {
          bytes: base64ToArrayBuffer(inline.data),
          contentType: inline.mimeType ?? 'image/png',
          model: input.model,
          provider: 'google',
        };
      }
    }
    throw new Error('Google response did not include any image data');
  },
};
