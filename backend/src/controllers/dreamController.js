const Dream = require('../models/Dream');
const { analyzeDreamWithAI, buildDreamImageUrl } = require('../services/ai');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/analyzeDream
const analyzeDream = async (req, res) => {
  try {
    const { dream } = req.body;
    if (!dream || dream.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a dream description (min 5 characters)' });
    }

    console.log('📥 Analyzing dream...');
    const result   = await analyzeDreamWithAI(dream.trim());
    const imageUrl = buildDreamImageUrl(dream.trim(), result.mood);
    console.log('🎨 Image URL built for mood:', result.mood);

    res.json({ ...result, imageUrl });
  } catch (err) {
    console.error('❌ analyzeDream error:', err.message);
    res.status(500).json({ error: 'Failed to analyze dream. Please try again.' });
  }
};

// POST /api/saveDream
const saveDream = async (req, res) => {
  try {
    const { text, meaning, symbols, mood, confidence, imageUrl } = req.body;
    if (!text || !meaning || !mood) {
      return res.status(400).json({ error: 'text, meaning, and mood are required' });
    }
    const dream = new Dream({
      text,
      meaning,
      symbols:    symbols    || [],
      mood,
      confidence: confidence ? Number(confidence) : null,
      imageUrl:   imageUrl   || '',
    });
    await dream.save();
    console.log('💾 Dream saved:', dream._id);
    res.status(201).json({ message: 'Dream saved successfully 🌙', dream });
  } catch (err) {
    console.error('❌ saveDream error:', err.message);
    res.status(500).json({ error: 'Failed to save dream' });
  }
};

// GET /api/getDreams
const getDreams = async (req, res) => {
  try {
    const dreams = await Dream.find().sort({ createdAt: -1 });
    console.log(`📋 Returned ${dreams.length} dreams`);
    res.json(dreams);
  } catch (err) {
    console.error('❌ getDreams error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dreams' });
  }
};

// GET /api/moodStats
const getMoodStats = async (req, res) => {
  try {
    const results = await Dream.aggregate([
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);
    const stats = {};
    results.forEach(r => { if (r._id) stats[r._id] = r.count; });
    console.log('📊 Mood stats:', stats);
    res.json(stats);
  } catch (err) {
    console.error('❌ getMoodStats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch mood stats' });
  }
};

// GET /api/insights  ── AI-powered personalised insight from last 5 dreams
const getInsights = async (req, res) => {
  try {
    const recent = await Dream.find().sort({ createdAt: -1 }).limit(5);

    if (recent.length === 0) {
      return res.json({ insight: null, dominantMood: null, dreamCount: 0, topSymbols: [] });
    }

    // Count moods → pick dominant
    const moodCount = {};
    recent.forEach(d => { if (d.mood) moodCount[d.mood] = (moodCount[d.mood] || 0) + 1; });
    const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Collect top recurring symbols (by frequency)
    const symCount = {};
    recent.forEach(d => d.symbols?.forEach(s => { symCount[s.name] = (symCount[s.name] || 0) + 1; }));
    const topSymbols = Object.entries(symCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    // Build summary for Groq
    const summary = recent.map((d, i) =>
      `Dream ${i + 1}: "${d.text.slice(0, 100)}" — Mood: ${d.mood} — Symbols: ${d.symbols?.map(s => s.name).join(', ')}`
    ).join('\n');

    console.log('🧠 Generating AI insight for', recent.length, 'dreams...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a compassionate dream psychologist. Given a summary of a user's recent dreams, write a single warm, personalised insight paragraph (3-5 sentences). 
Focus on the emotional patterns you observe (dominant mood: ${dominantMood}), what they might indicate about the user's mental/emotional state, and one actionable suggestion to improve wellbeing.
Tone: supportive, empathetic, not clinical. Do NOT use bullet points. Respond with ONLY the insight paragraph, no labels or headings.`,
        },
        {
          role: 'user',
          content: `Here are my recent dreams:\n${summary}\n\nPlease provide a personalised psychological insight.`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 300,
    });

    const insight = completion.choices[0]?.message?.content?.trim() || null;
    console.log('✅ Insight generated');

    res.json({ insight, dominantMood, dreamCount: recent.length, topSymbols });
  } catch (err) {
    console.error('❌ getInsights error:', err.message);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
};

module.exports = { analyzeDream, saveDream, getDreams, getMoodStats, getInsights };
