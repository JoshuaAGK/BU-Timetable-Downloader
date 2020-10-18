var xhr = XMLHttpRequest.prototype;
var send = xhr.send;

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
    
    var summary = null;
    var location = null;
    var description = null;
    
    
    var returnBeans = buildIcs(uid, dtstamp, dtstart, dtend, summary, location, description);
    
    console.log(returnBeans);
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