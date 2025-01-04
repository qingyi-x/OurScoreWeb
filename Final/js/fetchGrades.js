document.getElementById("fetchGrades").addEventListener("click", () => {
    console.log("Fetch Grades button clicked");
    console.log("Fetching grades...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0].id;

        showLoadingAnimation(); // Show loading animation

        chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: scrapeClassLinks
        }, async (results) => {
            const links = results[0].result;
            console.log("Links found:", links);
            const data = [];

            // Directly scrape grades from each class page without iframe
            for (const link of links) {
                const grades = await scrapeGrades(link.href); // scrapeGrades now accepts the URL directly
                data.push({ ...grades, className: link.className, date: new Date().toLocaleDateString() });
            }

            // Get the saved credits from storage
            chrome.storage.local.get({ gradesHistory: [] }, (result) => {
                const storedGrades = result.gradesHistory;

                // Update the data with the registered credits
                data.forEach(item => {
                    const storedGrade = storedGrades.find(stored => stored.className === item.className);
                    if (storedGrade && storedGrade.credit > 0) {
                        item.credit = storedGrade.credit;
                    }
                });

                saveGrades(data);
                hideLoadingAnimation(); // Hide loading animation
                displayResults(data); // Display results
            });
        });
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

    const grade = parseFloat(gradeElement?.textContent.trim()) || NaN;
    const average = parseFloat(avgElement?.textContent.trim()) || NaN;
    const stdDev = parseFloat(stdDevElement?.textContent.trim()) || NaN;

    console.log("Raw values:", { grade, average, stdDev }); // Debug log

    console.log("Scraping grades from URL:", url);

    let zScore = "Not Available";
    let rScore = "Not Available";
    
    if (!isNaN(grade) && !isNaN(average) && !isNaN(stdDev) && stdDev !== 0) {
        zScore = ((grade - average) / stdDev).toFixed(3);
        console.log("Calculated Z-Score:", zScore);
        
        try {
            const settings = await chrome.storage.local.get(['cegep', 'program']);
            console.log("Settings retrieved:", settings);
            if (settings.cegep && settings.program) {
                rScore = calculateRScore(parseFloat(zScore), settings.cegep, settings.program);
                console.log("Calculated R-Score:", rScore);
            }
        } catch (error) {
            console.error("Error calculating R-Score:", error);
        }
    }

    return {
        grade: grade || "Not Found",
        average: average || "Not Found",
        stdDev: stdDev || "Not Found",
        zScore,
        rScore: rScore !== null ? rScore.toFixed(2) : "Not Available"
    };
}

function calculateRScore(zScore, school, program) {
    if (!SCHOOL_PROGRAM_CONSTANTS) {
        console.error('SCHOOL_PROGRAM_CONSTANTS is not defined!');
        return null;
    }

    const constants = SCHOOL_PROGRAM_CONSTANTS[school]?.[program];
    if (!constants) {
        console.error('School or program constants not found for:', { school, program });
        return null;
    }

    const { IFGZ, IDGZ } = constants;
    const rScore = ((zScore * IDGZ) + IFGZ + 5) * 5;
    return rScore;
}

// Modify your existing displayResults function
function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (data.length === 0) {
        resultsDiv.innerHTML = "<p>No grades found.</p>";
        return;
    }

    data.forEach(item => {
        const resultHTML = `
            <div>
                <strong>${item.className}</strong><br>
                Grade: ${item.grade}<br>
                Average: ${item.average}<br>
                Std Dev: ${item.stdDev}<br>
                Z-Score: ${item.zScore}<br>
                R-Score: ${item.rScore}<br>
                Credits: ${item.credit}
            </div>`;
        resultsDiv.insertAdjacentHTML("beforeend", resultHTML);
    });
}

console.log('SCHOOL_PROGRAM_CONSTANTS:', SCHOOL_PROGRAM_CONSTANTS);