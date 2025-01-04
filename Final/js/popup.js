
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

document.getElementById("resetGrades").addEventListener("click", () => {
    chrome.storage.local.set({ gradesHistory: [] }, () => {
        console.log("Grades history reset.");
        displayResults([]);
    });
});

function scrapeClassLinks() {
    const gradeButtons = document.querySelectorAll("a.card-panel-item-wrapper.action");
    console.log("Grade buttons found:", gradeButtons.length); // Log number of buttons found
    
    return Array.from(gradeButtons)
        .filter(button => button.querySelector(".item-header-title")?.innerText.includes("Notes d'évaluation"))
        .map(button => {
            const classNameDiv = button.closest(".card-panel").querySelector(".card-panel-title");
            return {
                href: button.href,
                className: classNameDiv ? classNameDiv.innerText.trim() : "Unknown Class"
            };
        });
}

async function scrapeGrades(url) {
    const response = await fetch(url);
    const pageContent = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(pageContent, "text/html");

    const avgElement = doc.querySelector('td[align="RIGHT"] font[size="1"][face="Arial, Helvetica"][color="#000066"]:nth-of-type(1)');
    const stdDevElement = doc.querySelector('table.tb-sommaire table tbody tr:nth-child(3) td[align="RIGHT"] font[size="1"][face="Arial, Helvetica"][color="#000066"]');
    const gradeElement = doc.querySelector('td[valign="TOP"][align="RIGHT"]:nth-of-type(3) font[size="1"][face="Arial, Helvetica"]');

    console.log("Average element found:", avgElement);
    console.log("Standard deviation element found:", stdDevElement);
    console.log("Grade element found:", gradeElement);

    const grade = parseFloat(gradeElement?.textContent.trim()) || NaN;
    const average = parseFloat(avgElement?.textContent.trim()) || NaN;
    const stdDev = parseFloat(stdDevElement?.textContent.trim()) || NaN;

    let zScore = "Not Available";
    if (!isNaN(grade) && !isNaN(average) && !isNaN(stdDev) && stdDev !== 0) {
        zScore = ((grade - average) / stdDev).toFixed(3);
    }

    console.log("Scraped grade data:", { grade, average, stdDev, zScore });

    return {
        grade: grade || "Not Found",
        average: average || "Not Found",
        stdDev: stdDev || "Not Found",
        zScore
    };
}

function saveGrades(data) {
    chrome.storage.local.get({ gradesHistory: [] }, (result) => {
        console.log("Saving grades:", data);
        const updatedHistory = result.gradesHistory.concat(data.map(item => ({
            ...item,
            date: new Date().toLocaleDateString(),
            credit: 0
        })));

        chrome.storage.local.set({ gradesHistory: updatedHistory }, () => {
            console.log("Grades and credits saved.");
            promptForCredits(updatedHistory);
        });
    });
}

function promptForCredits(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "<p>Please input credits for the following courses:</p>";

    data.forEach(item => {
        const creditInputHTML = `
            <div>
                <strong>${item.className}</strong><br>
                Credit (0 to 2.66): 
                <input type="number" min="0" max="2.66" step="0.01" value="${item.credit || 0}" data-class="${item.className}" />
            </div>`;
        resultsDiv.insertAdjacentHTML("beforeend", creditInputHTML);
    });

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Credits";
    saveButton.addEventListener("click", () => saveCredits(data));
    resultsDiv.appendChild(saveButton);
}

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

                // Simply call displayResults to update the UI with the new data
                displayResults(gradesHistory);  // Display the results with updated credit immediately
            });
        } else {
            console.error("Class not found.");
        }
    });
}


function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (data.length === 0) {
        resultsDiv.innerHTML = "<p>No grades found.</p>";
        return;
    }

    const groupedByDate = groupGradesByDate(data);
    let totalWeightedZScore = 0;
    let totalWeight = 0;

    for (const [date, grades] of Object.entries(groupedByDate)) {
        const dateElement = document.createElement("div");
        dateElement.classList.add("date-entry");
        dateElement.innerHTML = `<strong class="date-header">${date}</strong>`;

        const gradesContainer = document.createElement("div");
        gradesContainer.classList.add("grades-container");
        gradesContainer.style.display = "none";

        grades.forEach(item => {
            if (item.credit > 0 && item.zScore !== "Not Available") {
                totalWeightedZScore += parseFloat(item.zScore) * item.credit;
                totalWeight += item.credit;
            }

            const resultHTML = `
                <p>
                    <strong>${item.className}</strong><br>
                    Z-Score: ${item.zScore || "Not Available"}<br>
                    Credit: ${item.credit}
                </p>`;
            gradesContainer.insertAdjacentHTML("beforeend", resultHTML);
        });

        dateElement.appendChild(gradesContainer);
        resultsDiv.appendChild(dateElement);

        dateElement.querySelector(".date-header").addEventListener("click", () => {
            gradesContainer.style.display = gradesContainer.style.display === "none" ? "block" : "none";
        });
    }

    const avgZScore = totalWeight > 0 ? (totalWeightedZScore / totalWeight).toFixed(3) : "Not Available";

    const avgZScoreDiv = document.createElement("div");
    avgZScoreDiv.innerHTML = `<strong>Average Weighted Z-Score: ${avgZScore}</strong>`;
    resultsDiv.prepend(avgZScoreDiv);
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

// Settings Button toggle visibility of form
document.getElementById("settingsButton").addEventListener("click", () => {
    const settingsForm = document.getElementById("settingsForm");
    settingsForm.style.display = settingsForm.style.display === "none" ? "block" : "none";
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

    // Hide settings form after saving
    document.getElementById("settingsForm").style.display = "none";
});
