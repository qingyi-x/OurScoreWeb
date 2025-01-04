class EventHandlers {
    static init() {
        this.initNavigationHandlers();
        this.initSettingsHandlers();
        // etc...
    }

    static initNavigationHandlers() {
        document.getElementById("backFromSettings").addEventListener("click", 
            () => UIState.showSection('mainContent'));
        // etc...
    }
} 