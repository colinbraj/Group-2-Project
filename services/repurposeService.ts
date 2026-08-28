import OpenAI from 'openai';
import { Asset, RepurposeType } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface SummaryResult {
    transcript?: string;
    summary: string;
    keyPoints: string[];
    modelsUsed: string[];
}

export interface VideoResult {
    id: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
}

export interface RepurposeJobResult {
    type: RepurposeType;
    success: boolean;
    summary?: SummaryResult;
    imageUrl?: string;
    // All outcomes must have captions
    captions: {
        facebook: string;
        instagram: string;
    };
    video?: VideoResult;
    error?: string;
    // When true, n8n has already saved the post to Supabase
    savedByN8n?: boolean;
    postId?: string;
}

export type ProgressCallback = (stage: string, progress: number, model: string) => void;

// ============================================================================
// OPENAI CLIENT
// ============================================================================

const getOpenAIClient = () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!apiKey) {
        console.warn("OPENAI_API_KEY is missing. Using mock responses.");
        return null;
    }
    return new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });
};

// ============================================================================
// TEXT EXTRACTION - Get text content from any asset type
// ============================================================================

/**
 * Extract text content from an asset based on its type.
 * - Video: Extract audio → MP3 → Transcribe with gpt-4o-mini-transcribe
 * - Audio: Transcribe directly with gpt-4o-mini-transcribe
 * - PDF: Send to GPT-4o-mini to read content
 * - Text: Read file content directly
 */
const extractTextFromAsset = async (
    asset: Asset,
    fileBlob: Blob | null | unknown,
    onProgress?: ProgressCallback
): Promise<string> => {
    const openai = getOpenAIClient();

    // If we already have transcript, use it
    if (asset.transcript && asset.transcript.length > 50) {
        console.log('Using existing transcript');
        return asset.transcript;
    }

    // Validate that fileBlob is actually a Blob (lost when restored from localStorage)
    const validBlob = (fileBlob && fileBlob instanceof Blob) ? fileBlob : null;

    if (fileBlob && !validBlob) {
        console.warn('fileBlob exists but is not a valid Blob - may have been restored from localStorage');
    }

    switch (asset.type) {
        case 'Video': {
            onProgress?.('Extracting audio from video...', 10, 'FFmpeg');

            if (!validBlob) {
                console.log('No video file available, using mock transcript');
                return generateMockTranscript(asset.title);
            }

            // Convert video to audio (MP3)
            onProgress?.('Converting to audio...', 20, 'FFmpeg');
            const audioBlob = await extractAudioFromVideo(validBlob);

            // Transcribe audio
            onProgress?.('Transcribing audio...', 40, 'gpt-4o-mini-transcribe');
            return await transcribeAudio(audioBlob, openai, onProgress);
        }

        case 'Audio': {
            onProgress?.('Transcribing audio...', 20, 'gpt-4o-mini-transcribe');

            if (!validBlob) {
                console.log('No audio file available, using mock transcript');
                return generateMockTranscript(asset.title);
            }

            return await transcribeAudio(validBlob, openai, onProgress);
        }

        case 'PDF': {
            onProgress?.('Reading PDF content...', 20, 'GPT-4o');

            if (!validBlob) {
                console.log('No PDF file available, using mock content');
                return `Document: ${asset.title}. This document contains professional insights and key information. (File needs to be re-uploaded for full content extraction)`;
            }

            // Extract text from PDF using GPT-4o
            return await extractPDFText(validBlob, onProgress);
        }

        case 'Text':
        default: {
            onProgress?.('Reading text content...', 20, 'Direct');

            if (!validBlob) {
                return `Content about: ${asset.title}`;
            }

            // Read text file content
            const text = await validBlob.text();
            return text || `Content about: ${asset.title}`;
        }
    }
};

/**
 * Extract audio from video file as MP3.
 * Uses Web Audio API for browser-based extraction.
 */
