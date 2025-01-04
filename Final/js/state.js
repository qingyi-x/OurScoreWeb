class UIState {
    static sections = ['mainContent', 'settingsForm', 'historySection'];
    
    static showSection(sectionId) {
        this.sections.forEach(section => {
            const element = document.getElementById(section);
            element.style.display = section === sectionId ? 'block' : 'none';
        });
        this.updateActiveStates(sectionId);
    }

    static updateActiveStates(activeSection) {
        // Handle button active states
    }
} 