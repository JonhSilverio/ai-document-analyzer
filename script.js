document.addEventListener('DOMContentLoaded', () => {
    const btnAnalyze = document.getElementById('btn-analyze');
    const uploadSection = document.getElementById('upload-section');
    const loadingState = document.getElementById('loading-state');
    const resultsSection = document.getElementById('results-section');
    const btnReset = document.getElementById('btn-reset');

    const tabUpload = document.getElementById('tab-upload');
    const tabPaste = document.getElementById('tab-paste');
    const dropzone = document.getElementById('dropzone');
    const pasteArea = document.getElementById('paste-area');
    const textInput = document.getElementById('text-input');
    
    const btnBrowse = document.getElementById('btn-browse');
    const fileUpload = document.getElementById('file-upload');

    const docTags = document.getElementById('doc-tags');
    const summaryContent = document.getElementById('summary-content');
    const risksList = document.getElementById('risks-list');

    let uploadedTextContent = "";

    tabUpload.addEventListener('click', () => {
        tabUpload.classList.add('active'); tabPaste.classList.remove('active');
        dropzone.classList.remove('hidden'); pasteArea.classList.add('hidden');
    });

    tabPaste.addEventListener('click', () => {
        tabPaste.classList.add('active'); tabUpload.classList.remove('active');
        pasteArea.classList.remove('hidden'); dropzone.classList.add('hidden');
        textInput.focus(); 
    });

    btnBrowse.addEventListener('click', (e) => { e.preventDefault(); fileUpload.click(); });

    fileUpload.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            const file = e.target.files[0];
            updateDropzoneUI(file.name);
            
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedTextContent = event.target.result;
            };
            reader.readAsText(file);
        }
    });

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault(); dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            updateDropzoneUI(file.name);
            
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedTextContent = event.target.result;
            };
            reader.readAsText(file);
        }
    });

    function updateDropzoneUI(fileName) {
        dropzone.querySelector('h3').innerText = "Document Ready!";
        dropzone.querySelector('p').innerText = fileName;
        dropzone.querySelector('h3').style.color = "var(--primary)";
        dropzone.style.borderColor = "var(--primary)";
        dropzone.style.background = "rgba(99, 102, 241, 0.05)";
    }

    btnAnalyze.addEventListener('click', async () => {
        let textToAnalyze = tabPaste.classList.contains('active') ? textInput.value.trim() : uploadedTextContent.trim();

        if(!textToAnalyze) {
            alert("Please upload a .txt file or paste some text to analyze.");
            return;
        }

        uploadSection.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: textToAnalyze })
            });

            if (!response.ok) {
                throw new Error('Erro na comunicação com a IA.');
            }

            const realData = await response.json();
            populateResults(realData);

        } catch (error) {
            console.error("Erro:", error);
            alert("Ocorreu um erro ao analisar o documento. Verifique se o servidor Python (app.py) está rodando.");
            loadingState.classList.add('hidden');
            uploadSection.classList.remove('hidden');
        }
    });

    btnReset.addEventListener('click', () => {
        resultsSection.classList.add('hidden'); uploadSection.classList.remove('hidden');
        dropzone.querySelector('h3').innerText = "Drag & Drop your .txt document here";
        dropzone.querySelector('h3').style.color = "inherit";
        dropzone.querySelector('p').innerText = "For this demo, we support .TXT files only.";
        dropzone.style.borderColor = "var(--border-color)"; dropzone.style.background = "rgba(255,255,255,0.5)";
        fileUpload.value = ""; textInput.value = ""; uploadedTextContent = "";
        tabUpload.click(); 
    });

    function populateResults(data) {
        loadingState.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        if (data.tags && data.tags.length > 0) {
            docTags.innerHTML = data.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }

        if (data.summary) {
            summaryContent.innerHTML = data.summary;
        }

        if (data.risks && data.risks.length > 0) {
            risksList.innerHTML = data.risks.map(risk => `
                <li>
                    <strong>${risk.title}</strong>
                    ${risk.description}
                </li>
            `).join('');
        } else {
            risksList.innerHTML = "<li><strong>No major risks detected.</strong> This document appears to be standard.</li>";
        }
    }
});