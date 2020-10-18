var xhr = XMLHttpRequest.prototype;
var send = xhr.send;

var isStudent = true;

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

function parseJSON(arrayOfAllEvents) {    
    // Temporary
    var workingSingle = arrayOfAllEvents[5]
    
    var uid = uniqueStr();
    
    var dtstamp = new Date(Date.now());
    dtstamp = dateTo8601(dtstamp);
    
    var dtstart = workingSingle.StartTime;
    dtstart = dateTo8601(dtstart)
    
    var dtend = workingSingle.EndTime;
    dtend = dateTo8601(dtend)
    
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
    
    
    
    var description = null;
    
    
    var returnBeans = buildIcs(uid, dtstamp, dtstart, dtend, summary, location, description);

    console.log(returnBeans);
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
        title = title.split(", ");
        
        for (var i = title.length - 1; i > 0; i--) {
            if (title[i] == title[0]) {
                title = title.pop();
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
BEGIN:VEVENT
UID:` + uid + `
DTSTAMP:` + dtstamp + `
DTSTART;TZID=Europe/London:` + dtstart + `
DTEND;TZID=Europe/London:` + dtend + `
SUMMARY:` + summary + `
LOCATION:` + location + `
DESCRIPTION:` + description + `
END:VEVENT
END:VCALENDAR`
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