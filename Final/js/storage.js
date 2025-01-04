/* GRADES STORAGE */
function saveGrades(data) {
    chrome.storage.local.get({ gradesHistory: [] }, (result) => {
        console.log("Saving grades:", data);

        // Map existing history to an object for quick lookup
        const historyMap = result.gradesHistory.reduce((map, item) => {
            map[item.className] = item;
            return map;
        }, {});

        // Merge new data with existing history
        const updatedHistory = data.map((item) => {
            const existingEntry = historyMap[item.className];
            return {
                ...item,
                credit: existingEntry ? existingEntry.credit : 0, // Preserve existing credit or default to 0
            };
        });

        // Combine updated classes with existing ones not in the current data
        const mergedHistory = [
            ...updatedHistory,
            ...result.gradesHistory.filter(
                (historyItem) => !data.some((item) => item.className === historyItem.className)
            ),
        ];

        chrome.storage.local.set({ gradesHistory: mergedHistory }, () => {
            console.log("Grades and credits saved.");
        });
    });
}

/* CREDIT STORAGE */
function saveCredit(className, credit) {
    chrome.storage.local.get({ gradesHistory: [] }, (result) => {
        const gradesHistory = result.gradesHistory;

        // Find the class and update the credit
        const classIndex = gradesHistory.findIndex(grade => grade.className === className);
        if (classIndex !== -1) {
            gradesHistory[classIndex].credit = credit;
            // Save the updated grades history back to storage
            chrome.storage.local.set({ gradesHistory }, () => {
                console.log("Credits updated successfully");

                // After updating the credit, recalculate and display immediately
                displayResults(gradesHistory);  // Call displayResults to update the UI
            });
        } else {
            console.error("Class not found.");
        }
    });
}



/* PROMPT FOR CREDITS */
function promptForCredits(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "<p>Please input credits for the following courses:</p>";

    // Ensure that the credit input fields are rendered
    data.forEach(item => {
        const creditInputHTML = `
            <div class="credit-input">
                <strong>${item.className}</strong><br>
                Credit (0 to 2.66): 
                <input type="number" min="0" max="2.66" step="0.01" value="${item.credit || 0}" data-class="${item.className}" />
            </div>`;
        resultsDiv.insertAdjacentHTML("beforeend", creditInputHTML);
    });

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Credits";
    saveButton.addEventListener("click", () => {
        saveCredits(data);
    });
    resultsDiv.appendChild(saveButton);
}
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

// Save the updated credits back to local storage IN SETTINGS
function saveRegisteredCredits(gradesHistory) {
    const inputs = document.querySelectorAll("input[data-class]");
    
    // Update the credits in the gradesHistory array
    inputs.forEach(input => {
        const className = input.getAttribute("data-class");
        const updatedCredit = parseFloat(input.value) || 0;

        gradesHistory.forEach(item => {
            if (item.className === className) {
                item.credit = updatedCredit;
            }
        });
    });

    // Save the updated gradesHistory with the new credits
    chrome.storage.local.set({ gradesHistory: gradesHistory }, () => {
        console.log("Registered credits updated:", gradesHistory);
        displayResults(gradesHistory);
    });
}


/* RESET GRADES AND CREDITS */
document.getElementById("resetGrades").addEventListener("click", () => {
    // Clear grades history and credits from local storage
    chrome.storage.local.set({ gradesHistory: [], credits: {} }, () => {
        console.log("Grades and credits history reset.");
        
        // Show the notification
        const notification = document.getElementById("notification");
        notification.classList.add("show");

        // Hide the notification after 2 seconds
        setTimeout(() => {
            notification.classList.remove("show");
        }, 2000);

        // Reset the UI to reflect that grades and credits are reset
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "<p>Grades and credits have been reset.</p>"; // Inform the user about the reset

        // Update any other UI elements as needed
        const historyResults = document.getElementById("historyResults");
        historyResults.innerHTML = "<p>No grades found. Go to Léa to start estimating!</p>";
    });
});
