var xhr = XMLHttpRequest.prototype;
var send = xhr.send;
var isStudent = true;
var arrayoflectures = [];

// Making changes to XMLHttpRequest send function
xhr.send = function(postData) {
    // Attach event listener to response
    this.addEventListener('load', function() {
        // Console log parsed response
        var returnObj = JSON.parse(this.responseText);
        if (returnObj.hasOwnProperty("events")) {
            parseJSON(returnObj.events);
        }
    });

    // Apply changes to send function
    return send.apply(this, arguments);
};

function addDownloadBtnToDOM() {
    var toolbar = document.getElementsByClassName("toolbar")[0];
    var downloadContainer = document.createElement("div");
    downloadContainer.setAttribute("class", "dropdown")
    downloadContainer.setAttribute("id", "timetableDownload")
    
    var tooltip = document.createElement("div");
    tooltip.setAttribute("class", "tooltip fade left in");
    tooltip.setAttribute("id", "downloadtooltip");
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("style", "top: 4px; left: -84px; display: none;")
    var tooltipArrow = document.createElement("div");
    tooltipArrow.setAttribute("class", "tooltip-arrow");
    var tooltipInner = document.createElement("div");
    tooltipInner.setAttribute("class", "tooltip-inner");
    tooltipInner.innerHTML = "Download";
    
    tooltip.appendChild(tooltipArrow);
    tooltip.appendChild(tooltipInner);
    downloadContainer.appendChild(tooltip)
    
    var downloadBtn = document.createElement("a");
    downloadBtn.setAttribute("role", "button");
    downloadBtn.setAttribute("style", "height: 30px; width: 30px; background-color: #4e546f; cursor: pointer; margin-top: 10px; margin-bottom: 10px; display: block;");
    downloadBtn.setAttribute("onmouseover", "mouseOver()");
    downloadBtn.setAttribute("onmouseout", "mouseOut()");
    downloadBtn.setAttribute("onclick", "downloadTimetableFunc()");
    
    var downloadIcon = document.createElement("img");
    downloadIcon.src = document.getElementById("buTimetableDownloaderLogoMax").src;
    downloadIcon.setAttribute("style", "padding: 5px;");
    
    downloadBtn.appendChild(downloadIcon);
    downloadContainer.appendChild(downloadBtn);
    toolbar.appendChild(downloadContainer);
}

function mouseOver() {
    document.getElementById("downloadtooltip").style.display = "block";
}
function mouseOut() {
    document.getElementById("downloadtooltip").style.display = "none";
}


function downloadTimetableFunc() {
    var dateRange = getDownloadRange();
    var startRange = dateRange[0];
    var endRange = dateRange[1];
    var eventsInRange = [];
    
    for (var i = 0; i < arrayoflectures.length; i++) {
        var exampleLecture = arrayoflectures[i];

        // Convert ics formatted string to JSON
        exampleLecture = exampleLecture.split("\n");
        var tempObject = {};
        for (var j = 0; j < exampleLecture.length; j++) {
            var splitString = exampleLecture[j].split(":");
            if (splitString[0].includes("DTEND")) {
                splitString[0] = "DTEND";
            } else if (splitString[0].includes("DTSTART")) {
                splitString[0] = "DTSTART";
            }
            tempObject[splitString[0]] = splitString[1];
        }

        var isoString = tempObject.DTSTART;

        var epochStamp = Date.parse(isoString.substring(0, 4) + "-" + isoString.substring(4, 6) + "-" + isoString.substring(6, 11) + ":" + isoString.substring(11, 13) + ":" + isoString.substring(13, 15));

        if (epochStamp >= startRange && epochStamp <= endRange) {
            eventsInRange.push(arrayoflectures[i])
        }
    }
    
    var icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Joshua Kelley//Bournemouth University Timetable Downloader//EN`;
    for (var k = 0; k < eventsInRange.length; k++) {
        icsString += `
` + eventsInRange[k];
    }
    icsString += `
END:VCALENDAR`;
    
    download('event.ics', icsString)
}

function download(name, writeData) {
    // Create a link (a) element to process the download through
    var element = document.createElement('a');
    // Make it invisible
    element.style.display = 'none';
    // Link it to the file
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(writeData));
    element.setAttribute('download', name);
    // Add it to the DOM
    document.body.appendChild(element);
    // Simulate clicking the link to begin the download.
    element.click();
    // Remove it from the DOM
    document.body.removeChild(element);
}

function getDownloadRange() {
    var rangeTxt = document.getElementById("headerTitle").innerHTML;
    var startDate = {
        "day": 0,
        "month": 0,
        "year": 0
    }
    var endDate = {
        "day": 0,
        "month": 0,
        "year": 0
    }
    
    var year = rangeTxt.substring(rangeTxt.length - 4);
    rangeTxt = rangeTxt.substring(0, rangeTxt.length - 5);
    
    startDate.year = parseInt(year);
    endDate.year = parseInt(year);    
    
    if (rangeTxt.split(' ').length == 1) { // True if month view
        startDate.month = monthIndex(rangeTxt);
        endDate.month = monthIndex(rangeTxt);
        startDate.day = 1;
        endDate.day = daysInMonth(endDate.month, parseInt(endDate.year))
        
    } else if (rangeTxt.includes("-")) { // True if week view
        var startList = rangeTxt.split(" - ")[0].split(" ");
        var endList = rangeTxt.split(" - ")[1].split(" ");
        
        endDate.month = monthIndex(endList[1]);
        endDate.day = parseInt(endList[0]);

        if (startList.length == 3) {
            startDate.year = parseInt(startList[2]);
        }
        if (startList.length == 1) {
            startDate.month = endDate.month;
        } else {
            startDate.month = monthIndex(startList[1]);
        }
        startDate.day = parseInt(startList[0]);
        
        
        
        
    } else { // True if day view
        rangeTxt = rangeTxt.split(" ");
        startDate.day = parseInt(rangeTxt[0]);
        endDate.day = parseInt(rangeTxt[0]);
        startDate.month = monthIndex(rangeTxt[1]);
        endDate.month = monthIndex(rangeTxt[1]);
    }
    
    
    
    for (var i = 0; i < Object.keys(startDate).length; i++) {
        var key = Object.keys(startDate)[i]
        startDate[key] = String(startDate[key]);
        if (startDate[key].length == 1) {
            startDate[key] = "0" + startDate[key];
        } 
    }
    for (var i = 0; i < Object.keys(endDate).length; i++) {
        var key = Object.keys(endDate)[i]
        endDate[key] = String(endDate[key]);
        if (endDate[key].length == 1) {
            endDate[key] = "0" + endDate[key];
        } 
    }
    
    var startEpoch = Date.parse(startDate.year + "-" + startDate.month + "-" + startDate.day + "T00:00:01");
    var endEpoch = Date.parse(endDate.year + "-" + endDate.month + "-" + endDate.day + "T23:59:59");
    
    return [startEpoch, endEpoch];
}

function monthIndex(monthString) {
    var dat = new Date('1 ' + monthString + ' 1970');
    return dat.getMonth() + 1;
}

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function parseJSON(arrayOfAllEvents) {   
    addDownloadBtnToDOM();
    
    for (var i = 0; i < arrayOfAllEvents.length; i++) {
        var workingSingle = arrayOfAllEvents[i]
        
    
    
        var uid = uniqueStr();
        
        
        var dtstamp = dateTo8601(new Date(Date.now()));
        
        var dtstart = dateTo8601(workingSingle.StartTime);

        var dtend = dateTo8601(workingSingle.EndTime);

        var summary = workingSingle.ModuleName;
        summary = titleTrim(summary);
        summary = titleCase(summary);
        
        var location = "";
        if (workingSingle.EventType == "Online") {
            location = "Online";
        } else {
            location = workingSingle.RoomsAsString;
            location = titleTrim(location);
            location = titleCase(location);
        }
        
        

        var description = workingSingle.Lecturers;
        
        var lecturerList = [];
        for (var j = 0; j < Object.keys(description).length; j++) {
            var key = Object.keys(description)[j]
            lecturerList.push(nameFormat(description[key]));
        }
        
        if (lecturerList.length == 1) {
            description = "Lecturer:";
            description += "\\" + "n" + lecturerList[0];
        } else {
            description = "Lecturers:";
            for (var k = 0; k < lecturerList.length; k++) {
                description += "\\" + "n" + lecturerList[k];
            }
        }
        

        var returnBeans = buildEvent(uid, dtstamp, dtstart, dtend, summary, location, description);
        arrayoflectures.push(returnBeans);
    }
}

function nameFormat(name) {
    name = name.toLowerCase();
    name = name.split(" ");
    name.unshift(name[name.length - 1]);
    name.pop();
    name = name.join(" ");
    name = titleCase(name);
    return name;
}


function titleTrim(title) {
    // Remove parenthesis from string
    if (title.includes("(")) {
        // Check parenthesis isn't first in string, and check student timetable.
        if (title.indexOf("(") != 0 && isStudent) {
            title = title.substring(0, title.indexOf("(") - 1);
        }
    }
    // Lower-Case string
    title = title.toLowerCase();
    
    if (title.includes(", ")) {
        
        var splitString = String(title);
        splitString = splitString.split(", ");
        
        for (var i = splitString.length - 1; i > 0; i--) {
            if (splitString[i] == splitString[0]) {
                splitString = splitString.pop();
            }
        }
    }
    
    
    var lectureTheatres = ["allsebrook", "barnes", "cobham", "lawrence", "lees", "shelley", "stevenson", "create", "inspire", "share", "marconi", "wollstone"];
    
    if (title.split(' ').length == 1) {
        if (lectureTheatres.includes(title)) {
            title += " lecture theatre";
        }
    }
    
    
    
    return title;
}

