// Gemini API Service
// Centralized service for handling Gemini API calls

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

class GeminiAPIService {
  private apiKey: string | undefined;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor() {
    this.apiKey = process.env.PUBLIC_GEMINI_API_KEY;
  }

  private validateApiKey(): string {
    const apiKey = process.env.PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API key Gemini tidak ditemukan. Periksa konfigurasi environment.');
    }
    return apiKey;
  }

  private async makeRequest(prompt: string): Promise<string> {
    const apiKey = this.validateApiKey();

    const url = `${this.baseUrl}?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    console.log('🚀 Sending request to Gemini API...');
    console.log('📍 URL:', url.replace(this.apiKey!, '[HIDDEN]'));
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('✅ AI Response received:', data);

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        console.error('❌ Invalid AI response structure:', data);
        throw new Error('Respons dari AI tidak valid. Silakan coba lagi.');
      }

      return responseText;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      throw error;
    }
  }

  async generateStudyPlan(topic: string): Promise<string[]> {
    const prompt = `Anda adalah ahli kurikulum. Buatkan roadmap belajar untuk topik: "${topic}". Balas HANYA dengan array JSON dari string. Jangan gunakan format markdown seperti **. Contoh: ["Langkah 1", "Langkah 2"]`;
    
    const responseText = await this.makeRequest(prompt);
    
    // Clean the response text more thoroughly
    let cleanedText = responseText.replace(/```json\n?|```\n?/g, '').trim();
    cleanedText = cleanedText.replace(/^[^\[]*\[/, '[').replace(/\][^\]]*$/, ']');
    
    console.log('🧹 Cleaned text:', cleanedText);
    
    try {
      const parsedTasks: string[] = JSON.parse(cleanedText);
      if (!Array.isArray(parsedTasks) || parsedTasks.length === 0) {
        throw new Error('Response is not a valid array');
      }
      return parsedTasks;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('📝 Text that failed to parse:', cleanedText);
      throw new Error('Format respons AI tidak valid. Silakan coba lagi.');
    }
  }

  async generateTaskDetails(task: string, topic: string): Promise<string> {
    const prompt = `Anda adalah seorang mentor belajar yang memberikan bimbingan singkat dan efektif.
    Jelaskan secara ringkas, jelas, dan fokus pada poin-poin penting untuk langkah belajar: "${task}", dalam konteks topik "${topic}".
    Berikan penjelasan dalam 2 hingga 3 kalimat yang informatif.
    Jangan gunakan format markdown seperti **bold**, *italic*, list (*), atau simbol lainnya.`;
    
    const responseText = await this.makeRequest(prompt);
    
    // Clean markdown if still present
    return responseText.trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/^- /gm, '');
  }
}

// Export singleton instance
export const geminiAPI = new GeminiAPIService();
export default geminiAPI;