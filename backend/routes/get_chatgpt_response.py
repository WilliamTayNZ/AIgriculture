from flask import Blueprint, request, jsonify

fetch_gpt_response_bp = Blueprint('fetch_gpt_response', __name__)

from backend.ai_agent import GPTDependencies, create_agent, get_recommendations, HISTORICAL_DATA
# from backend.speed_utils import summarize_area_list, compact_grid

agent = create_agent()

@fetch_gpt_response_bp.route('/api/gpt_response', methods=['POST'])
async def fetch_gpt_response():
    try:
        print("Python: Received GPT response request")
        data = request.get_json()
        context = data.get('field_context')
        grid_raw  = data.get('gridData')
        area_raw  = data.get('areaData')


        print("Grid raw:")
        print(grid_raw)
        print("Area raw:")
        print(area_raw)
        print("\n")

        '''
        # reduce size of data for faster LLM processing
        area_summary = summarize_area_list(area_raw)
        grid_compact = compact_grid(grid_raw)

        '''

        deps = GPTDependencies(
            context=context,
            gridData=grid_raw,
            areaData=area_raw,         
            historical_context=HISTORICAL_DATA
        )

        '''
        print("Grid compact:")
        print(grid_compact)
        print("Area summary:")
        print(area_summary)
        '''

        gpt_out = await get_recommendations(agent, deps)

        print("")
        print("")
        print("------GPT OUT:-----")
        print(gpt_out)
        print("")
        print("")

        return gpt_out.tips

    except Exception as e:
        return jsonify({"error": str(e)}), 500

'''
- Provide 5 green suggestions (actions to take, based on the numbers).
- Provide 3 red avoid suggestions (actions to avoid, based on the numbers).
- Each suggestion should reference the relevant numbers (e.g. "Because NDVI is ${gridData.NDVI}, ..." or "Rainfall is ${gridData.rain}mm").
- Do not mention brand names.
- Format: prefix green suggestions with 🟩 and avoid suggestions with 🟥.

Field context:
${context}

Selected grid data (for alert bar):
${JSON.stringify(gridData, null, 2)}

Area data (surrounding grids):
${JSON.stringify(areaData, null, 2)}
` + historical_context;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an agricultural AI assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 320,
        temperature: 0.7,
      }),
    });

    const json = await res.json();
    console.log(json);
    const text = json.choices?.[0]?.message?.content || "";
    // Only keep green (🟩) and red (🟥) suggestions
    const tips = text.split(/\n+/)
      .map(l => l.trim())
      .filter(l => l.startsWith("🟩") || l.startsWith("🟥"));
    return tips.length ? tips : [text || "No suggestions generated."];
  } catch (err) {
    return ["Error fetching AI suggestions."];
  }
}
'''