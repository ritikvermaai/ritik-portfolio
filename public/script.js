function runCode() {
    const code = document.getElementById("code").value;
    const input = document.getElementById("userInput").value;
    const language = document.getElementById("language").value;
    const output = document.getElementById("output");

    const runBtn = document.getElementById("runBtn");
    const runText = document.getElementById("runText");
    const runLoader = document.getElementById("runLoader");

    // Start animation
    runBtn.disabled = true;
    runText.innerText = "Running";
    runLoader.style.display = "inline-block";
    output.innerHTML = "";

    fetch("/run", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, language, input })
    })
    .then(res => res.json())
    .then(result => {
    output.innerHTML = result.output;
})
    .catch(() => {
        output.innerHTML = "Error running code!";
    })
    .finally(() => {
        // Stop animation
        runBtn.disabled = false;
        runText.innerText = "Run";
        runLoader.style.display = "none";
    });
}
window.onload = function(){
    const savedCode = localStorage.getItem("openedCode");
    const savedLang = localStorage.getItem("openedLang");

    if(savedCode){
        document.getElementById("code").value = savedCode;
        document.getElementById("language").value = savedLang;
        localStorage.removeItem("openedCode");
        localStorage.removeItem("openedLang");
    }
}
// Floating badge
window.addEventListener("scroll", function(){
    const badge = document.getElementById("badge");

    if(window.scrollY > 200){
        badge.classList.add("show");
    } else{
        badge.classList.remove("show");
    }
});
// Sidebar behaviour is centralized in site-shell.js.

// Fade in on load
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});

// Fade out on link click
document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", function(e){
            const href = this.getAttribute("href");

            if(href && !href.startsWith("#") && !href.startsWith("http")){
                e.preventDefault();
                document.body.classList.remove("loaded");

                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
});


/* =====================================================
   COMPILER LINE NUMBERS
   Only run when compiler elements exist
===================================================== */

const textarea =
    document.getElementById("code");

const lineNumbers =
    document.getElementById("lineNumbers");


if (
    textarea &&
    lineNumbers
) {

    function updateLineNumbers() {

        const lines =
            textarea.value
                .split("\n")
                .length;


        lineNumbers.innerHTML =
            "";


        for (
            let i = 1;
            i <= lines;
            i++
        ) {

            lineNumbers.innerHTML +=
                i + "<br>";

        }

    }


    // Initial call
    updateLineNumbers();


    // Update on typing
    textarea.addEventListener(
        "input",
        updateLineNumbers
    );


    // Sync scroll
    textarea.addEventListener(
        "scroll",
        () => {

            lineNumbers.scrollTop =
                textarea.scrollTop;

        }
    );

}

document.querySelectorAll(".row").forEach(row => {
    row.style.opacity = "0";
    row.style.transition = "all 1s ease";

    if(row.classList.contains("reverse")){
        row.style.transform = "translateX(-100px)";
    } else {
        row.style.transform = "translateX(100px)";
    }

    observer.observe(row);
});

/* =====================================================
   PROFESSIONAL WEBSITE MODAL
===================================================== */

let siteModalResolver = null;


function escapeSiteHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function openSiteModal({

    title = "Information",

    subtitle = "",

    icon = "✨",

    body = "",

    buttons = []

} = {}) {

    const overlay =
        document.getElementById(
            "siteModalOverlay"
        );

    const titleElement =
        document.getElementById(
            "siteModalTitle"
        );

    const subtitleElement =
        document.getElementById(
            "siteModalSubtitle"
        );

    const iconElement =
        document.getElementById(
            "siteModalIcon"
        );

    const bodyElement =
        document.getElementById(
            "siteModalBody"
        );

    const actions =
        document.getElementById(
            "siteModalActions"
        );


    if (!overlay) {

        console.error(
            "Site modal not found."
        );

        return Promise.resolve(null);

    }


    titleElement.textContent =
        title;

    subtitleElement.textContent =
        subtitle;

    iconElement.textContent =
        icon;

    bodyElement.innerHTML =
        body;

    actions.innerHTML =
        "";


    return new Promise(resolve => {

        siteModalResolver =
            resolve;


        buttons.forEach(button => {

            const element =
                document.createElement(
                    "button"
                );

            element.type =
                "button";

            element.className =
                "site-modal-btn " +
                (
                    button.type ||
                    "primary"
                );

            element.textContent =
                button.text;


            element.onclick =
                () => {

                    closeSiteModal(
                        button.value
                    );

                };


            actions.appendChild(
                element
            );

        });


        overlay.classList.add(
            "active"
        );


        setTimeout(() => {

            const input =
                bodyElement.querySelector(
                    "input, textarea"
                );

            if (input) {

                input.focus();

                if (input.select) {
                    input.select();
                }

            }

        }, 100);

    });

}


