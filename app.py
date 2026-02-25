from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google import genai
from google.genai import types
import json
import os


try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# ROTA 3: A inteligência da IA
@app.route('/analyze', methods=['POST'])
def analyze_document():
    data = request.json
    document_text = data.get('text', '')

    if not document_text:
        return jsonify({"error": "Nenhum texto fornecido"}), 400

 
    GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GOOGLE_API_KEY:
        return jsonify({"error": "Chave da API não configurada no servidor Render."}), 500

    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        
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

        response = client.models.generate_content(
            model='gemini-2.5-flash-lite', 
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
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)