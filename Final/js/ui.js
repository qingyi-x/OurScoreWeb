function showLoadingAnimation() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = '<div class="loading">Loading...</div>'; // Simple loading text or spinner
}

function hideLoadingAnimation() {
    const loadingElement = document.querySelector(".loading");
    if (loadingElement) {
        loadingElement.remove();
    }
}


// Function to display results
function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (data.length === 0) {
        resultsDiv.innerHTML = "<p>No grades found.</p>";
        return;
    }

    let totalWeightedZScore = 0;
    let totalWeightedRScore = 0;
    let totalWeight = 0;

    data.forEach(item => {
        if (item.credit > 0 && item.zScore !== "Not Available" && item.rScore !== "Not Available") {
            totalWeightedZScore += parseFloat(item.zScore) * item.credit;
            totalWeightedRScore += parseFloat(item.rScore) * item.credit;
            totalWeight += item.credit;
        }
    });

    const avgZScore = totalWeight > 0 ? (totalWeightedZScore / totalWeight).toFixed(3) : "Not Available";
    const avgRScore = totalWeight > 0 ? (totalWeightedRScore / totalWeight).toFixed(2) : "Not Available";

    const summaryHTML = `
        <div class="score-summary">
            <p class="average-r-score-message">Average R-Score: ${avgRScore}</p>
            <p class="average-z-score-message">Average Z-Score: ${avgZScore}</p>
        </div>
    `;
    resultsDiv.insertAdjacentHTML("beforeend", summaryHTML);
}

function groupGradesByDate(grades) {
    return grades.reduce((grouped, grade) => {
        const { date } = grade;
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(grade);
        return grouped;
    }, {});
}
// Show the history section
document.getElementById("historyButton").addEventListener("click", () => {
    document.getElementById("mainContent").style.display = "none"; // Hide the main content
    document.getElementById("historySection").style.display = "block"; // Show the history section

    // Load history from storage
    chrome.storage.local.get({ gradesHistory: [] }, (result) => {
        const historyResults = document.getElementById("historyResults");
        historyResults.innerHTML = ""; // Clear existing content

        const gradesHistory = result.gradesHistory;

        if (gradesHistory.length === 0) {
            historyResults.innerHTML = "<p>No history available.</p>";
        } else {
            // Group by date and display
            const groupedByDate = groupGradesByDate(gradesHistory);
            for (const [date, grades] of Object.entries(groupedByDate)) {
                const dateEntry = document.createElement("div");
                dateEntry.innerHTML = `<strong>${date}</strong>`;
                grades.forEach(grade => {
                    const gradeEntry = document.createElement("div");
                    gradeEntry.innerHTML = `
                        <p>
                            <strong>${grade.className}</strong><br>
                            Grade: ${grade.grade}<br>
                            Average: ${grade.average}<br>
                            Standard Deviation: ${grade.stdDev}<br>
                            Z-Score: ${grade.zScore}<br>
                            R-Score: ${grade.rScore}<br>
                            Credit: ${grade.credit}
                        </p>
                    `;
                    dateEntry.appendChild(gradeEntry);
                });
                historyResults.appendChild(dateEntry);
            }
        }
    });
});

// Back button from history to main content
document.getElementById("backFromHistory").addEventListener("click", () => {
    document.getElementById("historySection").style.display = "none"; // Hide history section
    document.getElementById("mainContent").style.display = "block"; // Show main content
});

// Utility function to group grades by date
function groupGradesByDate(grades) {
    return grades.reduce((grouped, grade) => {
        const { date } = grade;
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(grade);
        return grouped;
    }, {});
}
document.getElementById("backFromSettings").addEventListener("click", () => {
    // Hide settings form
    document.getElementById("settingsForm").style.display = "none";

    // Show main content
    document.getElementById("mainContent").style.display = "block";
});

document.getElementById("backToMain").addEventListener("click", () => {
    // If it's a single-page application, hide the current section and show the main content
    document.getElementById("historySection").style.display = "none";
    document.getElementById("settingsForm").style.display = "none";
    document.getElementById("mainContent").style.display = "block"; // Show main content

    // If you want to navigate to a new page, you can use:
    // window.location.href = 'index.html'; // Replace with the actual main page URL
});

// Navigation functions with smooth transitions
function showMainContent() {
    fadeOut("settingsForm");
    fadeOut("historySection");
    fadeIn("mainContent");
    removeActiveStates();
}

function showSettingsForm() {
    fadeOut("mainContent");
    fadeOut("historySection");
    fadeIn("settingsForm");
    toggleActiveState("settingsButton");
}

function showHistorySection() {
    fadeOut("mainContent");
    fadeOut("settingsForm");
    fadeIn("historySection");
    toggleActiveState("historyButton");
}

// Smooth transition helpers
function fadeIn(elementId) {
    const element = document.getElementById(elementId);
    element.style.opacity = 0;
    element.style.display = "block";
    
    let opacity = 0;
    const timer = setInterval(() => {
        if (opacity >= 1) {
            clearInterval(timer);
        }
        element.style.opacity = opacity;
        opacity += 0.1;
    }, 20);
}

function fadeOut(elementId) {
    const element = document.getElementById(elementId);
    let opacity = 1;
    
    const timer = setInterval(() => {
        if (opacity <= 0) {
            element.style.display = "none";
            clearInterval(timer);
        }
        element.style.opacity = opacity;
        opacity -= 0.1;
    }, 20);
}

// Button event listeners with active state handling
document.getElementById("logo").addEventListener("click", () => {
    removeActiveStates();
    showMainContent();
});

document.getElementById("settingsButton").addEventListener("click", () => {
    console.log("Settings button clicked"); // Debug line
    const settingsForm = document.getElementById("settingsForm");
    const mainContent = document.getElementById("mainContent");
    
    settingsForm.style.display = "block";
    mainContent.style.display = "none";
});

document.getElementById("historyButton").addEventListener("click", () => {
    removeActiveStates();
    document.getElementById("historyButton").classList.add("active");
    showHistorySection();
});

document.getElementById("backFromSettings").addEventListener("click", showMainContent);

document.getElementById("backFromHistory").addEventListener("click", () => {
    removeActiveStates();
    showMainContent();
});

document.getElementById("backToMain").addEventListener("click", () => {
    removeActiveStates();
    showMainContent();
});

// Helper function to manage active states
function removeActiveStates() {
    const buttons = ["settingsButton", "historyButton"];
    buttons.forEach(id => {
        document.getElementById(id).classList.remove("active");
    });
}

function toggleActiveState(buttonId) {
    const button = document.getElementById(buttonId);
    button.classList.toggle("active");
}
