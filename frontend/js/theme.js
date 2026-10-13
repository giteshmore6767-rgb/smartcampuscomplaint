(function () {
    const storageKey = "sc_theme";
    const validThemes = ["dark", "light"];

    function readTheme() {
        try {
            const savedTheme = localStorage.getItem(storageKey);
            return validThemes.includes(savedTheme) ? savedTheme : "dark";
        } catch {
            return "dark";
        }
    }

    let currentTheme = readTheme();
    document.documentElement.dataset.theme = currentTheme;

    function applyTheme(theme) {
        currentTheme = validThemes.includes(theme) ? theme : "dark";
        document.documentElement.dataset.theme = currentTheme;
        try {
            localStorage.setItem(storageKey, currentTheme);
        } catch {
            // The current page still changes theme when storage is unavailable.
        }
        updateToggle();
    }

    function updateToggle() {
        const button = document.querySelector(".theme-toggle");
        if (!button) return;

        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        const isLight = nextTheme === "light";
        button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
        button.setAttribute("aria-pressed", String(currentTheme === "light"));
        button.title = `Switch to ${nextTheme} mode`;
        button.innerHTML = `${isLight
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke-linecap="round"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        }<span class="theme-toggle-label">${nextTheme === "light" ? "Light" : "Dark"}</span>`;
    }

    function addThemeToggle() {
        if (document.querySelector(".theme-toggle")) return;
        const topNavigation = document.querySelector(".topbar nav");
        const sidebar = document.querySelector(".sidebar");
        const authCard = document.querySelector(".auth-card");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "theme-toggle";
        button.addEventListener("click", () => applyTheme(currentTheme === "dark" ? "light" : "dark"));

        if (topNavigation) {
            topNavigation.append(button);
        } else if (sidebar) {
            const logoutButton = sidebar.querySelector(".logout");
            sidebar.insertBefore(button, logoutButton || null);
        } else if (authCard) {
            const brand = authCard.querySelector(".brand");
            authCard.insertBefore(button, brand || null);
        }
        updateToggle();
    }

    function clearAuthFields() {
        const form = document.querySelector(".auth-card form");
        if (!form) return;
        form.reset();
        form.querySelectorAll('input[type="password"]').forEach(input => {
            input.value = "";
        });
    }

    window.addEventListener("pageshow", clearAuthFields);
    document.addEventListener("DOMContentLoaded", () => {
        addThemeToggle();
        clearAuthFields();
    });
})();
