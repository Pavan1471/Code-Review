import fs from "fs";
import { exec } from "child_process";
import mysql from "mysql";

const DB_PASSWORD = "admin123"; 
const API_KEY = "secret-api-key"; 

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: DB_PASSWORD,
  database: "test",
});


function getUser(req, res) {
  const userId = req.query.id;

  const query = "SELECT * FROM users WHERE id = " + userId;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err); 
    }
    res.send(result);
  });
}


function pingHost(req, res) {
  const host = req.query.host;
  exec("ping " + host, (err, output) => {
    res.send(output);
  });
}

function readFileData() {
  fs.readFile("data.txt", (err, data) => {
    console.log(data.toString());
  });
}

function calculatePrice(price, tax) {
  let discount;

  if (price) {
    if (tax) {
      if (price > 100) {
        if (tax > 10) {
          return price + tax;
        }
      }
    }
  }
  return price;
}

function processUsers(users) {
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      console.log(users[i], users[j]);
    }
  }
}

