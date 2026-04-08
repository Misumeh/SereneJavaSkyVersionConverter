const mcpatcher_path = "assets/minecraft/mcpatcher"
const optfine_path = "assets/minecraft/optifine"

async function convertSky() {
    const inputFile = document.getElementById('archivoEntrada').files[0];
    const selectedVersion = document.getElementById('versionSelector');

    if (inputFile) {
        try {
            const zip = await JSZip.loadAsync(inputFile);

            // makes optifine path if mcpatcher exists and version selected != 1
            if (zip.folder(mcpatcher_path) && selectedVersion.value != 1) {
                    zip.folder(mcpatcher_path).forEach((relativePath, file) => {
                        zip.folder(optfine_path).file(relativePath, file._data);
                });
                zip.remove(mcpatcher_path);
            }
            // makes mcpatcher if optifine exists and version selected = 1
            else if (zip.folder(optfine_path) && selectedVersion.value == 1) {
                    zip.folder(optfine_path).forEach((relativePath, file) => {
                        zip.folder(mcpatcher_path).file(relativePath, file._data);
                });
                zip.remove(optfine_path);
            }
            zip.file('converted.txt', "pack converted using https://skyconverter.misumeh.com/ \nsource code: https://github.com/Misumeh/SkyConverter/");
            // Change the "pack_format" variable in "pack.mcmeta"
            let packmcmeta = zip.file('pack.mcmeta');
            if (packmcmeta) {
                try {
                    // Get the content as text and remove the BOM if present
                    let mcmetacontents = await packmcmeta.async('text');
                    mcmetacontents = mcmetacontents.replace(/^\uFEFF/, '');

                    const packmetajson = JSON.parse(mcmetacontents);
                    packmetajson.pack.pack_format = parseInt(selectedVersion.value);
                    zip.remove('pack.mcmeta');
                    zip.file('pack.mcmeta', JSON.stringify(packmetajson, null, 4));
                } catch (jsonError) {
                    console.error('Error parsing JSON content:', jsonError);
                    console.log('JSON content:', await packmcmeta.async('string'));
                    alert('An error occurred while parsing JSON content. Check the browser console for more details.');
                    return;
                }
            } else {
                alert('A "pack.mcmeta" file was not found in the main folder.');
                return;
            }
            
            // Create a new compressed file
            const newZip = await zip.generateAsync({ type: 'blob' });

            // Create a new name for the file
            const newName = `${inputFile.name.replace('.zip', '')} Converted ${selectedVersion.selectedOptions[0].text}.zip`;
            // Download the new file with the new name
            const url = URL.createObjectURL(newZip);
            const a = document.createElement('a');
            a.href = url;
            a.download = newName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Add smooth scroll behavior to links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
