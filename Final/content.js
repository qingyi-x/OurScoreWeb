function scrapeGrades() {

    const avgElement = document.querySelector('td[align="RIGHT"] font[size="1"][face="Arial, Helvetica"][color="#000066"]:nth-of-type(1)');
    const stdDevElement = document.querySelector('table.tb-sommaire table tbody tr:nth-child(3) td[align="RIGHT"] font[size="1"][face="Arial, Helvetica"][color="#000066"]');
    
    const gradeElement = document.querySelector('td[valign="TOP"][align="RIGHT"]:nth-of-type(3) font[size="1"][face="Arial, Helvetica"]');

    return {
        grade: gradeElement ? gradeElement.textContent.trim() : "Not found",
        average: avgElement ? avgElement.textContent.trim() : "Not found",
        stdDev: stdDevElement ? stdDevElement.textContent.trim() : "Not found"
    };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrapeGrades") {
        sendResponse(scrapeGrades());
    }
});