function closeSiteModal(
    value = null
) {

    const overlay =
        document.getElementById(
            "siteModalOverlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "active"
    );


    if (siteModalResolver) {

        const resolve =
            siteModalResolver;

        siteModalResolver =
            null;

        resolve(value);

    }

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeButton =
            document.getElementById(
                "siteModalClose"
            );

        if (closeButton) {

            closeButton.onclick =
                () => {

                    closeSiteModal(
                        null
                    );

                };

        }


        const overlay =
            document.getElementById(
                "siteModalOverlay"
            );

        if (overlay) {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        closeSiteModal(
                            null
                        );

                    }

                }
            );

        }

    }
);


/* ================= INPUT PROMPT ================= */

function sitePrompt({

    title =
        "Enter Information",

    subtitle =
        "Please enter the required information.",

    label =
        "Value",

    value =
        "",

    placeholder =
        "",

    type =
        "text",

    icon =
        "✏️"

} = {}) {

    const inputId =
        "siteInput_" +
        Date.now();


    return openSiteModal({

        title,

        subtitle,

        icon,

        body: `

            <div class="site-modal-field">

                <label for="${inputId}">
                    ${escapeSiteHTML(label)}
                </label>

                <input
                    id="${inputId}"
                    type="${type}"
                    value="${escapeSiteHTML(value)}"
                    placeholder="${escapeSiteHTML(
                        placeholder
                    )}"
                >

            </div>

        `,

        buttons: [

            {
                text:
                    "Cancel",

                type:
                    "cancel",

                value:
                    null
            },

            {
                text:
                    "Continue",

                type:
                    "primary",

                value:
                    "submit"
            }

        ]

    }).then(result => {

        if (
            result !==
            "submit"
        ) {

            return null;

        }


        const input =
            document.getElementById(
                inputId
            );


        return input
            ? input.value
            : "";

    });

}


/* ================= NOTICE ================= */

function siteNotice({

    title =
        "Done",

    subtitle =
        "",

    message =
        "",

    icon =
        "✅",

    type =
        "primary"

} = {}) {

    return openSiteModal({

        title,

        subtitle,

        icon,

        body: `

            <div class="site-modal-message">

                ${escapeSiteHTML(
                    message
                )}

            </div>

        `,

        buttons: [

            {
                text:
                    "OK",

                type,

                value:
                    true

            }

        ]

    });

}

/* ================= WELCOME SPLASH ================= */
(function initWelcomeSplash() {
    const splash = document.getElementById("welcomeSplash");
    if (!splash) return;

    // Show the welcome animation once per browser tab/session.
    // This prevents an annoying animation every time the homepage is refreshed.
    let alreadyShown = false;
    try {
        alreadyShown = sessionStorage.getItem("ritikWelcomeSplashShown") === "1";
    } catch (error) {
        // If storage is unavailable, simply show the splash normally.
    }

    if (alreadyShown) {
        splash.classList.add("splash-hide");
        document.body.classList.remove("splash-active");
        return;
    }

    try {
        sessionStorage.setItem("ritikWelcomeSplashShown", "1");
    } catch (error) {
        // Continue without session storage.
    }

    const hideSplash = () => {
        splash.classList.add("splash-hide");
        document.body.classList.remove("splash-active");
        setTimeout(() => splash.remove(), 800);
    };

    // Give the welcome animation enough time to be noticed, but keep it quick.
    window.setTimeout(hideSplash, 1800);
})();
