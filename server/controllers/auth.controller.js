import { eq } from 'drizzle-orm'
import {db} from '../config/db.js'
import { users } from '../config/schema.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.insert(users).values({ name, email, password: hashedPassword }).returning();
    const user = result[0];

    res.status(201).json({
        success: true,
        message: "User created successfully",
        user: { id: user.id, name: user.name, email: user.email }
    });
}

export const signin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Credentials are missing" });
    }

    const result = await db.select().from(users).where(eq(users.email,email));

    const user = result[0];
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, "dfvbgbfvdb", { expiresIn: "1d" });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
        success: true,
        message: "User signed in successfully",
        user: { id: user.id, name: user.name, email: user.email },
        token
    });
}


export const logout=async(req,res)=>{
    res.clearCookie("token")
    res.status(200).json({message:"User logged out successfully"})
}