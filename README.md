# Frontend-LLM

A modern, beautiful, and responsive web-based chat interface that connects directly to multiple Large Language Model (LLM) providers from the client-side. This application allows you to use APIs from Google (Gemini), OpenRouter, and Cerebras without needing a backend server.

## Features

- **Multi-Provider Support:** Seamlessly switch between different LLM providers and models.
  - **Google AI:** Gemini 2.5 Flash, Gemini 2.5 Flash Lite
  - **OpenRouter:** Minimax M1, Deepseek R1, Qwen3, and more.
  - **Cerebras:** Llama 4 Scout, Qwen 3, Llama 3.3.
- **Secure Local Storage:** Your API keys are stored securely in your browser's `localStorage`, so you only need to enter them once.
- **Chat History:** Conversations are saved locally, allowing you to review past interactions. You can also clear the history at any time.
- **Beautiful UI:** A clean, modern, and responsive user interface designed for a great chat experience.
- **No Backend Required:** The entire application runs in the browser, making it easy to deploy and host on static site platforms.
- **Offline Caching:** A service worker (`sw.js`) caches the application files, allowing for faster load times and some offline functionality.

## Getting Started

To run this application locally, you'll need to serve the files using a simple web server.

1.  **Clone the repository (or download the files):**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Start a local web server:**
    If you have Python installed, you can use its built-in HTTP server.
    ```bash
    # For Python 3
    python -m http.server

    # For Python 2
    python -m SimpleHTTPServer
    ```
    Alternatively, you can use any other local web server, like `live-server` for Node.js.

3.  **Open the application:**
    Open your web browser and navigate to `http://localhost:8000` (or the port your server is running on).

4.  **Enter API Keys:**
    On your first visit, a modal will appear asking for your API keys for Cerebras, OpenRouter, and Gemini. Enter them to begin using the chat.

## Deployment on GitHub Pages

This application can be easily deployed for free using GitHub Pages.

1.  **Create a GitHub Repository:** Push your code to a new public repository on GitHub.
2.  **Enable GitHub Pages:**
    - In your repository, go to **Settings** > **Pages**.
    - Under "Build and deployment", select **Deploy from a branch**.
    - Choose the `main` branch and the `/ (root)` folder.
    - Click **Save**.

GitHub will deploy your site and provide you with a public URL.

## Technologies Used

- **HTML5**
- **CSS3** (with modern styling for a clean look)
- **JavaScript (ES6+)** (for all application logic and API interactions)

## Security Warning

**IMPORTANT:** This application stores your API keys in your browser's `localStorage`. While this is convenient for a personal project, it is **not a secure practice for production applications**. Anyone with access to your browser could potentially view these keys. For any public-facing or sensitive application, it is highly recommended to use a backend server to manage and protect your API keys.