const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
    // For browser environment, we'll extract audio using HTML5 video element
    // This is a simplified approach - for production, consider using ffmpeg.wasm

    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;

        video.onloadedmetadata = async () => {
            try {
                const duration = video.duration;
                const sampleRate = audioContext.sampleRate;
                const numChannels = 2;
                const numSamples = Math.floor(duration * sampleRate);

                // Create offline context
                const offlineContext = new OfflineAudioContext(numChannels, numSamples, sampleRate);

                // Create media element source
                const source = audioContext.createMediaElementSource(video);
                const destination = audioContext.createMediaStreamDestination();
                source.connect(destination);

                // Record audio using MediaRecorder
                const mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
                const chunks: Blob[] = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                    URL.revokeObjectURL(video.src);
                    resolve(audioBlob);
                };

                // Start recording and playing
                mediaRecorder.start();
                video.play();

                // Stop after video ends
                video.onended = () => {
                    mediaRecorder.stop();
                    audioContext.close();
                };

                // Fallback timeout for short videos
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        video.pause();
                        mediaRecorder.stop();
                        audioContext.close();
                    }
                }, (duration + 2) * 1000);

            } catch (err) {
                console.error('Audio extraction error:', err);
                // Return original blob as fallback
                resolve(videoBlob);
            }
        };

        video.onerror = () => {
            console.error('Video load error');
            resolve(videoBlob); // Return original as fallback
        };
    });
};

/**
 * Transcribe audio using OpenAI's transcription API.
 */
const transcribeAudio = async (
    audioBlob: Blob,
    openai: OpenAI | null,
    onProgress?: ProgressCallback
): Promise<string> => {
    if (!openai) {
        onProgress?.('Transcription (mock)...', 60, 'gpt-4o-mini-transcribe');
        await delay(1500);
        return "This is a mock transcription of the audio content. The audio discusses key insights about professional development, leadership strategies, and effective communication techniques.";
    }

    try {
        onProgress?.('Sending to transcription API...', 50, 'gpt-4o-mini-transcribe');

        // Convert blob to File for OpenAI API
        const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'gpt-4o-mini-transcribe',
        });

        onProgress?.('Transcription complete', 80, 'gpt-4o-mini-transcribe');
        return transcription.text;
    } catch (error) {
        console.error('Transcription error:', error);
        return "Transcription failed. Please try again.";
    }
};

/**
 * Extract text from PDF by parsing raw bytes.
 * Works for text-based PDFs. For scanned/image PDFs, returns minimal info.
 */
const extractPDFText = async (
    pdfBlob: Blob | unknown,
    onProgress?: ProgressCallback
): Promise<string> => {
    console.log('Starting PDF text extraction, blob:', pdfBlob, 'type:', typeof pdfBlob);

    // Validate that pdfBlob is actually a Blob
    if (!pdfBlob || !(pdfBlob instanceof Blob)) {
        console.error('Invalid PDF blob - not a Blob instance:', typeof pdfBlob);
        return 'PDF content could not be read. The file may need to be re-uploaded.';
    }

    console.log('PDF blob size:', pdfBlob.size, 'type:', pdfBlob.type);

    try {
        onProgress?.('Reading PDF...', 30, 'Direct');

        // Check if arrayBuffer method exists
        if (typeof pdfBlob.arrayBuffer !== 'function') {
            console.error('Blob does not have arrayBuffer method - may have been serialized');
            return 'PDF content could not be read. Please re-upload the file.';
        }

        // Read the PDF as text - this works for text-based PDFs
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Convert to string to search for text content
        let rawText = '';
        for (let i = 0; i < bytes.length; i++) {
            const char = bytes[i];
            // Only include printable ASCII characters
            if (char >= 32 && char <= 126) {
                rawText += String.fromCharCode(char);
            } else if (char === 10 || char === 13) {
                rawText += '\n';
            }
        }

        onProgress?.('Extracting text content...', 50, 'Direct');

        // Extract text between parentheses (PDF text objects are often in parentheses)
        const textMatches: string[] = [];
        const regex = /\(([^)]+)\)/g;
        let match;
        while ((match = regex.exec(rawText)) !== null) {
            const text = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\\\/g, '\\')
                .trim();

            // Only include meaningful text (not just numbers or single chars)
            if (text.length > 2 && !/^[\d\s.,-]+$/.test(text)) {
                textMatches.push(text);
            }
        }

        // Also try to find text in stream objects (BT...ET blocks)
        const streamRegex = /BT\s*([\s\S]*?)\s*ET/g;
        while ((match = streamRegex.exec(rawText)) !== null) {
            const streamContent = match[1];
            const tjMatches = streamContent.match(/\(([^)]+)\)/g);
            if (tjMatches) {
                tjMatches.forEach(m => {
                    const t = m.slice(1, -1).trim();
                    if (t.length > 2 && !/^[\d\s.,-]+$/.test(t)) {
                        textMatches.push(t);
                    }
                });
            }
        }

        // Remove duplicates and join
        const uniqueTexts = [...new Set(textMatches)];
        const extractedText = uniqueTexts.join(' ').replace(/\s+/g, ' ').trim();

        console.log('Extracted text length:', extractedText.length);

        if (extractedText.length < 50) {
            onProgress?.('Limited text found', 90, 'Direct');
            return extractedText || `PDF Document (${Math.round(pdfBlob.size / 1024)}KB). This may be an image-based or encrypted PDF.`;
        }

        onProgress?.('PDF text extracted', 95, 'Direct');
        return extractedText;

    } catch (error) {
        console.error('PDF extraction error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return `Failed to read PDF: ${errorMessage}. Please try re-uploading the file.`;
    }
};

