from dotenv import load_dotenv

# from geopy.adapters import AioHTTPAdapter
# from geopy.geocoders import Nominatim

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
import json

load_dotenv()

with open("historical_data.txt", encoding="utf-8") as f:
    HISTORICAL_DATA = f.read()

class GPTDependencies(BaseModel):
    context: str = Field(description="User-provided context, describing their field, crop, or situation.")
    gridData: dict = Field(description="Data for the farmer’s grid location.")
    areaData: list = Field(description="List of data for the grids surrounding the farmer's location, providing context for comparing the selected field to nearby areas.")
    historical_context: str = Field(description="Relevant historical news articles for several regions.")
    

class GPTOutput(BaseModel):
    tips: list[str] = Field(min_length=8, max_length=8, 
                            description="Start with exactly 5 green suggestions, each starting with 🟩 and citing numbers, followed by exactly 3 red avoid/critical suggestions, each starting with 🟥 and citing numbers..")

def build_prompt(deps: GPTDependencies) -> str:
    grid_json = json.dumps(deps.gridData, ensure_ascii=False)
    area_json = json.dumps(deps.areaData, ensure_ascii=False)
    historical_text = deps.historical_context

    return (
        "FIELD CONTEXT:\n"
        f"{deps.context}\n\n"
        "SELECTED GRID DATA (JSON):\n"
        f"{grid_json}\n\n"
        "AREA SUMMARY (JSON; mean/min/max/count across nearby cells):\n"
        f"{area_json}\n\n"
        "HISTORICAL DATA:\n"
        f"{historical_text}\n\n"
        "Return tips as specified in the system instructions."
    )
    
INSTRUCTIONS = (
    "You are an agricultural AI assistant.\n"
    "Use the following field context, selected grid data, and area data to generate suggestions. \n"
    "Reference the actual numbers (e.g. temperature, rain, NDVI, soil moisture, cropland, landcover) from the JSON in your advice.\n"
    "Produce an array with EXACTLY 8 elements: 5 green suggestions FOLLOWED BY 3 red avoid suggestions as described below.\n"
    "\n"
    "STRICT OUTPUT RULES:\n"
    "- Provide 5 green suggestions (actions to take, based on the numbers).\n"
    "- Provide 3 red avoid suggestions (actions to avoid, based on the numbers).\n"
    "- Each suggestion should reference the relevant numbers (e.g. 'Because NDVI is ${gridData.NDVI}, ...' or 'Rainfall is ${gridData.rain}mm').\n"
    "- DO NOT GIVE RESPONSES LIKE 'if the soil moisture is low, do this'. In a case like this, you must CLEARLY identify that the soil moisture is low or high and explain its implications to the farmer.\n"
    "- Do NOT mention brand names.\n"
    "- Format: prefix green suggestions with 🟩 and avoid suggestions with 🟥.\n"
    "- Ensure that your suggestions are ALL RELEVANT to the region that has been selected and the CONTEXT provided. This is extremely important.\n"
    "- Also ensure that no mistakes are made (eg. the correct region is mentioned)"
)


def create_agent(model: str = "openai:gpt-4o-mini", instructions: str = INSTRUCTIONS):
    return Agent(
        model,
        deps_type=GPTDependencies,
        output_type=GPTOutput,
        instructions=INSTRUCTIONS,
        model_settings={
        "max_output_tokens": 320,
        "temperature": 0.3
        }
      )


async def get_recommendations(agent: Agent[GPTDependencies, GPTOutput], deps: GPTDependencies):
    print("Calling get_recommendations() in chatgpt.py")
    prompt = build_prompt(deps)
    return (await agent.run(prompt, deps=deps)).output



# async def get_address(ctx: RunContext[GPTDependencies]):
#     location = GEOLOCATOR.reverse(
#         (ctx.deps.latitude, ctx.deps.longitude), exactly_one=True
#     )

#     if location is None:
#         return "Unknown"

#     location = await location
#     if location is None:
#         return "Unknown"

#     return str(location.address)


# async def get_crop_and_global_support(ctx: RunContext[GPTDependencies]):
#     classification_mapping = {
#         0: "Non-croplands",
#         1: "Croplands-irrigation Major",
#         2: "Croplands-irrigation Minor",
#         3: "Croplands-rainfed",
#         4: "Croplands-rainfed Minor Fragments",
#         5: "Croplands-rainfed Very Minor Fragments",
#     }
#     return classification_mapping[ctx.deps.crop_and_global_support_code]



'''
  // Compose prompt using context, selected grid, and area data
  // Reference numbers from gridData (alert bar) and areaData
  const prompt = `
You are an agricultural AI assistant. Use the following field context, selected grid data, and area data to generate suggestions.
Reference the actual numbers (e.g. temperature, rain, NDVI, soil moisture, cropland, landcover) in your advice.

- Provide 5 green suggestions (actions to take, based on the numbers).
- Provide 3 red avoid suggestions (actions to avoid, based on the numbers).
- Each suggestion should reference the relevant numbers (e.g. "Because NDVI is (gridData.NDVI), ..." or "Rainfall is (gridData.rain)mm").
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