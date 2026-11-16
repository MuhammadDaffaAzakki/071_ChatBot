const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

const messages = [];

function addMessage(text, sender) {

    const message = document.createElement("div");
    message.classList.add("message", sender);
    const content = document.createElement("div");
    content.classList.add("message-content");
    content.textContent = text;
    message.appendChild(content);
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
    return content;
}

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (!userMessage) {
        return;
    }

    addMessage(userMessage, "user");
    messages.push({ role: "user", content: userMessage });
    userInput.value = "";
    userInput.disabled = true;
    const button = chatForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Menunggu...";

    const botContent = addMessage("", "bot");
    let botMessage = "";
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error || "Terjadi kesalahan."
            );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, {
                stream: true
            });

            const lines = buffer.split("\n");
            buffer = lines.pop();
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine.startsWith("data:")) {
                    continue;
                }
                const data = trimmedLine.slice(5).trim();
                if (data === "[DONE]") {
                    continue;
                }
                const token = JSON.parse(data);
                botMessage += token;
                botContent.textContent = botMessage;
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }

        messages.push({ role: "assistant", content: botMessage });
    } catch (error) {
        console.error(error);
        botContent.textContent = "Maaf, terjadi kesalahan: " + error.message;
    } finally {
        userInput.disabled = false;
        button.disabled = false;
        button.textContent = "Kirim";
        userInput.focus();
    }
});