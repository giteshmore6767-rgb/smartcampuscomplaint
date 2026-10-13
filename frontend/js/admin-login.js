const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.dataset.state = "loading";
    message.textContent = "Signing in...";

    try {

        const response = await fetch(`${API_BASE}/auth/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        if (data.user.role !== "admin") {
            throw new Error("Admin access required");
        }

        localStorage.setItem("sc_token", data.token);

        localStorage.setItem(
            "sc_user",
            JSON.stringify(data.user)
        );

        message.dataset.state = "success";
        message.textContent = "Sign in successful. Loading the admin dashboard...";

        setTimeout(function () {

            window.location.href = "admin-dashboard.html";

        }, 500);

    } catch (error) {

        console.error(error);

        message.dataset.state = "error";
        message.textContent = error.message;

    }

});