// Theme switcher
const themeToggle = document.getElementById('theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Set initial theme based on system preference
document.documentElement.setAttribute('data-theme', prefersDark.matches ? 'dark' : 'light');

// Toggle theme when button is clicked
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
});

// Update theme when system preference changes
prefersDark.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
});

document.getElementById('file-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];
    const outputFileName = document.getElementById('outputFileName').value || 'combined.txt';
    const status = document.getElementById('status');

    status.textContent = '';
    const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

    // Validate inputs
    if (!file1 || !file2) {
        status.textContent = 'Please select both files';
        status.style.color = 'red';
        return;
    }

    if (file1.size > MAX_FILE_SIZE || file2.size > MAX_FILE_SIZE) {
        status.textContent = 'Files must be smaller than 10GB each';
        status.style.color = 'red';
        return;
    }

    if (file1.size + file2.size > MAX_FILE_SIZE) {
        status.textContent = 'Combined file size must be under 10GB';
        status.style.color = 'red';
        return;
    }

    try {
        status.textContent = 'Processing files... This may take a while for large files.';

        // Request file save location using File System Access API
        const handle = await window.showSaveFilePicker({
            suggestedName: outputFileName,
            types: [
                {
                    description: 'Text File',
                    accept: { 'text/plain': ['.txt'] }
                }
            ]
        });
        const writable = await handle.createWritable();

        // Function to stream chunks from input file to output
        const processFile = async (file, writable, progressBar) => {
            const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let chunksProcessed = 0;

            for (let start = 0; start < file.size; start += CHUNK_SIZE) {
                const chunk = file.slice(start, start + CHUNK_SIZE);
                const buffer = await chunk.arrayBuffer();

                // Write to the output file
                await writable.write(buffer);

                // Update progress
                chunksProcessed++;
                const progress = Math.round((chunksProcessed / totalChunks) * 100);
                progressBar.style.width = `${progress}%`;
            }
        };

        // Process first file
        status.innerHTML = `
            <div>Processing first file...</div>
            <div class="progress-container">
                <div class="progress-bar" id="progress1"></div>
            </div>
        `;
        const progressBar1 = document.getElementById('progress1');
        await processFile(file1, writable, progressBar1);

        // Process second file
        status.innerHTML = `
            <div>Processing second file...</div>
            <div class="progress-container">
                <div class="progress-bar" id="progress2"></div>
            </div>
        `;
        const progressBar2 = document.getElementById('progress2');
        await processFile(file2, writable, progressBar2);

        // Finalize the writable stream
        await writable.close();

        status.textContent = 'Files combined successfully!';
        status.style.color = 'green';
    } catch (error) {
        console.error('Error:', error);
        status.textContent = error.message || 'Error processing files.';
        status.style.color = 'red';
    }
});
