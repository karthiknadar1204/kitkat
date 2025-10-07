import express from 'express'
import {  logout, signup, signin } from '../controllers/auth.controller.js'

const authRoutes=express.Router()

authRoutes.post("/register",signup)
authRoutes.post("/login",signin)
authRoutes.post("/logout",logout)



export default authRoutes