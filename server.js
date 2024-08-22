const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
const port = 3000;

const tempDataFilePath = path.join("/tmp", "users.json");
const originalDataFilePath = path.join(__dirname, "data", "users.json");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Ensure users.json is in /tmp directory
function ensureTempFile() {
  if (!fs.existsSync(tempDataFilePath)) {
    fs.copyFileSync(originalDataFilePath, tempDataFilePath);
  }
}

// Route to handle form submission
app.post("/submit", (req, res) => {
  console.log("Data file path:", dataFilePath); // This should now work

  const { name, password, age, height, weight } = req.body;
  const bmr = Math.floor(10 * weight + 6.25 * height - 5 * age + 5);

  let users = JSON.parse(fs.readFileSync(dataFilePath));
  users.push({ name, password, age, height, weight, bmr });
  fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));

  res.send(`
    <h1>Form Submitted</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p><strong>Age:</strong> ${age}</p>
    <p><strong>Height:</strong> ${height} cm</p>
    <p><strong>Weight:</strong> ${weight} kg</p>
    <p><strong>Daily calories:</strong> ${bmr}</p>
  `);
});


app.get("/users", (req, res) => {
  ensureTempFile();
  const users = JSON.parse(fs.readFileSync(tempDataFilePath));
  res.json(users);
});

app.post("/login", (req, res) => {
  ensureTempFile();
  const { name, password } = req.body;
  let users = JSON.parse(fs.readFileSync(tempDataFilePath));

  const user = users.find(
    (user) => user.name === name && user.password === password
  );

  if (user) {
    req.session.user = user;
    res.redirect("/index.html");
  } else {
    res.send(`<h1>Invalid credentials</h1><a href="/login.html">Try again</a>`);
  }
});

app.get("/login-status", (req, res) => {
  const loggedInUser = req.session?.user;
  console.log("Logged-in user:", loggedInUser);

  if (loggedInUser) {
    const { name, bmr } = loggedInUser;
    res.json({ loggedIn: true, name, bmr });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Unable to log out.");
    }
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
