import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
    PORT: string,
    DB_URL: string,
    BCRYPT_SALT_ROUND: string,
    NODE_ENV: string,
    JWT_ACCESS_SECRET: string,
    JWT_ACCESS_EXPIRES: string,
    JWT_REFRESH_SECRET: string,
    JWT_REFRESH_EXPIRES: string
}

const loadEnvVariables = (): EnvConfig => {
    const requiredVariables: string[] = ["PORT", "DB_URL", "BCRYPT_SALT_ROUND", "NODE_ENV", "JWT_ACCESS_SECRET", "JWT_ACCESS_EXPIRES", "JWT_REFRESH_SECRET", "JWT_REFRESH_EXPIRES"]

    requiredVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing require environment variable ${key}`)
        }
    })

    return {
        PORT: process.env.PORT as string,
        DB_URL: process.env.DB_URL as string,
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
        NODE_ENV: process.env.NODE_ENV as string,
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
        JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string
    }
}

export const envVars = loadEnvVariables();