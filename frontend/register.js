const form = document.getElementById("registerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const department = document.getElementById("department").value;
    const roll_no = document.getElementById("roll_no").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Creating account...";

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    department: department,
                    roll_no: roll_no,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        message.textContent = "Account created successfully!";

        setTimeout(function () {
            window.location.href = "student-login.html";
        }, 1000);

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
});