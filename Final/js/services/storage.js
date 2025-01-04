class StorageService {
    static async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.local.set(settings, () => {
                console.log("Settings saved:", settings);
                resolve();
            });
        });
    }

    static async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['cegep', 'program', 'gradesHistory'], resolve);
        });
    }

    // Add autosave functionality
    static initAutoSave() {
        // Add input event listeners to settings fields
        const cegepSelect = document.getElementById('cegep');
        const programSelect = document.getElementById('program');
        
        const autoSaveHandler = async () => {
            const settings = {
                cegep: cegepSelect.value,
                program: programSelect.value
            };
            await this.saveSettings(settings);
        };

        // Debounce the autosave to prevent too many storage operations
        let timeout;
        const debouncedAutoSave = () => {
            clearTimeout(timeout);
            timeout = setTimeout(autoSaveHandler, 500);
        };

        // Add event listeners
        cegepSelect.addEventListener('change', debouncedAutoSave);
        programSelect.addEventListener('change', debouncedAutoSave);

        // Also add input event for when user is typing (if using text inputs)
        cegepSelect.addEventListener('input', debouncedAutoSave);
        programSelect.addEventListener('input', debouncedAutoSave);
    }

    // Add credit autosave functionality
    static initCreditAutoSave() {
        const creditsContainer = document.getElementById('registeredCreditsContainer');
        
        creditsContainer.addEventListener('input', async (event) => {
            if (event.target.matches('input[type="number"]')) {
                const className = event.target.dataset.class;
                const credit = parseFloat(event.target.value) || 0;
                
                const { gradesHistory } = await this.getSettings();
                const updatedHistory = gradesHistory.map(grade => 
                    grade.className === className ? { ...grade, credit } : grade
                );

                await this.saveSettings({ gradesHistory: updatedHistory });
                console.log(`Credit autosaved for ${className}: ${credit}`);
            }
        });
    }
}

// Initialize autosave when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    StorageService.initAutoSave();
    StorageService.initCreditAutoSave();
}); 