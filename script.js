const mcpatcher_path = 'assets/minecraft/mcpatcher';
const optfine_path = 'assets/minecraft/optifine';

const fileInput = document.getElementById('archivoEntrada');
const versionSelector = document.getElementById('versionSelector');
const convertButton = document.getElementById('convertButton');
const selectedFileText = document.getElementById('selectedFile');
const selectedVersionText = document.getElementById('selectedVersion');
const conversionStatusText = document.getElementById('conversionStatus');
const toolStateText = document.getElementById('toolState');
const consoleOutput = document.getElementById('consoleOutput');

let currentFile = null;

function updateStatePanel() {
    selectedFileText.textContent = currentFile ? currentFile.name : 'No file selected';
    selectedVersionText.textContent = versionSelector.selectedOptions[0].text;
}

function logConsole(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `console-line console-${type}`;
    line.textContent = `> ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function setStatus(message) {
    conversionStatusText.textContent = message;
    toolStateText.textContent = message;
}

function setButtonsEnabled(enabled) {
    convertButton.disabled = !enabled;
    if (!enabled) {
        convertButton.classList.add('btn-disabled');
        convertButton.textContent = 'Processing...';
    } else {
        convertButton.classList.remove('btn-disabled');
        convertButton.innerHTML = '<i class="fas fa-magic"></i> Convert Now';
    }
}

fileInput.addEventListener('change', () => {
    currentFile = fileInput.files[0] || null;
    updateStatePanel();

    if (currentFile) {
        logConsole(`Selected file: ${currentFile.name}`);
        setStatus('Ready to convert');
        setButtonsEnabled(true);
    }
});

versionSelector.addEventListener('change', () => {
    updateStatePanel();
    logConsole(`Target version set to ${versionSelector.selectedOptions[0].text}`);
});

async function convertSky() {
    if (!currentFile) {
        logConsole('No ZIP file selected. Please choose a file first.', 'error');
        setStatus('Awaiting file upload');
        return;
    }

    setButtonsEnabled(false);
    setStatus('Converting…');
    logConsole('Starting conversion process...');

    try {
        const zip = await JSZip.loadAsync(currentFile);
        logConsole('Loaded ZIP package. Analyzing file structure...');

        const targetVersion = versionSelector.value;
        const targetText = versionSelector.selectedOptions[0].text;
        const metaVersion = parseFloat(targetVersion);

        if (zip.folder(mcpatcher_path) && targetVersion !== '1') {
            zip.folder(mcpatcher_path).forEach((relativePath, file) => {
                zip.folder(optfine_path).file(relativePath, file._data);
            });
            zip.remove(mcpatcher_path);
            logConsole('Converted mcpatcher paths into OptiFine folder structure.');
        } else if (zip.folder(optfine_path) && targetVersion === '1') {
            zip.folder(optfine_path).forEach((relativePath, file) => {
                zip.folder(mcpatcher_path).file(relativePath, file._data);
            });
            zip.remove(optfine_path);
            logConsole('Converted OptiFine paths into mcpatcher folder structure.');
        } else {
            logConsole('No path translation required for this pack.');
        }

        const packFiles = zip.file(/pack\.mcmeta$/i);
        if (packFiles && packFiles.length) {
            const packFile = packFiles[0];
            try {
                const packText = await packFile.async('text');
                const packJson = JSON.parse(packText);
                packJson.pack = packJson.pack || {};
                packJson.pack.pack_format = Number.isNaN(metaVersion) ? targetVersion : metaVersion;
                zip.file(packFile.name, JSON.stringify(packJson, null, 2));
                logConsole(`Updated pack.mcmeta pack_format to ${packJson.pack.pack_format}.`);
            } catch (parseError) {
                logConsole('Could not parse pack.mcmeta. Leaving existing metadata unchanged.', 'warn');
            }
        } else {
            logConsole('No pack.mcmeta file found in archive.');
        }

        const newZip = await zip.generateAsync({ type: 'blob' });
        const downloadName = `${currentFile.name.replace(/\.zip$/i, '')} - Serene ${targetText}.zip`;
        const url = URL.createObjectURL(newZip);

        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setStatus('Conversion complete');
        logConsole(`Finished converting to ${targetText}. Download should begin shortly.`);
    } catch (error) {
        console.error('Conversion error:', error);
        setStatus('Conversion failed');
        logConsole(`Error: ${error.message || 'Unexpected issue while converting.'}`, 'error');
    } finally {
        setButtonsEnabled(true);
        updateStatePanel();
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Initialize panel state
setStatus('Waiting for file');
setButtonsEnabled(false);
updateStatePanel();
logConsole('Serene is ready. Select a ZIP file to begin.');