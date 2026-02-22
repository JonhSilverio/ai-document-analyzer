from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import json
import os
from dotenv import load_dotenv

# Isso abre o "cofre" (seu arquivo .env)
load_dotenv()

app = Flask(__name__)
CORS(app) 

# Agora ele pega a chave do cofre, com total segurança!
GOOGLE_API_KEY = os.environ.get("GEMINI_API_KEY")

client = genai.Client(api_key=GOOGLE_API_KEY)

@app.route('/analyze', methods=['POST'])
def analyze_document():
    data = request.json
    document_text = data.get('text', '')

    if not document_text:
        return jsonify({"error": "Nenhum texto fornecido"}), 400

    prompt = f"""
    You are a Senior Legal and Risk Analyst AI.
    Analyze the following contract or document text. 
    You MUST return ONLY a valid JSON object with this exact structure:
    {{
        "tags": ["Tag1", "Tag2", "Tag3"],
        "summary": "<p>Write an executive summary here in 2 paragraphs.</p>",
        "risks": [
            {{"title": "Risk Title 1", "description": "Explanation of the risk"}},
            {{"title": "Risk Title 2", "description": "Explanation of the risk"}}
        ]
    }}

    Document text to analyze:
    {document_text}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        
        result = json.loads(response.text)
        return jsonify(result)
    
    except Exception as e:
        print("Erro na API:", e)
        return jsonify({"error": "Falha ao analisar o documento com IA."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)