const generateMockTranscript = (title: string): string => {
    return `Welcome to today's session on "${title}". 

We're going to explore the key concepts and practical strategies that will help you succeed. In my experience working with thousands of professionals, I've noticed that the most successful individuals share certain traits.

First, they maintain composure under pressure. Second, they communicate with clarity and conviction. And third, they never stop learning.

Let me share a quick story that illustrates this perfectly...`;
};

// ============================================================================
// CAPTION GENERATION - Always generate captions for all outcomes
// ============================================================================

/**
 * Generate social media captions from text content.
 */
const generateCaptions = async (
    textContent: string,
    openai: OpenAI | null,
    onProgress?: ProgressCallback
): Promise<{ facebook: string; instagram: string }> => {
    if (!openai) {
        onProgress?.('Generating captions (mock)...', 90, 'GPT-4o-mini');
        await delay(500);
        return {
            facebook: `✨ Key insights from our latest content!\n\n${textContent.substring(0, 200)}...\n\nWhat do you think? Share your thoughts below! 👇`,
            instagram: `✨ New content alert!\n\n${textContent.substring(0, 150)}...\n\n#ContentCreation #Insights #ProfessionalDevelopment`
        };
    }

    try {
        onProgress?.('Generating captions...', 85, 'GPT-4o-mini');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a social media content expert. Generate engaging captions for Facebook and Instagram based on the provided content.

Return a JSON object with exactly these two fields:
- "facebook": A longer, engaging Facebook caption (150-300 chars) with a call-to-action
- "instagram": A punchy Instagram caption (100-200 chars) with relevant hashtags

Make the captions feel authentic and engaging.`
                },
                {
                    role: 'user',
                    content: `Generate social media captions for this content:\n\n${textContent.substring(0, 1000)}`
                }
            ],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            facebook: result.facebook || `Check out our latest insights! ${textContent.substring(0, 100)}...`,
            instagram: result.instagram || `New content! ${textContent.substring(0, 80)}... #Content`
        };
    } catch (error) {
        console.error('Caption generation error:', error);
        return {
            facebook: `✨ ${textContent.substring(0, 200)}...`,
            instagram: `${textContent.substring(0, 150)}... #Content`
        };
    }
};

// ============================================================================
// SUMMARIZATION
// ============================================================================

const summarizeText = async (
    text: string,
    openai: OpenAI | null,
    onProgress?: ProgressCallback
): Promise<SummaryResult> => {
    if (!openai) {
        onProgress?.('Summarizing (mock)...', 70, 'GPT-4o-mini');
        await delay(1000);
        return {
            summary: `This content covers key insights about professional development and leadership. The main focus is on practical strategies for success in modern business environments.`,
            keyPoints: [
                'Maintain composure under pressure',
                'Communicate with clarity and conviction',
                'Embrace continuous learning',
                'Build meaningful professional relationships'
            ],
            modelsUsed: ['GPT-4o-mini']
        };
    }

    try {
        onProgress?.('Summarizing with AI...', 70, 'GPT-4o-mini');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Summarize the following content. Return a JSON object with "summary" (1-2 paragraph overview) and "keyPoints" (array of 4-6 bullet points). Return ONLY valid JSON.'
                },
                { role: 'user', content: text }
            ],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            summary: result.summary || 'Summary could not be generated.',
            keyPoints: result.keyPoints || [],
            modelsUsed: ['GPT-4o-mini']
        };
    } catch (error) {
        console.error('Summarization error:', error);
        throw error;
    }
};

// ============================================================================
// IMAGE GENERATION (via n8n Flow 4)
// ============================================================================

