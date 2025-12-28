import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Health check
app.get("/", (req, res) => {
  res.send("GitHub Webhook + Gemini AI running");
});

// Fetch file content
async function fetchFileContent(repo, path) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  return Buffer.from(res.data.content, "base64").toString("utf-8");
}

// GitHub Webhook
app.post("/github-webhook", async (req, res) => {
  const event = req.headers["x-github-event"];

  // Ping event
  if (event === "ping") {
    return res.status(200).json({ message: "Webhook connected successfully" });
  }

  // Push event
  if (event !== "push") {
    return res.status(200).send("Event ignored");
  }

  try {
    const payload = req.body;
    const repoFullName = payload.repository.full_name;
    const commitSha = payload.after;

    // 1️⃣ Get repo tree
    const treeUrl = `https://api.github.com/repos/${repoFullName}/git/trees/${commitSha}?recursive=1`;
    const treeRes = await axios.get(treeUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });

    // 2️⃣ Filter code files
    const codeFiles = treeRes.data.tree.filter(
      (file) =>
        file.type === "blob" &&
        /\.(js|ts|jsx|tsx|py|java|go|cs)$/.test(file.path) &&
        !file.path.includes("node_modules")
    );

    // 3️⃣ Read file contents (LIMIT to avoid token overflow)
    let repoCode = "";
    for (const file of codeFiles.slice(0, 20)) {
      const content = await fetchFileContent(repoFullName, file.path);
      repoCode += `\n\n// File: ${file.path}\n${content}`;
    }

    // 4️⃣ Gemini prompt
    const prompt = `
You are a senior software engineer.

Analyze the repository code below and return results in JSON format:

{
  "Critical": [],
  "High": [],
  "Medium": [],
  "Low": [],
  "Score": "",
  "Summary": ""
}

Focus on:
- Security
- Performance
- Code smells
- Best practices

Repository Code:
${repoCode}
`;

    // 5️⃣ Send to Gemini AI
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();
    console.log("Gemini Analysis:", analysis);
    // 6️⃣ Response
    return res.status(200).json({
      repository: repoFullName,
      commit: commitSha,
      analysis,
    });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return res.status(500).json({ error: "Analysis failed" });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`🚀 Webhook server running on port ${process.env.PORT}`);
});
