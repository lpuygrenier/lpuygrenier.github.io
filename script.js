document.addEventListener("DOMContentLoaded", function () {
    const commandInput = document.getElementById("commandInput");
    commandInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            const command = commandInput.value;
            // Process the command and display output as needed
            // You can use AJAX or other techniques to fetch data or run commands
            appendOutput(`$ ${command}`);
            commandInput.value = "";
        }
    });

    function appendOutput(text) {
        const outputContainer = document.querySelector(".terminal-output");
        outputContainer.innerHTML += `<div>${text}</div>`;
    }
});
