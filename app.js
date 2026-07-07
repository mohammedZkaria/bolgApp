import express from "express";
import mysql from "mysql2";
import "dotenv/config";
import { error } from "node:console";

const app = express();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

app.use(express.json());

app.post("/signup", (req, res) => {
  try {
    const { firstName, lastName, email, password, gender, DOB } = req.body;

    db.execute(
      "SELECT u_email FROM user WHERE u_email = ?",
      [req.body.email],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (results.length > 0) {
          return res.status(400).json({ error: "Email already exists" });
        }
      },
    );

    db.execute(
      "INSERT INTO user (u_firstName, u_lastName, u_email, u_password, u_gender, u_DOB) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, password, gender, DOB],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        return res.status(201).json({ message: "User created successfully" });
      },
    );
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", (req, res) => {
  try {
    db.execute(
      "SELECT u_email u_password FROM user where u_email = ? and u_password = ?   ",
      [req.body.email, req.body.password],
      (err, results) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        }

        if (!results.length > 0) {
          return res
            .status(401)
            .json({ message: "email and password mismatch" });
        }

        return res.status(200).json({ message: "User logged in successfully" });
      },
    );
  } catch (error) {
    console.log(error);
  }
});

app.get("/profile/:id", (req, res) => {
  db.execute(
    "SELECT * FROM user WHERE u_id =?",
    [req.params.id],
    (error, data) => {
      if (error) {
        return res.status(500).json({ message: "Database error" });
      }
      if (data.length > 0) {
        return res.status(200).json({ data, message: "User found" });
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    },
  );
});

app.patch("/profile/:id", (req, res) => {
  try {
    db.execute(
      "UPDATE user SET u_firstName = ?, u_lastName = ?, u_password = ?, u_gender = ?, u_DOB = ? WHERE u_id = ?",
      [
        req.body.firstName,
        req.body.lastName,
        req.body.password,
        req.body.gender,
        req.body.DOB,
        req.params.id,
      ],
      (error, data) => {
        if (error) {
          return res.status(500).json({ error, message: "Database error" });
        }
        if (!data.affectedRows) {
          return res.status(200).json({ data, message: "User updated" });
        } else {
          return res.status(404).json({ message: "User not found" });
        }
      },
    );
  } catch (error) {}
});

app.post("/add-blog/:id", (req, res) => {
  try {
    db.execute(
      "INSERT INTO bolg (b_title, b_content, b_author_id) VALUES (?, ?, ?)",
      [req.body.title, req.body.content, req.params.id],

      (err, results) => {
        if (err) {
          return res.status(500).json({ message: "Database error" });
        }
        return res.status(201).json({ message: "Post created successfully" });
      },
    );
  } catch (error) {}
});

app.delete("/delete-blog/:id", (req, res) => {
  const blogId = req.params.id;

  // 1. الكويري الأولى: نـتأكد إن البوست موجود (صلحنا اسم الجدول blog)
  db.execute(
    "SELECT * FROM bolg WHERE b_id = ?",
    [blogId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      // صلحنا الشرط: لو الطول بيساوي 0 يعني البوست مش موجود
      if (results.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      // 2. الكويري الثانية: مش هتشتغل إلا لو البوست موجود فعلاً (مكتوبة جوه الأولى)
      db.execute(
        "DELETE FROM bolg WHERE b_id = ?",
        [blogId],
        (deleteErr, deleteResults) => {
          if (deleteErr) {
            return res.status(500).json({ message: "Database error during deletion" });
          }

          // الرد النهائي بالنجاح بيتبعت هنا بس
          return res.status(200).json({ message: "Post deleted successfully" });
        }
      );

    }
  );
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on http://localhost:" + process.env.PORT);
});
