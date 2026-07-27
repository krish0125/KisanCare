document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImgBtn = document.getElementById('removeImgBtn');
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnIcon = document.getElementById('btnIcon');
    
    const errorMessage = document.getElementById('errorMessage');
    const resultsCard = document.getElementById('resultsCard');
    const mockBanner = document.getElementById('mockBanner');
    
    let selectedFile = null;

    // ── Drag & Drop Events ────────────────────────────────────────────────
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    removeImgBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        previewContainer.style.display = 'none';
        uploadArea.style.display = 'block';
        analyzeBtn.disabled = true;
        resultsCard.style.display = 'none';
        errorMessage.style.display = 'none';
    });

    // ── File Handling ─────────────────────────────────────────────────────
    function handleFileSelection(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showError("Invalid file type. Please upload a JPG, PNG, or WebP image.");
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showError("File size exceeds 5MB. Please upload a smaller image.");
            return;
        }
        
        selectedFile = file;
        errorMessage.style.display = 'none';
        resultsCard.style.display = 'none';
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'block';
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
    
    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }

    // ── API Submission ────────────────────────────────────────────────────
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        const cropType = document.getElementById('cropSelect').value || 'unknown';
        
        // UI Loading State
        analyzeBtn.disabled = true;
        btnText.textContent = "Analyzing...";
        btnIcon.style.display = 'none';
        btnSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        document.getElementById('lowConfidenceMessage').style.display = 'none';
        resultsCard.style.display = 'none';
        
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('crop_type', cropType);
        
        try {
            const res = await authFetch('http://localhost:5001/api/disease-detect', {
                method: 'POST',
                body: formData
            });
            
            const data = await res.json();
            
            if (!res.ok || data.status === 'error') {
                throw new Error(data.message || 'Server error occurred.');
            }
            
            if (data.status === 'model_not_trained') {
                throw new Error(data.message);
            }
            
            if (data.low_confidence) {
                const lowConfMsg = document.getElementById('lowConfidenceMessage');
                lowConfMsg.textContent = `Confidence Score: ${(data.confidence * 100).toFixed(1)}%. ${data.message}`;
                lowConfMsg.style.display = 'block';
                return; // Stop here, do not show results
            }
            
            renderResults(data);
            
        } catch (err) {
            console.error("Analysis Error:", err);
            showError(`<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cancel</span> ${err.message}`);
        } finally {
            // Restore button state
            analyzeBtn.disabled = false;
            btnText.textContent = "Analyze Crop";
            btnIcon.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    });

    // ── Rendering Results ─────────────────────────────────────────────────
    function renderResults(data) {
        const nameEl = document.getElementById('resDiseaseName');
        const severityEl = document.getElementById('resSeverity');
        
        const causeEl = document.getElementById('resCause');
        const prevEl = document.getElementById('resPrevention');
        const organicEl = document.getElementById('resOrganic');
        const chemicalEl = document.getElementById('resChemical');
        const fertilizerEl = document.getElementById('resFertilizer');
        
        const friendlyName = (data.disease || 'Unknown').split('___').join(' ').replace(/_/g, ' ');
        nameEl.textContent = friendlyName;
        
        severityEl.textContent = `${(data.confidence * 100).toFixed(1)}% Confidence`;
        severityEl.className = 'badge'; // reset
        if (data.confidence > 0.90) severityEl.classList.add('high');
        else if (data.confidence > 0.75) severityEl.classList.add('medium');
        else severityEl.classList.add('low');
        
        causeEl.textContent = data.cause || 'Unknown';
        prevEl.textContent = data.prevention || 'Unknown';
        organicEl.textContent = data.organic_treatment || 'Not specified';
        chemicalEl.textContent = data.chemical_treatment || 'Not specified';
        fertilizerEl.textContent = data.fertilizer_suggestion || 'Not specified';
        
        resultsCard.style.display = 'block';
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
