import type {Config} from "drizzle-kit"
import * as dotenv from "dotenv"
import { resolve } from "path"

// Load biến môi trường từ file .env
// override: true để ghi đè nếu đã có biến cùng tên (từ drizzle-kit tự động load)
dotenv.config({ 
    path: resolve(process.cwd(), ".env"), 
    override: true 
})

export default {
    schema: "./src/lib/db/schema.ts",
    out:"./drizzle",
    dialect:"postgresql",
    dbCredentials:{
        url: process.env.DATABASE_URL || ""
    },
    verbose:true,
    strict:true,

}satisfies Config