import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { NextAuthOptions } from "next-auth"
import { SignupValidation } from "@repo/zod/index"
import db from "@repo/db/db"

declare module "next-auth"{
  interface Session{
    user:{
      id?:string,
      name?:string,
      email?:string,
      image?:string
    }
  }
}

export const authOption: NextAuthOptions = {
  providers:[
    CredentialsProvider({
    name: 'SignIn with Credential',
    credentials: {
      name:{label:"Name", type:"text", placeholder:"Enter the name"},
      email:{label:"Email", type:"text", placeholder:"Enter the email"},
      phone:{label:"Phone", type:"text",placeholder:"Enter the phone number"},
      password:{label:"Password", type:"text", placeholder:"Enter the password"}
    },
    async authorize(credentials):Promise<any> {
      console.log("Auth Got Hit",credentials)
      if(!credentials) return null
      
      const parsed = SignupValidation.safeParse(credentials)
      
      if(!parsed.success){
        console.error("Error at Validation Check",parsed.error.flatten())
        return null
      }
      
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { email: parsed.data.email },
            { number: parsed.data.phone }
          ]
        }
      })

      if(existingUser){
        console.log("User Already Exisited",existingUser?.id);

        if(typeof existingUser.password !== "string") return null

        const isPasswordValid = await bcrypt.compare(parsed.data.password,existingUser.password)
        if(!isPasswordValid) return null

        return {
          id:existingUser.id,
          name:existingUser.name,
          email:existingUser.email
        } 
      }
      
      try {
        const hashedPassword = await bcrypt.hash(parsed.data.password, Number(process.env.SALTRound || 10))

        const newUser = await db.user.create({
          data:{
            name:parsed.data.name,
            email:parsed.data.email,
            number:parsed.data.phone,
            password:hashedPassword
          }
        })

        console.log("User registered:", newUser.email);

        return {
          name:parsed.data.name,
          email:parsed.data.email,
          number:parsed.data.phone
        }
      } catch (error) {
        console.error("DB Error",error)
        return null
      }
    }
  })
  ],
  secret:process.env.JWT_SECRET,
  callbacks:{
    async session({session,token}){
      if(session && token) session.user.id = token.sub
      return session 
    },
    async jwt({token,user}){
      if(user) token.sub = user.id
      return token
    }
  },
  session:{
    strategy:"jwt",
  },
  pages:{
    signIn:"/auth/signin",
    error: "/auth/error",
  }
}