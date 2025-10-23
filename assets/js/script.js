// Add button press visual feedback and keyboard activation
document.addEventListener("DOMContentLoaded", () => {
    const buttons = Array.from(document.querySelectorAll(".play-btn"));
    buttons.forEach((btn) => {
        // click visual
        btn.addEventListener("mousedown", () => btn.classList.add("pressed"));
        btn.addEventListener("mouseup", () => btn.classList.remove("pressed"));
        btn.addEventListener("mouseleave", () =>
            btn.classList.remove("pressed")
        );

        // keyboard activation (Enter / Space)
        btn.setAttribute("tabindex", "0");
        btn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                btn.classList.add("pressed");
            }
        });
        btn.addEventListener("keyup", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                btn.classList.remove("pressed");
                // follow link
                const href = btn.getAttribute("href");
                if (href) window.location.href = href;
            }
        });
    });
});
