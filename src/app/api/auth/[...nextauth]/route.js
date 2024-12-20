import { PrismaAdapter } from "@next-auth/prisma-adapter"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import bcryptjs from "bcryptjs"
import db from "@/lib/db"

export const authOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "email", type: "text" },
                password: { label: "password", type: "password" }
            },
            async authorize(credentials) {
                const { email, password } = credentials

                const user = await db.user.findUnique({
                    where: {
                        email
                    }
                })

                if (!user) {
                    throw new Error("Invalid input")
                }

                const isCorrectPass = await bcryptjs.compare(password, user.password)

                if (!isCorrectPass) {
                    throw new Error("Invalid input")
                } else {
                    const { password, ...currentUser } = user

                    return currentUser
                }
            }
        }),
        GithubProvider({
            clientId:process.env.GITHUB_CLIENT_ID,
            clientSecret:process.env.GITHUB_CLIENT_SECRET
        }),
        GoogleProvider({
            clientId:process.env.GOOGLE_CLIENT_ID,
            clientSecret:process.env.GOOGLE_CLIENT_SECRET
        })
    ],
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login"
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) token.isAdmin = user.isAdmin
            return token
        },
        session({ session, token }) {
            session.user.isAdmin = token.isAdmin
            return session
        }
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }