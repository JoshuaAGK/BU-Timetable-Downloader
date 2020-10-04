// Global Variables
var isStudent = true;

// Listen for inputs from popup.js
chrome.runtime.onMessage.addListener (
    function(request) {
        if (request.msg == "download") {
            main();
        }
    }
);

// Listen for keypress
document.addEventListener('keydown', logKey);

// Run code on keypress
function logKey(e) {
    // Check if "S" key pressed (S = 83 in ASCII)
    if (e.keyCode == 83) {
        main();
    }
}

// Get this party started!
function main() {
    var x = document.querySelectorAll(".modal-content");
    var workingString = x[2].innerHTML;
    scrapeData(workingString);
}

// Read and scrape raw HTML
function scrapeData(workingString) {
    // Check how many classes the 'List View' button is associated with
    var classList = document.getElementById("listViewBtn").className.split(' ');
    // Check if lecturer timetable or student timetable
    var labelList = document.querySelectorAll(".hd-aside");
    var labelItm = labelList[0].innerHTML;
    // Ignore first letter because capitalisation
    if (labelItm.includes("ecturer")) {
        isStudent = false;
    }
    
    if (classList.length >= 6) {
        // Process raw innerHTML for list view
        listProcess();
    } else {
        // Select innerHTML text as a substring between two tags
        var eventDate = getSubString(workingString, '<h2 id="eventDate">', '</h2>');
        var eventTime = getSubString(workingString, '<h3 id="eventTime">', '</h3>');
        var eventName = getSubString(workingString, '<h4 id="eventName">', '</h4>');
        var eventRoom = getSubString(workingString, '<span id="eventRooms" class="value">', '</span>');
        var lecturers = getSubString(workingString, '<span id="eventLecturers" class="value">', '</span>');
        // Process raw innerHTML for single item
        stringProcess(eventDate, eventTime, eventName, eventRoom, lecturers);
    }
}

/* Scrape list view HTML and process it.
/  Much simpler as list view is all in one place
/  and list view has simpler layout */
function listProcess() {
    var eventArray = [];
    var eventTemp = ``;
    var writeData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Joshua Kelley//Bournemouth University Timetable Downloader//EN`;
    // Select every row in table
    var selectElement = document.getElementById("listView");
    selectElement = selectElement.getElementsByTagName("tbody")[0];
    selectElement = selectElement.getElementsByTagName("tr");
    for (i = 0; i < selectElement.length; i++) {
        // Split lines of innerHTML into array
        var workingElement = selectElement[i];
        var arrayOfLines = workingElement.innerHTML.split("</td><td>");
        
        // Convert array to many strings
        var startTime = arrayOfLines[3].substring(11);
        var startDate = arrayOfLines[3].substring(0, 10);
        var endTime   = arrayOfLines[4].substring(11);
        var endDate   = arrayOfLines[4].substring(0, 10);
        var eventName = arrayOfLines[0].substring(4);
        var eventRoom = arrayOfLines[2];
        var eventDesc = arrayOfLines[8];
        
        // Format strings
        startDate = startDate.substring(6, 10) + startDate.substring(3, 5) + startDate.substring(0, 2) + "T" + timeConvert(startTime) + "00";
        endDate = endDate.substring(6, 10) + endDate.substring(3, 5) + endDate.substring(0, 2) + "T" + timeConvert(endTime) + "00";
        eventName = titleFormat(eventName);
        eventDesc = nameFormat(eventDesc);
        eventDesc = multiNameLineFormat(eventDesc);
    
        // Only write events inside specified date range
        if (dateRangeCheck(startDate)) {
            console.log("Passed Date Check");
            eventTemp = `
BEGIN:VEVENT
UID:` + uid() + `
DTSTAMP;TZID=Europe/London:` + dtstamp() + `
DTSTART;TZID=Europe/London:` + startDate + `
DTEND:` + endDate + `
SUMMARY:` + eventName + `
LOCATION:` + eventRoom + `
DESCRIPTION:` + eventDesc + `
END:VEVENT`;
        }
        
        if (!eventArray.includes(eventTemp)) {
            eventArray += eventTemp;
            writeData += eventTemp
        }
    }
    
    writeData += `
END:VCALENDAR`;
    
    // Download .ics file to client
    download('event.ics', writeData);
}

function dateRangeCheck(date) {
    var hasNumber = /\d/;
    var weekView = false;
    var dayView = false;
    var eventMonth = document.getElementById("headerTitle").innerHTML;
    // Strip trailing YYYY
    eventMonth = eventMonth.substring(0, eventMonth.length - 5);
    // Check if week view
    if (eventMonth.includes("-")) {
        weekView = true;
    }
    // Check if day view
    if (hasNumber.test(eventMonth)) {
        eventMonth = eventMonth.substring(3);
        dayView = true;
    }
    // Cut down to 3 letter month
    eventMonth = eventMonth.substring(0, 3);
    
    switch(eventMonth) {
        case "Jan":
            eventMonth = "01";
            break;
        case "Feb":
            eventMonth = "02";
            break;
        case "Mar":
            eventMonth = "03";
            break;
        case "Apr":
            eventMonth = "04";
            break;
        case "May":
            eventMonth = "05";
            break;
        case "Jun":
            eventMonth = "06";
            break;
        case "Jul":
            eventMonth = "07";
            break;
        case "Aug":
            eventMonth = "08";
            break;
        case "Sep":
            eventMonth = "09";
            break;
        case "Oct":
            eventMonth = "10";
            break;
        case "Nov":
            eventMonth = "11";
            break;
        case "Dec":
            eventMonth = "12";
            break;
    }
    
    if (date.substring(4, 6) == eventMonth || weekView == true || dayView == true) {
        return true;
    } else {
        return false;
    }
    
}

function multiNameLineFormat(lecturers) {
    var eventDesc = "";
    if (lecturers.length >= 2) {
        eventDesc = "Lecturers:";
        for (var i = 0; i < lecturers.length; i++) {
            eventDesc += "\\" + "n" + lecturers[i];
        }
    } else {
        if (lecturers[0] != "") {
            eventDesc = "Lecturer:";
            for (var i = 0; i < lecturers.length; i++) {
                eventDesc += "\\" + "n" + lecturers[i];
            }
        }
    }
    
    return eventDesc;
}

// Process raw innerHTML into formatted data
function stringProcess(eventDate, eventTime, eventName, eventRoom, lecturers) {
    // Check an event is actually selected
    if (document.getElementById("eventModal").classList.contains("in")) {
        var eventDesc;
        // Process eventTime into a stard and end timestamp
        var startTime = dateConvert(eventDate, eventTime).substring(0, 15)
        var endTime = dateConvert(eventDate, eventTime).substring(15, 30)
        // Title-Case the event name
        eventName = titleFormat(eventName);
        // Rearrange lecturer names the right way around, and Title-Case
        lecturers = nameFormat(lecturers);
        // Write lecturer names to description
        eventDesc = multiNameLineFormat(lecturers);

        // The final multi-line string of text to write to the .ics file
        writeData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Joshua Kelley//Bournemouth University Timetable Downloader//EN
BEGIN:VEVENT
UID:` + uid() + `
DTSTAMP:` + dtstamp() + `
DTSTART;TZID=Europe/London:` + startTime + `
DTEND;TZID=Europe/London:` + endTime + `
SUMMARY:` + eventName + `
LOCATION:` + eventRoom + `
DESCRIPTION:` + eventDesc + `
END:VEVENT
END:VCALENDAR`
        
        
        
        // TODO
        //
        // SETTING AND GETTING DATA
        // This works here btw, just need to get it to work in popup.
        // Maybe it works in popup already. I haven't tested it yet.
        
        /*
        chrome.storage.sync.get(['key'], function(result) {
            console.log('Value currently is ' + result.key);
        });
        
        chrome.storage.sync.set({key: startTime}, function() {
            console.log('Value is set to ' + startTime);
        });
        */
    
        // Download .ics file to client
        download('event.ics', writeData)
    }
}

// Downloads the file to the client.
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

// Move firstnames to before lastnames, and Title-Case names.
function nameFormat(lecturers) {
    // Create array with all lecturer names
    var stringSplit = lecturers.split(", ");
    var tempArray;
    
    for (var i = 0; i < stringSplit.length; i++) {
        // Split full name into array of first/middle/last
        tempArray = stringSplit[i].split(" ");
        // Add firstname to front of array
        tempArray.unshift(tempArray[tempArray.length - 1])
        // Keep all elements except last one
        tempArray = tempArray.splice(0, tempArray.length - 1)
        
        for (var x = 0; x < tempArray.length; x++) {
            // Title-Case all names
            tempArray[x] = titleFormat(tempArray[x]);
        }
        // Join names back together into string
        stringSplit[i] = tempArray.join(' ');
        
    }
    return stringSplit;
}

// Prepare strings to be Title-Case'd
function titleFormat(title) {
    // Remove parenthesis from string
    if (title.includes("(")) {
        // Check parenthesis isn't first in string, and check student timetable.
        if (title.indexOf("(") != 0 && isStudent == true) {
            title = title.substring(0, title.indexOf("(") - 1);
        }
    }
    // Lower-Case string
    title = title.toLowerCase();
    return(titleCase(title));
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

// Convert date to ISO 8601 format
function dateConvert(eventDate, eventTime) {
    var eventMonth = eventDate.substring(0, 3);
    var eventDay = eventDate.substr(4, eventDate.length);
    
    // Convert month word to number
    switch(eventMonth) {
        case "Jan":
            eventMonth = "01";
            break;
        case "Feb":
            eventMonth = "02";
            break;
        case "Mar":
            eventMonth = "03";
            break;
        case "Apr":
            eventMonth = "04";
            break;
        case "May":
            eventMonth = "05";
            break;
        case "Jun":
            eventMonth = "06";
            break;
        case "Jul":
            eventMonth = "07";
            break;
        case "Aug":
            eventMonth = "08";
            break;
        case "Sep":
            eventMonth = "09";
            break;
        case "Oct":
            eventMonth = "10";
            break;
        case "Nov":
            eventMonth = "11";
            break;
        case "Dec":
            eventMonth = "12";
            break;
    }
    
    // Add a leading zero to the day if otherwise missing.
    if (eventDay.length == 1) {
        eventDay = "0" + eventDay;
    }
    
    // Grab the current year off the DOM
    var eventYear = document.getElementById("headerTitle").innerHTML;
    eventYear = eventYear.substring(eventYear.length - 4, eventYear.length);
    // Merging date into YYYYMMDD
    var dateNum = eventYear + eventMonth + eventDay;
    // Grabbing start and end times from the time string
    var startTime = eventTime.substring(0, eventTime.indexOf("-") - 1);
    var endTime = eventTime.substring(eventTime.indexOf("-") + 2, eventTime.length);
    // Formatting start and end times into HHMMSS
    startTime = dateNum + "T" + timeConvert(startTime) + "00";
    endTime = dateNum + "T" + timeConvert(endTime) + "00";
    return(startTime+endTime);
}

// Converting 12-Hour time to 24-Hour time
function timeConvert(time) {
    // Grab hour from time string
    var hour = time.substring(0, time.indexOf(":"));
    // Grab minute from time string
    var minute = time.substring(time.indexOf(":") + 1, time.indexOf(" "));
    // Grab AM/PM from time string
    var meridian = time.substring(time.length - 2, time.length);
    
    // Add 12 hours if past midday
    if (meridian == "pm" && hour != "12") {
        hour = parseInt(hour, 10);
        hour += 12;
        hour = hour.toString();
    }
    
    // Add a leading zero to the hour if otherwise missing.
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    
    return(hour + minute)
}

// Find the substring between two points
function getSubString(string, start, end) {
    // Take the substring
    var subString = string.substring(string.lastIndexOf(start) + start.length, string.lastIndexOf(end));
    // Cut off any remaning unwanted string
    if (subString.includes(end)) {
        subString = subString.substring(0, subString.indexOf(end));
    }
    return subString;
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

// Get a completley random string
function uid() {
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
    var randomList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
    for (var i = 0; i < 10; i++) {
        var randNum = Math.floor((Math.random() * randomList.length));
        returnStr += randomList[randNum];
    }
    return returnStr;
}