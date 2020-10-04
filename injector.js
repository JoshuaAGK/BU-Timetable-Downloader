var xhr = XMLHttpRequest.prototype;
var send = xhr.send;

// Making changes to XMLHttpRequest send function
xhr.send = function(postData) {
    // Attach event listener to response
    this.addEventListener('load', function() {
        // Console log parsed response
        console.log(JSON.parse(this.responseText));  
    });

    // Apply changes to send function
    return send.apply(this, arguments);
};