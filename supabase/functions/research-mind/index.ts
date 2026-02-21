const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaperInput {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  source: string;
  arxiv_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paper, relatedPapers } = await req.json() as {
      paper: PaperInput;
      relatedPapers: PaperInput[];
    };

    if (!paper) {
      return new Response(
        JSON.stringify({ error: 'Paper data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context from related papers
    const relatedContext = (relatedPapers || []).slice(0, 8).map((p, i) =>
      `[Paper ${i + 1}] "${p.title}" by ${p.author}\nSummary: ${p.summary}\nTags: ${p.tags.join(', ')}`
    ).join('\n\n');

    const systemPrompt = `You are ResearchMind, an autonomous academic reasoning engine. Analyze the given research paper by extracting claims, finding contradictions with related work, identifying evidence gaps, and providing devil's advocate challenges.

You MUST respond with a valid JSON object matching this exact schema (no markdown, no code fences):
{
  "claims": [
    { "text": "string", "type": "hypothesis|finding|methodology|conclusion", "strength": "strong|moderate|weak" }
  ],
  "supporting_papers": [
    { "title": "string", "relation": "string explaining how it supports" }
  ],
  "conflicting_papers": [
    { "title": "string", "contradiction": "string explaining the contradiction" }
  ],
  "contradictions": [
    { "description": "string", "severity": "high|medium|low" }
  ],
  "evidence_gaps": [
    "string describing a gap"
  ],
  "devils_advocate": [
    { "challenge": "string", "target_claim": "string" }
  ],
  "confidence_score": 0.0 to 1.0,
  "confidence_explanation": "string explaining the score",
  "reasoning_summary": "string with overall assessment"
}`;

    const userPrompt = `Analyze this paper and cross-reference with related work:

## Target Paper
Title: ${paper.title}
Author: ${paper.author}
Summary: ${paper.summary}
Tags: ${paper.tags.join(', ')}

## Related Papers for Cross-Reference
${relatedContext || 'No related papers available for comparison.'}

Perform deep analysis: extract key claims, identify supporting/conflicting papers from the related set, detect contradictions, find evidence gaps, generate devil's advocate challenges, and compute a confidence score. Return ONLY valid JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('AI gateway error:', status, errText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from response (strip markdown fences if present)
    let analysis;
    try {
      const jsonStr = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', rawContent.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ResearchMind error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