const generateImage = async (
    textContent: string,
    onProgress?: ProgressCallback
): Promise<{ imageUrl: string; savedByN8n: boolean; postId?: string }> => {
    const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.kadoshai.com';
    const CREATE_POST_WEBHOOK = import.meta.env.VITE_N8N_CREATE_POST_WEBHOOK || '/webhook/create-post';

    try {
        onProgress?.('Calling image generation...', 50, 'DALL-E 3');

        const webhookUrl = `${N8N_BASE_URL}${CREATE_POST_WEBHOOK}`;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                platforms: ['facebook', 'instagram'],
                goal: 'engagement',
                tone: 'professional',
                context: textContent.substring(0, 500),
            }),
        });

        onProgress?.('Processing response...', 75, 'Supabase Storage');

        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status}`);
        }

        const result = JSON.parse(await response.text());

        return {
            imageUrl: result.image_url || '',
            savedByN8n: true,
            postId: result.post_id
        };
    } catch (error) {
        console.error('n8n image generation failed:', error);
        // Return mock/placeholder
        return {
            imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/1024/1024`,
            savedByN8n: false
        };
    }
};

// ============================================================================
// VIDEO GENERATION (Sora - Mock)
// ============================================================================

const generateVideo = async (
    textContent: string,
    onProgress?: ProgressCallback
): Promise<VideoResult> => {
    onProgress?.('Preparing video generation...', 20, 'Sora 2');
    await delay(1000);

    onProgress?.('Generating video frames...', 50, 'Sora 2');
    await delay(2000);

    onProgress?.('Rendering video...', 80, 'Sora 2');
    await delay(1000);

    // Mock result - Sora API would be called here
    return {
        id: `sora_${Date.now()}`,
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/640/360`,
        duration: 15
    };
};

// ============================================================================
// ORCHESTRATOR - Process Full Repurpose Job
// ============================================================================

/**
 * Orchestrates the full repurpose workflow.
 * 1. Extract text content from asset (transcribe/read)
 * 2. Process based on selected option
 * 3. Always generate captions for the outcome
 */
export const processRepurposeJob = async (
    asset: Asset,
    option: RepurposeType,
    onProgress?: ProgressCallback,
    fileBlob?: Blob | null
): Promise<RepurposeJobResult> => {
    const openai = getOpenAIClient();

    try {
        // Step 1: Extract text content from asset
        onProgress?.('Extracting content...', 5, 'Pre-processing');
        const textContent = await extractTextFromAsset(asset, fileBlob || null, onProgress);

        console.log('Extracted text content:', textContent.substring(0, 200) + '...');

        // Step 2: Process based on option
        switch (option) {
            case 'Summarize': {
                onProgress?.('Summarizing content...', 60, 'GPT-4o-mini');
                const summary = await summarizeText(textContent, openai, onProgress);

                // Generate captions from summary
                onProgress?.('Generating captions...', 85, 'GPT-4o-mini');
                const captions = await generateCaptions(summary.summary, openai, onProgress);

                onProgress?.('Complete!', 100, 'GPT-4o-mini');

                return {
                    type: option,
                    success: true,
                    summary: { ...summary, transcript: textContent },
                    captions
                };
            }

            case 'Image_Gen': {
                onProgress?.('Generating image...', 40, 'DALL-E 3');
                const imageResult = await generateImage(textContent, onProgress);

                // Generate captions
                onProgress?.('Generating captions...', 85, 'GPT-4o-mini');
                const captions = await generateCaptions(textContent, openai, onProgress);

                onProgress?.('Complete!', 100, 'GPT-4o-mini');

                return {
                    type: option,
                    success: true,
                    imageUrl: imageResult.imageUrl,
                    captions,
                    savedByN8n: imageResult.savedByN8n,
                    postId: imageResult.postId
                };
            }

            case 'Video_Sora': {
                onProgress?.('Generating video...', 30, 'Sora 2');
                const video = await generateVideo(textContent, onProgress);

                // Generate captions
                onProgress?.('Generating captions...', 85, 'GPT-4o-mini');
                const captions = await generateCaptions(textContent, openai, onProgress);

                onProgress?.('Complete!', 100, 'GPT-4o-mini');

                return {
                    type: option,
                    success: true,
                    video,
                    captions
                };
            }

            default:
                throw new Error(`Unknown repurpose option: ${option}`);
        }
    } catch (error) {
        console.error('Repurpose job error:', error);
        return {
            type: option,
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            captions: { facebook: '', instagram: '' }
        };
    }
};

// ============================================================================
// UTILITY
// ============================================================================

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
