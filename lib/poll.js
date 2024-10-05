(function() {

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function initPoll(id) {
    if (getCookie(`poll-${id}`)) {
        return Promise.resolve();
    }

    var html = `
        <div id="poll-popup" style="
            position: fixed;
            width: 75%;
            max-width: 645px;
            margin-right: 48px;
        ">
            <div style="
                position: absolute;
                right: -48px;
                cursor: pointer;
                font-size: 48px;
                color: #999;
                border: 1px rgba(113, 0, 0, 1) solid;
                border-radius: 3px;
                background: rgba(39, 41, 50, 1);
                padding: 0 8px;
            " id="close-btn">&times;</div>
            <div class="strawpoll-embed" id="strawpoll_${id}" style="height: 772px; max-height: 100vh; max-width: 645px; width: 100%; margin: 0 auto; display: flex; flex-direction: column;">
                <iframe title="StrawPoll Embed" id="strawpoll_iframe_${id}" src="https://strawpoll.com/embed/${id}" style="position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;" frameborder="0" allowfullscreen allowtransparency>Loading...</iframe>
                <script async src="https://cdn.strawpoll.com/dist/widgets.js" charset="utf-8"></script>
            </div>
        </div>
    `;

    document.write(html);

    return new Promise(function(resolve) {
        document.addEventListener('DOMContentLoaded', function () {
            var closeBtn = document.getElementById('close-btn');
            var pollPopup = document.getElementById('poll-popup');

            closeBtn.addEventListener('click', function () {
                pollPopup.remove();
                setCookie(`poll-${id}`, 'closed', 14);
                resolve();
            });
        });
    });
}

window.initPoll = initPoll;

})();
