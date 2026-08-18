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
async function saveCode(){
    const title = prompt("Enter Project Name:");
    const code = document.getElementById("code").value;
    const language = document.getElementById("language").value;

    await fetch("/save",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ title, code, language })
    });

    alert("Project Saved Successfully!");
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
const textarea = document.getElementById("code");
const lineNumbers = document.getElementById("lineNumbers");

function updateLineNumbers() {
    const lines = textarea.value.split("\n").length;
    lineNumbers.innerHTML = "";

    for (let i = 1; i <= lines; i++) {
        lineNumbers.innerHTML += i + "<br>";
    }
}

// Initial call
updateLineNumbers();

// Update on typing
textarea.addEventListener("input", updateLineNumbers);

// Sync scroll
textarea.addEventListener("scroll", () => {
    lineNumbers.scrollTop = textarea.scrollTop;
});
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateX(0)";
        }
    });
}, {
    threshold: 0.3
});

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