function dateTo8601(dateStr) {
    
    try {dateStr = dateStr.toISOString();}catch(e){};
    dateStr = dateStr.replace(/-/g, "");
    dateStr = dateStr.replace(/:/g, "");
    dateStr = dateStr.replace(/Z/g, "");
    
    if (dateStr.includes(".")) {
        dateStr = dateStr.substring(0, dateStr.indexOf("."));
    }
    return dateStr;
}



function buildIcs(uid, dtstamp, dtstart, dtend, summary, location, description) {
    var returnString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Joshua Kelley//Bournemouth University Timetable Downloader//EN


END:VCALENDAR`
    return returnString;
}

function buildEvent(uid, dtstamp, dtstart, dtend, summary, location, description) {
    var returnString = `BEGIN:VEVENT
UID:` + uid + `
DTSTAMP:` + dtstamp + `
DTSTART;TZID=Europe/London:` + dtstart + `
DTEND;TZID=Europe/London:` + dtend + `
SUMMARY:` + summary + `
LOCATION:` + location + `
DESCRIPTION:` + description + `
END:VEVENT`
    return returnString;
}

// Get current date/time as ISO 8601 format
function dtstamp() {
    var returnDate = "";
    
    // Fill vars with current times
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    var day = new Date().getDate();
    var hour = new Date().getHours();
    var minute = new Date().getMinutes();
    var second = new Date().getSeconds();
    var nowDate = [year.toString(), month.toString(), day.toString(), "T" + hour.toString(), minute.toString(), second.toString()];
    // Add leading zeros to single-char values
    for (var i = 0; i < nowDate.length; i++) {
        while (nowDate[i].length < 2) {
            nowDate[i] = "0" + nowDate[i];
        }
        returnDate += nowDate[i];
    }
    return returnDate;
}

function uniqueStr() {
    var returnStr = "";
    returnStr += dtstamp();
    returnStr += "-";
    var msecs = new Date().getMilliseconds();
    msecs = msecs.toString();
    while (msecs.length < 3) {
        msecs = "0" + msecs;
    }
    returnStr += msecs;
    returnStr += "-";
    var randomList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    for (var i = 0; i < 10; i++) {
        var randNum = Math.floor((Math.random() * randomList.length));
        returnStr += randomList[randNum];
    }
    return returnStr;
}

// Title-Case strings
function titleCase(inputString) {
    var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    var lowerWords = ["a", "the", "in", "at", "and", "with", "to", "or", "of", "if", "it", "is", "but"];
    var upperWords = ["pg", "ug", "l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "bu", "bucss"];
    var stringSplit = inputString.split(" ");
    var endText;
    
    for (var i = 0; i < stringSplit.length; i++) {
        // For each word, grab two strings, first character and the rest of the string
        var firstChar = stringSplit[i].substring(0, 1);
        var restChars = stringSplit[i].substring(1, stringSplit[i].length);
        
        // Capitalise words in upperWords
        for (var j = 0; j < upperWords.length; j++) {
            var proceed = true;
            // Temporarily remove currently-checking upperWord from string
            var cutString = stringSplit[i].replace(upperWords[j], "");
            
            // Check if new string still contains any A-Z letters
            for (var k = 0; k < alphabet.length; k++) {
                if (cutString.includes(alphabet[k])) {
                    proceed = false;
                }
            }
            
            // Proceed if no other A-Z letters, and upperWord is in string
            if (stringSplit[i].includes(upperWords[j]) && proceed) {
                firstChar = firstChar.toUpperCase();
                restChars = restChars.toUpperCase();
            }
        }
        
        if (i == 0 || !lowerWords.includes(stringSplit[i])) {
            // Upper-Case first char if first word or not in lowerWords
            firstChar = firstChar.toUpperCase();
        }
        
        // Check if name contains hyphen
        if (restChars.includes("-")) {
            // Split name into three around hyphen
            var leftStr = restChars.substring(0, restChars.indexOf("-")+1)
            var midStr = restChars.substring(restChars.indexOf("-")+1, restChars.indexOf("-")+2);
            var rightStr = restChars.substring(restChars.indexOf("-")+2, restChars.length);
            // Capitalise letter after hyphen
            restChars = leftStr + midStr.toUpperCase() + rightStr;
        }
        
        // Merge first character and other characters
        stringSplit[i] = firstChar + restChars;
        
        // Merge all words back into one string
        if (endText == null) {
            endText = firstChar + restChars;
        } else {
            endText = endText + " " + firstChar + restChars;
        }
    }
    return (endText);
}

// Legacy download method

// Listen for keypress
document.addEventListener('keydown', logKey);
// Run code on keypress
function logKey(e) {
    // Check if "S" key pressed (S = 83 in ASCII)
    if (e.keyCode == 83) {
        legacyDownload();
    }
}

function legacyDownload() {
    var classList = document.getElementById("listViewBtn").className.split(' ');
    if (classList.length >= 6) {
        // Process raw innerHTML for list view
        downloadTimetableFunc();
    } else {
        
    }
}