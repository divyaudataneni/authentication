const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

let db = null;
let dbPath = path.join(__dirname, "userData.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:'${e.message}'`);
    process.exit(1);
  }
};
initializeDBAndServer();

//POST API1

app.post("/register", async (request, response) => {
  const registerDetails = request.body;
  const { username, name, password, gender, location } = registerDetails;
  const hashedPassword = await bcrypt.hash(password, 10);

  const postQuery = ` SELECT * FROM user WHERE username = '${username}';`;
  const dbresponse = await db.get(postQuery);

  if (dbresponse === undefined) {
    //create new user in user table
    const postnewUser = `
       INSERT INTO user(username,name,password,gender,location)
       VALUES (
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}')`;
    if (password.length > 4) {
      let newuser = await db.run(postnewUser);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    //invalid user
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const userQuery = `
      SELECT * FROM user
      WHERE username = '${username}';
    `;
  const dbresponse = await db.get(userQuery);
  console.log(dbresponse);
  if (dbresponse === undefined) {
    //invalid user
    response.status(400);
    response.send("Invalid user");
  } else {
    //check password valid or not
    const isPasswordMached = await bcrypt.compare(
      password,
      dbresponse.password
    );
    if (isPasswordMached === true) {
      //valid password

      response.status(200);
      response.send("Login success!");
    } else {
      //invalid password
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const updateQuery = `
     SELECT * FROM user WHERE username = '${username}';
    `;
  const dbUser = await db.get(updateQuery);
  console.log(dbUser.password);
  console.log(oldPassword);

  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

  console.log(isPasswordMatched);
  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      //update new password
      const encryptedNewPassword = await bcrypt.hash(newPassword, 10);
      const updateNewQuery = `
      UPDATE user SET password = '${encryptedNewPassword}'
      WHERE username = '${username}';
      `;
      await db.run(updateNewQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
