const loginForm = document.getElementById("loginForm");
const errorBox = document.getElementById("error");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const password =
        document.getElementById("password").value.trim();

    errorBox.textContent = "";

    if (!password) {

        errorBox.textContent =
            "Please enter your password.";

        return;
    }

    try {

        const response = await fetch("/admin/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                password: password
            })

        });

        const data = await response.json();

        if (data.success) {

            window.location.href =
                "/admin/dashboard.html";

        } else {

            errorBox.textContent =
                data.message || "Incorrect password.";

        }

    } catch (error) {

        console.error(error);

        errorBox.textContent =
            "Unable to connect to server.";

    }

});