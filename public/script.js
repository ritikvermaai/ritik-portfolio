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
async function saveCode() {

    const title =
        await sitePrompt({

            title:
                "Save Project",

            subtitle:
                "Give your project a name before saving.",

            label:
                "Project Name",

            placeholder:
                "e.g. Calculator Program",

            icon:
                "💾"

        });


    /* USER CANCELLED */

    if (title === null) {

        return;

    }


    const cleanTitle =
        title.trim();


    /* EMPTY NAME */

    if (!cleanTitle) {

        await siteNotice({

            title:
                "Project Name Required",

            subtitle:
                "Your project was not saved.",

            message:
                "Please enter a project name and try again.",

            icon:
                "⚠️"

        });

        return;

    }


    const code =
        document
            .getElementById(
                "code"
            )
            .value;


    const language =
        document
            .getElementById(
                "language"
            )
            .value;


    if (!code.trim()) {

        await siteNotice({

            title:
                "No Code Found",

            subtitle:
                "Your project was not saved.",

            message:
                "Please write some code before saving the project.",

            icon:
                "⚠️"

        });

        return;

    }


    try {

        const response =
            await fetch(
                "/save",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            title:
                                cleanTitle,

                            code,

                            language

                        })

                }
            );


        const data =
            await response.json();


        /* SERVER ERROR */

        if (
            !response.ok
        ) {

            await siteNotice({

                title:
                    "Save Failed",

                subtitle:
                    "Your project could not be saved.",

                message:
                    data.message ||
                    "The server rejected the request.",

                icon:
                    "❌",

                type:
                    "danger"

            });

            return;

        }


        /* SUCCESS */

        await siteNotice({

            title:
                "Project Saved",

            subtitle:
                "Your project has been saved successfully.",

            message:
                `"${cleanTitle}" is now available in your Saved Projects.`,

            icon:
                "✅"

        });


    } catch (error) {

        console.error(
            "Save Project Error:",
            error
        );


        await siteNotice({

            title:
                "Connection Error",

            subtitle:
                "Unable to save your project.",

            message:
                "Please check your connection and try again.",

            icon:
                "❌",

            type:
                "danger"

        });

    }

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
function toggleMenu(){
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const button = document.querySelector(".menu-btn");

    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    button.classList.toggle("active");
}
// Close sidebar when link clicked
document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", () => {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("overlay");
        const button = document.querySelector(".menu-btn");

        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        button.classList.remove("active");
    });
});
// Close sidebar when clicking anywhere outside
document.addEventListener("click", function(e){
    const sidebar = document.getElementById("sidebar");
    const button = document.querySelector(".menu-btn");

    if(
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !button.contains(e.target)
    ){
        sidebar.classList.remove("active");
        document.getElementById("overlay").classList.remove("active");
        button.classList.remove("active");
    }
});
// Active page highlight
window.addEventListener("DOMContentLoaded", function(){
    const path = window.location.pathname;

    if(path === "/" || path.includes("index")){
        document.getElementById("nav-home")?.classList.add("active");
    }
    if(path.includes("coding")){
        document.getElementById("nav-coding")?.classList.add("active");
    }
    if(path.includes("projects")){
        document.getElementById("nav-projects")?.classList.add("active");
    }
    if(path.includes("contact")){
        document.getElementById("nav-contact")?.classList.add("active");
    }
    if(path.includes("gallery")){
        document.getElementById("nav-gallery")?.classList.add("active");
    }
});
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