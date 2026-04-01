const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert dream psychologist with deep knowledge of Jungian symbolism and subconscious analysis.

When given a dream, analyze it and respond ONLY with a valid JSON object in this exact format:
{
  "meaning": "A clear 2-3 sentence psychological explanation of the dream",
  "symbols": [
    { "name": "Symbol name", "meaning": "What this symbol represents psychologically" }
  ],
  "mood": "OneWordEmotionalState"
}

Rules:
- Provide exactly 3-5 symbols from the dream
- mood must be a single word (e.g. Anxiety, Hope, Fear, Joy, Confusion, Dread, Peace)
- Do NOT add any text outside the JSON`;

async function analyzeDreamWithAI(dreamText) {
  console.log('🧠 Calling Groq AI...');

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Analyze this dream: "${dreamText}"` },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  console.log('✅ Groq AI responded');

  const parsed = JSON.parse(content);
  if (!parsed.meaning || !parsed.mood) {
    throw new Error('Invalid AI response structure');
  }

  return {
    meaning: parsed.meaning,
    symbols: Array.isArray(parsed.symbols) ? parsed.symbols : [],
    mood:    parsed.mood,
  };
}

/**
 * Build a Pollinations.ai image URL.
 * Returned to the client and loaded directly as an <img> src —
 * img tags are NOT subject to browser ORB/CORS restrictions.
 */
function buildDreamImageUrl(dreamText, mood) {
  const moodStyles = {
    dread:     'dark ominous gothic atmosphere deep shadows blood moon',
    fear:      'horror surrealism dark mist haunting shadows eerie glow',
    anxiety:   'surreal swirling fog distorted perspective neon colors unsettling',
    hope:      'ethereal golden light luminous clouds heavenly dawn',
    joy:       'vibrant magical colors floating islands bioluminescent paradise',
    peace:     'serene cosmic landscape soft aurora borealis calm tranquil',
    confusion: 'melting surrealism impossible architecture twilight',
    sadness:   'melancholic rain muted blues lonely figure soft moonlight',
  };

  const moodKey   = (mood || '').toLowerCase();
  const styleHint = Object.entries(moodStyles).find(([k]) => moodKey.includes(k))?.[1]
    || 'surreal dreamscape cosmic mystery otherworldly';

  const snippet = dreamText.slice(0, 60).replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const prompt  = `simple surreal dream ${snippet}`;

  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=512&nologo=true&seed=${seed}`;
}

module.exports = { analyzeDreamWithAI, buildDreamImageUrl };
