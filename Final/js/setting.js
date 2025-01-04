// Retrieve and set saved settings on page load
window.addEventListener("load", () => {
    chrome.storage.local.get({ gradesHistory: [], cegep: "", program: "" }, (result) => {
        displayResults(result.gradesHistory);
        if (result.cegep) {
            document.getElementById("cegep").value = result.cegep;
        }
        if (result.program) {
            document.getElementById("program").value = result.program;
        }
    });
});

// Settings Button toggle visibility of form and page appearance
document.getElementById("settingsButton").addEventListener("click", () => {
    console.log("Settings button clicked");
    
    const settingsForm = document.getElementById("settingsForm");
    const mainContent = document.getElementById("mainContent");
    const historySection = document.getElementById("historySection");

    console.log("Current settingsForm display:", settingsForm.style.display);

    // Hide all sections first
    historySection.style.display = "none";
    
    // Toggle between settings and main content
    if (settingsForm.style.display === "none") {
        console.log("Showing settings form");
        settingsForm.style.display = "block";
        mainContent.style.display = "none";
        document.body.classList.add("settings-mode");
    } else {
        console.log("Hiding settings form");
        settingsForm.style.display = "none";
        mainContent.style.display = "block";
        document.body.classList.remove("settings-mode");
    }
});

// Save settings to Chrome storage
document.getElementById("saveSettings").addEventListener("click", () => {
    const cegep = document.getElementById("cegep").value;
    const program = document.getElementById("program").value;

    if (cegep && program) {
        chrome.storage.local.set({ cegep, program }, () => {
            alert("Settings saved!");
            console.log("Settings saved:", { cegep, program });
        });
    } else {
        alert("Please fill out both fields.");
    }
});
// Show registered credits when button is clicked
document.getElementById("registeredCreditsButton").addEventListener("click", () => {
    chrome.storage.local.get({ gradesHistory: [] }, (result) => {
        const gradesHistory = result.gradesHistory;
        
        if (gradesHistory.length === 0) {
            document.getElementById("registeredCreditsContainer").innerHTML = "<p>No credits found. Add grades first.</p>";
            return;
        }

        // Display the registered credits
        const creditsContainer = document.getElementById("registeredCreditsContainer");
        creditsContainer.innerHTML = "<h3>Registered Credits</h3>";

        gradesHistory.forEach((grade) => {
            const creditInputHTML = `
                <div class="credit-entry">
                    <strong>${grade.className}</strong><br>
                    Current Credit: ${grade.credit || 0}
                    <input type="number" min="0" max="2.66" step="0.01" value="${grade.credit || 0}" data-class="${grade.className}" />
                </div>`;
            creditsContainer.insertAdjacentHTML("beforeend", creditInputHTML);
        });

        // Add Save Button
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save Credits";
        saveButton.addEventListener("click", () => {
            saveRegisteredCredits(gradesHistory);
        });
        creditsContainer.appendChild(saveButton);
    });
});

//Autosave 
// Retrieve and set saved settings on page load
window.addEventListener("load", () => {
    chrome.storage.local.get({ gradesHistory: [], cegep: "", program: "" }, (result) => {
        displayResults(result.gradesHistory);
        if (result.cegep) {
            document.getElementById("cegep").value = result.cegep;
        }
        if (result.program) {
            document.getElementById("program").value = result.program;
        }
    });
});

// Settings Button toggle visibility of form and page appearance
document.getElementById("settingsButton").addEventListener("click", () => {
    const settingsForm = document.getElementById("settingsForm");
    const mainContent = document.getElementById("mainContent");
    const historySection = document.getElementById("historySection");

    settingsForm.style.display = "block";
    mainContent.style.display = "none";
    historySection.style.display = "none";
    document.body.classList.add("settings-mode");
});

// Back button functionality
document.getElementById("backFromSettings").addEventListener("click", () => {
    const settingsForm = document.getElementById("settingsForm");
    const mainContent = document.getElementById("mainContent");
    
    settingsForm.style.display = "none";
    mainContent.style.display = "block";
    document.body.classList.remove("settings-mode");
});

// History button functionality
document.getElementById("historyButton").addEventListener("click", () => {
    const mainContent = document.getElementById("mainContent");
    const historySection = document.getElementById("historySection");
    const settingsForm = document.getElementById("settingsForm");

    mainContent.style.display = "none";
    historySection.style.display = "block";
    settingsForm.style.display = "none";
});

// Back from history functionality
document.getElementById("backFromHistory").addEventListener("click", () => {
    const mainContent = document.getElementById("mainContent");
    const historySection = document.getElementById("historySection");

    historySection.style.display = "none";
    mainContent.style.display = "block";
});

// Auto-save settings when input changes
document.getElementById("cegep").addEventListener("input", autoSaveSettings);
document.getElementById("program").addEventListener("input", autoSaveSettings);

function autoSaveSettings() {
    const cegep = document.getElementById("cegep").value;
    const program = document.getElementById("program").value;
    chrome.storage.local.set({ cegep, program }, () => {
        console.log("Settings auto-saved:", { cegep, program });
    });
}

// Registered credits functionality
document.getElementById("registeredCreditsButton").addEventListener("click", () => {
    chrome.storage.local.get({ gradesHistory: [] }, (result) => {
        const gradesHistory = result.gradesHistory;
        
        if (gradesHistory.length === 0) {
            document.getElementById("registeredCreditsContainer").innerHTML = "<p>No credits found. Add grades first.</p>";
            return;
        }

        const creditsContainer = document.getElementById("registeredCreditsContainer");
        creditsContainer.innerHTML = "<h3>Registered Credits</h3>";

        gradesHistory.forEach((grade) => {
            const creditInputHTML = `
                <div class="credit-entry">
                    <strong>${grade.className}</strong><br>
                    Current Credit: ${grade.credit || 0}
                    <input type="number" min="0" max="2.66" step="0.01" value="${grade.credit || 0}" data-class="${grade.className}" />
                </div>`;
            creditsContainer.insertAdjacentHTML("beforeend", creditInputHTML);
        });

        // Add auto-save functionality to credit inputs
        const creditInputs = creditsContainer.querySelectorAll("input[type='number']");
        creditInputs.forEach(input => {
            input.addEventListener("input", () => {
                saveRegisteredCredits(gradesHistory);
            });
        });
    });
});

// Reset grades functionality
document.getElementById("resetGrades").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all grades and credits? This cannot be undone.")) {
        chrome.storage.local.set({ gradesHistory: [] }, () => {
            console.log("Grades history reset.");
            displayResults([]);
        });
    }
});

// Function to recalculate and update R-scores
async function updateRScores() {
    const settings = await chrome.storage.local.get(['cegep', 'program', 'gradesHistory']);
    const { cegep, program, gradesHistory } = settings;

    if (!cegep || !program) {
        console.error("CEGEP or program not set.");
        return;
    }

    const updatedGrades = gradesHistory.map(grade => {
        if (grade.zScore !== "Not Available") {
            const rScore = calculateRScore(parseFloat(grade.zScore), cegep, program);
            return { ...grade, rScore: rScore.toFixed(2) };
        }
        return grade;
    });

    chrome.storage.local.set({ gradesHistory: updatedGrades }, () => {
        console.log("R-scores updated based on new settings.");
        displayResults(updatedGrades); // Update the UI with new R-scores
    });
}

// Add event listeners to update R-scores when settings change
document.getElementById("cegep").addEventListener("change", updateRScores);
document.getElementById("program").addEventListener("change", updateRScores);

