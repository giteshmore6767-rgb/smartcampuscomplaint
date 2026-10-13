const form = document.getElementById("registerForm");
const message = document.getElementById("message");

document.querySelectorAll("[data-password-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
        const input = document.getElementById(button.dataset.passwordToggle);
        const showing = input.type === "password";
        input.type = showing ? "text" : "password";
        button.setAttribute("aria-pressed", String(showing));
        button.setAttribute("aria-label", showing ? "Hide password" : "Show password");
    });
});

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const department = document.getElementById("department").value;
    const roll_no = document.getElementById("roll_no").value.trim();
    const password = document.getElementById("password").value;

    message.dataset.state = "loading";
    message.textContent = "Creating your profile...";

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, department, roll_no, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        message.dataset.state = "success";
        message.textContent = "Profile created. Taking you to sign in...";

        setTimeout(function () {
            window.location.href = "student-login.html";
        }, 1000);

    } catch (error) {
        console.error(error);
        message.dataset.state = "error";
        message.textContent = error.message;
    }
});