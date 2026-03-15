# Contributing to Aegis Edge

Thank you for your interest in Aegis Edge! We welcome contributions from the community to help make this zero-latency edge intrusion detection system even better.

Whether you're fixing a bug, improving documentation, or adding new features, this guide will help you get started.

---

## 1. How to Submit an Issue 🐞

If you find a bug or have a suggestion, please open an issue on GitHub. To help us resolve it quickly, please include:

*   **A clear description** of the bug or feature request.
*   **Steps to reproduce** the issue (for bugs).
*   **Environment details**:
    *   Operating System (Windows/macOS/Linux).
    *   Python version (`python --version`).
    *   Relevant library versions (`numpy`, `scikit-learn`).
*   **Screenshots or terminal logs** if applicable.

---

## 2. How to Submit a Pull Request (PR) 🔧

We follow a standard GitHub flow for contributions:

1.  **Fork** the repository to your own account.
2.  **Create a new branch** for your changes:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/bug-description
    ```
3.  **Make your changes** and test them locally.
4.  **Commit your changes** using descriptive commit messages (see below).
5.  **Push** to your fork and **Submit a Pull Request** to the main repository.

All PRs will be reviewed as soon as possible. Thank you for your patience!

---

## 3. Code Style & Standards ✨

To keep the codebase clean and consistent, we follow these guidelines:

*   **Python**: We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/). We recommend using **Black** for automatic formatting.
*   **JavaScript/CSS/HTML**: We recommend using **Prettier** for formatting.
*   **Documentation**: Ensure any new features or changes are reflected in the `README.md`.

---

## 4. Development Environment Setup 🛠

To set up Aegis Edge for development:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Hao610/Aegis-Edge.git
    cd Aegis-Edge
    ```
2.  **Install dependencies**:
    ```bash
    pip install numpy scikit-learn joblib
    ```
3.  **Train the model** (if working on the AI engine):
    ```bash
    python ai_train.py
    ```
4.  **Run the core engine**:
    ```bash
    python edge_manager.py
    ```
5.  **Run the dashboard** (for UI/UX development):
    ```bash
    python -m http.server 8000
    ```
    Visit `http://localhost:8000/dashboard/` in your browser.

---

## 5. Commit Message Convention 📝

We recommend using [Conventional Commits](https://www.conventionalcommits.org/) to make the history readable:

*   `feat:` A new feature.
*   `fix:` A bug fix.
*   `docs:` Documentation changes.
*   `style:` Changes that do not affect the meaning of the code (formatting, etc).
*   `refactor:` A code change that neither fixes a bug nor adds a feature.
*   `perf:` A code change that improves performance.

**Example**: `feat: add live packet capture support via Scapy`

---

## 6. Code of Conduct

Help us keep Aegis Edge a welcoming and inclusive community. Please be respectful, professional, and kind to fellow contributors. We follow the standards set out in the [Contributor Covenant](https://www.contributor-covenant.org/).

---

✅ **Summary of Contribution:**

1.  Report bugs with clear reproduction steps.
2.  Follow the Fork -> Branch -> PR workflow.
3.  Adhere to Python (Black) and JS (Prettier) styles.
4.  Use standard dev commands for testing.
5.  Write clear, conventional commit messages.

Your support helps protect the perimeter! 🛡️
